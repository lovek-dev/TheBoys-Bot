const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('movieresults')
        .setDescription('View reaction results for the current movie session'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const session = db.get(`movie_session_${interaction.guild.id}`);
        if (!session) {
            return interaction.reply({ content: '❌ No active movie session. Use `/startmovie` first.', flags: MessageFlags.Ephemeral });
        }

        const reactions = session.reactions || {};
        const lines = Object.entries(reactions).map(([emoji, users]) =>
            `${emoji} — **${users.length}** reaction${users.length !== 1 ? 's' : ''}${users.length ? ` — ${users.map(id => `<@${id}>`).join(', ')}` : ''}`
        );

        const embed = new EmbedBuilder()
            .setTitle(`🎬 Reactions for: ${session.title}`)
            .setDescription(lines.join('\n') || 'No reactions yet.')
            .setColor(0xe63946)
            .setFooter({ text: `Session started by <@${session.startedBy}>` });

        return interaction.reply({ embeds: [embed] });
    }
};
