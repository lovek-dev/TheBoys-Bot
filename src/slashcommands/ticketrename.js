const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rename')
        .setDescription('Rename this ticket channel')
        .addStringOption(opt =>
            opt.setName('name')
                .setDescription('New name for the ticket channel')
                .setRequired(true)
                .setMaxLength(50))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, client) {
        const ticketData = client.db.get(`ticket_${interaction.channelId}`);
        if (!ticketData) {
            return interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', ephemeral: true });
        }

        const name = interaction.options.getString('name')
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (!name) {
            return interaction.reply({ content: '❌ Invalid channel name. Use letters, numbers, and hyphens only.', ephemeral: true });
        }

        try {
            await interaction.channel.setName(name, `Renamed by ${interaction.user.tag}`);
            await interaction.reply({ content: `✅ Ticket channel renamed to **${name}**.` });
        } catch (e) {
            console.error('[TICKET RENAME]', e);
            await interaction.reply({ content: '❌ Failed to rename channel. Check my permissions.', ephemeral: true });
        }
    }
};
