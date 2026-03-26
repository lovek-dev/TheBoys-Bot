const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ragebait')
        .setDescription('Toggle the Ragebait Interaction Module')
        .addBooleanOption(option => option.setName('enabled').setDescription('Enable or disable').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        const enabled = interaction.options.getBoolean('enabled');
        client.db.set(`ragebait_enabled_${interaction.guildId}`, enabled);
        await interaction.reply({ content: `Ragebait module ${enabled ? 'enabled' : 'disabled'}.`, ephemeral: true });
    }
};