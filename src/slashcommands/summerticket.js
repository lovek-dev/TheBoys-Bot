const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summerticket')
        .setDescription('Send the SummerSMP support ticket panel')
        .addChannelOption(opt =>
            opt.setName('category')
                .setDescription('Discord category where ticket channels are created')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const category = interaction.options.getChannel('category');
        if (category) {
            client.db.set(`summer_ticket_category_${interaction.guildId}`, category.id);
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

        const content = category ? `✅ Ticket category set to **${category.name}**. Tickets will be created there.` : undefined;
        await interaction.reply({ content, embeds: [embed], components: [row] });
    }
};
