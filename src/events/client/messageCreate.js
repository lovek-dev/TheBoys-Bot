const { handleRagebait } = require('../../ragebait/ragebaitHandler');
const { handleAbuse } = require('../../ragebait/abuseHandler');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        // Auto Moderation
        if (!message.member.permissions.has('Administrator')) {
            const inviteRegex = /(discord\.(gg|com\/invite)\/\w+)/i;
            if (inviteRegex.test(message.content)) {
                await message.delete().catch(() => {});
                return message.channel.send(`${message.author}, invites are not allowed!`).then(m => setTimeout(() => m.delete(), 5000));
            }
        }

        // Track messages for stats
        const key = `messages_${message.guild.id}_${message.author.id}`;
        const current = client.db?.get(key) || 0;
        client.db?.set(key, current + 1);

        // Abuse Detection & Auto-Roast
        await handleAbuse(message, client);

        // Ragebait Logic
        await handleRagebait(message, client);
    }
};
