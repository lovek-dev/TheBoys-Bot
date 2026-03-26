const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recap')
        .setDescription('Get a recap summary of the current series episode session'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const session = db.get(`series_session_${interaction.guild.id}`);
        if (!session) {
            return interaction.reply({ content: '❌ No active series session.', flags: MessageFlags.Ephemeral });
        }

        const epKey = `S${session.currentSeason}E${session.currentEpisode}`;
        const epRatings = (session.episodeRatings || {})[epKey] || [];
        const reactions = session.reactions || {};
        const avgRating = epRatings.length
            ? (epRatings.reduce((s, r) => s + r.score, 0) / epRatings.length).toFixed(1)
            : 'No ratings';

        const reactionSummary = Object.entries(reactions)
            .map(([emoji, users]) => `${emoji} ×${users.length}`)
            .join('  ');

        const topRating = epRatings.sort((a, b) => b.score - a.score)[0];
        const topQuote = topRating
            ? `"${topRating.review || 'No review'}" — <@${topRating.userId}> (${topRating.score}/10)`
            : 'No ratings submitted.';

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`📺 Episode Recap — ${session.title} ${epKey}`)
                    .addFields(
                        { name: '🌟 Average Rating', value: `${avgRating}`, inline: true },
                        { name: '😂 Reactions', value: reactionSummary || 'None', inline: true },
                        { name: '💬 Top Review', value: topQuote },
                    )
                    .setColor(0x1d3557)
                    .setFooter({ text: `Session started by <@${session.startedBy}>` })
            ]
        });
    }
};
