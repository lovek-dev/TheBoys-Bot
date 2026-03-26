const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moviestats')
        .setDescription('View movie watch party stats for this server or a user')
        .addUserOption(opt => opt.setName('user').setDescription('User to check stats for (leave blank for server stats)').setRequired(false)),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const target = interaction.options.getUser('user');
        const session = db.get(`movie_session_${interaction.guild.id}`);
        const recommendations = db.get(`movie_recommendations_${interaction.guild.id}`) || [];

        if (target) {
            const ratings = session?.ratingsList?.filter(r => r.userId === target.id) || [];
            const reactionCount = session ? Object.values(session.reactions || {}).reduce((sum, arr) => sum + (arr.includes(target.id) ? 1 : 0), 0) : 0;
            const userRecs = recommendations.filter(r => r.userId === target.id);

            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`📊 Stats for ${target.username}`)
                        .addFields(
                            { name: '⭐ Ratings given', value: `${ratings.length}`, inline: true },
                            { name: '😂 Reactions made', value: `${reactionCount}`, inline: true },
                            { name: '🎬 Movies recommended', value: `${userRecs.length}`, inline: true },
                        )
                        .setColor(0x2b2d42)
                        .setThumbnail(target.displayAvatarURL())
                ]
            });
        }

        const totalRatings = session?.ratingsList?.length || 0;
        const avgRating = totalRatings
            ? (session.ratingsList.reduce((s, r) => s + r.score, 0) / totalRatings).toFixed(1)
            : 'N/A';
        const totalReactions = session
            ? Object.values(session.reactions || {}).reduce((sum, arr) => sum + arr.length, 0)
            : 0;

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`📊 Movie Stats — ${interaction.guild.name}`)
                    .addFields(
                        { name: '🎬 Current movie', value: session ? session.title : 'None', inline: true },
                        { name: '⭐ Total ratings', value: `${totalRatings}`, inline: true },
                        { name: '🌟 Average rating', value: `${avgRating}`, inline: true },
                        { name: '😂 Total reactions', value: `${totalReactions}`, inline: true },
                        { name: '📋 Recommendations', value: `${recommendations.length}`, inline: true },
                    )
                    .setColor(0x2b2d42)
            ]
        });
    }
};
