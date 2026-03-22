const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ratings')
        .setDescription('Show ratings for a movie')
        .addStringOption(opt =>
            opt.setName('movie').setDescription('Movie title').setRequired(true)),
    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', ephemeral: true });
        }

        const movie = interaction.options.getString('movie');
        const key = `movie_ratings_${interaction.guildId}_${movie.toLowerCase().replace(/\s+/g, '_')}`;
        const ratings = db.get(key);

        if (!ratings || ratings.length === 0) {
            return interaction.reply({ content: `❌ No ratings found for **${movie}**. Use \`/rate\` to add one.`, ephemeral: true });
        }

        const avg = (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1);
        const topReview = ratings.filter(r => r.review).sort((a, b) => b.score - a.score)[0];

        const embed = new EmbedBuilder()
            .setTitle(`🎬 Ratings: ${movie}`)
            .setColor(0xffd700)
            .addFields(
                { name: '⭐ Average Rating', value: `${avg}/10`, inline: true },
                { name: '🗳️ Total Votes', value: `${ratings.length}`, inline: true }
            )
            .setTimestamp();

        if (topReview) {
            embed.addFields({ name: `🏆 Top Review by ${topReview.username} (${topReview.score}/10)`, value: topReview.review });
        }

        const breakdown = ratings.slice(-5).map(r => `**${r.username}**: ${r.score}/10${r.review ? ` — *${r.review.slice(0, 60)}*` : ''}`).join('\n');
        embed.addFields({ name: '📋 Recent Ratings', value: breakdown || 'None' });

        return interaction.reply({ embeds: [embed] });
    }
};
