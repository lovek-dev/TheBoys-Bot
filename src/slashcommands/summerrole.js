const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summerrole')
        .setDescription('Set the role given to accepted SummerSMP clan members')
        .addRoleOption(opt =>
            opt.setName('role')
                .setDescription('The SummerSMP member role')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const role = interaction.options.getRole('role');
        client.db.set(`summer_role_${interaction.guildId}`, role.id);
        await interaction.reply({ content: `✅ Accepted SummerSMP members will receive the ${role} role.`, ephemeral: true });
    }
};
