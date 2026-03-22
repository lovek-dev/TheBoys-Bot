const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('episoderatings')
        .setDescription('Show ratings for the current episode'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const session = db.get(`series_session_${interaction.guildId}`);
        if (!session)
            return interaction.reply({ content: '❌ No active series session.', ephemeral: true });

        const key = `ep_ratings_${interaction.guildId}_${session.seriesKey}_S${session.season}E${session.episode}`;
        const ratings = db.get(key) || [];

        if (ratings.length === 0)
            return interaction.reply({ content: `❌ No ratings yet for S${session.season}E${session.episode}. Use \`/rateepisode\`.`, ephemeral: true });

        const avg = (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1);
        const top = ratings.filter(r => r.review).sort((a, b) => b.score - a.score)[0];

        const embed = new EmbedBuilder()
            .setTitle(`📊 Episode Ratings: S${session.season}E${session.episode}`)
            .setDescription(`**${session.title}**`)
            .setColor(0xffd700)
            .addFields(
                { name: '⭐ Average', value: `${avg}/10`, inline: true },
                { name: '🗳️ Votes', value: `${ratings.length}`, inline: true }
            ).setTimestamp();

        if (top) embed.addFields({ name: `🏆 Best Review — ${top.username} (${top.score}/10)`, value: top.review });

        const recent = ratings.slice(-4).map(r => `**${r.username}**: ${r.score}/10`).join('\n');
        embed.addFields({ name: '📋 Recent', value: recent });

        return interaction.reply({ embeds: [embed] });
    }
};
