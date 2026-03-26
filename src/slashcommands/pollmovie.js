const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, ComponentType } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pollmovie')
        .setDescription('Start a vote for what to watch next')
        .addStringOption(opt => opt.setName('option1').setDescription('First movie option').setRequired(true))
        .addStringOption(opt => opt.setName('option2').setDescription('Second movie option').setRequired(true))
        .addStringOption(opt => opt.setName('option3').setDescription('Third movie option (optional)').setRequired(false))
        .addStringOption(opt => opt.setName('option4').setDescription('Fourth movie option (optional)').setRequired(false)),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const options = [
            interaction.options.getString('option1'),
            interaction.options.getString('option2'),
            interaction.options.getString('option3'),
            interaction.options.getString('option4'),
        ].filter(Boolean);

        const votes = {};
        const voted = new Set();
        options.forEach((_, i) => { votes[i] = 0; });

        const labels = ['🅰️', '🅱️', '🅲', '🅳'];

        const buildEmbed = () => new EmbedBuilder()
            .setTitle('🗳️ Movie Poll — What should we watch?')
            .setDescription(options.map((o, i) => `${labels[i]} **${o}** — ${votes[i]} vote${votes[i] !== 1 ? 's' : ''}`).join('\n'))
            .setColor(0x457b9d)
            .setFooter({ text: 'Poll ends in 5 minutes • One vote per person' });

        const row = new ActionRowBuilder().addComponents(
            options.map((_, i) =>
                new ButtonBuilder().setCustomId(`poll_vote_${i}`).setLabel(labels[i]).setStyle(ButtonStyle.Primary)
            )
        );

        const msg = await interaction.reply({ embeds: [buildEmbed()], components: [row], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 5 * 60 * 1000 });

        collector.on('collect', async i => {
            if (!i.customId.startsWith('poll_vote_')) return;
            if (voted.has(i.user.id)) {
                return i.reply({ content: '❌ You already voted!', flags: MessageFlags.Ephemeral });
            }
            const idx = parseInt(i.customId.replace('poll_vote_', ''));
            votes[idx]++;
            voted.add(i.user.id);
            await i.update({ embeds: [buildEmbed()], components: [row] });
        });

        collector.on('end', async () => {
            const winner = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
            const winnerName = options[parseInt(winner[0])];
            const endEmbed = buildEmbed()
                .setTitle('🗳️ Poll Ended!')
                .setFooter({ text: `Winner: ${winnerName} with ${winner[1]} vote${winner[1] !== 1 ? 's' : ''}` });

            const disabledRow = new ActionRowBuilder().addComponents(
                options.map((_, i) =>
                    new ButtonBuilder().setCustomId(`poll_vote_${i}`).setLabel(labels[i]).setStyle(ButtonStyle.Secondary).setDisabled(true)
                )
            );

            await msg.edit({ embeds: [endEmbed], components: [disabledRow] }).catch(() => {});
        });
    }
};
