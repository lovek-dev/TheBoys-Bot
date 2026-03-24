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
    try {
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        client.slashCommands.set(command.data.name, command);
        console.log(`[SLASH COMMAND] Loaded: ${command.data.name}`.green);
      } else {
        console.warn(`[SLASH COMMAND] Skipped ${file}: missing data or execute`.yellow);
      }
    } catch (err) {
      console.error(`[SLASH COMMAND] Failed to load ${file}: ${err.message}`.red);
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

// Slash command interactions are handled by src/events/client/interactionCreate.js via the event loader.

const { runDiagnostics } = require('./utils/diagnostics');

client.once('clientReady', () => {
    runDiagnostics(client);
});

async function registerSlashCommands() {
  const commands = [];
  const slashCommandsPath = path.join(__dirname, 'slashcommands');
  
  if (fs.existsSync(slashCommandsPath)) {
    const slashCommandFiles = fs.readdirSync(slashCommandsPath).filter(file => file.endsWith('.js'));

    for (const file of slashCommandFiles) {
      const filePath = path.join(slashCommandsPath, file);
      try {
        const command = require(filePath);
        if ('data' in command) {
          commands.push(command.data.toJSON());
        }
      } catch (err) {
        console.error(`[REGISTER] Failed to load ${file}: ${err.message}`.red);
      }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
      // Register commands in every guild the bot is in
      const guilds = client.guilds.cache;
      console.log(`Registering ${commands.length} slash commands in ${guilds.size} guild(s)...`.yellow);

      for (const [guildId, guild] of guilds) {
        try {
          const data = await rest.put(
            Routes.applicationGuildCommands(config.CLIENTID, guildId),
            { body: commands },
          );
          console.log(`✅ Registered ${data.length} commands in "${guild.name}" (${guildId})`.green);
        } catch (guildErr) {
          console.error(`❌ Failed to register in guild ${guildId}:`, guildErr.message);
        }
      }

      // Clear any stale global commands
      await rest.put(Routes.applicationCommands(config.CLIENTID), { body: [] });
      console.log(`Cleared global application (/) commands.`.blue);
    } catch (error) {
      console.error('Error during slash command registration:', error);
    }
  }
}

const _token = (process.env.TOKEN || '').trim();
console.log(`[LOGIN] Token exists: ${!!_token} | Length: ${_token.length} | Node: ${process.version}`);
if (!_token) {
  console.error('[LOGIN] ❌ TOKEN env var is missing — bot cannot start.');
  process.exit(1);
}

// Note: Discord gateway on Render can take 2–3 minutes — do NOT add a short timeout here.
client.login(_token)
  .then(() => {
    console.log(`✅ Logged in as ${client.user?.tag}`);
    registerSlashCommands();
  })
  .catch((err) => {
    console.error('[CRUSH] Login failed:', err.message || err);
    process.exit(1);
  });

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
    console.error('⚠ Shard error — Discord.js will attempt to reconnect automatically:'.yellow, error.message || error);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error('[ANTI-CRUSH] Uncaught Exception Monitor:', err, 'Origin:', origin);
});

process.on('warning', (warning) => {
    // Suppress known discord.js v14 internal deprecation about 'ready' → 'clientReady'
    if (warning.name === 'DeprecationWarning' && warning.message?.includes('ready event has been renamed')) return;
    console.warn('[ANTI-CRUSH] Warning:', warning);
});

// auto kill
const ms = require("ms");
setInterval(() => {
  if (!client || !client.user) {
    console.log("Client Not Login, Waiting...")
  }
}, ms("1m"));