const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send a DM to a user or role')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('dm_user')
                    .setLabel('User')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('dm_role')
                    .setLabel('Role')
                    .setStyle(ButtonStyle.Secondary),
            );

        await interaction.reply({
            content: 'Do you want to send to a Role or a User?',
            components: [row],
            ephemeral: true
        });
    },
};
