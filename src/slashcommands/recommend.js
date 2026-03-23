const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isMovieEnabled } = require('../utils/movie/isEnabled');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recommend')
        .setDescription('Recommend a movie to the server or view recommendations')
        .addSubcommand(sub =>
            sub.setName('add').setDescription('Add a recommendation')
                .addStringOption(opt => opt.setName('movie').setDescription('Movie name').setRequired(true))
                .addStringOption(opt => opt.setName('reason').setDescription('Why you recommend it').setRequired(false))
        )
        .addSubcommand(sub =>
            sub.setName('list').setDescription('View all recommendations')
        ),

    async execute(interaction, client) {
        if (!isMovieEnabled(interaction.guild.id)) {
            return interaction.reply({ content: '🎬 Movie features are disabled in this server.', flags: MessageFlags.Ephemeral });
        }

        const sub = interaction.options.getSubcommand();
        const key = `movie_recommendations_${interaction.guild.id}`;

        if (sub === 'add') {
            const movie = interaction.options.getString('movie');
            const reason = interaction.options.getString('reason') || null;
            const list = db.get(key) || [];
            list.push({ movie, reason, userId: interaction.user.id, timestamp: Date.now() });
            db.set(key, list);
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('🎬 Recommendation Added')
                        .setDescription(`<@${interaction.user.id}> recommends **${movie}**${reason ? `\n> ${reason}` : ''}`)
                        .setColor(0x2a9d8f)
                ]
            });
        }

        if (sub === 'list') {
            const list = db.get(key) || [];
            if (!list.length) return interaction.reply({ content: '📋 No recommendations yet. Use `/recommend add` to add one!', flags: MessageFlags.Ephemeral });
            const lines = list.slice(-20).map((r, i) =>
                `**${i + 1}.** ${r.movie} — <@${r.userId}>${r.reason ? ` — _${r.reason}_` : ''}`
            );
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('🎬 Movie Recommendations')
                        .setDescription(lines.join('\n'))
                        .setColor(0x2a9d8f)
                ]
            });
        }
    }
};
