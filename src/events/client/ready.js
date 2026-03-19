const { ActivityType } = require('discord.js');

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        const users = client.users.cache.size;

        console.log(`[READY] ${client.user.tag} is up and ready to go.`.bold);
        console.log("----------------------------------------".white);

        client.user.setPresence({
          activities: [{
            name: "I Am A Devil , Searching For Redemption",
            type: 4 // COMPETING
          }],
          status: "online"
        });
        setStatus();
        setInterval(setStatus, 60000);
    }
};