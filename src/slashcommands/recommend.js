const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

const genreMap = {
    action: ['Mad Max: Fury Road', 'John Wick', 'The Dark Knight', 'Mission Impossible', 'Avengers: Endgame'],
    comedy: ['Superbad', 'The Grand Budapest Hotel', 'Game Night', 'Knives Out', 'Bridesmaids'],
    horror: ['Hereditary', 'A Quiet Place', 'Get Out', 'The Conjuring', 'It'],
    romance: ['La La Land', 'The Notebook', 'Crazy Rich Asians', 'Pride & Prejudice', 'About Time'],
    scifi: ['Interstellar', 'Inception', 'The Matrix', 'Dune', 'Blade Runner 2049'],
    thriller: ['Gone Girl', 'Parasite', 'Shutter Island', 'Oldboy', 'Prisoners'],
    animation: ['Spider-Man: Into the Spider-Verse', 'Your Name', 'Spirited Away', 'Coco', 'Soul'],
    drama: ['The Shawshank Redemption', 'Forrest Gump', 'Schindler\'s List', 'Good Will Hunting', '1917']
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recommend')
        .setDescription('Get movie recommendations based on genre or server history')
        .addStringOption(opt =>
            opt.setName('genre')
                .setDescription('Genre to get recommendations for')
                .setRequired(false)
                .addChoices(
                    ...Object.keys(genreMap).map(g => ({ name: g, value: g }))
                )),
    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', ephemeral: true });
        }

        const genre = interaction.options.getString('genre');
        const history = db.get(`movie_history_${interaction.guildId}`) || [];
        const watchedTitles = history.map(h => h.title.toLowerCase());

        let picks, description;

        if (genre && genreMap[genre]) {
            let pool = genreMap[genre].filter(m => !watchedTitles.includes(m.toLowerCase()));
            if (pool.length === 0) pool = genreMap[genre]; // reset if all watched
            picks = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
            description = `🎭 **${genre.charAt(0).toUpperCase() + genre.slice(1)}** picks for you:`;
        } else {
            // Pick randomly from all genres, exclude watched
            const all = Object.values(genreMap).flat();
            let pool = all.filter(m => !watchedTitles.includes(m.toLowerCase()));
            if (pool.length < 3) pool = all;
            picks = pool.sort(() => 0.5 - Math.random()).slice(0, 3);
            description = `🎬 Random picks based on your server history:`;
        }

        const embed = new EmbedBuilder()
            .setTitle('🍿 Movie Recommendations')
            .setColor(0x00b894)
            .setDescription(description + '\n\n' + picks.map((m, i) => `${i + 1}. **${m}**`).join('\n'))
            .setFooter({ text: `Already watched ${watchedTitles.length} movies in this server!` })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
