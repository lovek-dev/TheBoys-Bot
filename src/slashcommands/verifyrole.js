const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verifyrole')
        .setDescription('Set the role given upon verification')
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('The role to give')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        const role = interaction.options.getRole('role');
        client.db.set(`verify_role_${interaction.guildId}`, role.id);
        await interaction.reply({ content: `Verification role set to ${role.name}`, ephemeral: true });
    },
};
