const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verifytab')
        .setDescription('Send verification embed')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Verification')
            .setDescription('Click the button below to get verified!')
            .setImage('https://media.discordapp.net/attachments/1438611778433974313/1438883406430863522/image.png')
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
