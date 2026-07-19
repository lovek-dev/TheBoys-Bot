const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketping')
        .setDescription('Set a role to ping whenever a new ticket is created')
        .addRoleOption(opt =>
            opt.setName('role')
                .setDescription('The role to ping on new tickets (leave empty to clear)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const role = interaction.options.getrole('role');

        if (!role) {
            client.db.delete(`summer_ticket_ping_${interaction.guildId}`);
            return interaction.reply({ content: '✅ Ticket ping cleared — no one will be pinged on new tickets.', ephemeral: true });
        }

        client.db.set(`summer_ticket_ping_${interaction.guildId}`, role.id);
        await interaction.reply({ content: `✅ <@${role.id}> will be pinged whenever a new ticket is created.`, ephemeral: true });
    }
};
