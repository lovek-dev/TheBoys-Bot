const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pollmovie')
        .setDescription('Create a movie vote poll')
        .addStringOption(opt => opt.setName('movie1').setDescription('First movie option').setRequired(true))
        .addStringOption(opt => opt.setName('movie2').setDescription('Second movie option').setRequired(true))
        .addStringOption(opt => opt.setName('movie3').setDescription('Third movie option (optional)').setRequired(false))
        .addStringOption(opt => opt.setName('movie4').setDescription('Fourth movie option (optional)').setRequired(false))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Poll duration in minutes (default: 5)').setRequired(false)),
    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', ephemeral: true });
        }

        const movies = [
            interaction.options.getString('movie1'),
            interaction.options.getString('movie2'),
            interaction.options.getString('movie3'),
            interaction.options.getString('movie4'),
        ].filter(Boolean);

        const duration = (interaction.options.getInteger('duration') ?? 5) * 60 * 1000;
        const pollId = `poll_${interaction.guildId}_${Date.now()}`;

        const votes = {};
        movies.forEach(m => votes[m] = []);
        db.set(pollId, { movies, votes, endsAt: Date.now() + duration });

        const emojis = ['🎬', '🎥', '🍿', '🎞️'];
        const buttons = movies.map((m, i) =>
            new ButtonBuilder()
                .setCustomId(`movie_vote_${i}_${pollId}`)
                .setLabel(`${emojis[i]} ${m}`)
                .setStyle(ButtonStyle.Primary)
        );

        const rows = [];
        for (let i = 0; i < buttons.length; i += 2) {
            rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 2)));
        }

        const embed = new EmbedBuilder()
            .setTitle('🗳️ Movie Vote Poll')
            .setDescription('Vote for what the server should watch next!\n\n' + movies.map((m, i) => `${emojis[i]} **${m}**`).join('\n'))
            .setColor(0xa29bfe)
            .setFooter({ text: `Poll ends in ${interaction.options.getInteger('duration') ?? 5} minutes` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], components: rows });

        // Announce winner after duration
        setTimeout(async () => {
            try {
                const pollData = db.get(pollId);
                if (!pollData) return;

                const results = pollData.movies.map(m => ({ movie: m, count: (pollData.votes[m] || []).length }));
                results.sort((a, b) => b.count - a.count);
                const winner = results[0];

                const resultEmbed = new EmbedBuilder()
                    .setTitle('🏆 Poll Results!')
                    .setColor(0xffd700)
                    .setDescription(`**Winner: ${winner.movie}** with **${winner.count} vote(s)**!\n\n` +
                        results.map((r, i) => `${i + 1}. ${r.movie} — ${r.count} vote(s)`).join('\n'))
                    .setTimestamp();

                await interaction.channel.send({ embeds: [resultEmbed] });
                db.set(pollId, null);
            } catch (e) { console.error('Poll end error:', e); }
        }, duration);
    }
};
