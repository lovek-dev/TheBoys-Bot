const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wishlist')
        .setDescription('Show the server movie and series wishlist from member recommendations'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const movies = db.get(`wishlist_movies_${interaction.guildId}`) || [];
        const series = db.get(`wishlist_series_${interaction.guildId}`) || [];

        const embed = new EmbedBuilder()
            .setTitle('📋 Server Wishlist')
            .setColor(0x6c5ce7)
            .setTimestamp()
            .setFooter({ text: 'Add yours via the Join Us button in /moviewelcome' });

        embed.addFields(
            {
                name: `🎬 Movie Wishlist (${movies.length})`,
                value: movies.length > 0
                    ? movies.slice(0, 25).map((m, i) => `${i + 1}. ${m}`).join('\n')
                    : 'No movies added yet.',
                inline: false
            },
            {
                name: `📺 Series Wishlist (${series.length})`,
                value: series.length > 0
                    ? series.slice(0, 25).map((s, i) => `${i + 1}. ${s}`).join('\n')
                    : 'No series added yet.',
                inline: false
            }
        );

        return interaction.reply({ embeds: [embed] });
    }
};
