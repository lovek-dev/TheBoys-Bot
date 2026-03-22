const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('movieresults')
        .setDescription('Show reaction results for the current/last movie session'),
    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', ephemeral: true });
        }

        const session = db.get(`movie_session_${interaction.guildId}`);
        if (!session) {
            return interaction.reply({ content: '❌ No movie session found. Start one with `/startmovie`.', ephemeral: true });
        }

        const { funny, scary, plottwist, cringe } = session.reactions;
        const total = funny + scary + plottwist + cringe;

        const embed = new EmbedBuilder()
            .setTitle(`📊 Reaction Results: ${session.title}`)
            .setColor(0x6c5ce7)
            .addFields(
                { name: '😂 Funny', value: `${funny} reactions`, inline: true },
                { name: '😱 Scary', value: `${scary} reactions`, inline: true },
                { name: '🤯 Plot Twist', value: `${plottwist} reactions`, inline: true },
                { name: '💀 Cringe', value: `${cringe} reactions`, inline: true },
                { name: '📈 Total Reactions', value: `${total}`, inline: true }
            )
            .setFooter({ text: `Session started by <@${session.startedBy}>` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
