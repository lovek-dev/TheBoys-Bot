const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Setup reaction roles')
        .addStringOption(option => option.setName('message_id').setDescription('The message ID').setRequired(true))
        .addStringOption(option => option.setName('emoji').setDescription('The emoji to use').setRequired(true))
        .addRoleOption(option => option.setName('role').setDescription('The role to give').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const messageId = interaction.options.getString('message_id');
        const emoji = interaction.options.getString('emoji');
        const role = interaction.options.getRole('role');

        const message = await interaction.channel.messages.fetch(messageId);
        await message.react(emoji);

        // Store this in database
        client.db?.set(`rr_${interaction.guild.id}_${messageId}_${emoji}`, role.id);

        await interaction.reply({ content: 'Reaction role setup!', ephemeral: true });
    },
};
