const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),

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

    try {
      await queue.skip();
      await interaction.reply({
        embeds: [{
          color: 0x00ff00,
          description: '⏭️ Skipped the current song!',
        }],
      });
    } catch (error) {
      await interaction.reply({
        content: '❌ There are no more songs in the queue!',
        ephemeral: true,
      });
    }
  },
};
