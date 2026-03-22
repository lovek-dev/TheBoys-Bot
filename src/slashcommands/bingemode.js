const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const { getSeasonDetails, getEpisodeDetails } = require('../utils/seriesFetch');
const db = require('../database/db');

// In-memory binge timers (reset on restart)
if (!global.bingeTimers) global.bingeTimers = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bingemode')
        .setDescription('Auto-advance episodes during a binge session')
        .addStringOption(opt =>
            opt.setName('action')
                .setDescription('Start or stop binge mode')
                .setRequired(true)
                .addChoices(
                    { name: 'start', value: 'start' },
                    { name: 'stop', value: 'stop' }
                ))
        .addIntegerOption(opt =>
            opt.setName('interval')
                .setDescription('Minutes between episodes (default 25)')
                .setRequired(false)
                .setMinValue(1).setMaxValue(180)),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const session = db.get(`series_session_${interaction.guildId}`);
        if (!session)
            return interaction.reply({ content: '❌ No active series session. Use `/startseries` first.', ephemeral: true });

        const action = interaction.options.getString('action');

        if (action === 'stop') {
            const timer = global.bingeTimers.get(interaction.guildId);
            if (timer) { clearInterval(timer); global.bingeTimers.delete(interaction.guildId); }
            db.set(`binge_active_${interaction.guildId}`, false);
            const embed = new EmbedBuilder().setTitle('⏹️ Binge Mode Stopped').setColor(0xff4444).setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        // start
        if (global.bingeTimers.has(interaction.guildId)) {
            return interaction.reply({ content: '⚠️ Binge mode is already running! Use `/bingemode stop` first.', ephemeral: true });
        }

        const intervalMins = interaction.options.getInteger('interval') ?? 25;
        db.set(`binge_active_${interaction.guildId}`, true);

        const embed = new EmbedBuilder()
            .setTitle('🔥 Binge Mode Started!')
            .setDescription(`The next episode will automatically start every **${intervalMins} minutes**.`)
            .setColor(0xe17055)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        const timer = setInterval(async () => {
            const currentSession = db.get(`series_session_${interaction.guildId}`);
            if (!currentSession || !db.get(`binge_active_${interaction.guildId}`)) {
                clearInterval(timer);
                global.bingeTimers.delete(interaction.guildId);
                return;
            }

            let nextSeason = currentSession.season, nextEpisode = currentSession.episode + 1;

            if (currentSession.showId) {
                const seasonData = await getSeasonDetails(currentSession.showId, currentSession.season);
                if (nextEpisode > (seasonData?.episodes?.length || 99)) {
                    nextSeason = currentSession.season + 1;
                    nextEpisode = 1;
                }
            }

            currentSession.season = nextSeason;
            currentSession.episode = nextEpisode;
            currentSession.startTime = Date.now();
            currentSession.reactions = { funny: 0, scary: 0, plottwist: 0, cringe: 0 };
            currentSession.reactionLog = [];
            db.set(`series_session_${interaction.guildId}`, currentSession);

            try {
                const channel = await client.channels.fetch(currentSession.channelId);
                let epInfo = null;
                if (currentSession.showId) epInfo = await getEpisodeDetails(currentSession.showId, nextSeason, nextEpisode);

                const nextEmbed = new EmbedBuilder()
                    .setTitle(`🎬 Binge: Now Watching S${nextSeason}E${nextEpisode}`)
                    .setDescription(`**${currentSession.title}**${epInfo?.name ? ` — ${epInfo.name}` : ''}`)
                    .setColor(0xe17055).setTimestamp();

                if (epInfo?.still_path) nextEmbed.setImage(`https://image.tmdb.org/t/p/w500${epInfo.still_path}`);
                channel.send({ embeds: [nextEmbed] });
            } catch (e) {
                console.error('[BINGE] Error advancing episode:', e.message);
            }
        }, intervalMins * 60 * 1000);

        global.bingeTimers.set(interaction.guildId, timer);
    }
};
