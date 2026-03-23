const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('See your saved timestamp for the current movie'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const session = db.get(`movie_session_${interaction.guild.id}`);
        if (!session) {
            return interaction.reply({ content: '❌ No active movie session.', flags: MessageFlags.Ephemeral });
        }

        const markers = session.markers || [];
        const marker = markers.find(m => m.userId === interaction.user.id);

        if (!marker) {
            return interaction.reply({ content: '❌ You have no saved timestamp. Use `/marktime` first.', flags: MessageFlags.Ephemeral });
        }

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('▶️ Resume Point')
                    .setDescription(`Pick up **${session.title}** from **${marker.time}**${marker.note ? `\n> ${marker.note}` : ''}`)
                    .setColor(0x264653)
                    .setFooter({ text: `Saved at ${new Date(marker.savedAt).toLocaleTimeString()}` })
            ],
            flags: MessageFlags.Ephemeral
        });
    }
};
