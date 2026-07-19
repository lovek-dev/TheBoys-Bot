const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Permanently delete this ticket channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, client) {
        const ticketData = client.db.get(`ticket_${interaction.channelId}`);

        if (!ticketData) {
            return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', ephemeral: true });
        }

        await interaction.reply({ content: '🗑️ Deleting this ticket channel in 5 seconds...' });

        // Clean up DB
        client.db.delete(`ticket_${interaction.channelId}`);

        setTimeout(async () => {
            await interaction.channel.delete('Ticket deleted by staff').catch(() => {});
        }, 5000);
    }
};
