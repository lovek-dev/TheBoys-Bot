const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moviewelcome')
        .setDescription('Post the Movie & Series Hub welcome message'),

    async execute(interaction, client) {
        const embed = new EmbedBuilder()
            .setTitle('🎬 Welcome to the Movie & Series Hub')
            .setDescription(
                'Welcome! This server is dedicated to watching movies and series together.\n' +
                'Join watch parties, rate content, vote on what to watch, and have fun 🍿\n\n' +
                '**Click the button below to join us and share your recommendations!**'
            )
            .setImage('https://media.discordapp.net/attachments/1485320634857689259/1485344283195080964/a-neon-sign-that-says-cinema-is-lit-up-photo.png')
            .setColor(0xe17055)
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('moviewelcome_join')
                .setLabel('🍿 Join Us')
                .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({ embeds: [embed], components: [row] });
    }
};
