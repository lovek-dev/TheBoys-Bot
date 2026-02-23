const { ActivityType } = require('discord.js');

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        const users = client.users.cache.size;

        console.log(`[READY] ${client.user.tag} is up and ready to go.`.bold);
        console.log("----------------------------------------".white);

        const setStatus = () => {
            const statuses = [`${users} Users`];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            client.user.setActivity(status, { type: ActivityType.Watching });
        };

        setStatus();
        setInterval(setStatus, 60000);
    }
};