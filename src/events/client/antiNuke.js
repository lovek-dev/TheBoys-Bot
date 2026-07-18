/**
 * Anti-Nuke Protection — mass channel deletion detection.
 * Active on all servers at all times.
 */
const { AuditLogEvent } = require('discord.js');
const nukeTracker = require('../../utils/antiNukeTracker');

const THRESHOLD = { max: 3, windowMs: 10_000 };

module.exports = {
    name: 'channelDelete',
    async execute(channel, client) {
        if (!channel.guild) return;
        const guild = channel.guild;

        try {
            const logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
            const entry = logs.entries.first();
            if (!entry || Date.now() - entry.createdTimestamp > 5000) return;
            if (entry.executor.id === client.user.id) return;

            const key = `${guild.id}_${entry.executor.id}_channelDelete`;
            const now = Date.now();
            let track = nukeTracker.get(key) || { count: 0, resetAt: now + THRESHOLD.windowMs };
            if (now > track.resetAt) track = { count: 0, resetAt: now + THRESHOLD.windowMs };
            track.count++;
            nukeTracker.set(key, track);

            if (track.count >= THRESHOLD.max) {
                const owner = await guild.fetchOwner().catch(() => null);
                if (!owner || entry.executor.id === owner.id) return;

                const member = await guild.members.fetch(entry.executor.id).catch(() => null);
                if (member) await member.roles.set([], 'Anti-Nuke: mass channel delete').catch(() => {});
                await guild.bans.create(entry.executor.id, { reason: '[ANTI-NUKE] Mass channel deletion' });

                owner.user.send(
                    `🚨 **Anti-Nuke triggered** in **${guild.name}**\n` +
                    `**User banned:** ${entry.executor.tag} (${entry.executor.id})\n` +
                    `**Reason:** Mass channel deletion (≥${THRESHOLD.max} channels in ${THRESHOLD.windowMs / 1000}s)`
                ).catch(() => {});

                console.log(`[ANTI-NUKE] Banned ${entry.executor.tag} in ${guild.name} — mass channel delete`);
            }
        } catch (e) {
            console.error('[ANTI-NUKE channelDelete]', e.message);
        }
    }
};
