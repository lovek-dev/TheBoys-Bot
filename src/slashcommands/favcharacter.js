const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('favcharacter')
        .setDescription('Vote for your favourite character in the current series')
        .addStringOption(opt =>
            opt.setName('name').setDescription('Character name').setRequired(true)),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const session = db.get(`series_session_${interaction.guildId}`);
        if (!session)
            return interaction.reply({ content: '❌ No active series session.', ephemeral: true });

        const character = interaction.options.getString('name').trim();
        const key = `characters_${interaction.guildId}_${session.seriesKey}`;
        const chars = db.get(key) || {};

        if (!chars[character]) chars[character] = { votes: 0, voters: [] };
        if (chars[character].voters.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ You already voted for a character! Your vote stays.', ephemeral: true });
        }

        // Remove previous vote by this user from any character
        for (const c of Object.keys(chars)) {
            chars[c].voters = chars[c].voters.filter(id => id !== interaction.user.id);
            chars[c].votes = chars[c].voters.length;
        }

        chars[character].voters.push(interaction.user.id);
        chars[character].votes = chars[character].voters.length;
        db.set(key, chars);

        const embed = new EmbedBuilder()
            .setTitle('🎭 Favourite Character Voted!')
            .setDescription(`You voted for **${character}** in **${session.title}**!`)
            .setColor(0xfd79a8).setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
