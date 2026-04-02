const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const WELCOME_GIF = 'https://images-ext-1.discordapp.net/external/JvX5EcH7GjIcZoYmVxYM9RjSTPl8RXwYLkHZIZPhX5Q/https/media.tenor.com/kKHBMAQ1s-YAAAPo/3.mp4';

module.exports = {
  name: 'setup',
  aliases: ['s'],
  ownerOnly: true,

  run: async (client, message, args) => {
    if (!message.guild) return;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('rule')
        .setLabel('View Rules')
        .setStyle(ButtonStyle.Success)
        .setEmoji('📖')
    );

    const embed = new EmbedBuilder()
      .setAuthor({ name: `Welcome to ${message.guild.name}` })
      .setDescription(
        `✦・**Welcome!**・✦\n\n` +
        `:compass: Make Sure to Read the Rules! ‹3\n\n\n` +
        `₊˚:globe_with_meridians: Get verified at <#1224003744966901782>\n\n\n` +
        `— ୨🎀୧ Be very welcome! ✦\n\n` +
        `₊˚ʚ :partying_face: ɞ *Hope you like our server!*\n\n` +
        `**Read the rules to avoid punishment**\n\n` +
        `꒷꒥꒷ ‧₊˚ Thanks for joining! :)`
      )
      .setImage(WELCOME_GIF)
      .setColor('#2f3136');

    try {
      await message.channel.send({ embeds: [embed], components: [row] });
      await message.delete().catch(() => {});
    } catch (err) {
      console.error('[SETUP] Failed to send setup embed:', err);
    }
  },
};
