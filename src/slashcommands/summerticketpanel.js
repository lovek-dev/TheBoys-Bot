const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summerticketpanel')
        .setDescription('Send the SummerSMP support ticket panel in this channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const categoryId = client.db.get(`summer_ticket_category_${interaction.guildId}`);
        if (!categoryId) {
            return interaction.reply({
                content: '❌ No ticket category set. Run `/summerticket <category>` first to configure where ticket channels are created.',
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎫 SummerSMP — Support Tickets')
            .setDescription(
                '> Need assistance from staff? Open a ticket below.\n\n' +
                '**⚔️ Report a Teammate**\n' +
                '> Someone betrayed you, killed you unfairly, or stole from you?\n' +
                '> Submit a report and our staff will investigate.\n\n' +
                '**🏆 Request a Promotion**\n' +
                '> Believe you deserve a rank upgrade based on your contributions?\n' +
                '> Submit your promotion request with proof.\n\n' +
                '*All tickets are reviewed by staff as soon as possible.*'
            )
            .setColor(0xFFAA00)
            .setFooter({ text: 'SummerSMP Ticket System' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('summer_ticket_report')
                .setLabel('⚔️ Report')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('summer_ticket_promo')
                .setLabel('🏆 Promotion Request')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: '✅ Ticket panel sent!', flags: 64 });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    }
};
