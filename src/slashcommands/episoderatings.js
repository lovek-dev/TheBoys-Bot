const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('episoderatings')
        .setDescription('View ratings for the current episode'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const session = db.get(`series_session_${interaction.guild.id}`);
        if (!session) {
            return interaction.reply({ content: '❌ No active series session.', flags: MessageFlags.Ephemeral });
        }

        const epKey = `S${session.currentSeason}E${session.currentEpisode}`;
        const list = (session.episodeRatings || {})[epKey] || [];

        if (!list.length) {
            return interaction.reply({ content: `📊 No ratings for **${epKey}** yet. Use \`/rateepisode\` to submit yours!`, flags: MessageFlags.Ephemeral });
        }

        const avg = (list.reduce((s, r) => s + r.score, 0) / list.length).toFixed(1);
        const lines = list.map(r =>
            `<@${r.userId}> — **${r.score}/10**${r.review ? ` — _${r.review}_` : ''}`
        );

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`📊 Episode Ratings — ${session.title} ${epKey}`)
                    .setDescription(lines.join('\n'))
                    .addFields({ name: '🌟 Average Score', value: `${avg}/10`, inline: true })
                    .setColor(0xf4a261)
            ]
        });
    }
};
