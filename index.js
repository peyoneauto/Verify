const {
  Discord,
  MessageEmbed,
  Client,
  Intents,
  GuildScheduledEvent,
  Permissions,
  MessageButton,
  MessageActionRow,
} = require("discord.js");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const DiscordStrategy = require("passport-discord").Strategy;
const refresh = require("passport-oauth2-refresh");
const path = require("path");
const bodyParser = require("body-parser");
const DiscordOauth2 = require("discord-oauth2");
const wait = require("node:timers/promises").setTimeout;
require("dotenv").config();

const config = require("./config.js");
const { bot } = config;

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// --------------------- اتصال بقاعدة MongoDB ---------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ تم الاتصال بقاعدة MongoDB");
}).catch(err => {
  console.error("❌ فشل الاتصال بـ MongoDB:", err);
});

// --------------------- مخطط المستخدمين ---------------------
const userSchema = new mongoose.Schema({
  id: String,
  accessToken: String,
  refreshToken: String,
});
const User = mongoose.model("User", userSchema);

// --------------------- Express Setup ---------------------
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(__dirname + "assets"));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(
  session({
    secret: "some random secret",
    cookie: { maxAge: 60000 * 60 * 24 },
    saveUninitialized: false,
  })
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
app.use(passport.initialize());
app.use(passport.session());

const oauth = new DiscordOauth2({
  clientId: bot.botID,
  clientSecret: bot.clientSECRET,
  redirectUri: bot.callbackURL,
});

const scopes = ["identify", "email", "guilds", "guilds.join"];

passport.use(
  new DiscordStrategy(
    {
      clientID: bot.botID,
      clientSecret: bot.clientSECRET,
      callbackURL: bot.callbackURL,
      scope: scopes,
    },
    async (accessToken, refreshToken, profile, done) => {
      await User.findOneAndUpdate(
        { id: profile.id },
        { accessToken, refreshToken },
        { upsert: true }
      );
      return done(null, profile);
    }
  )
);

// --------------------- Routes ---------------------
app.get("/", (req, res) => {
  res.render("index", {
    client: client,
    user: req.user,
    config: config,
    bot: bot,
  });
});

app.get("/login", passport.authenticate("discord", { failureRedirect: "/" }), (req, res) => {
  res.render("login", {
    client: client,
    user: req.user,
    config: config,
    bot: bot,
  });
});

app.get('/', (req, res) => {
  res.send(`<body><center><h1>Bot 24H ON!</h1></center></body>`);
});

var listener = app.listen(process.env.PORT || 3004, function () {
  console.log("Your app is listening on port " + listener.address().port);
});

// --------------------- Events ---------------------
client.on("ready", () => {
  console.log(`Bot is On! ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (!config.bot.owners.includes(message.author.id)) return;

  if (message.content.startsWith(`+send`)) {
    let button = new MessageButton()
      .setLabel(`آثــبــث نـفــســك`)
      .setStyle(`LINK`)
      .setURL(`https://discord.com/oauth2/authorize?client_id=1383106052010147840&response_type=code&redirect_uri=https%3A%2F%2Farabbroad.onrender.com%2Flogin&scope=identify+email+guilds+guilds.join`)
      .setEmoji(`✅`);
    let row = new MessageActionRow().addComponents(button);
    message.channel.send({ components: [row] });
  }

  else if (message.content.startsWith(`+check`)) {
    let args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send(`**منشن شخص طيب**`);
    let member = message.mentions.members.first() || message.guild.members.cache.get(args);
    if (!member) return message.channel.send(`**شخص غلط**`);

    let data = await User.findOne({ id: member.id });
    if (data) return message.channel.send(`**موثق بالفعل**`);
    return message.channel.send(`**غير موثق**`);
  }

  else if (message.content.startsWith(`+join`)) {
    let msg = await message.channel.send(`**جاري الفحص ..**`);
    let args = message.content.split(` `).slice(1);
    if (!args[0] || !args[1]) return msg.edit(`**عذرًا , يرجى تحديد خادم ..**`);
    let guild = client.guilds.cache.get(args[0]);
    let amount = parseInt(args[1]);
    let users = await User.find({});
    let count = 0;

    if (!guild) return msg.edit(`**عذرًا , لم اتمكن من العثور على الخادم ..**`);
    if (amount > users.length) return msg.edit(`**لا يمكنك ادخال هاذا العدد ..**`);

    for (let i = 0; i < amount; i++) {
      try {
        await oauth.addMember({
          guildId: guild.id,
          userId: users[i].id,
          accessToken: users[i].accessToken,
          botToken: client.token,
        });
        count++;
      } catch (err) {}
    }

    msg.edit(`**تم بنجاح ..**
**تم ادخال** \`${count}\`
**لم اتمكن من ادخال** \`${amount - count}\`
**تم طلب** \`${amount}\``);
  }

  else if (message.content.startsWith(`+refresh`)) {
    let mm = await message.channel.send(`**جاري عمل ريفريش ..**`);
    let users = await User.find({});
    let count = 0;

    for (let user of users) {
      try {
        let res = await oauth.tokenRequest({
          clientId: client.user.id,
          clientSecret: bot.clientSECRET,
          grantType: "refresh_token",
          refreshToken: user.refreshToken,
        });

        await User.updateOne(
          { id: user.id },
          {
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
          }
        );
        count++;
      } catch {
        await User.deleteOne({ id: user.id });
      }
    }

    mm.edit(`**تم بنجاح ..**
**تم تغير** \`${count}\`
**تم حذف** \`${users.length - count}\``);
  }

  else if (message.content.startsWith(`+users`)) {
    let users = await User.find({});
    message.reply(`**يوجد حاليًا ${users.length}**`);
  }

  else if (message.content.startsWith(`+help`)) {
    message.reply(`**[\`+join {ServerId} {amount}\`]**
**[\`+refresh\`]**
**[\`+users\`]**
**[\`+help\`]**
**[\`+check\`]**
**[\`+send\`]**`);
  }
});

client.login(process.env.token);
