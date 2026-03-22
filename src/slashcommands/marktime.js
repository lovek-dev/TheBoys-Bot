const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marktime')
        .setDescription('Save your current timestamp in the movie')
        .addStringOption(opt =>
            opt.setName('time')
                .setDescription('Timestamp in hh:mm:ss or mm:ss format')
                .setRequired(true)),
    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', ephemeral: true });
        }

        const time = interaction.options.getString('time');
        if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
            return interaction.reply({ content: '❌ Invalid format. Use `hh:mm:ss` or `mm:ss`.', ephemeral: true });
        }

        db.set(`movie_timestamp_${interaction.guildId}_${interaction.user.id}`, { time, savedAt: Date.now() });

        const embed = new EmbedBuilder()
            .setTitle('⏱ Timestamp Saved!')
            .setDescription(`Your progress has been saved at **${time}**. Use \`/resume\` to get it back later.`)
            .setColor(0x00cec9)
            .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
