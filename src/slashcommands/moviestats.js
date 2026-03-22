const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moviestats')
        .setDescription('Show the server movie stats dashboard'),
    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', ephemeral: true });
        }

        const history = db.get(`movie_history_${interaction.guildId}`) || [];
        const leaderboard = db.get(`trivia_leaderboard_${interaction.guildId}`) || {};

        // Read all keys from DB to find ratings for this guild
        let dbData = {};
        try {
            const dbPath = path.join(__dirname, '../../database.json');
            dbData = JSON.parse(fs.readFileSync(dbPath));
        } catch (e) {}

        // Find top rated movie
        let topRated = null;
        let topAvg = 0;
        for (const [key, val] of Object.entries(dbData)) {
            if (key.startsWith(`movie_ratings_${interaction.guildId}_`) && Array.isArray(val) && val.length > 0) {
                const avg = val.reduce((s, r) => s + r.score, 0) / val.length;
                if (avg > topAvg) {
                    topAvg = avg;
                    const movieName = key.replace(`movie_ratings_${interaction.guildId}_`, '').replace(/_/g, ' ');
                    topRated = { name: movieName, avg: avg.toFixed(1), votes: val.length };
                }
            }
        }

        // Top trivia user
        const sorted = Object.entries(leaderboard).sort((a, b) => b[1] - a[1]);
        const topUser = sorted[0];

        const embed = new EmbedBuilder()
            .setTitle('📊 Movie Stats Dashboard')
            .setColor(0x6c5ce7)
            .addFields(
                { name: '🎬 Movies Watched', value: `${history.length}`, inline: true },
                { name: '🏆 Top Rated', value: topRated ? `**${topRated.name}** — ${topRated.avg}/10 (${topRated.votes} votes)` : 'No ratings yet', inline: false },
                { name: '🧠 Trivia Champion', value: topUser ? `<@${topUser[0]}> with **${topUser[1]} points**` : 'No trivia played yet', inline: false }
            )
            .setTimestamp();

        if (history.length > 0) {
            const recent = history.slice(-3).reverse().map(h => `• ${h.title}`).join('\n');
            embed.addFields({ name: '🕐 Recently Watched', value: recent });
        }

        return interaction.reply({ embeds: [embed] });
    }
};
