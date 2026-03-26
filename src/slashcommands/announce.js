const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('announce')
    .setDescription('Send an announcement to a channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send the announcement to')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Title of the announcement')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The announcement message')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Embed color (e.g., #FF0000 or RED)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const color = interaction.options.getString('color') || '#0099ff';

    if (!channel.isTextBased()) {
      return interaction.reply({
        content: '❌ Please select a text channel!',
        ephemeral: true,
      });
    }

    const botPermissions = channel.permissionsFor(interaction.guild.members.me);
    if (!botPermissions.has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({
        content: `❌ I don't have permission to send messages in ${channel}!`,
        ephemeral: true,
      });
    }

    if (!botPermissions.has(PermissionFlagsBits.EmbedLinks)) {
      return interaction.reply({
        content: `❌ I don't have permission to embed links in ${channel}!`,
        ephemeral: true,
      });
    }

    try {
      const colorValue = color.startsWith('#') ? parseInt(color.slice(1), 16) : color.toUpperCase();

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(message)
        .setColor(colorValue)
        .setTimestamp()
        .setFooter({ text: `Announced by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      await channel.send({ embeds: [embed] });

      await interaction.reply({
        content: `✅ Announcement sent successfully to ${channel}!`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Announce command error:', error);

      await interaction.reply({
        content: `❌ Failed to send announcement: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
