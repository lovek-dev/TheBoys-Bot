const { ActivityType } = require('discord.js');
const { startChecker } = require('../../utils/afkTracker');

module.exports = {
    name: "clientReady",
    once: true,
    async execute(client) {
        startChecker(client);

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

        // run once immediately
        setStatus();

        // update every 60 seconds
        setInterval(setStatus, 60000);
    }
};