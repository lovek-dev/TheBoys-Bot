const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
    name: 'guildBanAdd',
    async execute(ban, client) {
        const channelId = client.db.get(`summer_logs_channel_${ban.guild.id}`);
        if (!channelId) return;
        const channel = ban.guild.channels.cache.get(channelId);
        if (!channel) return;

        await new Promise(r => setTimeout(r, 800));
        let executor = null;
        let reason = ban.reason || 'No reason provided';

        try {
            const logs = await ban.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberBanAdd });
            const banLog = logs.entries.find(e => e.target.id === ban.user.id && Date.now() - e.createdTimestamp < 5000);
            if (banLog) {
                executor = banLog.executor;
                reason = banLog.reason || reason;
            }
        } catch (e) {}

        const embed = new EmbedBuilder()
            .setTitle('🔨 Member Banned')
            .setDescription(`<@${ban.user.id}> has been banned.`)
            .addFields(
                { name: 'User',      value: `${ban.user.tag} (${ban.user.id})`,         inline: true },
                { name: 'Banned By', value: executor ? `${executor.tag}` : 'Unknown',   inline: true },
                { name: 'Reason',    value: reason,                                      inline: false }
            )
            .setThumbnail(ban.user.displayAvatarURL())
            .setColor(0xFF0000)
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(() => {});
    }
};
