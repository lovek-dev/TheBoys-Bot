const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seriesprogress')
        .setDescription('View the current series watch party progress'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const session = db.get(`series_session_${interaction.guild.id}`);
        if (!session) {
            return interaction.reply({ content: '❌ No active series session. Use `/startseries` to start one.', flags: MessageFlags.Ephemeral });
        }

        const totalEpRatings = Object.values(session.episodeRatings || {}).reduce((sum, arr) => sum + arr.length, 0);
        const ratedEpisodes = Object.keys(session.episodeRatings || {}).length;
        const totalReactions = Object.values(session.reactions || {}).reduce((sum, arr) => sum + arr.length, 0);
        const elapsed = Math.round((Date.now() - session.startedAt) / 60000);

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`📺 Series Progress — ${session.title}`)
                    .addFields(
                        { name: '📍 Current Episode', value: `S${session.currentSeason}E${session.currentEpisode}`, inline: true },
                        { name: '📅 Total Seasons', value: `${session.totalSeasons || 'Unknown'}`, inline: true },
                        { name: '👤 Started by', value: `<@${session.startedBy}>`, inline: true },
                        { name: '⭐ Episode ratings submitted', value: `${totalEpRatings}`, inline: true },
                        { name: '🎬 Episodes rated', value: `${ratedEpisodes}`, inline: true },
                        { name: '😂 Current ep reactions', value: `${totalReactions}`, inline: true },
                        { name: '⏱️ Session duration', value: `${elapsed} min`, inline: true },
                    )
                    .setColor(0x1d3557)
                    .setThumbnail(session.poster || null)
            ]
        });
    }
};
