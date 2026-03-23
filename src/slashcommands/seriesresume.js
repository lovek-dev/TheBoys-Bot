const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seriesresume')
        .setDescription('See your saved timestamp for the current series episode'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const session = db.get(`series_session_${interaction.guild.id}`);
        if (!session) {
            return interaction.reply({ content: '❌ No active series session.', flags: MessageFlags.Ephemeral });
        }

        const markers = session.markers || [];
        const marker = markers.find(m => m.userId === interaction.user.id);

        if (!marker) {
            return interaction.reply({ content: '❌ No saved timestamp. Use `/seriesmark` to save one.', flags: MessageFlags.Ephemeral });
        }

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('▶️ Series Resume Point')
                    .setDescription(`Resume **${session.title}** S${session.currentSeason}E${session.currentEpisode} from **${marker.time}**${marker.note ? `\n> ${marker.note}` : ''}`)
                    .setColor(0x1d3557)
                    .setFooter({ text: `Saved at ${new Date(marker.savedAt).toLocaleTimeString()}` })
            ],
            flags: MessageFlags.Ephemeral
        });
    }
};
