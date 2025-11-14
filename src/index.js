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
    "DirectMessageTyping"
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
    Partials.Reaction
  ]
})

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

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(error);
    const errorMessage = { content: 'There was an error executing this command!', ephemeral: true };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
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
      console.log(`Started refreshing ${commands.length} application (/) commands.`.yellow);

      const data = await rest.put(
        Routes.applicationCommands(config.CLIENTID),
        { body: commands },
      );

      console.log(`Successfully reloaded ${data.length} application (/) commands.`.green);
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

process.on("unhandledRejection", async (err) => {
  console.log(`[ANTI - CRUSH] Unhandled Rejection : ${err}`.red.bold)
  console.log(err)
})

// auto kill
const ms = require("ms");
setInterval(() => {
  if (!client || !client.user) {
    console.log("Client Not Login, Process Kill")
    process.kill(1);
  }
}, ms("1m"));