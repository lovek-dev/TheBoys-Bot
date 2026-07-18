const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transfer')
        .setDescription('Transfer this ticket to another staff member')
        .addUserOption(opt =>
            opt.setName('staff')
                .setDescription('The staff member to transfer to')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, client) {
        const ticketData = client.db.get(`ticket_${interaction.channelId}`);
        if (!ticketData) {
            return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', ephemeral: true });
        }

        const staff = interaction.options.getUser('staff');
        const staffMember = interaction.options.getMember('staff');

        if (!staffMember) {
            return interaction.reply({ content: '❌ User not found in this server.', ephemeral: true });
        }

        if (!staffMember.permissions.has('ManageRoles')) {
            return interaction.reply({ content: '❌ That user does not have staff permissions (Manage Roles).', ephemeral: true });
        }

        const previousClaimer = ticketData.claimedBy;
        ticketData.claimedBy = staff.id;
        client.db.set(`ticket_${interaction.channelId}`, ticketData);

        // Make sure new staff can see/use the channel
        try {
            await interaction.channel.permissionOverwrites.edit(staff.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
        } catch (e) {}

        await interaction.reply({
            content:
                `🔄 Ticket transferred to <@${staff.id}>.\n` +
                (previousClaimer ? `Previously claimed by <@${previousClaimer}>.` : '')
        });
    }
};
