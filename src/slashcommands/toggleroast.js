const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config/config.json');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggleroast')
        .setDescription('Enable or disable roast/ragebait responses (Owner only)')
        .addStringOption(opt =>
            opt.setName('action')
                .setDescription('Enable or disable roast/ragebait')
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
        db.set(`roast_enabled_${interaction.guildId}`, enabled);

        const embed = new EmbedBuilder()
            .setTitle('🔥 Roast/Ragebait ' + (enabled ? 'Enabled' : 'Disabled'))
            .setDescription(enabled
                ? '✅ Roast and ragebait responses are now **ON** in this server.'
                : '🔇 Roast and ragebait responses are now **OFF** in this server.')
            .setColor(enabled ? 0xff6600 : 0x555555)
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
