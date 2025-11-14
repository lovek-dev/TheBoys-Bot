const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play music from YouTube or Spotify')
    .addStringOption(option =>
      option.setName('song')
        .setDescription('Song name, URL (YouTube/Spotify)')
        .setRequired(true)
    ),
  
  async execute(interaction, client) {
    const query = interaction.options.getString('song');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to play music!',
        ephemeral: true,
      });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
      return interaction.reply({
        content: '❌ I need permissions to join and speak in your voice channel!',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      await client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
      });

      await interaction.editReply({
        embeds: [{
          color: 0x00ff00,
          title: '✅ Request received!',
          description: `Searching for: **${query}**`,
          timestamp: new Date(),
        }],
      });
    } catch (error) {
      console.error('Play command error:', error);
      
      let errorMessage = 'Failed to play the song. Please try again.';
      
      if (error.message.includes('No result')) {
        errorMessage = 'No results found for your search query.';
      } else if (error.message.includes('private')) {
        errorMessage = 'This video is private or unavailable.';
      } else if (error.message.includes('age')) {
        errorMessage = 'This video is age-restricted.';
      }

      await interaction.editReply({
        embeds: [{
          color: 0xff0000,
          title: '❌ Error',
          description: errorMessage,
        }],
      });
    }
  },
};
