const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const { getEpisodeDetails } = require('../utils/seriesFetch');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recap')
        .setDescription('Show a recap of the last episode watched'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const session = db.get(`series_session_${interaction.guildId}`);
        if (!session)
            return interaction.reply({ content: '❌ No active series session.', ephemeral: true });

        await interaction.deferReply();

        const prevEp = session.episode > 1
            ? { s: session.season, e: session.episode - 1 }
            : { s: Math.max(1, session.season - 1), e: 1 };

        let epInfo = null;
        if (session.showId) {
            epInfo = await getEpisodeDetails(session.showId, prevEp.s, prevEp.e);
        }

        const reactKey = `ep_reactions_${interaction.guildId}_${session.seriesKey}_S${prevEp.s}E${prevEp.e}`;
        const reactions = db.get(reactKey) || { funny: 0, scary: 0, plottwist: 0, cringe: 0 };

        const embed = new EmbedBuilder()
            .setTitle(`🎬 Previously On: ${session.title}`)
            .setDescription(`**S${prevEp.s}E${prevEp.e}${epInfo?.name ? ` — ${epInfo.name}` : ''}**\n\n${epInfo?.overview || '*No summary available*'}`)
            .setColor(0xe17055)
            .addFields(
                { name: '😂 Funny', value: `${reactions.funny}`, inline: true },
                { name: '😱 Scary', value: `${reactions.scary}`, inline: true },
                { name: '🤯 Plot Twist', value: `${reactions.plottwist}`, inline: true },
                { name: '💀 Cringe', value: `${reactions.cringe}`, inline: true }
            )
            .setTimestamp();

        if (epInfo?.still_path) embed.setImage(`https://image.tmdb.org/t/p/w500${epInfo.still_path}`);

        return interaction.editReply({ embeds: [embed] });
    }
};
