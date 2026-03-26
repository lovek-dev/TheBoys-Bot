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
            .setImage('https://media.discordapp.net/attachments/1485320634857689259/1485344283195080964/a-neon-sign-that-says-cinema-is-lit-up-photo.png?ex=69c62369&is=69c4d1e9&hm=26f04dc5799e344b47f52ef9bfbdf9dcdb6787b3d9aeaf9bf43867e6fd8c1200&=&format=webp&quality=lossless&width=781&height=438')
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
