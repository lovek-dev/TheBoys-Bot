const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a member (timeout)')
        .addUserOption(option => option.setName('target').setDescription('The member to mute').setRequired(true))
        .addStringOption(option => option.setName('duration').setDescription('Duration (e.g., 60s, 5m, 1h)').setRequired(true))
        .addStringOption(option => option.setName('reason').setDescription('Reason for the mute'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    async execute(interaction, client) {
        const target = interaction.options.getMember('target');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        if (!target) return interaction.reply({ content: 'Member not found.', ephemeral: true });
        
        const msDuration = ms(duration);
        if (!msDuration || msDuration < 5000 || msDuration > 2419200000) {
            return interaction.reply({ content: 'Invalid duration. Use 5s to 28d.', ephemeral: true });
        }

        try {
            await target.timeout(msDuration, reason);
            
            const embed = new EmbedBuilder()
                .setTitle('🔇 Member Muted')
                .addFields(
                    { name: 'Target', value: `${target.user.tag} (${target.id})`, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setColor(0xffa500)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            const logChannelId = client.db.get(`logs_channel_${interaction.guildId}`);
            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) logChannel.send({ embeds: [embed] }).catch(() => {});
            }
        } catch (error) {
            await interaction.reply({ content: `Failed to mute: ${error.message}`, ephemeral: true });
        }
    }
};