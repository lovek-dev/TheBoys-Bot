const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verifyforms')
        .setDescription('Set the verification forms channel')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send forms to')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        const channel = interaction.options.getChannel('channel');
        client.db.set(`verify_channel_${interaction.guildId}`, channel.id);
        await interaction.reply({ content: `Verification channel set to ${channel}`, ephemeral: true });
    },
};
