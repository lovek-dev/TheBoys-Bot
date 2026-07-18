const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a user from this ticket channel')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('The user to remove')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, client) {
        const ticketData = client.db.get(`ticket_${interaction.channelId}`);
        if (!ticketData) {
            return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');

        // Don't allow removing the ticket opener
        if (user.id === ticketData.openerUserId) {
            return interaction.reply({ content: '❌ You cannot remove the ticket opener.', ephemeral: true });
        }

        try {
            await interaction.channel.permissionOverwrites.edit(user.id, {
                ViewChannel: false,
                SendMessages: false
            });
            await interaction.reply({ content: `✅ <@${user.id}> has been removed from this ticket.` });
        } catch (e) {
            console.error('[TICKET REMOVE]', e);
            await interaction.reply({ content: '❌ Failed to remove user. Check my permissions.', ephemeral: true });
        }
    }
};
