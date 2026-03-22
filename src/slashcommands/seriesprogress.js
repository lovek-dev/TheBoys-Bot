const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

function progressBar(current, total, len = 10) {
    const filled = Math.round((current / total) * len);
    return '█'.repeat(filled) + '░'.repeat(len - filled);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seriesprogress')
        .setDescription('Show progress through the current series'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const session = db.get(`series_session_${interaction.guildId}`);
        if (!session)
            return interaction.reply({ content: '❌ No active series session.', ephemeral: true });

        const progress = db.get(`series_progress_${interaction.guildId}_${session.seriesKey}`) || {};
        const totalSeasons = session.totalSeasons || session.season;

        const lines = [];
        for (let s = 1; s <= totalSeasons; s++) {
            const epDone = progress[`S${s}`] || 0;
            const epTotal = session.episodesPerSeason?.[s] || 10;
            const bar = progressBar(epDone, epTotal);
            lines.push(`**Season ${s}:** ${bar} (${epDone}/${epTotal})`);
        }

        const embed = new EmbedBuilder()
            .setTitle(`📊 Series Progress: ${session.title}`)
            .setDescription(lines.join('\n') || 'No progress tracked yet.')
            .setColor(0xa29bfe)
            .addFields({ name: '📍 Currently On', value: `S${session.season}E${session.episode}`, inline: true })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
