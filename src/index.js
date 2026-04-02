require('./console/watermark')
const { Client, Partials, Collection, REST, Routes } = require('discord.js');
const colors = require('colors');
const config = require('./config/config.json');
const path = require('path');
const fs = require('fs');

const client = new Client({
  intents: [
    "Guilds",
    "GuildMessages",
    "GuildPresences",
    "GuildMessageReactions",
    "DirectMessages",
    "MessageContent",
    "GuildVoiceStates",
    "GuildMembers",
    "DirectMessageTyping",
    "GuildModeration"
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction
  ]
})

client.db = require('./database/db');
client.config = require('./config/config.json')
client.commands = new Collection()
client.slashCommands = new Collection()
client.events = new Collection()
client.aliases = new Collection()
module.exports = client;

["command", "event"].forEach(file => {
  require(`./handlers/${file}`)(client);
});

// Voice time tracking
client.voiceStates = new Map();
client.on('voiceStateUpdate', (oldState, newState) => {
    if (newState.member.user.bot) return;
    
    // User joined
    if (!oldState.channelId && newState.channelId) {
        client.voiceStates.set(newState.member.id, Date.now());
    }
    
    // User left
    if (oldState.channelId && !newState.channelId) {
        const joinTime = client.voiceStates.get(newState.member.id);
        if (joinTime) {
            const duration = Date.now() - joinTime;
            const key = `voice_${newState.guild.id}_${newState.member.id}`;
            const current = client.db.get(key) || 0;
            client.db.set(key, current + duration);
            client.voiceStates.delete(newState.member.id);
        }
    }
});

const slashCommandsPath = path.join(__dirname, 'slashcommands');
if (fs.existsSync(slashCommandsPath)) {
  const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));
  for (const file of slashCommandFiles) {
    const filePath = path.join(slashCommandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.slashCommands.set(command.data.name, command);
      console.log(`[SLASH COMMAND] Loaded: ${command.data.name}`.green);
    }
  }
}

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    const roleId = client.db.get(`rr_${reaction.message.guildId}_${reaction.message.id}_${reaction.emoji.name}`);
    if (roleId) {
        const member = await reaction.message.guild.members.fetch(user.id);
        await member.roles.add(roleId);
    }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    const roleId = client.db.get(`rr_${reaction.message.guildId}_${reaction.message.id}_${reaction.emoji.name}`);
    if (roleId) {
        const member = await reaction.message.guild.members.fetch(user.id);
        await member.roles.remove(roleId);
    }
});

const { runDiagnostics } = require('./utils/diagnostics');

client.on('clientReady', () => {
    runDiagnostics(client);
});

async function registerSlashCommands() {
  const commands = [];
  const slashCommandsPath = path.join(__dirname, 'slashcommands');
  
  if (fs.existsSync(slashCommandsPath)) {
    const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

    for (const file of slashCommandFiles) {
      const filePath = path.join(slashCommandsPath, file);
      const command = require(filePath);
      if ('data' in command) {
        commands.push(command.data.toJSON());
      }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
      console.log(`Started refreshing ${commands.length} application (/) commands for guild ${config.GUILD_ID || "1190999620818567220"}.`.yellow);

      const guildId = config.GUILD_ID || "1190999620818567220";
      const data = await rest.put(
        Routes.applicationGuildCommands(config.CLIENTID, guildId),
        { body: commands },
      );

      console.log(`Successfully reloaded ${data.length} application (/) commands for guild ${guildId}.`.green);
      
      // Clear global commands to avoid double entries
      await rest.put(
        Routes.applicationCommands(config.CLIENTID),
        { body: [] },
      );
      console.log(`Successfully cleared global application (/) commands.`.blue);
    } catch (error) {
      console.error('Error registering slash commands:', error);
    }
  }
}

client.login(process.env.TOKEN)
  .then(() => {
    registerSlashCommands();
  })
  .catch((err) => {
    console.log("[CRUSH] Something went wrong while connecting to your bot" + "\n");
    console.log("[CRUSH] Error from DiscordAPI :" + err);
    process.exit();
  })

// [ANTI - CRUSH] Global Error Handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection Detected'.red.bold);
    console.error(`Error: ${reason.message || reason}`);
    console.error(`Stack: ${reason.stack || 'No stack available'}`);
    console.error('Bot attempting recovery…'.yellow);
});

process.on('uncaughtException', (err, origin) => {
    console.error('🚨 Uncaught Exception Detected'.red.bold);
    console.error(`Error: ${err.message}`);
    console.error(`Stack: ${err.stack}`);
    console.error('Bot attempting recovery…'.yellow);
});

client.on('shardError', error => {
    console.error('⚠ Connection lost. Reconnecting…'.yellow, error);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error('[ANTI-CRUSH] Uncaught Exception Monitor:', err, 'Origin:', origin);
});

process.on('warning', (warning) => {
    console.warn('[ANTI-CRUSH] Warning:', warning);
});

// auto kill
const ms = require("ms");
setInterval(() => {
  if (!client || !client.user) {
    console.log("Client Not Login, Waiting...")
  }
}, ms("1m"));