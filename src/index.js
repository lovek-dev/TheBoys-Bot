require('./console/watermark')
const { Client, Partials, Collection, REST, Routes } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const colors = require('colors');
const config = require('./config/config.json');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');

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

const distubePlugins = [];

if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
  distubePlugins.push(
    new SpotifyPlugin({
      api: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      },
    })
  );
  console.log('[DISTUBE] Spotify plugin enabled'.green);
} else {
  console.log('[DISTUBE] Spotify credentials not found - Spotify playback disabled. YouTube will still work!'.yellow);
}

const distube = new DisTube(client, {
  emitNewSongOnly: false,
  savePreviousSongs: true,
  joinNewVoiceChannel: true,
  nsfw: true,
  ffmpeg: {
    path: ffmpeg,
  },
  plugins: distubePlugins,
});

client.distube = distube;
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

distube.on('playSong', (queue, song) => {
  queue.textChannel.send({
    embeds: [{
      color: 0x00ff00,
      title: '🎵 Now Playing',
      description: `**[${song.name}](${song.url})**`,
      fields: [
        { name: 'Duration', value: song.formattedDuration, inline: true },
        { name: 'Requested by', value: song.user.toString(), inline: true },
      ],
      thumbnail: { url: song.thumbnail },
    }],
  });
});

distube.on('addSong', (queue, song) => {
  queue.textChannel.send({
    embeds: [{
      color: 0x0099ff,
      title: '➕ Added to Queue',
      description: `**[${song.name}](${song.url})**`,
      fields: [
        { name: 'Duration', value: song.formattedDuration, inline: true },
        { name: 'Position', value: `${queue.songs.length}`, inline: true },
      ],
      thumbnail: { url: song.thumbnail },
    }],
  });
});

distube.on('error', (channel, error) => {
  console.error('DisTube Error:', error);
  if (channel) {
    channel.send(`❌ An error occurred: ${error.message}`);
  }
});

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

// Slash commands and buttons are handled entirely by src/events/client/interactionCreate.js
// which is loaded by the event handler above. No duplicate listener needed here.

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

const _token = (process.env.TOKEN || '').trim();
console.log(`[LOGIN] Token check — exists: ${!!_token}, length: ${_token.length}`);

if (!_token) {
  console.error('[LOGIN] ❌ TOKEN is missing or empty. Set it in Render → Environment.');
  process.exit(1);
}

// Step 1: Verify token via REST (HTTP) before attempting WebSocket.
// This proves the token is valid before we even try to connect to the gateway.
(async () => {
  // Connect database first so all commands have persistent data from the start.
  await client.db.connect();

  try {
    const restCheck = new REST({ version: '10' }).setToken(_token);
    const me = await restCheck.get(Routes.user('@me'));
    console.log(`[LOGIN] ✅ Token verified — bot account: ${me.username}#${me.discriminator}`);
  } catch (restErr) {
    console.error(`[LOGIN] ❌ Token is INVALID or EXPIRED: ${restErr.message}`);
    console.error('[LOGIN] Fix: go to Discord Developer Portal → Bot → Reset Token, then update TOKEN in Render.');
    process.exit(1);
  }

  // Step 2: Connect to Discord gateway (WebSocket).
  // Use a 3-minute timeout — Render cold starts can be slow.
  const _loginTimeout = setTimeout(() => {
    console.error('[LOGIN] ❌ Gateway connection timed out after 3 minutes.');
    console.error('[LOGIN] Token IS valid (REST check passed). This is a gateway/network issue.');
    console.error('[LOGIN] Check: Discord Developer Portal → Bot → Privileged Gateway Intents');
    console.error('  → Enable: Presence Intent, Server Members Intent, Message Content Intent');
    process.exit(1);
  }, 3 * 60 * 1000);

  client.login(_token)
    .then(() => {
      clearTimeout(_loginTimeout);
      registerSlashCommands();
    })
    .catch((err) => {
      clearTimeout(_loginTimeout);
      console.log("[CRUSH] Something went wrong while connecting to your bot\n");
      console.log("[CRUSH] Error from DiscordAPI :" + err);
      process.exit();
    });
})();

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