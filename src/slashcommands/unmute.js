const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a member')
        .addUserOption(option => option.setName('target').setDescription('The member to unmute').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for the unmute'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction, client) {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) return interaction.reply({ content: 'Member not found.', ephemeral: true });

        try {
            await target.timeout(null, reason);
            
            const embed = new EmbedBuilder()
                .setTitle('🔊 Member Unmuted')
                .addFields(
                    { name: 'Target', value: `${target.user.tag} (${target.id})`, inline: true },
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
            await interaction.reply({ content: `Failed to unmute: ${error.message}`, ephemeral: true });
        }
    }
};