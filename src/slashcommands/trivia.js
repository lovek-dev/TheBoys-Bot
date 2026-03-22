const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

const questions = [
    { q: 'Which movie won the first-ever Academy Award for Best Picture?', options: ['Wings', 'Sunrise', 'Seventh Heaven', 'The Circus'], answer: 0 },
    { q: 'Who directed "Inception" (2010)?', options: ['Steven Spielberg', 'Christopher Nolan', 'James Cameron', 'David Fincher'], answer: 1 },
    { q: 'What is the highest-grossing film of all time (as of 2023)?', options: ['Avengers: Endgame', 'Titanic', 'Avatar', 'Star Wars: The Force Awakens'], answer: 2 },
    { q: '"I\'ll be back." is a famous quote from which movie?', options: ['Predator', 'RoboCop', 'The Terminator', 'Total Recall'], answer: 2 },
    { q: 'Which actor played Iron Man in the MCU?', options: ['Chris Evans', 'Robert Downey Jr.', 'Mark Ruffalo', 'Chris Hemsworth'], answer: 1 },
    { q: 'In "The Lion King", what is the name of Simba\'s father?', options: ['Scar', 'Rafiki', 'Mufasa', 'Zazu'], answer: 2 },
    { q: 'Who directed "Parasite" (2019)?', options: ['Park Chan-wook', 'Bong Joon-ho', 'Lee Chang-dong', 'Hong Sang-soo'], answer: 1 },
    { q: 'Which movie features the song "My Heart Will Go On"?', options: ['Ghost', 'Dirty Dancing', 'Titanic', 'Pretty Woman'], answer: 2 },
    { q: 'What year was "The Godfather" released?', options: ['1969', '1970', '1972', '1974'], answer: 2 },
    { q: 'In "Pulp Fiction", what is in the briefcase?', options: ['Gold bars', 'Diamonds', 'It\'s never revealed', 'Money'], answer: 2 },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Answer a random movie trivia question and earn points!'),
    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', ephemeral: true });
        }

        const q = questions[Math.floor(Math.random() * questions.length)];
        const triviaKey = `trivia_${interaction.guildId}_${interaction.user.id}_${Date.now()}`;

        db.set(triviaKey, { answer: q.answer, expires: Date.now() + 30000 });

        const labels = ['A', 'B', 'C', 'D'];
        const buttons = q.options.map((opt, i) =>
            new ButtonBuilder()
                .setCustomId(`trivia_ans_${i}_${triviaKey}`)
                .setLabel(`${labels[i]}: ${opt}`)
                .setStyle(ButtonStyle.Primary)
        );

        const rows = [];
        for (let i = 0; i < buttons.length; i += 2) {
            rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 2)));
        }

        const embed = new EmbedBuilder()
            .setTitle('🎬 Movie Trivia!')
            .setDescription(`**${q.q}**\n\nYou have **30 seconds** to answer!`)
            .setColor(0xfdcb6e)
            .setFooter({ text: 'Correct answers earn +10 points!' })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], components: rows });
    }
};
