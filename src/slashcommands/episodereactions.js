const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('episodereactions')
        .setDescription('Show reaction stats for the current episode'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const session = db.get(`series_session_${interaction.guildId}`);
        if (!session)
            return interaction.reply({ content: '❌ No active series session.', ephemeral: true });

        const reactKey = `ep_reactions_${interaction.guildId}_${session.seriesKey}_S${session.season}E${session.episode}`;
        const reactions = db.get(reactKey) || { funny: 0, scary: 0, plottwist: 0, cringe: 0 };
        const total = Object.values(reactions).reduce((a, b) => a + b, 0);

        const embed = new EmbedBuilder()
            .setTitle(`😂 Episode Reactions: S${session.season}E${session.episode}`)
            .setDescription(`**${session.title}**`)
            .setColor(0xfdcb6e)
            .addFields(
                { name: '😂 Funny', value: `${reactions.funny}`, inline: true },
                { name: '😱 Scary', value: `${reactions.scary}`, inline: true },
                { name: '🤯 Plot Twist', value: `${reactions.plottwist}`, inline: true },
                { name: '💀 Cringe', value: `${reactions.cringe}`, inline: true },
                { name: '📈 Total', value: `${total}`, inline: true }
            ).setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
