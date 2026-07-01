const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const db = require('../database/db');

// ─── XP Milestones ───────────────────────────────────────────────────────────
const MILESTONES = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000, 20000, 30000, 50000];

// ─── Rank Tiers (one per milestone gap) ──────────────────────────────────────
const RANKS = [
    { emoji: '🪨', name: 'Stone',      division: 'I'   },
    { emoji: '🪨', name: 'Stone',      division: 'II'  },
    { emoji: '🥉', name: 'Bronze',     division: 'I'   },
    { emoji: '🥉', name: 'Bronze',     division: 'II'  },
    { emoji: '🥈', name: 'Silver',     division: 'I'   },
    { emoji: '🥈', name: 'Silver',     division: 'II'  },
    { emoji: '🥇', name: 'Gold',       division: 'I'   },
    { emoji: '🥇', name: 'Gold',       division: 'II'  },
    { emoji: '🥇', name: 'Gold',       division: 'III' },
    { emoji: '💎', name: 'Platinum',   division: 'I'   },
    { emoji: '💎', name: 'Platinum',   division: 'II'  },
    { emoji: '🔮', name: 'Diamond',    division: null  },
    { emoji: '🌌', name: 'Master',     division: null  },
    { emoji: '⭐', name: 'Grandmaster', division: null },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeXP(messages, voiceMs, wars, rep) {
    return (messages * 2) + (Math.floor(voiceMs / 60000) * 3) + (wars * 100) + (rep * 25);
}

function getRank(xp) {
    let idx = 0;
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
        if (xp >= MILESTONES[i]) { idx = i; break; }
    }
    return RANKS[Math.min(idx, RANKS.length - 1)];
}

function getProgressBar(xp) {
    const maxMilestone = MILESTONES[MILESTONES.length - 1];
    if (xp >= maxMilestone) {
        return { text: '`██████████` MAX', xpNeeded: 0, nextMilestone: null };
    }

    let prevMs = 0, nextMs = MILESTONES[1];
    for (let i = 0; i < MILESTONES.length - 1; i++) {
        if (xp >= MILESTONES[i] && xp < MILESTONES[i + 1]) {
            prevMs = MILESTONES[i];
            nextMs = MILESTONES[i + 1];
            break;
        }
    }

    const progress = (xp - prevMs) / (nextMs - prevMs);
    const filled = Math.max(0, Math.min(10, Math.floor(progress * 10)));
    const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
    const currentInRange = xp - prevMs;
    const rangeSize = nextMs - prevMs;

    return {
        text: `\`${bar}\` ${currentInRange.toLocaleString()} / ${rangeSize.toLocaleString()} XP`,
        xpNeeded: nextMs - xp,
        nextMilestone: nextMs,
    };
}

