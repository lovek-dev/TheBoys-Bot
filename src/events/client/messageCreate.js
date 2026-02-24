const { getRoast } = require('../../utils/roastEngine');

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

        // Roast Engine
        const isPing = message.mentions.has(client.user.id) && !message.content.includes('@everyone') && !message.content.includes('@here');
        const roast = getRoast(message.author.id, message.content, isPing);
        
        if (roast) {
            // Auto-Mute logic (Timeout) for extreme toxicity
            const userState = client.db?.get(`roast_state_${message.author.id}`) || { count: 0 };
            userState.count++;
            client.db?.set(`roast_state_${message.author.id}`, userState);

            if (userState.count >= 15) { // Mute after 15 toxic messages/pings
                try {
                    if (message.member.moderatable) {
                        await message.member.timeout(60000, 'Extreme toxicity/Bot harassment');
                        await message.channel.send(`🤐 **${message.author.username}** has been muted for 1 minute. Maybe use that time to rethink your life choices.`);
                        client.db?.set(`roast_state_${message.author.id}`, { count: 0 }); // Reset count
                        return;
                    }
                } catch (e) {
                    console.error('[MUTE ERROR]', e);
                }
            }
            
            await message.reply(roast);
        }
    }
};
