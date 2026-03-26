const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUltimateRoast } = require('../data/roasts');

const RAGE_TRIGGER_MS = 60 * 1000;
const RAGE_INTERVAL_MS = 40 * 1000;

function clearRoastSession(client, userId) {
    const session = client.activeRoasts?.get(userId);
    if (!session) return;
    clearTimeout(session.rageCheckTimeout);
    clearInterval(session.rageInterval);
    client.activeRoasts.delete(userId);
}

async function sendRoast(client, session, userId, forceUltimate = false) {
    try {
        const channel = await client.channels.fetch(session.channelId);
        if (!channel) return;
        const roast = getUltimateRoast(userId, '', forceUltimate);
        if (roast) await channel.send(`<@${userId}> ${roast}`);
    } catch (err) {
        console.error('[ROAST] Failed to send roast:', err.message);
    }
}

function startRageMode(client, userId) {
    const session = client.activeRoasts?.get(userId);
    if (!session || session.rageMode) return;

    session.rageMode = true;
    client.activeRoasts.set(userId, session);

    client.channels.fetch(session.channelId).then(ch => {
        ch.send(`<@${userId}> 💀 You thought ignoring me would work? FULL RAGE MODE ACTIVATED.`);
    }).catch(() => {});

    session.rageInterval = setInterval(async () => {
        const current = client.activeRoasts?.get(userId);
        if (!current) return clearInterval(session.rageInterval);
        await sendRoast(client, current, userId, true);
    }, RAGE_INTERVAL_MS);

    client.activeRoasts.set(userId, session);
}

function scheduleRageCheck(client, userId) {
    const session = client.activeRoasts?.get(userId);
    if (!session) return;

    clearTimeout(session.rageCheckTimeout);
    session.rageCheckTimeout = setTimeout(() => {
        const current = client.activeRoasts?.get(userId);
        if (!current || current.rageMode) return;

        const timeSinceReply = Date.now() - (current.lastReply || current.startTime);
        if (timeSinceReply >= RAGE_TRIGGER_MS) {
            startRageMode(client, userId);
        }
    }, RAGE_TRIGGER_MS);

    client.activeRoasts.set(userId, session);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roast')
        .setDescription('Roast module controls')
        .addSubcommand(sub =>
            sub.setName('target')
                .setDescription('Target a user for roasts — goes rage mode if they ignore it')
                .addUserOption(opt =>
                    opt.setName('user').setDescription('The user to roast').setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('enable')
                .setDescription('Enable the roast module for this server')
        )
        .addSubcommand(sub =>
            sub.setName('disable')
                .setDescription('Disable the roast module for this server')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'enable') {
            client.db.set(`roast_enabled_${interaction.guildId}`, true);
            return interaction.reply({ content: '✅ Roast module **enabled** for this server.', flags: 64 });
        }

        if (sub === 'disable') {
            client.db.set(`roast_enabled_${interaction.guildId}`, false);
            return interaction.reply({ content: '🔇 Roast module **disabled** for this server.', flags: 64 });
        }

        if (sub === 'target') {
            const roastEnabled = client.db.get(`roast_enabled_${interaction.guildId}`);
            if (roastEnabled === false) {
                return interaction.reply({ content: '🔇 Roast module is disabled in this server. Use `/roast enable` to turn it on.', flags: 64 });
            }

            const target = interaction.options.getUser('user');

            if (target.bot) return interaction.reply({ content: 'I cannot roast bots.', flags: 64 });
            if (target.id === interaction.user.id) return interaction.reply({ content: "Can't roast yourself 💀", flags: 64 });

            if (!client.activeRoasts) client.activeRoasts = new Map();

            if (client.activeRoasts.has(target.id)) {
                clearRoastSession(client, target.id);
                return interaction.reply({ content: `✅ Stopped roasting <@${target.id}>.`, flags: 64 });
            }

            const session = {
                channelId: interaction.channelId,
                startTime: Date.now(),
                lastReply: null,
                rageMode: false,
                rageCheckTimeout: null,
                rageInterval: null
            };

            client.activeRoasts.set(target.id, session);

            const openingRoast = getUltimateRoast(target.id, '', false);
            await interaction.reply({
                content: `🎯 <@${target.id}> you've been selected. Let's see how long you last.\n\n${openingRoast}`
            });

            scheduleRageCheck(client, target.id);
        }
    },

    onTargetReply(client, userId) {
        const session = client.activeRoasts?.get(userId);
        if (!session) return;

        session.lastReply = Date.now();

        if (session.rageMode) {
            session.rageMode = false;
            clearInterval(session.rageInterval);
            session.rageInterval = null;

            client.channels.fetch(session.channelId).then(ch => {
                ch.send(`<@${userId}> oh NOW you wanna talk? too late, I've seen your energy. 😂`);
            }).catch(() => {});
        }

        scheduleRageCheck(client, userId);
        client.activeRoasts.set(userId, session);
    }
};
