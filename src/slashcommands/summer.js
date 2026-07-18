const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summer')
        .setDescription('SummerSMP commands')
        .addSubcommand(sub =>
            sub.setName('verify')
                .setDescription('Send the SummerSMP clan application panel in this channel'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'verify') {
            const embed = new EmbedBuilder()
                .setTitle('⚔️ SummerSMP — Clan Recruitment')
                .setDescription(
                    '> ### Welcome to **SummerSMP** Clan Recruitment!\n\n' +
                    'We are actively looking for **skilled, dedicated, and active** players to represent our clan.\n\n' +
                    '**📌 What We Expect**\n' +
                    '> • Be active and contribute to the clan\n' +
                    '> • Represent SummerSMP with honour\n' +
                    '> • Follow all server and clan rules at all times\n' +
                    '> • Be respectful to all members\n\n' +
                    '**📝 How to Apply**\n' +
                    '> Click the **⚔️ Join** button below to fill out a short application form.\n' +
                    '> Our staff team will review it and respond as soon as possible.\n\n' +
                    '> ⚠️ *False information or application spam will result in a permanent ban from applying.*'
                )
                .setColor(0xFFAA00)
                .setFooter({ text: 'SummerSMP Clan Recruitment • Good luck!' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('summer_join')
                    .setLabel('⚔️ Join')
                    .setStyle(ButtonStyle.Primary)
            );

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }
};
