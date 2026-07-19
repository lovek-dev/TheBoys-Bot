const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticketping')
        .setDescription('Set a user to ping whenever a new ticket is created')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('The user to ping on new tickets (leave empty to clear)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const user = interaction.options.getUser('user');

        if (!user) {
            client.db.delete(`summer_ticket_ping_${interaction.guildId}`);
            return interaction.reply({ content: '✅ Ticket ping cleared — no one will be pinged on new tickets.', ephemeral: true });
        }

        client.db.set(`summer_ticket_ping_${interaction.guildId}`, user.id);
        await interaction.reply({ content: `✅ <@${user.id}> will be pinged whenever a new ticket is created.`, ephemeral: true });
    }
};
