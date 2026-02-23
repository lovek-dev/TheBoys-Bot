const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gay')
        .setDescription('Gay-O-Meter')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to check')
                .setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const percentage = Math.floor(Math.random() * 101);
        
        const embed = new EmbedBuilder()
            .setTitle('Gay-O-Meter')
            .setDescription(`${target} is **${percentage}%** gay! 🌈`)
            .setColor(percentage > 50 ? 0xff00ff : 0x00ffff);
            
        await interaction.reply({ embeds: [embed] });
    },
};
