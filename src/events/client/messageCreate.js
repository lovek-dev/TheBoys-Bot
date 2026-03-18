const { getUltimateRoast, triggers } = require('../../data/roasts');
const interactionData = require('../../data/interactions');
const roastCommand = require('../../slashcommands/roast');
const { EmbedBuilder } = require('discord.js');
const nodeFetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const defianceTriggers = ['bet', 'try it', 'go on', 'broke', 'stfu', 'fuck you', "don't reply"];

// Per-action GIF history to avoid repeats (buffer of 7)
const gifHistory = new Map();

async function fetchGif(query, historyKey) {
    const history = gifHistory.get(historyKey) || [];
    const urls = [
        `https://api.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDSRZULEUB&limit=30&media_filter=minimal`,
        `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDSRZULEUB&limit=30&media_filter=minimal`
    ];

    for (const url of urls) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const res = await nodeFetch(url, { signal: controller.signal });
            clearTimeout(timer);
            if (!res.ok) continue;
            const data = await res.json();
            if (!data.results || data.results.length === 0) continue;

            let results = data.results.filter(r => {
                const gifUrl = r.media?.[0]?.gif?.url || r.url;
                return gifUrl && !history.includes(gifUrl);
            });

            if (results.length === 0) {
                gifHistory.set(historyKey, []);
                results = data.results;
            }

            const pick = results[Math.floor(Math.random() * results.length)];
            const gifUrl = pick.media?.[0]?.gif?.url || pick.media?.[0]?.mediumgif?.url || pick.url || null;

            if (gifUrl) {
                gifHistory.set(historyKey, [...history, gifUrl].slice(-7));
                return gifUrl;
            }
        } catch (e) {
            // try next url
        }
    }
    return null;
}

// Dedup guard — prevents any message from being processed twice
const processedIds = new Set();

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        // Dedup: skip if this message ID was already handled
        if (processedIds.has(message.id)) return;
        processedIds.add(message.id);
        setTimeout(() => processedIds.delete(message.id), 10000);

        // "Boys" Interaction System
        if (message.content.toLowerCase().startsWith('boys ')) {
            const args = message.content.slice(5).trim().split(/\s+/);
            const command = args[0].toLowerCase();
            const target = message.mentions.users.first();

            // Cooldown check (3 seconds per user)
            const cooldowns = client.interactionCooldowns || new Map();
            const now = Date.now();
            if (cooldowns.has(message.author.id)) {
                const expirationTime = cooldowns.get(message.author.id) + 3000;
                if (now < expirationTime) return;
            }
            cooldowns.set(message.author.id, now);
            client.interactionCooldowns = cooldowns;

            if (interactionData.actions[command] && target) {
                const action = interactionData.actions[command];
                if (action.nsfw && !message.channel.nsfw) {
                    return message.reply("This command only works in NSFW channels! 😤");
                }

                let responseMsg;
                const rareChance = Math.random() < 0.05;
                if (target.id === message.author.id) responseMsg = action.self;
                else if (target.id === client.user.id) responseMsg = action.bot;
                else if (rareChance) responseMsg = "CRITICAL HIT! Server lore expanded ⚡";
                else responseMsg = action.messages[Math.floor(Math.random() * action.messages.length)];

                const query = action.keywords[Math.floor(Math.random() * action.keywords.length)];
                const gif = await fetchGif(query, `action_${command}`);

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${message.author.username} ${action.verb} ${target.username}!!`, iconURL: message.author.displayAvatarURL() })
                    .setDescription(`<@${message.author.id}> → <@${target.id}>\n${responseMsg}`)
                    .setColor('#2b2d31');

                if (gif) embed.setImage(gif);

                return message.channel.send({ embeds: [embed] });

            } else if (interactionData.emotions[command]) {
                const emotion = interactionData.emotions[command];

                const query = emotion.keywords[Math.floor(Math.random() * emotion.keywords.length)];
                const gif = await fetchGif(query, `emotion_${command}`);

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${message.author.username} ${emotion.message}`, iconURL: message.author.displayAvatarURL() })
                    .setDescription(`<@${message.author.id}>\n${emotion.sub}`)
                    .setColor('#2b2d31');

                if (gif) embed.setImage(gif);

                return message.channel.send({ embeds: [embed] });
            }

            // Unknown boys command — stop here
            return;
        }

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
        const lowerContent = message.content.toLowerCase();
        const activeRoasts = client.activeRoasts || new Map();
        const isTargeted = activeRoasts.has(message.author.id);
        const isPing = message.mentions.has(client.user.id) && !message.content.includes('@everyone') && !message.content.includes('@here');
        const hasDefiance = defianceTriggers.some(t => lowerContent.includes(t));

        // Notify roast command so rage mode / timers update on reply
        if (isTargeted) {
            try { roastCommand.onTargetReply(client, message.author.id); } catch (e) {}
        }

        if (triggers.some(trigger => lowerContent.includes(trigger)) || isPing || isTargeted || hasDefiance) {
            const roast = getUltimateRoast(message.author.id, message.content, isTargeted);
            if (!roast) return;

            // Defiance: remove verified role and restore after 4 mins
            if (hasDefiance && !message.member.permissions.has('Administrator')) {
                const roleId = client.db?.get(`verify_role_${message.guild.id}`);
                if (roleId && message.member.roles.cache.has(roleId)) {
                    try {
                        await message.member.roles.remove(roleId, 'Toxic behavior / Bot defiance');
                        await message.channel.send(`🚨 **${message.author.username}** just lost their verified role for being a broke boy. Try me again.`);

                        setTimeout(async () => {
                            try {
                                const fetchMember = await message.guild.members.fetch(message.author.id).catch(() => null);
                                if (fetchMember) {
                                    await fetchMember.roles.add(roleId, 'Automatic role restoration after 4 mins');
                                    await message.channel.send(`🔄 **${message.author.username}** has their verified role restored. Don't blow it this time.`);
                                }
                            } catch (e) {
                                console.error('[ROLE RESTORE ERROR]', e);
                            }
                        }, 4 * 60 * 1000);
                    } catch (e) {
                        console.error('[ROLE REMOVE ERROR]', e);
                    }
                }
            }

            // Auto-timeout after sustained harassment
            if (message.member.moderatable) {
                const stateMap = global.__roastStateCounts || (global.__roastStateCounts = new Map());
                const cnt = (stateMap.get(message.author.id) || 0) + 1;
                stateMap.set(message.author.id, cnt);

                if (cnt >= 25) {
                    try {
                        await message.member.timeout(60000, 'Extreme bot harassment');
                        await message.channel.send(`🔇 **${message.author.username}** Sit down. I've had enough of you.`);
                        stateMap.set(message.author.id, 0);
                        return;
                    } catch (e) {}
                }
            }

            return message.reply(roast);
        }
    }
};
