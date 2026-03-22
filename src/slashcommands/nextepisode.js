const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const { getSeasonDetails, getEpisodeDetails } = require('../utils/seriesFetch');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nextepisode')
        .setDescription('Advance to the next episode in the current series session'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const session = db.get(`series_session_${interaction.guildId}`);
        if (!session)
            return interaction.reply({ content: '❌ No active series session. Use `/startseries` first.', ephemeral: true });

        await interaction.deferReply();

        let { season, episode } = session;
        let nextSeason = season, nextEpisode = episode + 1;

        // Check if we need to roll over to next season
        if (session.showId) {
            const seasonData = await getSeasonDetails(session.showId, season);
            const epCount = seasonData?.episodes?.length || 99;
            if (episode >= epCount) {
                nextSeason = season + 1;
                nextEpisode = 1;
            }
        } else {
            // OMDB: just keep incrementing — no episode count info
        }

        session.season = nextSeason;
        session.episode = nextEpisode;
        session.startTime = Date.now();
        session.reactions = { funny: 0, scary: 0, plottwist: 0, cringe: 0 };
        session.reactionLog = [];
        db.set(`series_session_${interaction.guildId}`, session);

        // Save progress
        const progress = db.get(`series_progress_${interaction.guildId}_${session.seriesKey}`) || {};
        progress[`S${nextSeason}`] = Math.max(progress[`S${nextSeason}`] || 0, nextEpisode);
        db.set(`series_progress_${interaction.guildId}_${session.seriesKey}`, progress);

        // Fetch episode details
        let epInfo = null;
        if (session.showId) {
            epInfo = await getEpisodeDetails(session.showId, nextSeason, nextEpisode);
        }

        const embed = new EmbedBuilder()
            .setTitle(`📺 Now Watching: ${session.title}`)
            .setDescription(`**S${nextSeason}E${nextEpisode}${epInfo?.name ? ` — ${epInfo.name}` : ''}**\n${epInfo?.overview || ''}`)
            .setColor(0x00b894)
            .addFields(
                { name: '📍 Episode', value: `S${nextSeason}E${nextEpisode}`, inline: true },
                { name: '⭐ Ep Rating', value: epInfo?.vote_average ? `${epInfo.vote_average.toFixed(1)}/10` : 'N/A', inline: true }
            )
            .setTimestamp();

        if (epInfo?.still_path) embed.setImage(`https://image.tmdb.org/t/p/w500${epInfo.still_path}`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`ep_react_funny_${interaction.guildId}`).setLabel('😂 Funny').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`ep_react_scary_${interaction.guildId}`).setLabel('😱 Scary').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`ep_react_plottwist_${interaction.guildId}`).setLabel('🤯 Plot Twist').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`ep_react_cringe_${interaction.guildId}`).setLabel('💀 Cringe').setStyle(ButtonStyle.Secondary),
        );

        return interaction.editReply({ embeds: [embed], components: [row] });
    }
};
