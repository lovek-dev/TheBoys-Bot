const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

async function fetchMovie(title) {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) return null;
    const fetch = (await import('node-fetch')).default;
    const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`);
    const data = await res.json();
    return data.Response === 'True' ? data : null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('startmovie')
        .setDescription('Start a watch party for a movie')
        .addStringOption(opt =>
            opt.setName('name')
                .setDescription('Movie title to watch')
                .setRequired(true))
        .addIntegerOption(opt =>
            opt.setName('countdown')
                .setDescription('Countdown in minutes before movie starts (default: 5)')
                .setRequired(false)),
    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', ephemeral: true });
        }

        await interaction.deferReply();
        const title = interaction.options.getString('name');
        const countdown = interaction.options.getInteger('countdown') ?? 5;
        const movie = await fetchMovie(title);

        const sessionId = `${interaction.guildId}_${Date.now()}`;
        const session = {
            id: sessionId,
            title: movie?.Title || title,
            startedBy: interaction.user.id,
            startedAt: Date.now(),
            reactions: { funny: 0, scary: 0, plottwist: 0, cringe: 0 },
            reactionLog: []
        };
        db.set(`movie_session_${interaction.guildId}`, session);
        db.set(`movie_session_id_${interaction.guildId}`, sessionId);

        const embed = new EmbedBuilder()
            .setTitle(`🎬 Watch Party: ${movie?.Title || title}`)
            .setColor(0x6c5ce7)
            .setTimestamp();

        if (movie) {
            embed.addFields(
                { name: '⭐ Rating', value: movie.imdbRating || 'N/A', inline: true },
                { name: '⏱ Duration', value: movie.Runtime || 'N/A', inline: true },
                { name: '🎭 Genre', value: movie.Genre || 'N/A', inline: true },
                { name: '📝 Plot', value: movie.Plot || 'N/A' }
            );
            if (movie.Poster && movie.Poster !== 'N/A') embed.setThumbnail(movie.Poster);
        } else {
            embed.setDescription(`Starting watch party for **${title}**\n*(No movie data found — set OMDB_API_KEY for rich info)*`);
        }

        embed.setFooter({ text: `🕐 Starts in ${countdown} minutes | React during the watch!` });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`movie_react_funny_${sessionId}`).setLabel('😂 Funny').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`movie_react_scary_${sessionId}`).setLabel('😱 Scary').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`movie_react_plottwist_${sessionId}`).setLabel('🤯 Plot Twist').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`movie_react_cringe_${sessionId}`).setLabel('💀 Cringe').setStyle(ButtonStyle.Secondary),
        );

        await interaction.editReply({ embeds: [embed], components: [row] });

        // Create discussion thread
        try {
            const message = await interaction.fetchReply();
            await message.startThread({
                name: `🎬 ${movie?.Title || title} - Discussion`,
                autoArchiveDuration: 1440
            });
        } catch (e) { /* thread creation optional */ }

        // Countdown announce
        if (countdown > 0) {
            setTimeout(async () => {
                try {
                    await interaction.channel.send(`🎬 **${movie?.Title || title}** is starting NOW! Enjoy the watch party! 🍿`);
                } catch (e) {}
            }, countdown * 60 * 1000);
        }
    }
};
