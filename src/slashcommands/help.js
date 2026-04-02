const { SlashCommandBuilder } = require('discord.js');
const { buildHelpEmbed } = require('../utils/helpEmbed');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('See every command and action the bot can do'),

    async execute(interaction, client) {
        await interaction.reply({ embeds: [buildHelpEmbed()] });
    },
};
