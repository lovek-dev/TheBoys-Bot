const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user')
        .addStringOption(option => option.setName('userid').setDescription('The ID of the user to unban').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for the unban'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction, client) {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            await interaction.guild.members.unban(userId, reason);
            
            const embed = new EmbedBuilder()
                .setTitle('🔓 User Unbanned')
                .addFields(
                    { name: 'User ID', value: userId, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setColor(0x00ff00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            const logChannelId = client.db.get(`logs_channel_${interaction.guildId}`);
            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
            }
        } catch (error) {
            await interaction.reply({ content: `Failed to unban: ${error.message}`, ephemeral: true });
        }
    }
};