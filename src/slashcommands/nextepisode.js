const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nextepisode')
        .setDescription('Move the series session to the next episode'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const session = db.get(`series_session_${interaction.guild.id}`);
        if (!session) {
            return interaction.reply({ content: '❌ No active series session. Use `/startseries` first.', flags: MessageFlags.Ephemeral });
        }

        session.currentEpisode++;
        session.reactions = { '😂': [], '😱': [], '🤯': [], '💀': [] };
        db.set(`series_session_${interaction.guild.id}`, session);

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`📺 Next Episode!`)
                    .setDescription(`Moving to **${session.title}** — **S${session.currentSeason}E${session.currentEpisode}**`)
                    .setColor(0x1d3557)
                    .setFooter({ text: `Reactions have been reset for the new episode` })
            ]
        });
    }
};
