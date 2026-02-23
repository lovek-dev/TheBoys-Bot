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
        
        const comments = [
            "Wait... only {percent}%? The meter must be broken.",
            "I knew it! {percent}% pure rainbow power!",
            "Extreme levels of fabulousness detected: {percent}%",
            "You're basically a unicorn at this point. {percent}%",
            "Safe... for now. {percent}%",
            "Is it getting hot in here? {percent}%",
            "The results are in, and they are sparkling! {percent}%",
            "Confirmed: {percent}% gay. No refunds.",
            "A true icon! {percent}%",
            "Just a little bit of spice! {percent}%"
        ];
        
        const comment = comments[Math.floor(Math.random() * comments.length)].replace('{percent}', percentage);
        
        const embed = new EmbedBuilder()
            .setTitle('🏳️‍🌈 Gay-O-Meter 🏳️‍🌈')
            .setDescription(`${target} is **${percentage}%** gay!\n\n*${comment}*`)
            .setThumbnail('https://media.discordapp.net/attachments/1034529647846768711/1048950432854196274/standard_24.gif')
            .setColor(percentage > 50 ? 0xff00ff : 0x00ffff)
            .setFooter({ text: 'The meter never lies!' });
            
        await interaction.reply({ embeds: [embed] });
    },
};
