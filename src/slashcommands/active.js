const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('active')
    .setDescription('Shows bot activity and uptime information'),

  async execute(interaction) {
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    const memoryUsage = process.memoryUsage();
    const memoryMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);

    await interaction.reply({
      embeds: [{
        color: 0x00ff00,
        title: '🤖 Bot Activity Status',
        fields: [
          {
            name: '⏱️ Uptime',
            value: uptimeString,
            inline: true,
          },
          {
            name: '📊 Memory Usage',
            value: `${memoryMB} MB`,
            inline: true,
          },
          {
            name: '🌐 Servers',
            value: `${interaction.client.guilds.cache.size}`,
            inline: true,
          },
          {
            name: '👥 Users',
            value: `${interaction.client.users.cache.size}`,
            inline: true,
          },
          {
            name: '📡 Ping',
            value: `${interaction.client.ws.ping}ms`,
            inline: true,
          },
          {
            name: '✅ Status',
            value: 'Online and Active',
            inline: true,
          },
        ],
        timestamp: new Date(),
        footer: {
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        },
      }],
    });
  },
};
