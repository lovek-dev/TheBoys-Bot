const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seriesresume')
        .setDescription('Show where the server left off in the current series'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const session = db.get(`series_session_${interaction.guildId}`);
        if (!session)
            return interaction.reply({ content: '❌ No active series session.', ephemeral: true });

        const ts = db.get(`seriesmark_${interaction.guildId}`);

        const embed = new EmbedBuilder()
            .setTitle('▶️ Series Resume')
            .setColor(0x00cec9)
            .addFields(
                { name: '📺 Series', value: session.title, inline: true },
                { name: '📍 Last Watched', value: `S${session.season}E${session.episode}`, inline: true }
            )
            .setTimestamp();

        if (ts) {
            const ago = Math.round((Date.now() - ts.savedAt) / 60000);
            embed.addFields({ name: '⏱ Timestamp', value: `${ts.time} *(saved ${ago}m ago)*`, inline: true });
        }

        return interaction.reply({ embeds: [embed] });
    }
};
