const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('close')
        .setDescription('Close this ticket channel')
        .addStringOption(opt =>
            opt.setName('reason')
                .setDescription('Reason for closing (optional)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, client) {
        const ticketData = client.db.get(`ticket_${interaction.channelId}`);
        if (!ticketData) {
            return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', ephemeral: true });
        }

        const reason = interaction.options.getString('reason') || 'No reason provided';

        await interaction.reply({ content: `🔒 Closing ticket in 5 seconds...\n**Reason:** ${reason}` });

        // Log to summer logs
        const logsChannelId = client.db.get(`summer_logs_channel_${interaction.guildId}`);
        if (logsChannelId) {
            const logsChannel = interaction.guild.channels.cache.get(logsChannelId);
            if (logsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🔒 Ticket Closed')
                    .addFields(
                        { name: 'Type',       value: ticketData.type === 'report' ? '⚔️ Report' : '🏆 Promotion', inline: true },
                        { name: 'Opener',     value: `<@${ticketData.openerUserId}>`,                              inline: true },
                        { name: 'Closed By',  value: `<@${interaction.user.id}>`,                                 inline: true },
                        { name: 'Claimed By', value: ticketData.claimedBy ? `<@${ticketData.claimedBy}>` : 'Unclaimed', inline: true },
                        { name: 'Reason',     value: reason,                                                        inline: false }
                    )
                    .setColor(0x888888)
                    .setTimestamp();
                logsChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }

        client.db.delete(`ticket_${interaction.channelId}`);

        setTimeout(async () => {
            await interaction.channel.delete('Ticket closed via /close').catch(() => {});
        }, 5000);
    }
};
