const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const { fetchMovie } = require('../utils/movie/fetchMovie');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startmovie')
        .setDescription('Start a movie watch party session')
        .addStringOption(opt =>
            opt.setName('name').setDescription('Movie name').setRequired(true)
        ),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        const name = interaction.options.getString('name');
        const info = await fetchMovie(name);

        const session = {
            movieName: name,
            title: info.title,
            year: info.year,
            plot: info.plot,
            runtime: info.runtime,
            imdbRating: info.imdbRating,
            genre: info.genre || 'Unknown',
            poster: info.poster,
            startedAt: Date.now(),
            startedBy: interaction.user.id,
            reactions: { '😂': [], '😱': [], '🤯': [], '💀': [] },
        };

        db.set(`movie_session_${interaction.guild.id}`, session);

        const embed = new EmbedBuilder()
            .setTitle(`🎬 Now Watching: ${info.title} (${info.year})`)
            .setDescription(info.plot)
            .addFields(
                { name: '⏱ Runtime', value: info.runtime, inline: true },
                { name: '⭐ IMDB', value: info.imdbRating, inline: true },
                { name: '🎭 Genre', value: info.genre || 'Unknown', inline: true },
                { name: '👤 Started by', value: `<@${interaction.user.id}>`, inline: true },
            )
            .setColor(0xe63946)
            .setFooter({ text: 'React below to log your reactions!' });

        if (info.poster) embed.setThumbnail(info.poster);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('movie_react_😂').setLabel('😂').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('movie_react_😱').setLabel('😱').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('movie_react_🤯').setLabel('🤯').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('movie_react_💀').setLabel('💀').setStyle(ButtonStyle.Secondary),
        );

        const msg = await interaction.editReply({ embeds: [embed], components: [row] });

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 4 * 60 * 60 * 1000 });

        collector.on('collect', async i => {
            if (!i.customId.startsWith('movie_react_')) return;
            const emoji = i.customId.replace('movie_react_', '');
            const current = db.get(`movie_session_${interaction.guild.id}`);
            if (!current) return i.reply({ content: '❌ No active session.', flags: MessageFlags.Ephemeral });

            if (!current.reactions[emoji]) current.reactions[emoji] = [];
            const idx = current.reactions[emoji].indexOf(i.user.id);
            if (idx === -1) {
                current.reactions[emoji].push(i.user.id);
                db.set(`movie_session_${interaction.guild.id}`, current);
                await i.reply({ content: `${emoji} reaction logged!`, flags: MessageFlags.Ephemeral });
            } else {
                current.reactions[emoji].splice(idx, 1);
                db.set(`movie_session_${interaction.guild.id}`, current);
                await i.reply({ content: `${emoji} reaction removed.`, flags: MessageFlags.Ephemeral });
            }
        });
    }
};
