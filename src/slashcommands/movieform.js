const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('movieform')
        .setDescription('Set the channel where join form submissions are sent')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(opt =>
            opt.setName('channel')
                .setDescription('Channel to receive form submissions')
                .setRequired(true)),

    async execute(interaction, client) {
        const channel = interaction.options.getChannel('channel');
        db.set(`movieform_channel_${interaction.guildId}`, channel.id);

        const embed = new EmbedBuilder()
            .setTitle('✅ Movie Form Channel Set')
            .setDescription(`Join form submissions will now be sent to ${channel}.\n\nOwners will be pinged and can Accept or Deny each application.`)
            .setColor(0x00b894)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
