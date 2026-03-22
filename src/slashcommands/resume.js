const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Get your last saved movie timestamp'),
    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', ephemeral: true });
        }

        const saved = db.get(`movie_timestamp_${interaction.guildId}_${interaction.user.id}`);
        if (!saved) {
            return interaction.reply({ content: '❌ No saved timestamp found. Use `/marktime` to save one.', ephemeral: true });
        }

        const savedAgo = Math.round((Date.now() - saved.savedAt) / 60000);

        const embed = new EmbedBuilder()
            .setTitle('▶️ Resume Here')
            .setDescription(`You last paused at **${saved.time}**\n*(saved ${savedAgo} minute${savedAgo !== 1 ? 's' : ''} ago)*`)
            .setColor(0x00cec9)
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
