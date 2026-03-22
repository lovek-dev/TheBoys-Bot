const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moviepoll')
        .setDescription('Create a quick custom poll for your watch party')
        .addStringOption(opt =>
            opt.setName('question').setDescription('What are you asking?').setRequired(true))
        .addStringOption(opt =>
            opt.setName('option1').setDescription('First option').setRequired(true))
        .addStringOption(opt =>
            opt.setName('option2').setDescription('Second option').setRequired(true))
        .addStringOption(opt =>
            opt.setName('option3').setDescription('Third option (optional)').setRequired(false))
        .addStringOption(opt =>
            opt.setName('option4').setDescription('Fourth option (optional)').setRequired(false))
        .addIntegerOption(opt =>
            opt.setName('duration').setDescription('Poll duration in minutes (default 3)').setRequired(false).setMinValue(1).setMaxValue(60)),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const question = interaction.options.getString('question');
        const options = [
            interaction.options.getString('option1'),
            interaction.options.getString('option2'),
            interaction.options.getString('option3'),
            interaction.options.getString('option4'),
        ].filter(Boolean);

        const duration = (interaction.options.getInteger('duration') ?? 3) * 60 * 1000;
        const pollId = `mpoll_${interaction.guildId}_${Date.now()}`;

        const votes = {};
        options.forEach(o => votes[o] = []);
        db.set(pollId, { question, options, votes, endsAt: Date.now() + duration });

        const emojis = ['🅰️', '🅱️', '🆎', '🆑'];
        const buttons = options.map((opt, i) =>
            new ButtonBuilder()
                .setCustomId(`mpoll_vote_${i}_${pollId}`)
                .setLabel(`${emojis[i]} ${opt}`)
                .setStyle(ButtonStyle.Primary)
        );

        const rows = [];
        for (let i = 0; i < buttons.length; i += 2)
            rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 2)));

        const session = db.get(`movie_session_${interaction.guildId}`) || db.get(`series_session_${interaction.guildId}`);
        const context = session ? `During: **${session.title}**` : '';

        const embed = new EmbedBuilder()
            .setTitle(`🗳️ Watch Party Poll`)
            .setDescription(`**${question}**\n\n${context}`)
            .setColor(0xfdcb6e)
            .addFields(options.map((opt, i) => ({
                name: `${emojis[i]} ${opt}`,
                value: '0 votes',
                inline: true
            })))
            .setFooter({ text: `Poll closes in ${interaction.options.getInteger('duration') ?? 3} minute(s) • Started by ${interaction.user.username}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], components: rows });

        setTimeout(async () => {
            try {
                const final = db.get(pollId);
                if (!final) return;
                db.set(pollId, null);

                const results = final.options.map(o => ({ option: o, count: (final.votes[o] || []).length }));
                results.sort((a, b) => b.count - a.count);
                const winner = results[0];
                const total = results.reduce((s, r) => s + r.count, 0);

                const resultEmbed = new EmbedBuilder()
                    .setTitle(`🏆 Poll Results: ${question}`)
                    .setColor(0xffd700)
                    .setDescription(`**Winner: ${emojis[0]} ${winner.option}** with **${winner.count} vote(s)**!\n\n` +
                        results.map((r, i) => {
                            const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
                            const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
                            return `${emojis[i]} **${r.option}** — ${bar} ${r.count} vote(s) (${pct}%)`;
                        }).join('\n'))
                    .setTimestamp();

                await interaction.channel.send({ embeds: [resultEmbed] });
            } catch (e) { console.error('moviepoll end error:', e); }
        }, duration);
    }
};
