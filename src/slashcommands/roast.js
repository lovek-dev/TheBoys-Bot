const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getUltimateRoast } = require('../data/roasts');

const RAGE_TRIGGER_MS = 60 * 1000;     // 1 min silence before rage mode
const RAGE_INTERVAL_MS = 40 * 1000;    // roast every 40s in rage mode

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

    // Announce rage mode
    client.channels.fetch(session.channelId).then(ch => {
        ch.send(`<@${userId}> 💀 You thought ignoring me would work? FULL RAGE MODE ACTIVATED.`);
    }).catch(() => {});

    // Roast every 40 seconds in rage mode
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
        .setDescription('Target a user for roasts — goes rage mode if they ignore it')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to roast')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction, client) {
        const target = interaction.options.getUser('user');

        if (target.bot) return interaction.reply({ content: 'I cannot roast bots.', ephemeral: true });
        if (target.id === interaction.user.id) return interaction.reply({ content: "Can't roast yourself 💀", ephemeral: true });

        if (!client.activeRoasts) client.activeRoasts = new Map();

        // Toggle off if already roasting this user
        if (client.activeRoasts.has(target.id)) {
            clearRoastSession(client, target.id);
            return interaction.reply({ content: `✅ Stopped roasting <@${target.id}>.`, ephemeral: true });
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

        // Initial roast + @ping
        const openingRoast = getUltimateRoast(target.id, '', false);
        await interaction.reply({
            content: `🎯 <@${target.id}> you've been selected. Let's see how long you last.\n\n${openingRoast}`
        });

        // Schedule rage mode if they don't reply in 1 minute
        scheduleRageCheck(client, target.id);
    },

    // Called by messageCreate when target sends a message
    onTargetReply(client, userId) {
        const session = client.activeRoasts?.get(userId);
        if (!session) return;

        session.lastReply = Date.now();

        if (session.rageMode) {
            // Exit rage mode — back to reactive roasting
            session.rageMode = false;
            clearInterval(session.rageInterval);
            session.rageInterval = null;

            client.channels.fetch(session.channelId).then(ch => {
                ch.send(`<@${userId}> oh NOW you wanna talk? too late, I've seen your energy. 😂`);
            }).catch(() => {});
        }

        // Reset rage check timer — if they go quiet again, rage mode returns
        scheduleRageCheck(client, userId);
        client.activeRoasts.set(userId, session);
    }
};