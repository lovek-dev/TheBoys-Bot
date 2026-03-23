const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const { fetchSeries } = require('../utils/series/fetchSeries');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startseries')
        .setDescription('Start a series watch party session')
        .addStringOption(opt => opt.setName('name').setDescription('Series name').setRequired(true))
        .addIntegerOption(opt => opt.setName('season').setDescription('Season number').setRequired(true).setMinValue(1))
        .addIntegerOption(opt => opt.setName('episode').setDescription('Episode number').setRequired(true).setMinValue(1)),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        const name = interaction.options.getString('name');
        const season = interaction.options.getInteger('season');
        const episode = interaction.options.getInteger('episode');
        const info = await fetchSeries(name);

        const session = {
            seriesName: name,
            title: info.title,
            year: info.year,
            plot: info.plot,
            totalSeasons: info.totalSeasons,
            imdbRating: info.imdbRating,
            genre: info.genre || 'Unknown',
            poster: info.poster,
            currentSeason: season,
            currentEpisode: episode,
            startedAt: Date.now(),
            startedBy: interaction.user.id,
            reactions: { '😂': [], '😱': [], '🤯': [], '💀': [] },
            episodeRatings: {},
            markers: [],
        };

        db.set(`series_session_${interaction.guild.id}`, session);

        const embed = new EmbedBuilder()
            .setTitle(`📺 Now Watching: ${info.title} S${season}E${episode}`)
            .setDescription(info.plot)
            .addFields(
                { name: '🎭 Genre', value: info.genre || 'Unknown', inline: true },
                { name: '⭐ IMDB', value: info.imdbRating, inline: true },
                { name: '📅 Year', value: info.year, inline: true },
                { name: '👤 Started by', value: `<@${interaction.user.id}>`, inline: true },
            )
            .setColor(0x1d3557)
            .setFooter({ text: 'React below to log your episode reactions!' });

        if (info.poster) embed.setThumbnail(info.poster);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('series_react_😂').setLabel('😂').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('series_react_😱').setLabel('😱').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('series_react_🤯').setLabel('🤯').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('series_react_💀').setLabel('💀').setStyle(ButtonStyle.Secondary),
        );

        const msg = await interaction.editReply({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 4 * 60 * 60 * 1000 });

        collector.on('collect', async i => {
            if (!i.customId.startsWith('series_react_')) return;
            const emoji = i.customId.replace('series_react_', '');
            const current = db.get(`series_session_${interaction.guild.id}`);
            if (!current) return i.reply({ content: '❌ No active session.', flags: MessageFlags.Ephemeral });

            if (!current.reactions[emoji]) current.reactions[emoji] = [];
            const idx = current.reactions[emoji].indexOf(i.user.id);
            if (idx === -1) {
                current.reactions[emoji].push(i.user.id);
                db.set(`series_session_${interaction.guild.id}`, current);
                await i.reply({ content: `${emoji} reaction logged!`, flags: MessageFlags.Ephemeral });
            } else {
                current.reactions[emoji].splice(idx, 1);
                db.set(`series_session_${interaction.guild.id}`, current);
                await i.reply({ content: `${emoji} reaction removed.`, flags: MessageFlags.Ephemeral });
            }
        });
    }
};
