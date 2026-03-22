const db = require('../database/db');

// guild -> userId -> last active timestamp
if (!global.afkActivity) global.afkActivity = new Map();

const AFK_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes
const CHECK_INTERVAL_MS = 2 * 60 * 1000;  // check every 2 minutes

function resetActivity(userId, guildId) {
    if (!global.afkActivity.has(guildId)) global.afkActivity.set(guildId, new Map());
    global.afkActivity.get(guildId).set(userId, Date.now());
}

function startChecker(client) {
    if (global.afkCheckerRunning) return;
    global.afkCheckerRunning = true;

    setInterval(async () => {
        const now = Date.now();

        for (const [guildId, users] of global.afkActivity.entries()) {
            const session = db.get(`movie_session_${guildId}`) || db.get(`series_session_${guildId}`);
            if (!session) continue;

            const channelId = session.channelId;
            if (!channelId) continue;

            for (const [userId, lastActive] of users.entries()) {
                if (now - lastActive >= AFK_THRESHOLD_MS) {
                    try {
                        const channel = await client.channels.fetch(channelId);
                        await channel.send(`⚠️ <@${userId}> you seem inactive. Still watching?`);
                        // Reset so they don't get pinged again until another 20 min
                        users.set(userId, now);
                    } catch (e) {}
                }
            }
        }
    }, CHECK_INTERVAL_MS);
}

module.exports = { resetActivity, startChecker };
