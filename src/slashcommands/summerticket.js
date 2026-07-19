const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summerticket')
        .setDescription('Set the Discord category where ticket channels are created')
        .addChannelOption(opt =>
            opt.setName('category')
                .setDescription('The category to create ticket channels in')
                .addChannelTypes(ChannelType.GuildCategory)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const category = interaction.options.getChannel('category');
        client.db.set(`summer_ticket_category_${interaction.guildId}`, category.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ Ticket Category Set')
            .setDescription(`Ticket channels will now be created under **${category.name}**.`)
            .addFields(
                { name: '📂 Category', value: `<#${category.id}>`, inline: true },
                { name: '📌 Next Step', value: 'Use `/summerticketpanel` in the channel where you want the ticket panel sent.', inline: false }
            )
            .setColor(0xFFAA00)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};
