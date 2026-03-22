const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isMovieEnabled } = require('../utils/movieCheck');
const db = require('../database/db');

if (!global.watchVoteTimers) global.watchVoteTimers = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('watchvote')
        .setDescription('Start a group vote to pause, resume, or skip the current watch')
        .addStringOption(opt =>
            opt.setName('action')
                .setDescription('What to vote on')
                .setRequired(true)
                .addChoices(
                    { name: '⏸ Pause', value: 'pause' },
                    { name: '▶️ Resume', value: 'resume' },
                    { name: '⏭ Skip Episode', value: 'skip' }
                )),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guildId))
            return interaction.reply({ content: '🎬 Movie/Series features are disabled.', ephemeral: true });

        const session = db.get(`movie_session_${interaction.guildId}`) || db.get(`series_session_${interaction.guildId}`);
        if (!session)
            return interaction.reply({ content: '❌ No active movie or series session right now.', ephemeral: true });

        const action = interaction.options.getString('action');
        const voteKey = `watchvote_${interaction.guildId}`;

        if (db.get(voteKey))
            return interaction.reply({ content: '⚠️ A vote is already in progress! Use the buttons on the existing vote.', ephemeral: true });

        const voteData = {
            action,
            voters: [interaction.user.id],
            startedBy: interaction.user.id,
            startedAt: Date.now(),
            expires: Date.now() + 60000
        };
        db.set(voteKey, voteData);

        const actionLabel = { pause: '⏸ Pause', resume: '▶️ Resume', skip: '⏭ Skip Episode' }[action];

        const embed = new EmbedBuilder()
            .setTitle(`🗳️ Vote: ${actionLabel}`)
            .setDescription(`<@${interaction.user.id}> has called a vote!\nClick below to support this action.\n\n**Votes:** 1 so far`)
            .setColor(0xa29bfe)
            .setFooter({ text: 'Vote expires in 60 seconds • Need 2+ votes or 50% of participants' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`watchvote_cast_${interaction.guildId}`)
                .setLabel(`Vote to ${action}`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🗳️')
        );

        await interaction.reply({ embeds: [embed], components: [row] });

        const timer = setTimeout(async () => {
            try {
                const finalVote = db.get(voteKey);
                db.set(voteKey, null);
                global.watchVoteTimers.delete(interaction.guildId);
                if (!finalVote) return;

                const count = finalVote.voters.length;
                const resultEmbed = new EmbedBuilder()
                    .setTitle(`⏰ Vote Expired: ${actionLabel}`)
                    .setDescription(`The vote ended with **${count} vote(s)**. The threshold was not reached in time.`)
                    .setColor(0xff4444).setTimestamp();

                await interaction.channel.send({ embeds: [resultEmbed] });
            } catch (e) {}
        }, 60000);

        global.watchVoteTimers.set(interaction.guildId, timer);
    }
};
