const { SlashCommandBuilder, MessageFlags } = require('discord.js');
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
                )
        ),

    async execute(interaction, client) {
        const ownerIds = client.config.OWNER || [];
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ Only the bot owner can use this command.', flags: MessageFlags.Ephemeral });
        }

        const action = interaction.options.getString('action');
        db.set(`movie_enabled_${interaction.guild.id}`, action === 'enable');

        return interaction.reply({
            content: `🎬 Movie features have been **${action}d** for this server.`,
            flags: MessageFlags.Ephemeral
        });
    }
};
