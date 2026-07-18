const { EmbedBuilder, AuditLogEvent } = require('discord.js');

// Helper to get and send to summer logs channel
async function sendSummerLog(client, guildId, embed) {
    const channelId = client.db.get(`summer_logs_channel_${guildId}`);
    if (!channelId) return;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;
    const channel = guild.channels.cache.get(channelId);
    if (channel) channel.send({ embeds: [embed] }).catch(() => {});
}

// We use guildMemberAdd as the primary event name; additional hooks are registered in index via client.on directly
module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        const embed = new EmbedBuilder()
            .setTitle('📥 Member Joined')
            .setDescription(`<@${member.id}> joined the server.`)
            .addFields(
                { name: 'User',         value: `${member.user.tag} (${member.id})`, inline: true },
                { name: 'Account Age',  value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setColor(0x00FF88)
            .setTimestamp();

        await sendSummerLog(client, member.guild.id, embed);
    }
};
