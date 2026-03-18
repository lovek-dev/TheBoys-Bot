const { getRoast } = require('../../utils/roastEngine');
const handleRagebait = require('../../modules/ragebait');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;

        // Auto Moderation - Invite Links
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

        // Prefix Command Handler
        const prefix = client.config?.prefix || '!';
        if (message.content.startsWith(prefix)) {
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
            if (command) {
                try {
                    await command.execute(message, args, client);
                } catch (err) {
                    console.error(`[CMD ERROR] ${commandName}:`, err);
                }
            }
            return;
        }

        // Setup Prefix Handler
        const setupPrefix = '+';
        if (message.content.startsWith(setupPrefix)) {
            const args = message.content.slice(setupPrefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            const command = client.commands.get(commandName);
            if (command) {
                try {
                    await command.execute(message, args, client);
                } catch (err) {
                    console.error(`[SETUP CMD ERROR] ${commandName}:`, err);
                }
            }
            return;
        }

        // Roast Engine (ping-based)
        const isPing = message.mentions.has(client.user.id) && !message.content.includes('@everyone') && !message.content.includes('@here');
        const roastData = getRoast(message.author.id, message.content, isPing, client);

        if (roastData) {
            const { roast, hasDefiance, count } = roastData;

            // Defiance: remove verified role + restore after 4 min
            if (hasDefiance && !message.member.permissions.has('Administrator')) {
                const roleId = client.db.get(`verify_role_${message.guild.id}`);
                if (roleId && message.member.roles.cache.has(roleId)) {
                    try {
                        await message.member.roles.remove(roleId, 'Toxic behavior / Bot defiance');
                        await message.channel.send(`🚨 **${message.author.username}** just lost their verified role for being a broke boy. Try me again.`);

                        // Restore role after 4 minutes
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

            // Auto-timeout after 25 toxic interactions
            if (count >= 25) {
                try {
                    if (message.member.moderatable) {
                        await message.member.timeout(60000, 'Extreme bot harassment');
                        await message.channel.send(`🔇 **${message.author.username}** Sit down. I've had enough of you.`);
                        return;
                    }
                } catch (e) {}
            }

            await message.reply(roast);
            return;
        }

        // Ragebait Module (reply/ping back-and-forth escalation)
        await handleRagebait(message, client);
    }
};
