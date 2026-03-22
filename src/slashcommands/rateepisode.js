const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rateepisode')
        .setDescription('Rate the current episode')
        .addIntegerOption(opt =>
            opt.setName('score').setDescription('Rating 1–10').setRequired(true).setMinValue(1).setMaxValue(10))
        .addStringOption(opt =>
            opt.setName('review').setDescription('Optional review').setRequired(false)),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const session = db.get(`series_session_${interaction.guildId}`);
        if (!session)
            return interaction.reply({ content: '❌ No active series session.', ephemeral: true });

        const score = interaction.options.getInteger('score');
        const review = interaction.options.getString('review') || null;
        const key = `ep_ratings_${interaction.guildId}_${session.seriesKey}_S${session.season}E${session.episode}`;
        const ratings = db.get(key) || [];
        const idx = ratings.findIndex(r => r.userId === interaction.user.id);
        const entry = { userId: interaction.user.id, username: interaction.user.username, score, review, date: Date.now() };
        if (idx >= 0) ratings[idx] = entry; else ratings.push(entry);
        db.set(key, ratings);

        const avg = (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1);

        const embed = new EmbedBuilder()
            .setTitle(`⭐ Episode Rated: S${session.season}E${session.episode}`)
            .setDescription(`**${session.title}**`)
            .setColor(0xffd700)
            .addFields(
                { name: 'Your Score', value: `${score}/10`, inline: true },
                { name: 'Server Avg', value: `${avg}/10 (${ratings.length} votes)`, inline: true }
            ).setTimestamp();

        if (review) embed.addFields({ name: '📝 Review', value: review });

        return interaction.reply({ embeds: [embed] });
    }
};
