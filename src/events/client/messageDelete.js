const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        if (!message.guild || message.author?.bot) return;

        const logChannelId = client.db.get(`logs_channel_${message.guild.id}`);
        if (!logChannelId) return;

        const logChannel = message.guild.channels.cache.get(logChannelId);
        if (!logChannel) return;

        // Fetch audit logs to see who deleted the message
        const fetchedLogs = await message.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.MessageDelete,
        });
        
        const deletionLog = fetchedLogs.entries.first();
        let executor = 'Unknown (Likely Author)';

        if (deletionLog) {
            const { executor: logExecutor, target } = deletionLog;
            if (target && target.id === message.author.id && (Date.now() - deletionLog.createdTimestamp) < 5000) {
                executor = logExecutor.tag;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🗑️ Message Deleted')
            .addFields(
                { name: 'Author', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: 'Deleted By', value: executor, inline: true },
                { name: 'Channel', value: `${message.channel}`, inline: true },
                { name: 'Content', value: message.content || 'None (possibly an embed or image)' }
            )
            .setColor(0xff0000)
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};