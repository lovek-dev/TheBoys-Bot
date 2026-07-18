const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        const channelId = client.db.get(`summer_logs_channel_${member.guild.id}`);
        if (!channelId) return;
        const channel = member.guild.channels.cache.get(channelId);
        if (!channel) return;

        // Check audit logs to distinguish leave vs kick
        await new Promise(r => setTimeout(r, 1000));
        let action = 'left';
        let executor = null;
        let reason = 'No reason provided';

        try {
            const logs = await member.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberKick });
            const kickLog = logs.entries.find(e => e.target.id === member.id && Date.now() - e.createdTimestamp < 5000);
            if (kickLog) {
                action = 'kicked';
                executor = kickLog.executor;
                reason = kickLog.reason || 'No reason provided';
            }
        } catch (e) {}

        const embed = new EmbedBuilder()
            .setTitle(action === 'kicked' ? '👢 Member Kicked' : '📤 Member Left')
            .setDescription(`<@${member.id}> ${action === 'kicked' ? 'was kicked from' : 'left'} the server.`)
            .addFields(
                { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                ...(action === 'kicked' ? [
                    { name: 'Kicked By', value: executor ? `${executor.tag}` : 'Unknown', inline: true },
                    { name: 'Reason',    value: reason, inline: false }
                ] : [])
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setColor(action === 'kicked' ? 0xFF8800 : 0x888888)
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(() => {});
    }
};
