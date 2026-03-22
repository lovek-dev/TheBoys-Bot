const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

function formatDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('endsession')
        .setDescription('End the current movie or series session and show a summary report'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const movieSession = db.get(`movie_session_${interaction.guildId}`);
        const seriesSession = db.get(`series_session_${interaction.guildId}`);
        const session = movieSession || seriesSession;

        if (!session)
            return interaction.reply({ content: '❌ No active session to end.', ephemeral: true });

        const isSeries = !!seriesSession;
        const duration = Date.now() - session.startTime;
        const reactions = session.reactions || { funny: 0, scary: 0, plottwist: 0, cringe: 0 };
        const reactionLog = session.reactionLog || [];

        // Find most active user from reaction log + session activity
        const activityCount = {};
        for (const r of reactionLog) {
            activityCount[r.userId] = (activityCount[r.userId] || 0) + 1;
        }
        const mostActiveId = Object.entries(activityCount).sort((a, b) => b[1] - a[1])[0]?.[0];

        // Find top reaction moment (most reactions within a log window)
        let topMoment = null;
        if (reactionLog.length > 0) {
            const sorted = [...reactionLog].sort((a, b) => a.at - b.at);
            const labels = { funny: '😂', scary: '😱', plottwist: '🤯', cringe: '💀' };
            topMoment = labels[sorted[sorted.length - 1]?.type] || '🎬';
        }

        // Get average rating for this content
        let avgRating = 'N/A';
        if (isSeries) {
            const rKey = `ep_ratings_${interaction.guildId}_${session.seriesKey}_S${session.season}E${session.episode}`;
            const ratings = db.get(rKey) || [];
            if (ratings.length > 0) avgRating = (ratings.reduce((a, b) => a + b.score, 0) / ratings.length).toFixed(1) + '/10';
        } else {
            const rKey = `movie_ratings_${interaction.guildId}_${(session.title || '').toLowerCase().replace(/\s+/g, '_')}`;
            const ratings = db.get(rKey) || [];
            if (ratings.length > 0) avgRating = (ratings.reduce((a, b) => a + b.score, 0) / ratings.length).toFixed(1) + '/10';
        }

        const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

        const embed = new EmbedBuilder()
            .setTitle('📊 Session Report')
            .setColor(0x00b894)
            .setDescription(isSeries
                ? `**${session.title}** — S${session.season}E${session.episode}`
                : `**${session.title || 'Movie'}**`)
            .addFields(
                { name: '⏱ Duration', value: formatDuration(duration), inline: true },
                { name: '⭐ Avg Rating', value: avgRating, inline: true },
                { name: '🎭 Total Reactions', value: `${totalReactions}`, inline: true },
                { name: '😂 Funny', value: `${reactions.funny}`, inline: true },
                { name: '😱 Scary', value: `${reactions.scary}`, inline: true },
                { name: '🤯 Plot Twist', value: `${reactions.plottwist}`, inline: true },
                { name: '💀 Cringe', value: `${reactions.cringe}`, inline: true },
                { name: '🔥 Most Active', value: mostActiveId ? `<@${mostActiveId}> (${activityCount[mostActiveId]} interactions)` : 'N/A', inline: true },
                { name: '🎬 Top Moment', value: topMoment || 'N/A', inline: true }
            )
            .setTimestamp();

        // Clear session
        if (isSeries) db.set(`series_session_${interaction.guildId}`, null);
        else db.set(`movie_session_${interaction.guildId}`, null);

        // Cancel any binge mode
        const bTimer = global.bingeTimers?.get(interaction.guildId);
        if (bTimer) { clearInterval(bTimer); global.bingeTimers.delete(interaction.guildId); }
        db.set(`binge_active_${interaction.guildId}`, false);

        return interaction.reply({ embeds: [embed] });
    }
};
