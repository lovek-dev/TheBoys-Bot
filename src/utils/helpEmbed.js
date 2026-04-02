const { EmbedBuilder } = require('discord.js');

function buildHelpEmbed() {
    return new EmbedBuilder()
        .setTitle('🤖  TheBoys Bot — Help')
        .setDescription(
            'Here\'s everything you can do. Actions & expressions use the `boys` prefix, everything else is a slash command.\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━'
        )
        .setColor(0x5865F2)
        .addFields(
            {
                name: '🎭  Actions  —  `boys [action] @user`',
                value: [
                    '`slap` `kiss` `kick` `punch` `hug` `pat` `beg` `please`',
                    '`smash` 🔞  `dominate` 🔞  `fuck` 🔞',
                    '*NSFW ones only work in age-restricted channels.*',
                ].join('\n'),
                inline: false,
            },
            {
                name: '💭  Expressions  —  `boys [emotion]`',
                value: '`cry` `sorry` `laugh` `confused` `joy` `happy` `hype` `bored` `angry` `shy`',
                inline: false,
            },
            {
                name: '⚙️  Moderation',
                value: [
                    '`/mute` `/unmute` `/ban` `/unban` `/kick` `/clear`',
                    '`/announce` `/dm` `/logschannel` `/reactionrole`',
                ].join('\n'),
                inline: true,
            },
            {
                name: '🔐  Verification Setup',
                value: '`/verifyforms` `/verifyrole`\n`/verifytab` `/verifytabmessage`',
                inline: true,
            },
            {
                name: '\u200b',
                value: '\u200b',
                inline: false,
            },
            {
                name: '🎉  Fun',
                value: '`/gay` `/ragebait`\n`/roast target|enable|disable`',
                inline: true,
            },
            {
                name: '\u200b',
                value: '\u200b',
                inline: false,
            },
            {
                name: '🎬  Movie Club',
                value: [
                    '`/startmovie` `/startseries` `/seriesmark` `/seriesprogress`',
                    '`/seriesresume` `/nextepisode` `/marktime` `/rate` `/rateepisode`',
                    '`/ratings` `/episoderatings` `/episodereactions` `/wishlist`',
                    '`/recommend` `/recap` `/pollmovie` `/movieresults` `/moviestats`',
                    '`/moviewelcome` `/movieforms` `/movieformrole` `/movieserver`',
                ].join('\n'),
                inline: false,
            },
            {
                name: '📊  Stats',
                value: '`/stats` `/active`',
                inline: true,
            },
            {
                name: '❓  This command',
                value: '`/help`  or  `boys help`',
                inline: true,
            },
        )
        .setFooter({ text: '🔞 marks NSFW-only commands  •  3s cooldown on boys commands' })
        .setTimestamp();
}

module.exports = { buildHelpEmbed };
