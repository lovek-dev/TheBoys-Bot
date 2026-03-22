const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('topcharacters')
        .setDescription('Show the most loved characters in the current series'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const session = db.get(`series_session_${interaction.guildId}`);
        if (!session)
            return interaction.reply({ content: '❌ No active series session.', ephemeral: true });

        const key = `characters_${interaction.guildId}_${session.seriesKey}`;
        const chars = db.get(key) || {};

        const sorted = Object.entries(chars)
            .map(([name, data]) => ({ name, votes: data.votes }))
            .filter(c => c.votes > 0)
            .sort((a, b) => b.votes - a.votes);

        if (sorted.length === 0)
            return interaction.reply({ content: '❌ No character votes yet. Use `/favcharacter <name>`.', ephemeral: true });

        const medals = ['🥇', '🥈', '🥉'];
        const lines = sorted.slice(0, 10).map((c, i) =>
            `${medals[i] || `**${i + 1}.**`} **${c.name}** — ${c.votes} vote${c.votes !== 1 ? 's' : ''}`
        ).join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`🎭 Top Characters: ${session.title}`)
            .setDescription(lines)
            .setColor(0xfd79a8).setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
