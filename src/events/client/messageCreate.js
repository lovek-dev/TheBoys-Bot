const { getUltimateRoast, triggers } = require('../../data/roasts');
const interactionData = require('../../data/interactions');
const { EmbedBuilder } = require('discord.js');
const nodeFetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        // "Boys" Interaction System
        if (message.content.toLowerCase().startsWith('boys ')) {
            const args = message.content.slice(5).trim().split(/\s+/);
            const command = args[0].toLowerCase();
            const target = message.mentions.users.first();

            if (interactionData.actions[command] && target) {
                const action = interactionData.actions[command];
                if (action.nsfw && !message.channel.nsfw) {
                    return message.reply("This command only works in NSFW channels! 😤");
                }

                // Cooldown Check
                const cooldowns = client.interactionCooldowns || new Map();
                const now = Date.now();
                const cooldownAmount = 3000;
                if (cooldowns.has(message.author.id)) {
                    const expirationTime = cooldowns.get(message.author.id) + cooldownAmount;
                    if (now < expirationTime) return;
                }
                cooldowns.set(message.author.id, now);
                client.interactionCooldowns = cooldowns;

                let responseMsg;
                const rareChance = Math.random() < 0.05;
                if (target.id === message.author.id) responseMsg = action.self;
                else if (target.id === client.user.id) responseMsg = action.bot;
                else if (rareChance) responseMsg = "CRITICAL HIT! Server lore expanded ⚡";
                else responseMsg = action.messages[Math.floor(Math.random() * action.messages.length)];

                const query = action.keywords[Math.floor(Math.random() * action.keywords.length)];
                const tenorUrl = `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDSRZULEUB&limit=20`;
                
                try {
                    const res = await nodeFetch(tenorUrl);
                    const data = await res.json();
                    let gif = null;
                    if (data.results && data.results.length > 0) {
                        const randomResult = data.results[Math.floor(Math.random() * data.results.length)];
                        if (randomResult.media && randomResult.media[0] && randomResult.media[0].gif) {
                            gif = randomResult.media[0].gif.url;
                        } else if (randomResult.itemurl) {
                            gif = randomResult.itemurl;
                        } else if (randomResult.media && randomResult.media[0] && randomResult.media[0].mediumgif) {
                            gif = randomResult.media[0].mediumgif.url;
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `${message.author.username} ${action.verb} ${target.username}!!`, iconURL: message.author.displayAvatarURL() })
                        .setDescription(responseMsg)
                        .setImage(gif)
                        .setColor('#2b2d31');

                    return message.channel.send({ embeds: [embed] });
                } catch (e) {
                    console.error(e);
                    return message.channel.send(`${message.author.username} ${action.verb} ${target.username}!! OwO\n${responseMsg}`);
                }
            } else if (interactionData.emotions[command]) {
                const emotion = interactionData.emotions[command];
                
                // Cooldown Check for emotions too
                const cooldowns = client.interactionCooldowns || new Map();
                const now = Date.now();
                const cooldownAmount = 3000;
                if (cooldowns.has(message.author.id)) {
                    const expirationTime = cooldowns.get(message.author.id) + cooldownAmount;
                    if (now < expirationTime) return;
                }
                cooldowns.set(message.author.id, now);
                client.interactionCooldowns = cooldowns;

                const query = emotion.keywords[Math.floor(Math.random() * emotion.keywords.length)];
                const tenorUrl = `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDSRZULEUB&limit=20`;

                try {
                    const res = await nodeFetch(tenorUrl);
                    const data = await res.json();
                    let gif = null;
                    if (data.results && data.results.length > 0) {
                        const randomResult = data.results[Math.floor(Math.random() * data.results.length)];
                        if (randomResult.media && randomResult.media[0] && randomResult.media[0].gif) {
                            gif = randomResult.media[0].gif.url;
                        } else if (randomResult.itemurl) {
                            gif = randomResult.itemurl;
                        }
                    }

                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `${message.author.username} ${emotion.message}`, iconURL: message.author.displayAvatarURL() })
                        .setDescription(emotion.sub)
                        .setImage(gif)
                        .setColor('#2b2d31');

                    return message.channel.send({ embeds: [embed] });
                } catch (e) {
                    console.error(e);
                    return message.channel.send(`${message.author.username} ${emotion.message}\n${emotion.sub}`);
                }
            }
        }

        // Auto Moderation
        if (!message.member.permissions.has('Administrator')) {
            const inviteRegex = /(discord\.(gg|com\/invite)\/\w+)/i;
            if (inviteRegex.test(message.content)) {
                await message.delete().catch(() => {});
                return message.channel.send(`${message.author}, invites are not allowed!`).then(m => setTimeout(() => m.delete(), 5000));
            }
        }

        // Ultimate Ragebait Engine
        const lowerContent = message.content.toLowerCase();
        const activeRoasts = client.activeRoasts || new Map();
        const isTargeted = activeRoasts.has(message.author.id);

        if (triggers.some(trigger => lowerContent.includes(trigger)) || (message.mentions.has(client.user.id) && !message.content.includes('@everyone')) || isTargeted) {
            const roast = getUltimateRoast(message.author.id, message.content, isTargeted);
            if (roast) return message.reply(roast);
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
                        
                        // Give role back after 4 minutes
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
