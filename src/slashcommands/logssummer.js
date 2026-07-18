const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logssummer')
        .setDescription('Set the channel for SummerSMP logs (joins, leaves, bans, role changes, timeouts, promotions)')
        .addChannelOption(opt =>
            opt.setName('channel')
                .setDescription('The logs channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const channel = interaction.options.getChannel('channel');
        client.db.set(`summer_logs_channel_${interaction.guildId}`, channel.id);
        await interaction.reply({
            content: `✅ SummerSMP logs (joins, leaves, bans, kicks, timeouts, role changes, promotions) will be sent to ${channel}.`,
            ephemeral: true
        });
    }
};
