const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause or resume the current song'),

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

    if (queue.paused) {
      queue.resume();
      await interaction.reply({
        embeds: [{
          color: 0x00ff00,
          description: '▶️ Resumed the music!',
        }],
      });
    } else {
      queue.pause();
      await interaction.reply({
        embeds: [{
          color: 0xffaa00,
          description: '⏸️ Paused the music!',
        }],
      });
    }
  },
};
