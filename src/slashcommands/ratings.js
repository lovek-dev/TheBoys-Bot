const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ratings')
        .setDescription('View all ratings for the current movie session'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const session = db.get(`movie_session_${interaction.guild.id}`);
        if (!session) {
            return interaction.reply({ content: '❌ No active movie session.', flags: MessageFlags.Ephemeral });
        }

        const list = session.ratingsList || [];
        if (!list.length) {
            return interaction.reply({ content: '📊 No ratings yet. Use `/rate` to submit yours!', flags: MessageFlags.Ephemeral });
        }

        const avg = (list.reduce((s, r) => s + r.score, 0) / list.length).toFixed(1);
        const lines = list.map(r =>
            `<@${r.userId}> — **${r.score}/10**${r.review ? ` — _${r.review}_` : ''}`
        );

        const embed = new EmbedBuilder()
            .setTitle(`📊 Ratings for: ${session.title}`)
            .setDescription(lines.join('\n'))
            .addFields({ name: '🌟 Average Score', value: `${avg}/10`, inline: true })
            .setColor(0xf4a261);

        return interaction.reply({ embeds: [embed] });
    }
};
