const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verifytab')
        .setDescription('Send verification embed')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        const customMsg = client.db.get(`verify_msg_${interaction.guildId}`) || 'Click the button below to get verified!';
        const customImg = client.db.get(`verify_img_${interaction.guildId}`) || 'https://media.discordapp.net/attachments/1438611778433974313/1438883406430863522/image.png';

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Verification System')
            .setDescription(customMsg)
            .setImage(customImg)
            .setColor(0x00ff00);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('verify_start')
                    .setLabel('Get Verified')
                    .setStyle(ButtonStyle.Success),
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
