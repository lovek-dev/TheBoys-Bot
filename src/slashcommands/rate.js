const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rate')
        .setDescription('Rate a movie')
        .addStringOption(opt =>
            opt.setName('movie').setDescription('Movie title').setRequired(true))
        .addIntegerOption(opt =>
            opt.setName('score')
                .setDescription('Rating from 1–10')
                .setRequired(true)
                .setMinValue(1).setMaxValue(10))
        .addStringOption(opt =>
            opt.setName('review').setDescription('Optional short review').setRequired(false)),
    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', ephemeral: true });
        }

        const movie = interaction.options.getString('movie');
        const score = interaction.options.getInteger('score');
        const review = interaction.options.getString('review') || null;

        const key = `movie_ratings_${interaction.guildId}_${movie.toLowerCase().replace(/\s+/g, '_')}`;
        const ratings = db.get(key) || [];
        // Update or add
        const idx = ratings.findIndex(r => r.userId === interaction.user.id);
        const entry = { userId: interaction.user.id, username: interaction.user.username, score, review, date: Date.now() };
        if (idx >= 0) ratings[idx] = entry; else ratings.push(entry);
        db.set(key, ratings);

        // Track rated movies for recommendations
        const history = db.get(`movie_history_${interaction.guildId}`) || [];
        if (!history.find(h => h.title.toLowerCase() === movie.toLowerCase())) {
            history.push({ title: movie, ratedAt: Date.now() });
            db.set(`movie_history_${interaction.guildId}`, history);
        }

        const avg = (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1);

        const embed = new EmbedBuilder()
            .setTitle(`⭐ Rating Saved: ${movie}`)
            .setColor(0xffd700)
            .addFields(
                { name: 'Your Rating', value: `${score}/10`, inline: true },
                { name: 'Server Average', value: `${avg}/10 (${ratings.length} votes)`, inline: true }
            )
            .setTimestamp();

        if (review) embed.addFields({ name: '📝 Your Review', value: review });

        return interaction.reply({ embeds: [embed] });
    }
};
