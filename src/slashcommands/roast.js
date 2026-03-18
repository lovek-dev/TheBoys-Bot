const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getUltimateRoast } = require('../data/roasts');
const config = require('../config/config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roast')
        .setDescription('Target a user for automatic roasts (Owner only)')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to roast')
                .setRequired(true)),
    async execute(interaction, client) {
        const ownerIds = config.OWNER || [];
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: 'Only the bot owner can use this command.', ephemeral: true });
        }

        const target = interaction.options.getUser('user');
        if (target.bot) return interaction.reply({ content: 'I cannot roast bots.', ephemeral: true });

        if (!client.activeRoasts) client.activeRoasts = new Map();

        if (client.activeRoasts.has(target.id)) {
            clearInterval(client.activeRoasts.get(target.id).interval);
            client.activeRoasts.delete(target.id);
            return interaction.reply(`Stopped roasting ${target.tag}.`);
        }

        const interval = setInterval(async () => {
            try {
                const channel = await client.channels.fetch(interaction.channelId);
                const roast = getUltimateRoast(target.id, "", true);
                if (channel && roast) {
                    channel.send(`<@${target.id}> ${roast}`);
                }
            } catch (err) {
                console.error('Error in roast interval:', err);
            }
        }, 5 * 60 * 1000); // 5 minutes

        client.activeRoasts.set(target.id, { interval, targetId: target.id });

        const roastNow = getUltimateRoast(target.id, "", true);
        await interaction.reply({ content: `Now targeting ${target.tag} for roasts every 5 minutes.\n${roastNow}` });
    },
};
