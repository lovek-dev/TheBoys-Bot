const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
    name: 'guildBanRemove',
    async execute(ban, client) {
        const channelId = client.db.get(`summer_logs_channel_${ban.guild.id}`);
        if (!channelId) return;
        const channel = ban.guild.channels.cache.get(channelId);
        if (!channel) return;

        await new Promise(r => setTimeout(r, 800));
        let executor = null;

        try {
            const logs = await ban.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberBanRemove });
            const unbanLog = logs.entries.find(e => e.target.id === ban.user.id && Date.now() - e.createdTimestamp < 5000);
            if (unbanLog) executor = unbanLog.executor;
        } catch (e) {}

        const embed = new EmbedBuilder()
            .setTitle('✅ Member Unbanned')
            .setDescription(`<@${ban.user.id}> has been unbanned.`)
            .addFields(
                { name: 'User',        value: `${ban.user.tag} (${ban.user.id})`,       inline: true },
                { name: 'Unbanned By', value: executor ? `${executor.tag}` : 'Unknown', inline: true }
            )
            .setColor(0x00FF88)
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(() => {});
    }
};
