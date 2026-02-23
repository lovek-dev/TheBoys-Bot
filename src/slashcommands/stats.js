const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Shows user statistics')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to show stats for')
                .setRequired(false)),
    async execute(interaction, client) {
        const target = interaction.options.getUser('user') || interaction.user;
        const member = await interaction.guild.members.fetch(target.id);
        
        // In a real app, these would come from a database
        // For now, we'll initialize them or get them from a placeholder
        const messageCount = client.db?.get(`messages_${interaction.guild.id}_${target.id}`) || 0;
        const voiceTime = client.db?.get(`voice_${interaction.guild.id}_${target.id}`) || 0;
        
        const embed = new EmbedBuilder()
            .setColor(0x2b2d31)
            .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
            .addFields(
                { name: 'Created On', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:D>`, inline: true },
                { name: 'Joined On', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`, inline: true },
                { name: '\u200B', value: '\u200B', inline: false },
                { name: 'Server Ranks', value: `Message: #?\nVoice: No Data`, inline: true },
                { name: 'Messages', value: `1d: ${messageCount} messages\n7d: ${messageCount} messages\n14d: ${messageCount} messages`, inline: true },
                { name: 'Voice Activity', value: `1d: ${Math.floor(voiceTime / 3600000)} hours\n7d: ${Math.floor(voiceTime / 3600000)} hours\n14d: ${Math.floor(voiceTime / 3600000)} hours`, inline: true }
            )
            .setFooter({ text: `Server Lookback: Last 14 days — Timezone: UTC` });

        await interaction.reply({ embeds: [embed] });
    },
};
