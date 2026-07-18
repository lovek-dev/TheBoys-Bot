const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a user to this ticket channel')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('The user to add')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, client) {
        const ticketData = client.db.get(`ticket_${interaction.channelId}`);
        if (!ticketData) {
            return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const member = interaction.options.getMember('user');

        if (!member) {
            return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
        }

        try {
            await interaction.channel.permissionOverwrites.edit(user.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
            await interaction.reply({ content: `✅ <@${user.id}> has been added to this ticket.` });
        } catch (e) {
            console.error('[TICKET ADD]', e);
            await interaction.reply({ content: '❌ Failed to add user. Check my permissions.', ephemeral: true });
        }
    }
};
