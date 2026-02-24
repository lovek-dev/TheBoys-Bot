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
        const roastData = getRoast(message.author.id, message.content, isPing, client);
        
        if (roastData) {
            const { roast, hasDefiance, count } = roastData;

            // Handle Defiance / Extreme Toxicity
            if (hasDefiance && !message.member.permissions.has('Administrator')) {
                const roleId = client.db.get(`verify_role_${message.guild.id}`);
                if (roleId && message.member.roles.cache.has(roleId)) {
                    try {
                        await message.member.roles.remove(roleId, 'Toxic behavior / Bot defiance');
                        await message.channel.send(`🚨 **${message.author.username}** just lost their verified role for being a broke boy. Try me again.`);
                    } catch (e) {
                        console.error('[ROLE REMOVE ERROR]', e);
                    }
                }
            }

            // Auto-Mute logic (Timeout)
            if (count >= 25) { 
                try {
                    if (message.member.moderatable) {
                        await message.member.timeout(60000, 'Extreme bot harassment'); // 1 minute
                        await message.channel.send(`🔇 **${message.author.username}** Sit down. I've had enough of you.`);
                        return;
                    }
                } catch (e) {}
            }
            
            await message.reply(roast);
        }
    }
};
