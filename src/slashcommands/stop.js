const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel!',
        ephemeral: true,
      });
    }

    const queue = client.distube.getQueue(voiceChannel);

    if (!queue) {
      return interaction.reply({
        content: '❌ There is no music playing!',
        ephemeral: true,
      });
    }

    queue.stop();
    
    await interaction.reply({
      embeds: [{
        color: 0xff0000,
        description: '⏹️ Stopped the music and cleared the queue!',
      }],
    });
  },
};
