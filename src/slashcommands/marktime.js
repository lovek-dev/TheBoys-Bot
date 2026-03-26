const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marktime')
        .setDescription('Mark your current timestamp in the movie')
        .addStringOption(opt =>
            opt.setName('time').setDescription('Current time (e.g. 1:23:45 or 45:30)').setRequired(true)
        )
        .addStringOption(opt =>
            opt.setName('note').setDescription('Optional note').setRequired(false)
        ),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const session = db.get(`movie_session_${interaction.guild.id}`);
        if (!session) {
            return interaction.reply({ content: '❌ No active movie session. Use `/startmovie` first.', flags: MessageFlags.Ephemeral });
        }

        const time = interaction.options.getString('time');
        const note = interaction.options.getString('note') || null;

        if (!session.markers) session.markers = [];
        session.markers = session.markers.filter(m => m.userId !== interaction.user.id);
        session.markers.push({ userId: interaction.user.id, time, note, savedAt: Date.now() });
        db.set(`movie_session_${interaction.guild.id}`, session);

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('⏱️ Timestamp Saved')
                    .setDescription(`<@${interaction.user.id}> marked **${time}** in **${session.title}**${note ? `\n> ${note}` : ''}`)
                    .setColor(0x264653)
            ],
            flags: MessageFlags.Ephemeral
        });
    }
};
