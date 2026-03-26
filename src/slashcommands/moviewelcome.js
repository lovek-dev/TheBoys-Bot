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
            .setTitle('🎬 Welcome to the Movie & Series Hub')
            .setDescription(
                'Welcome! This server is dedicated to watching movies and series together.\n' +
                'Join watch parties, rate content, vote on what to watch, and have fun 🍿\n\n' +
                '**Click the button below to join us and share your recommendations!**'
            )
            .setImage('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80')
            .setColor(0x5865F2);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('join_movie_form')
                .setLabel('Join Us')
                .setEmoji('🎬')
                .setStyle(ButtonStyle.Primary)
        );

        await interaction.reply({ content: '✅ Welcome message sent!', flags: MessageFlags.Ephemeral });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    }
};
