const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pollseries')
        .setDescription('Vote on which TV series to watch next')
        .addStringOption(opt => opt.setName('series1').setDescription('First series').setRequired(true))
        .addStringOption(opt => opt.setName('series2').setDescription('Second series').setRequired(true))
        .addStringOption(opt => opt.setName('series3').setDescription('Third series (optional)').setRequired(false))
        .addStringOption(opt => opt.setName('series4').setDescription('Fourth series (optional)').setRequired(false))
        .addIntegerOption(opt => opt.setName('duration').setDescription('Poll duration in minutes (default 5)').setRequired(false)),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const options = [
            interaction.options.getString('series1'),
            interaction.options.getString('series2'),
            interaction.options.getString('series3'),
            interaction.options.getString('series4'),
        ].filter(Boolean);

        const duration = (interaction.options.getInteger('duration') ?? 5) * 60 * 1000;
        const pollId = `spoll_${interaction.guildId}_${Date.now()}`;

        const votes = {};
        options.forEach(s => votes[s] = []);
        db.set(pollId, { options, votes, endsAt: Date.now() + duration });

        const emojis = ['📺', '🎥', '🍿', '🎬'];
        const buttons = options.map((s, i) =>
            new ButtonBuilder()
                .setCustomId(`series_vote_${i}_${pollId}`)
                .setLabel(`${emojis[i]} ${s}`)
                .setStyle(ButtonStyle.Primary)
        );

        const rows = [];
        for (let i = 0; i < buttons.length; i += 2)
            rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 2)));

        const embed = new EmbedBuilder()
            .setTitle('🗳️ Series Vote Poll')
            .setDescription('Vote for what the server should watch next!\n\n' + options.map((s, i) => `${emojis[i]} **${s}**`).join('\n'))
            .setColor(0xa29bfe)
            .setFooter({ text: `Poll ends in ${interaction.options.getInteger('duration') ?? 5} minutes` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], components: rows });

        setTimeout(async () => {
            try {
                const pollData = db.get(pollId);
                if (!pollData) return;
                const results = pollData.options.map(s => ({ series: s, count: (pollData.votes[s] || []).length }));
                results.sort((a, b) => b.count - a.count);
                const winner = results[0];
                const resultEmbed = new EmbedBuilder()
                    .setTitle('🏆 Series Poll Results!')
                    .setColor(0xffd700)
                    .setDescription(`**Winner: ${winner.series}** with **${winner.count} vote(s)**!\n\n` +
                        results.map((r, i) => `${i + 1}. ${r.series} — ${r.count} vote(s)`).join('\n'))
                    .setTimestamp();
                await interaction.channel.send({ embeds: [resultEmbed] });
                db.set(pollId, null);
            } catch (e) { console.error('Series poll end error:', e); }
        }, duration);
    }
};
