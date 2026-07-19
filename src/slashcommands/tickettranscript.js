const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tickettranscript')
        .setDescription('Set the channel where ticket transcripts are sent when a ticket is closed')
        .addChannelOption(opt =>
            opt.setName('channel')
                .setDescription('The channel to send transcripts to')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const channel = interaction.options.getChannel('channel');
        client.db.set(`summer_ticket_transcript_${interaction.guildId}`, channel.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ Transcript Channel Set')
            .setDescription(`Ticket transcripts will now be sent to <#${channel.id}> when a ticket is closed.`)
            .setColor(0xFFAA00)
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};