function formatVoice(voiceMs) {
    const totalMinutes = Math.floor(voiceMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}m`;
    return `${hours}h ${minutes}m`;
}

function getLeaderboardPosition(guildId, targetUserId) {
    const all = db.all();
    const userStats = new Map();

    for (const [key, val] of Object.entries(all)) {
        const msgMatch = key.match(new RegExp(`^messages_${guildId}_(.+)$`));
        if (msgMatch) {
            const uid = msgMatch[1];
            const s = userStats.get(uid) || { messages: 0, voiceMs: 0, wars: 0, rep: 0 };
            s.messages = val || 0;
            userStats.set(uid, s);
        }
        const voiceMatch = key.match(new RegExp(`^voice_${guildId}_(.+)$`));
        if (voiceMatch) {
            const uid = voiceMatch[1];
            const s = userStats.get(uid) || { messages: 0, voiceMs: 0, wars: 0, rep: 0 };
            s.voiceMs = val || 0;
            userStats.set(uid, s);
        }
        const warMatch = key.match(new RegExp(`^war_${guildId}_(.+)$`));
        if (warMatch) {
            const uid = warMatch[1];
            const s = userStats.get(uid) || { messages: 0, voiceMs: 0, wars: 0, rep: 0 };
            s.wars = val || 0;
            userStats.set(uid, s);
        }
        const repMatch = key.match(new RegExp(`^rep_${guildId}_(.+)$`));
        if (repMatch) {
            const uid = repMatch[1];
            const s = userStats.get(uid) || { messages: 0, voiceMs: 0, wars: 0, rep: 0 };
            s.rep = val || 0;
            userStats.set(uid, s);
        }
    }

    const sorted = [...userStats.entries()]
        .map(([uid, d]) => ({ uid, xp: computeXP(d.messages, d.voiceMs, d.wars, d.rep) }))
        .sort((a, b) => b.xp - a.xp);

    const pos = sorted.findIndex(x => x.uid === targetUserId) + 1;
    return { position: pos > 0 ? pos : sorted.length + 1, total: sorted.length };
}

// ─── Command ──────────────────────────────────────────────────────────────────

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp')
        .setDescription('XP & activity stats')
        .addSubcommand(sub =>
            sub.setName('view')
                .setDescription('View XP stats for yourself or another member')
                .addUserOption(opt =>
                    opt.setName('user').setDescription('Member to look up (defaults to you)').setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('module')
                .setDescription('Enable or disable the XP module for this server (Admin only)')
                .addStringOption(opt =>
                    opt.setName('action')
                        .setDescription('enable or disable')
                        .setRequired(true)
                        .addChoices(
                            { name: 'enable',  value: 'enable'  },
                            { name: 'disable', value: 'disable' }
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName('addwar')
                .setDescription('Add war participations to a member (Admin only)')
                .addUserOption(opt =>
                    opt.setName('user').setDescription('Target member').setRequired(true)
                )
                .addIntegerOption(opt =>
                    opt.setName('amount').setDescription('Number of wars to add (negative to remove)').setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('addrep')
                .setDescription('Add reputation points to a member (Admin only)')
                .addUserOption(opt =>
                    opt.setName('user').setDescription('Target member').setRequired(true)
                )
                .addIntegerOption(opt =>
                    opt.setName('amount').setDescription('Rep points to add (negative to remove)').setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const sub = interaction.options.getSubcommand();

        // ── module toggle ────────────────────────────────────────────────────
        if (sub === 'module') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ content: '❌ Only administrators can toggle the XP module.', flags: MessageFlags.Ephemeral });
            }
            const action = interaction.options.getString('action');
            client.db.set(`xp_module_${interaction.guildId}`, action === 'enable');
            return interaction.reply({
                content: action === 'enable'
                    ? '✅ XP module **enabled** for this server.'
                    : '🔇 XP module **disabled** for this server.',
                flags: MessageFlags.Ephemeral
            });
        }

        // ── addwar ──────────────────────────────────────────────────────────
        if (sub === 'addwar') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ You need Manage Server permission to use this.', flags: MessageFlags.Ephemeral });
            }
            const target = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            const key = `war_${interaction.guildId}_${target.id}`;
            const current = client.db.get(key) || 0;
            const newVal = Math.max(0, current + amount);
            client.db.set(key, newVal);
            return interaction.reply({
                content: `⚔️ Updated <@${target.id}>'s war participations: **${current}** → **${newVal}**`,
                flags: MessageFlags.Ephemeral
            });
        }

        // ── addrep ──────────────────────────────────────────────────────────
        if (sub === 'addrep') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({ content: '❌ You need Manage Server permission to use this.', flags: MessageFlags.Ephemeral });
            }
            const target = interaction.options.getUser('user');
            const amount = interaction.options.getInteger('amount');
            const key = `rep_${interaction.guildId}_${target.id}`;
            const current = client.db.get(key) || 0;
            const newVal = Math.max(0, current + amount);
            client.db.set(key, newVal);
            return interaction.reply({
                content: `⭐ Updated <@${target.id}>'s reputation: **${current}** → **${newVal}**`,
                flags: MessageFlags.Ephemeral
            });
        }

        // ── view ─────────────────────────────────────────────────────────────
        if (sub === 'view') {
            const xpModuleEnabled = client.db.get(`xp_module_${interaction.guildId}`);
            if (xpModuleEnabled === false) {
                return interaction.reply({ content: '🔇 The XP module is disabled in this server. An admin can enable it with `/xp module enable`.', flags: MessageFlags.Ephemeral });
            }

            await interaction.deferReply();

            const targetUser = interaction.options.getUser('user') || interaction.user;
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

            // ── Gather raw stats ──
            const messages  = client.db.get(`messages_${interaction.guildId}_${targetUser.id}`) || 0;
            const voiceMs   = client.db.get(`voice_${interaction.guildId}_${targetUser.id}`)    || 0;
            const wars      = client.db.get(`war_${interaction.guildId}_${targetUser.id}`)      || 0;
            const rep       = client.db.get(`rep_${interaction.guildId}_${targetUser.id}`)      || 0;
            const ign       = client.db.get(`ign_${interaction.guildId}_${targetUser.id}`);

            // ── XP calculation ──
            const totalXP = computeXP(messages, voiceMs, wars, rep);

            // ── Rank ──
            const rank = getRank(totalXP);
            const rankLabel = rank.division ? `${rank.name} ${rank.division}` : rank.name;

            // ── Leaderboard position ──
            const { position, total } = getLeaderboardPosition(interaction.guildId, targetUser.id);

            // ── Progress bar ──
            const progress = getProgressBar(totalXP);

            // ── Verified status ──
            const verifyRoleId = client.db.get(`verify_role_${interaction.guildId}`);
            const isVerified = verifyRoleId && member?.roles.cache.has(verifyRoleId);
            const verifiedText = isVerified
                ? `✅ Verified${ign ? ` · IGN: **${ign}**` : ''}`
                : '❌ Not Verified';

            // ── Join date ──
            const joinTimestamp = member?.joinedTimestamp
                ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
                : 'Unknown';

            // ── Embed ──
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setAuthor({
                    name: `${targetUser.username}'s Activity Stats`,
                    iconURL: targetUser.displayAvatarURL()
                })
                .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
                .addFields(
                    // Rank section
                    {
                        name: '🏆 Rank',
                        value: [
                            `${rank.emoji} **${rankLabel}**`,
                            `📊 **#${position}** of **${total}** members`,
                            verifiedText,
                        ].join('\n'),
                        inline: false
                    },
                    // Activity stats
                    {
                        name: '✨ Total Activity XP',
                        value: `**${totalXP.toLocaleString()}** XP`,
                        inline: true
                    },
                    {
                        name: '💬 Messages',
                        value: `**${messages.toLocaleString()}**`,
                        inline: true
                    },
                    {
                        name: '🔊 Voice Time',
                        value: `**${formatVoice(voiceMs)}**`,
                        inline: true
                    },
                    {
                        name: '⚔️ War Participations',
                        value: `**${wars.toLocaleString()}**`,
                        inline: true
                    },
                    {
                        name: '⭐ Reputation',
                        value: `**${rep.toLocaleString()}**`,
                        inline: true
                    },
                    {
                        name: '📥 Joined',
                        value: joinTimestamp,
                        inline: true
                    },
                    // Progress bar
                    {
                        name: '📈 Progress to Next Milestone',
                        value: progress.text,
                        inline: false
                    }
                )
                .setFooter({
                    text: progress.xpNeeded > 0
                        ? `${progress.xpNeeded.toLocaleString()} XP needed for next milestone (${progress.nextMilestone?.toLocaleString()})`
                        : 'All milestones reached! 🎉'
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        }
    }
};
