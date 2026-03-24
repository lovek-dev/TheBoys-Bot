const { ActivityType } = require('discord.js');

module.exports = {
    name: "clientReady",
    once: true,
    async execute(client) {

        console.log(`[READY] ${client.user.tag} is up and ready to go.`);
        console.log("----------------------------------------");

        function setStatus() {
            const users = client.guilds.cache.reduce(
                (acc, guild) => acc + guild.memberCount, 0
            );

            client.user.setPresence({
                activities: [{
                    name: `I Am Devil , Searching For Redemption | ${users} Users`,
                }],
                status: "online"
            });
        }

        // Warm up discord.js's internal REST connection pool.
        // On Render the first outbound HTTPS call can take 3-5s (cold TCP).
        // Making a cheap request now means interaction.reply() later hits a warm connection.
        try {
            await client.rest.get('/users/@me');
            console.log('[READY] REST connection pool warmed up ✅');
        } catch (e) {
            console.log('[READY] REST warm-up skipped:', e.message);
        }

        // run once immediately
        setStatus();

        // update every 60 seconds
        setInterval(setStatus, 60000);
    }
};