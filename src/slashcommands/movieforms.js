const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('movieforms')
        .setDescription('Set the channel where movie club applications are sent')
        .addChannelOption(opt =>
            opt.setName('channel').setDescription('The channel to receive applications').setRequired(true)
        ),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const ownerIds = client.config.OWNER || [];
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ Only the bot owner can use this command.', flags: MessageFlags.Ephemeral });
        }

        const channel = interaction.options.getChannel('channel');
        db.set(`movie_forms_channel_${interaction.guild.id}`, channel.id);

        return interaction.reply({
            content: `✅ Movie club applications will now be sent to <#${channel.id}>.`,
            flags: MessageFlags.Ephemeral
        });
    }
};
