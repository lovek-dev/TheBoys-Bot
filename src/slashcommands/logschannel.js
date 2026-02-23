const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logschannel')
        .setDescription('Set the channel for bot logs')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send logs to')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        const channel = interaction.options.getChannel('channel');
        
        if (!channel.isTextBased()) {
            return interaction.reply({ content: 'Please select a text-based channel.', ephemeral: true });
        }

        client.db.set(`logs_channel_${interaction.guildId}`, channel.id);
        
        const embed = new EmbedBuilder()
            .setTitle('✅ Logs Channel Set')
            .setDescription(`Logging channel has been set to ${channel}`)
            .setColor(0x00ff00)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};