const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const config = require('./config/config');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('ffmpeg-static');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const distube = new DisTube(client, {
  emitNewSongOnly: false,
  savePreviousSongs: true,
  joinNewVoiceChannel: true,
  nsfw: true,
  ffmpeg: {
    path: ffmpeg,
  },
  plugins: [
    new SpotifyPlugin({
      api: {
        clientId: config.spotifyClientId,
        clientSecret: config.spotifyClientSecret,
      },
    }),
  ],
});

client.distube = distube;

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
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

  const command = client.commands.get(interaction.commandName);

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

async function registerCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command) {
      commands.push(command.data.toJSON());
    }
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

client.login(config.token).then(() => {
  registerCommands();
});

module.exports = client;
