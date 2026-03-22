const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const { searchSeries, getShowDetails } = require('../utils/seriesFetch');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startseries')
        .setDescription('Start a TV series watch party')
        .addStringOption(opt =>
            opt.setName('name').setDescription('Series name').setRequired(true)),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled in this server.', ephemeral: true });

        await interaction.deferReply();
        const name = interaction.options.getString('name');
        const show = await searchSeries(name);

        if (!show) {
            return interaction.editReply({ content: `❌ Could not find **${name}**. Set TMDB_API_KEY or OMDB_API_KEY for best results.` });
        }

        // Store pending show info so select menus can read it
        db.set(`series_pending_${interaction.guildId}`, {
            ...show,
            requestedBy: interaction.user.id,
            channelId: interaction.channelId
        });

        const embed = new EmbedBuilder()
            .setTitle(`📺 ${show.title}`)
            .setDescription(show.overview || 'No overview available.')
            .setColor(0x6c5ce7)
            .addFields(
                { name: '⭐ Rating', value: `${show.rating}`, inline: true },
                { name: '📁 Source', value: show.source === 'tmdb' ? 'TMDB' : 'OMDB', inline: true }
            )
            .setFooter({ text: 'Select a season to continue' });

        if (show.poster) embed.setThumbnail(show.poster);

        // Build season select (up to 25 seasons)
        let seasonCount = show.totalSeasons || 8;
        if (show.source === 'tmdb' && show.id) {
            try {
                const details = await getShowDetails(show.id);
                if (details?.number_of_seasons) seasonCount = details.number_of_seasons;
                // also patch embed with season/episode counts
                embed.addFields(
                    { name: '📺 Seasons', value: `${details.number_of_seasons}`, inline: true },
                    { name: '🎬 Episodes', value: `${details.number_of_episodes}`, inline: true }
                );
            } catch (e) {}
        }

        const options = [];
        for (let s = 1; s <= Math.min(seasonCount, 25); s++) {
            options.push({ label: `Season ${s}`, value: `${s}` });
        }

        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId(`series_select_season_${interaction.guildId}`)
                .setPlaceholder('Choose a season…')
                .addOptions(options)
        );

        return interaction.editReply({ embeds: [embed], components: [row] });
    }
};
