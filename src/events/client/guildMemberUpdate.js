const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember, client) {
        const logChannelId = client.db.get(`logs_channel_${newMember.guild.id}`);
        if (!logChannelId) return;

        const logChannel = newMember.guild.channels.cache.get(logChannelId);
        if (!logChannel) return;

        // Check for Timeout (Communication Disabled)
        const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
        const newTimeout = newMember.communicationDisabledUntilTimestamp;

        if (!oldTimeout && newTimeout) {
            // Member was timed out
            const fetchedLogs = await newMember.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberUpdate,
            });

            const timeoutLog = fetchedLogs.entries.first();
            let executor = 'Unknown';
            let reason = 'No reason provided';

            if (timeoutLog) {
                executor = timeoutLog.executor.tag;
                reason = timeoutLog.reason || 'No reason provided';
            }

            const duration = Math.round((newTimeout - Date.now()) / 1000 / 60);

            const embed = new EmbedBuilder()
                .setTitle('🔇 User Timed Out')
                .addFields(
                    { name: 'User', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
                    { name: 'Executor', value: executor, inline: true },
                    { name: 'Duration', value: `${duration} minutes`, inline: true },
                    { name: 'Reason', value: reason }
                )
                .setColor(0xffa500)
                .setTimestamp();

            logChannel.send({ embeds: [embed] }).catch(() => {});
        } else if (oldTimeout && !newTimeout) {
            // Timeout was removed
            const embed = new EmbedBuilder()
                .setTitle('🔊 Timeout Removed')
                .setDescription(`Timeout for ${newMember.user.tag} has been removed or expired.`)
                .setColor(0x00ff00)
                .setTimestamp();

            logChannel.send({ embeds: [embed] }).catch(() => {});
        }
    }
};