const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue'),

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

    const currentSong = queue.songs[0];
    const upcomingSongs = queue.songs.slice(1, 11);

    let queueList = `**Now Playing:**\n[${currentSong.name}](${currentSong.url}) - \`${currentSong.formattedDuration}\`\n\n`;

    if (upcomingSongs.length > 0) {
      queueList += '**Up Next:**\n';
      upcomingSongs.forEach((song, index) => {
        queueList += `${index + 1}. [${song.name}](${song.url}) - \`${song.formattedDuration}\`\n`;
      });

      if (queue.songs.length > 11) {
        queueList += `\n*...and ${queue.songs.length - 11} more songs*`;
      }
    }

    await interaction.reply({
      embeds: [{
        color: 0x0099ff,
        title: '🎵 Music Queue',
        description: queueList,
        footer: {
          text: `${queue.songs.length} song(s) | Duration: ${queue.formattedDuration}`,
        },
      }],
    });
  },
};
