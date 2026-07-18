/**
 * Auto-Moderation — anti-promotional, anti-invite, spam detection, caps filter.
 * Active on all servers at all times.
 */

// Invite link pattern
const INVITE_REGEX = /(discord\.(gg|com\/invite)\/[a-zA-Z0-9-]+)/i;

// Promotional / suspicious link pattern (skips major platforms)
const PROMO_REGEX = /https?:\/\/(?!(?:www\.)?(youtube\.com|youtu\.be|twitch\.tv|twitter\.com|x\.com|imgur\.com|discord\.com|discord\.gg|tenor\.com|giphy\.com|roblox\.com|minecraft\.net))[\w.-]+\.[a-z]{2,}(\/\S*)?/i;

// Spam tracker: userId -> [timestamps]
const spamMap = new Map();
const SPAM_LIMIT   = 6;    // messages
const SPAM_WINDOW  = 5000; // ms

// Caps filter threshold (% of uppercase letters)
const CAPS_THRESHOLD = 0.7;
const CAPS_MIN_LEN   = 15;

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (!message.guild) return;
        if (message.author.bot) return;
        // Let admins/mods bypass
        if (message.member?.permissions.has('Administrator')) return;
        if (message.member?.permissions.has('ManageMessages')) return;

        const content = message.content;

        // ── 1. Discord Invite Links ──────────────────────────────────────────
        if (INVITE_REGEX.test(content)) {
            await message.delete().catch(() => {});
            const warn = await message.channel.send(`🚫 <@${message.author.id}> — Discord invites are not allowed here.`);
            setTimeout(() => warn.delete().catch(() => {}), 6000);

            // Log
            sendAutoModLog(client, message.guild, {
                title: '🚫 Invite Link Blocked',
                user: message.author,
                channel: message.channel,
                content,
                reason: 'Posted a Discord invite link'
            });
            return;
        }

        // ── 2. Promotional / External Links ─────────────────────────────────
        if (PROMO_REGEX.test(content)) {
            await message.delete().catch(() => {});
            const warn = await message.channel.send(`📢 <@${message.author.id}> — Promotional or external links are not allowed here.`);
            setTimeout(() => warn.delete().catch(() => {}), 6000);

            sendAutoModLog(client, message.guild, {
                title: '📢 Promo Link Blocked',
                user: message.author,
                channel: message.channel,
                content,
                reason: 'Posted a promotional / external link'
            });
            return;
        }

        // ── 3. Spam Detection ────────────────────────────────────────────────
        const now = Date.now();
        const userSpam = (spamMap.get(message.author.id) || []).filter(t => now - t < SPAM_WINDOW);
        userSpam.push(now);
        spamMap.set(message.author.id, userSpam);

        if (userSpam.length >= SPAM_LIMIT) {
            spamMap.set(message.author.id, []); // reset

            // Timeout for 2 minutes
            if (message.member?.moderatable) {
                await message.member.timeout(2 * 60 * 1000, 'Auto-Mod: Spam detected').catch(() => {});
            }
            await message.channel.send(`🔇 <@${message.author.id}> has been timed out for **2 minutes** for spamming.`).catch(() => {});

            sendAutoModLog(client, message.guild, {
                title: '🔇 Spam Timeout Applied',
                user: message.author,
                channel: message.channel,
                content: `${userSpam.length} messages in ${SPAM_WINDOW / 1000}s`,
                reason: 'Spam detection triggered'
            });
            return;
        }

        // ── 4. Caps Filter ───────────────────────────────────────────────────
        if (content.length >= CAPS_MIN_LEN) {
            const letters = content.replace(/[^a-zA-Z]/g, '');
            if (letters.length > 0) {
                const upperRatio = (letters.split('').filter(c => c === c.toUpperCase()).length) / letters.length;
                if (upperRatio >= CAPS_THRESHOLD) {
                    await message.delete().catch(() => {});
                    const warn = await message.channel.send(`🔡 <@${message.author.id}> — Please avoid excessive CAPS.`);
                    setTimeout(() => warn.delete().catch(() => {}), 5000);
                    return;
                }
            }
        }
    }
};

function sendAutoModLog(client, guild, { title, user, channel, content, reason }) {
    const { EmbedBuilder } = require('discord.js');
    const channelId = client.db.get(`summer_logs_channel_${guild.id}`);
    if (!channelId) return;
    const logChannel = guild.channels.cache.get(channelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(title)
        .addFields(
            { name: 'User',    value: `<@${user.id}> (${user.tag})`,  inline: true },
            { name: 'Channel', value: `<#${channel.id}>`,             inline: true },
            { name: 'Reason',  value: reason,                         inline: false },
            { name: 'Content', value: content.slice(0, 500) || '—',  inline: false }
        )
        .setColor(0xFF8800)
        .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
}
