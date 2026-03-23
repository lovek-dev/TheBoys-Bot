const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rateepisode')
        .setDescription('Rate the current series episode (1-10)')
        .addIntegerOption(opt =>
            opt.setName('score').setDescription('Your rating (1-10)').setRequired(true).setMinValue(1).setMaxValue(10)
        )
        .addStringOption(opt =>
            opt.setName('review').setDescription('Optional review').setRequired(false)
        ),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const session = db.get(`series_session_${interaction.guild.id}`);
        if (!session) {
            return interaction.reply({ content: '❌ No active series session. Use `/startseries` first.', flags: MessageFlags.Ephemeral });
        }

        const score = interaction.options.getInteger('score');
        const review = interaction.options.getString('review') || null;
        const epKey = `S${session.currentSeason}E${session.currentEpisode}`;

        if (!session.episodeRatings) session.episodeRatings = {};
        if (!session.episodeRatings[epKey]) session.episodeRatings[epKey] = [];

        const existing = session.episodeRatings[epKey].findIndex(r => r.userId === interaction.user.id);
        const entry = { userId: interaction.user.id, score, review, timestamp: Date.now() };

        if (existing !== -1) {
            session.episodeRatings[epKey][existing] = entry;
        } else {
            session.episodeRatings[epKey].push(entry);
        }

        db.set(`series_session_${interaction.guild.id}`, session);

        const stars = '⭐'.repeat(Math.round(score / 2));
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`⭐ Episode Rating — ${session.title} ${epKey}`)
                    .setDescription(`<@${interaction.user.id}> rated this **${score}/10** ${stars}${review ? `\n> ${review}` : ''}`)
                    .setColor(0xf4a261)
            ]
        });
    }
};
