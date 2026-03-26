const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moviewelcome')
        .setDescription('Send the Movie Club welcome message with a Join Us button'),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎬 Welcome to the Movie Club!')
            .setDescription(
                'Want to be part of our watch parties, movie discussions, and series nights?\n\n' +
                'Click **Join Us** below to apply — it only takes a minute!'
            )
            .addFields(
                { name: '🍿 What you get', value: 'Access to watch party sessions, movie polls, trivia nights, and more!' },
                { name: '📋 How it works', value: 'Fill out a short form. The team will review it and you\'ll get a DM with the result.' }
            )
            .setColor(0xe63946)
            .setFooter({ text: 'One application per 12 hours • All applications are reviewed manually' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('join_movie_form')
                .setLabel('🎬 Join Us')
                .setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ content: '✅ Welcome message sent!', flags: MessageFlags.Ephemeral });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    }
};
