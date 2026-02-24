const { EmbedBuilder } = require('discord.js');

const pingResponses = ["huh? what do you want?", "what do you want", "hey.", "don’t spam ping me.", "you rang?"];
const replyResponses = ["Now you can suck my robotic one.", "sybau.", "Do you like it?", "that all you had to say?"];
const abusiveWords = ["tmkc", "bc", "randi", "bitch", "kutta", "chaka", "chake", "fuck you", "fuck off"];
const savageReplies = [
    "Do you have a name for your father yet?", "You type fast for someone thinking slow.", "Big anger, tiny vocabulary.",
    "You sound like lag in human form.", "Keep talking, maybe you’ll discover a personality.", "You’re not roasting me, you’re reheating leftovers.",
    "Even autocorrect gave up on you.", "Try harder, that insult came on dial-up.", "You argue like patch notes nobody asked for.", "Congratulations, you played yourself."
];
const spamResponses = ["you really need my attention that badly?", "relax, I’m not your emergency contact.", "spam harder, maybe it’ll work.", "you really like hardcore mode, huh?"];

const userStates = new Map();

module.exports = async (message, client) => {
    const isEnabled = client.db.get(`ragebait_enabled_${message.guild.id}`) !== false;
    if (!isEnabled) return;
    if (message.member.permissions.has('Administrator') || message.member.permissions.has('ManageMessages')) return;

    const userId = message.author.id;
    const now = Date.now();
    let state = userStates.get(userId) || { lastPing: 0, pingCount: 0, lastReply: 0, backAndForth: 0 };

    // Trigger 1 & 4: Ping Detection
    if (message.mentions.has(client.user) && !message.content.includes('/')) {
        state.pingCount = (now - state.lastPing < 30000) ? state.pingCount + 1 : 1;
        state.lastPing = now;
        userStates.set(userId, state);

        if (state.pingCount >= 3) {
            return message.reply(spamResponses[Math.floor(Math.random() * spamResponses.length)]);
        } else {
            return message.reply(pingResponses[Math.floor(Math.random() * pingResponses.length)]);
        }
    }

    // Trigger 2: Reply Detection
    const isReplyToBot = message.reference && (await message.fetchReference().catch(() => null))?.author.id === client.user.id;
    if (isReplyToBot && now - state.lastPing < 15000) {
        state.backAndForth++;
        userStates.set(userId, state);

        // Trigger 5: Escalation Trap
        if (state.backAndForth >= 3) {
            const trapMessage = await message.reply("do you wanna get out of the server?");
            state.trapActive = true;
            state.trapMessageId = trapMessage.id;
            userStates.set(userId, state);
            return;
        }

        // Trigger 3: Abusive Words
        if (abusiveWords.some(word => message.content.toLowerCase().includes(word))) {
            return message.reply(savageReplies[Math.floor(Math.random() * savageReplies.length)]);
        }

        await message.reply(replyResponses[Math.floor(Math.random() * replyResponses.length)]);
        try {
            await message.member.timeout(60000, "Ragebait Interaction");
            logModAction(message.guild, client, "Muted (Ragebait)", message.author, "60s", "Automated interaction");
        } catch (e) {}
        return;
    }

    // Trigger 5: Trap Response
    if (state.trapActive) {
        const trapTriggers = ["yes", "try it", "go on", "bet", "bitch"];
        if (trapTriggers.some(t => message.content.toLowerCase().includes(t))) {
            const roleId = client.db.get(`verify_role_${message.guild.id}`);
            if (roleId && message.member.roles.cache.has(roleId)) {
                try {
                    await message.member.roles.remove(roleId);
                    message.reply("As you wish. Verified role removed.");
                    logModAction(message.guild, client, "Role Removed (Ragebait)", message.author, "N/A", "Trap triggered");
                } catch (e) {}
            }
        }
        state.trapActive = false;
        userStates.set(userId, state);
    }
};

function logModAction(guild, client, action, user, duration, reason) {
    const logChannelId = client.db.get(`logs_channel_${guild.id}`);
    if (!logChannelId) return;
    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(`🛡️ ${action}`)
        .addFields(
            { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
            { name: 'Duration', value: duration, inline: true },
            { name: 'Reason', value: reason }
        )
        .setColor(0xff0000)
        .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(() => {});
}