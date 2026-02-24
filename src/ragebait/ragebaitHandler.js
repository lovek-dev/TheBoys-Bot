const { personas, extraRagebait } = require('./personas');

const pingHistory = new Map();
const activeConversations = new Map();

function getRandomPersona() {
    const keys = Object.keys(personas);
    return personas[keys[Math.floor(Math.random() * keys.length)]];
}

async function handleRagebait(message, client) {
    if (message.author.bot || !message.guild || message.member.permissions.has('Administrator')) return;

    const content = message.content.toLowerCase();
    const now = Date.now();
    const userId = message.author.id;

    // Trigger 3: Abusive Language Detection
    const abusiveWords = ['tmkc', 'bc', 'randi', 'bitch', 'kutta', 'chaka', 'chake', 'fuck you', 'fuck off'];
    if (abusiveWords.some(word => content.includes(word))) {
        const persona = getRandomPersona();
        return message.reply(persona.abusiveReplies[Math.floor(Math.random() * persona.abusiveReplies.length)]);
    }

    // Trigger 1 & 4: Pings
    if (message.mentions.has(client.user) || (message.reference && content.includes(`<@${client.user.id}>`))) {
        let userPings = pingHistory.get(userId) || [];
        userPings = userPings.filter(time => now - time < 30000);
        userPings.push(now);
        pingHistory.set(userId, userPings);

        const persona = getRandomPersona();
        
        // Trigger 4: Spam
        if (userPings.length >= 3) {
            return message.reply(persona.spamReplies[Math.floor(Math.random() * persona.spamReplies.length)]);
        }

        // Trigger 1: Normal Ping with Delay
        message.channel.sendTyping();
        const timeoutId = setTimeout(() => {
            message.reply(persona.pingReplies[Math.floor(Math.random() * persona.pingReplies.length)]);
            activeConversations.set(userId, { time: Date.now(), persona });
        }, Math.floor(Math.random() * 5000) + 3000);

        // No reply within 2 min
        setTimeout(() => {
            const conversation = activeConversations.get(userId);
            if (conversation && Date.now() - conversation.time >= 115000) {
                message.channel.send(`<@${userId}> why you pinged me?`);
                activeConversations.delete(userId);
            }
        }, 120000);
        return;
    }

    // Trigger 2: Reply after ping (within 30s)
    const conversation = activeConversations.get(userId);
    if (conversation && now - conversation.time < 30000) {
        activeConversations.delete(userId);
        const persona = conversation.persona;
        await message.reply(persona.timeoutReplies[Math.floor(Math.random() * persona.timeoutReplies.length)]);
        try {
            await message.member.timeout(60000, "Ragebait timeout");
        } catch (e) {
            console.error("Could not timeout user:", e);
        }
        return;
    }
}

module.exports = { handleRagebait };
