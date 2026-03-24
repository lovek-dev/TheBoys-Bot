const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wishlist')
        .setDescription('View movie & series suggestions from club applications')
        .addUserOption(opt =>
            opt.setName('user').setDescription('View suggestions from a specific user (leave blank for all)').setRequired(false)
        ),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const targetUser = interaction.options.getUser('user');
        const wishlistKey = `wishlist_${interaction.guild.id}`;
        const wishlist = db.get(wishlistKey) || [];

        if (!wishlist.length) {
            return interaction.editReply({ content: '📭 No wishlist suggestions yet. Suggestions are saved when members apply via the Movie Club form.' });
        }

        const filtered = targetUser
            ? wishlist.filter(w => w.userId === targetUser.id)
            : wishlist;

        if (!filtered.length) {
            return interaction.editReply({ content: `📭 No suggestions found for ${targetUser.tag}.` });
        }

        // Tally up counts across all submissions
        const seriesTally = {};
        const movieTally = {};

        for (const entry of filtered) {
            for (const s of (entry.series || [])) {
                const key = s.toLowerCase().trim();
                if (!key) continue;
                seriesTally[key] = (seriesTally[key] || { title: s, count: 0 });
                seriesTally[key].count++;
            }
            for (const m of (entry.movies || [])) {
                const key = m.toLowerCase().trim();
                if (!key) continue;
                movieTally[key] = (movieTally[key] || { title: m, count: 0 });
                movieTally[key].count++;
            }
        }

        const topSeries = Object.values(seriesTally)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map((s, i) => `**${i + 1}.** ${s.title}${s.count > 1 ? ` *(×${s.count})*` : ''}`)
            .join('\n') || 'No series suggestions yet.';

        const topMovies = Object.values(movieTally)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map((m, i) => `**${i + 1}.** ${m.title}${m.count > 1 ? ` *(×${m.count})*` : ''}`)
            .join('\n') || 'No movie suggestions yet.';

        const embed = new EmbedBuilder()
            .setTitle(targetUser ? `🎬 Wishlist — ${targetUser.username}` : '🎬 Movie Club Wishlist')
            .setDescription(targetUser ? `Suggestions submitted by ${targetUser.tag}` : `Based on **${filtered.length}** application(s) from **${new Set(filtered.map(f => f.userId)).size}** member(s)`)
            .addFields(
                { name: '📺 Top Series Suggestions', value: topSeries, inline: false },
                { name: '🎥 Top Movie Suggestions', value: topMovies, inline: false }
            )
            .setColor(0x2b2d42)
            .setFooter({ text: 'Suggestions are collected from Movie Club applications' })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
