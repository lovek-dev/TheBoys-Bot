const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('movieformrole')
        .setDescription('Set the role given to users accepted into the Movie Club')
        .addRoleOption(opt =>
            opt.setName('role').setDescription('The role to assign on acceptance').setRequired(true)
        ),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const ownerIds = client.config.OWNER || [];
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ Only the bot owner can use this command.', flags: MessageFlags.Ephemeral });
        }

        const role = interaction.options.getRole('role');
        db.set(`movie_form_role_${interaction.guild.id}`, role.id);

        return interaction.reply({
            content: `✅ Accepted Movie Club members will receive the **${role.name}** role.`,
            flags: MessageFlags.Ephemeral
        });
    }
};
