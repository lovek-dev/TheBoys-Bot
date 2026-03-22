const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const { getTaste, getTopGenres, getDominantReaction } = require('../utils/tasteTracker');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('taste')
        .setDescription('View your (or someone else\'s) movie/series taste profile')
        .addUserOption(opt =>
            opt.setName('user').setDescription('User to check (default: yourself)').setRequired(false)),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const target = interaction.options.getUser('user') || interaction.user;
        const taste = getTaste(target.id, interaction.guildId);

        const topGenres = getTopGenres(taste);
        const dominantReaction = getDominantReaction(taste);
        const totalRatings = taste.ratings.length;
        const totalReactions = Object.values(taste.reactions).reduce((a, b) => a + b, 0);

        const embed = new EmbedBuilder()
            .setTitle(`🧬 Taste Profile: ${target.username}`)
            .setColor(0x6c5ce7)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                {
                    name: '🎭 Top Genres',
                    value: topGenres.length > 0 ? topGenres.join(', ') : 'Not enough data yet',
                    inline: false
                },
                {
                    name: '⭐ Average Rating',
                    value: totalRatings > 0 ? `${taste.avgRating}/10 (from ${totalRatings} rating${totalRatings !== 1 ? 's' : ''})` : 'No ratings yet',
                    inline: true
                },
                {
                    name: '🎯 Dominant Reaction',
                    value: dominantReaction,
                    inline: true
                },
                {
                    name: '📊 All Reactions',
                    value: `😂 ${taste.reactions.funny}  😱 ${taste.reactions.scary}  🤯 ${taste.reactions.plottwist}  💀 ${taste.reactions.cringe}`,
                    inline: false
                },
                {
                    name: '🔢 Total Activity',
                    value: `${totalRatings} rating${totalRatings !== 1 ? 's' : ''} • ${totalReactions} reaction${totalReactions !== 1 ? 's' : ''}`,
                    inline: false
                }
            )
            .setFooter({ text: 'Profile built from your ratings and reactions in this server' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
