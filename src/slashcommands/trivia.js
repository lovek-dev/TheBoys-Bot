const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

const TRIVIA = [
    { q: 'What 1994 film features a man who sits at a bus stop and says "Life is like a box of chocolates"?', a: 'Forrest Gump', choices: ['Cast Away', 'Forrest Gump', 'The Green Mile', 'Philadelphia'] },
    { q: 'Who directed "Pulp Fiction" (1994)?', a: 'Quentin Tarantino', choices: ['Martin Scorsese', 'Steven Spielberg', 'Quentin Tarantino', 'Christopher Nolan'] },
    { q: 'In "The Matrix", which pill does Neo take to see the truth?', a: 'Red', choices: ['Blue', 'Green', 'Red', 'Yellow'] },
    { q: 'Which film won the first Academy Award for Best Picture?', a: 'Wings', choices: ['Wings', 'Sunrise', 'The Jazz Singer', 'Seventh Heaven'] },
    { q: 'What is the name of the ship in "Titanic" (1997)?', a: 'RMS Titanic', choices: ['HMS Victory', 'RMS Titanic', 'SS Minnow', 'Nostromo'] },
    { q: 'Who played Iron Man in the Marvel Cinematic Universe?', a: 'Robert Downey Jr.', choices: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'] },
    { q: 'Which film features the quote "Here\'s looking at you, kid"?', a: 'Casablanca', choices: ['Casablanca', 'Citizen Kane', 'Gone with the Wind', 'Rebecca'] },
    { q: 'What animated film features a character named Simba?', a: 'The Lion King', choices: ['Bambi', 'Tarzan', 'The Lion King', 'Jungle Book'] },
    { q: 'Who directed "Inception" (2010)?', a: 'Christopher Nolan', choices: ['James Cameron', 'Christopher Nolan', 'Ridley Scott', 'Steven Spielberg'] },
    { q: 'Which movie has the tagline "In space no one can hear you scream"?', a: 'Alien', choices: ['Predator', 'Event Horizon', 'Alien', 'Interstellar'] },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Start a movie trivia question for the watch party'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const item = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
        const shuffled = [...item.choices].sort(() => Math.random() - 0.5);
        const labels = ['A', 'B', 'C', 'D'];
        const answered = new Set();
        let correct = 0;
        let wrong = 0;

        const buildEmbed = () => new EmbedBuilder()
            .setTitle('🎬 Movie Trivia!')
            .setDescription(`**${item.q}**\n\n${shuffled.map((c, i) => `${labels[i]}. ${c}`).join('\n')}`)
            .addFields(
                { name: '✅ Correct', value: `${correct}`, inline: true },
                { name: '❌ Wrong', value: `${wrong}`, inline: true },
            )
            .setColor(0x6a0572)
            .setFooter({ text: 'Answer within 30 seconds!' });

        const row = new ActionRowBuilder().addComponents(
            shuffled.map((c, i) =>
                new ButtonBuilder().setCustomId(`trivia_${i}`).setLabel(labels[i]).setStyle(ButtonStyle.Primary)
            )
        );

        const msg = await interaction.reply({ embeds: [buildEmbed()], components: [row], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30_000 });

        collector.on('collect', async i => {
            if (answered.has(i.user.id)) return i.reply({ content: 'You already answered!', flags: MessageFlags.Ephemeral });
            answered.add(i.user.id);
            const chosen = shuffled[parseInt(i.customId.replace('trivia_', ''))];
            if (chosen === item.a) {
                correct++;
                await i.reply({ content: `✅ Correct, <@${i.user.id}>! The answer is **${item.a}**.`, flags: MessageFlags.Ephemeral });
            } else {
                wrong++;
                await i.reply({ content: `❌ Wrong! The correct answer is **${item.a}**.`, flags: MessageFlags.Ephemeral });
            }
            await msg.edit({ embeds: [buildEmbed()], components: [row] }).catch(() => {});
        });

        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                shuffled.map((c, i) =>
                    new ButtonBuilder().setCustomId(`trivia_${i}`).setLabel(labels[i]).setStyle(ButtonStyle.Secondary).setDisabled(true)
                )
            );
            const endEmbed = buildEmbed().setFooter({ text: `Time's up! Answer was: ${item.a}` });
            await msg.edit({ embeds: [endEmbed], components: [disabledRow] }).catch(() => {});
        });
    }
};
