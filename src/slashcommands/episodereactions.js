const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('episodereactions')
        .setDescription('View reaction results for the current series episode'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const session = db.get(`series_session_${interaction.guild.id}`);
        if (!session) {
            return interaction.reply({ content: '❌ No active series session.', flags: MessageFlags.Ephemeral });
        }

        const reactions = session.reactions || {};
        const epKey = `S${session.currentSeason}E${session.currentEpisode}`;
        const lines = Object.entries(reactions).map(([emoji, users]) =>
            `${emoji} — **${users.length}** reaction${users.length !== 1 ? 's' : ''}${users.length ? ` — ${users.map(id => `<@${id}>`).join(', ')}` : ''}`
        );

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`📺 Episode Reactions — ${session.title} ${epKey}`)
                    .setDescription(lines.join('\n') || 'No reactions yet.')
                    .setColor(0x1d3557)
                    .setFooter({ text: `Session started by <@${session.startedBy}>` })
            ]
        });
    }
};
