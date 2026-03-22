const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seriesmark')
        .setDescription('Save your current episode timestamp')
        .addStringOption(opt =>
            opt.setName('time').setDescription('Timestamp in hh:mm:ss or mm:ss').setRequired(true)),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const time = interaction.options.getString('time');
        if (!/^\d{1,2}:\d{2}(:\d{2})?$/.test(time))
            return interaction.reply({ content: '❌ Invalid format. Use `hh:mm:ss` or `mm:ss`.', ephemeral: true });

        db.set(`seriesmark_${interaction.guildId}`, { time, savedAt: Date.now(), userId: interaction.user.id });

        const embed = new EmbedBuilder()
            .setTitle('⏱ Episode Timestamp Saved')
            .setDescription(`Saved at **${time}**. Use \`/seriesresume\` to see it.`)
            .setColor(0x00cec9).setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
