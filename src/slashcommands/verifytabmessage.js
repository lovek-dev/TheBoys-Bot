const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verifytabmessage')
        .setDescription('Set custom message and image for verifytab')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message to show in verifytab')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('image')
                .setDescription('The image URL to show in verifytab')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        let message = interaction.options.getString('message');
        const image = interaction.options.getString('image');
        
        message = message.replace(/\\n/g, '\n');
        
        client.db.set(`verify_msg_${interaction.guildId}`, message);
        client.db.set(`verify_img_${interaction.guildId}`, image);
        
        await interaction.reply({ content: '✅ Verification message and image updated!', ephemeral: true });
    },
};
