const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const WELCOME_GIF = 'https://media.tenor.com/kKHBMAQ1s-YAAAPo/3.gif';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Post the server welcome embed with the rules button (owner only)'),

    async execute(interaction, client) {
        const ownerIds = client.config.OWNER || [];
        if (!ownerIds.includes(interaction.user.id)) {
            return interaction.reply({ content: '❌ Only the bot owner can use this command.', flags: 64 });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('rule')
                .setLabel('View Rules')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📖')
        );

        const embed = new EmbedBuilder()
            .setAuthor({ name: `Welcome to ${interaction.guild.name}` })
            .setDescription(
                `✦・**Welcome!**・✦\n\n` +
                `:compass: Make Sure to Read the Rules! ‹3\n\n\n` +
                `₊˚:globe_with_meridians: Get verified at <#1224003744966901782>\n\n\n` +
                `— ୨🎀୧ Be very welcome! ✦\n\n` +
                `₊˚ʚ :partying_face: ɞ *Hope you like our server!*\n\n` +
                `**Read the rules to avoid punishment**\n\n` +
                `꒷꒥꒷ ‧₊˚ Thanks for joining! :)`
            )
            .setImage(WELCOME_GIF)
            .setColor('#2f3136');

        try {
            await interaction.channel.send({ embeds: [embed], components: [row] });
            await interaction.reply({ content: '✅ Welcome embed posted!', flags: 64 });
        } catch (err) {
            console.error('[SETUP] Failed to send setup embed:', err);
            await interaction.reply({ content: '❌ Failed to post the embed. Check my permissions.', flags: 64 });
        }
    },
};
