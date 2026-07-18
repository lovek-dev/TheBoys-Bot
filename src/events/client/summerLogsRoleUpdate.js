const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember, client) {
        const channelId = client.db.get(`summer_logs_channel_${newMember.guild.id}`);
        if (!channelId) return;
        const channel = newMember.guild.channels.cache.get(channelId);
        if (!channel) return;

        // Role changes
        const addedRoles   = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
        const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

        if (addedRoles.size > 0 || removedRoles.size > 0) {
            await new Promise(r => setTimeout(r, 800));
            let executor = null;

            try {
                const logs = await newMember.guild.fetchAuditLogs({ limit: 5, type: AuditLogEvent.MemberRoleUpdate });
                const log = logs.entries.find(e => e.target.id === newMember.id && Date.now() - e.createdTimestamp < 5000);
                if (log) executor = log.executor;
            } catch (e) {}

            const embed = new EmbedBuilder()
                .setTitle('🔄 Member Role Updated')
                .addFields(
                    { name: 'Member',  value: `<@${newMember.id}> (${newMember.user.tag})`,      inline: true },
                    { name: 'By',      value: executor ? `${executor.tag}` : 'Unknown',          inline: true },
                    ...(addedRoles.size > 0   ? [{ name: '➕ Roles Added',   value: addedRoles.map(r   => `<@&${r.id}>`).join(', '), inline: false }] : []),
                    ...(removedRoles.size > 0 ? [{ name: '➖ Roles Removed', value: removedRoles.map(r => `<@&${r.id}>`).join(', '), inline: false }] : [])
                )
                .setColor(0x5865F2)
                .setTimestamp();

            channel.send({ embeds: [embed] }).catch(() => {});
        }
    }
};
