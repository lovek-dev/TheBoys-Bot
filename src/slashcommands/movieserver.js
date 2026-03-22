const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('movieserver')
        .setDescription('Enable or disable movie features for this server (Owner only)')
        .addStringOption(opt =>
            opt.setName('action')
                .setDescription('Enable or disable movie features')
                .setRequired(true)
                .addChoices(
                    { name: 'enable', value: 'enable' },
                    { name: 'disable', value: 'disable' }
                )),
    async execute(interaction, client) {
        const ownerIds = config.OWNER || [];
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: '🚫 Only the bot owner can use this command.', ephemeral: true });
        }

        const action = interaction.options.getString('action');
        const enabled = action === 'enable';
        db.set(`movie_enabled_${interaction.guildId}`, enabled);

        const embed = new EmbedBuilder()
            .setTitle('🎬 Movie Features ' + (enabled ? 'Enabled' : 'Disabled'))
            .setDescription(enabled
                ? '✅ All movie commands are now active in this server.'
                : '❌ All movie commands have been disabled in this server.')
            .setColor(enabled ? 0x00ff88 : 0xff4444)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
