const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remindmovie')
        .setDescription('Set a reminder before the movie starts')
        .addIntegerOption(opt =>
            opt.setName('minutes')
                .setDescription('Remind me in this many minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1440)),
    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', ephemeral: true });
        }

        const minutes = interaction.options.getInteger('minutes');

        const embed = new EmbedBuilder()
            .setTitle('⏰ Reminder Set!')
            .setDescription(`I'll ping you in **${minutes} minute${minutes !== 1 ? 's' : ''}**!`)
            .setColor(0xe17055)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        setTimeout(async () => {
            try {
                await interaction.channel.send(`<@${interaction.user.id}> 🎬 Your movie reminder! Time to join the watch party!`);
            } catch (e) {
                try { await interaction.user.send('🎬 Your movie reminder! Time to join the watch party!'); } catch (e2) {}
            }
        }, minutes * 60 * 1000);
    }
};
