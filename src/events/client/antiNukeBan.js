/**
 * Anti-Nuke — mass ban detection.
 * Also hooks into guildBanAdd which is also used by summerLogsBan.js for logging.
 * Both listeners are registered independently by the event handler.
 * Active on all servers at all times.
 */
const { AuditLogEvent } = require('discord.js');
const nukeTracker = require('../../utils/antiNukeTracker');

const THRESHOLD = { max: 5, windowMs: 15_000 };

module.exports = {
    name: 'guildBanAdd',
    async execute(ban, client) {
        const guild = ban.guild;

        try {
            const logs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
            const entry = logs.entries.first();
            if (!entry || Date.now() - entry.createdTimestamp > 5000) return;
            if (entry.executor.id === client.user.id) return;

            const key = `${guild.id}_${entry.executor.id}_massban`;
            const now = Date.now();
            let track = nukeTracker.get(key) || { count: 0, resetAt: now + THRESHOLD.windowMs };
            if (now > track.resetAt) track = { count: 0, resetAt: now + THRESHOLD.windowMs };
            track.count++;
            nukeTracker.set(key, track);

            if (track.count >= THRESHOLD.max) {
                const owner = await guild.fetchOwner().catch(() => null);
                if (!owner || entry.executor.id === owner.id) return;

                const member = await guild.members.fetch(entry.executor.id).catch(() => null);
                if (member) await member.roles.set([], 'Anti-Nuke: mass ban').catch(() => {});
                await guild.bans.create(entry.executor.id, { reason: '[ANTI-NUKE] Mass banning users' });

                owner.user.send(
                    `🚨 **Anti-Nuke triggered** in **${guild.name}**\n` +
                    `**User banned:** ${entry.executor.tag} (${entry.executor.id})\n` +
                    `**Reason:** Mass banning (≥${THRESHOLD.max} bans in ${THRESHOLD.windowMs / 1000}s)`
                ).catch(() => {});

                console.log(`[ANTI-NUKE] Banned ${entry.executor.tag} in ${guild.name} — mass ban`);
            }
        } catch (e) {
            console.error('[ANTI-NUKE guildBanAdd]', e.message);
        }
    }
};
