const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summerform')
        .setDescription('Set the channel where SummerSMP applications are sent for staff review')
        .addChannelOption(opt =>
            opt.setName('channel')
                .setDescription('The review channel')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction, client) {
        const channel = interaction.options.getChannel('channel');
        client.db.set(`summer_form_channel_${interaction.guildId}`, channel.id);
        await interaction.reply({ content: `✅ SummerSMP application forms will now be sent to ${channel} for review.`, ephemeral: true });
    }
};
