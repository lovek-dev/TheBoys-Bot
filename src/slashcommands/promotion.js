const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('promotion')
        .setDescription('Announce and apply a member promotion')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('The member being promoted')
                .setRequired(true))
        .addRoleOption(opt =>
            opt.setName('role')
                .setDescription('The role they are being promoted to')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('reason')
                .setDescription('Reason for the promotion')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, client) {
        const user   = interaction.options.getUser('user');
        const role   = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason');
        const member = interaction.options.getMember('user');

        // Assign the role
        if (member) {
            try {
                await member.roles.add(role.id, `Promoted by ${interaction.user.tag} — ${reason}`);
            } catch (e) {
                console.error('[PROMOTION] Failed to assign role:', e.message);
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🏆 Promotion Announcement')
            .setDescription(`Congratulations to <@${user.id}> on their well-deserved promotion! 🎉`)
            .addFields(
                { name: '👤 Member',       value: `<@${user.id}>`,            inline: true },
                { name: '🎖️ Promoted To', value: `<@&${role.id}>`,           inline: true },
                { name: '👮 Promoted By',  value: `<@${interaction.user.id}>`, inline: true },
                { name: '📝 Reason',       value: reason,                      inline: false }
            )
            .setColor(0x00FF88)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Mirror to summer logs channel
        const logsChannelId = client.db.get(`summer_logs_channel_${interaction.guildId}`);
        if (logsChannelId) {
            const logsChannel = interaction.guild.channels.cache.get(logsChannelId);
            if (logsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('🏆 Promotion Logged')
                    .addFields(
                        { name: 'Member',      value: `<@${user.id}>`,            inline: true },
                        { name: 'Promoted To', value: `<@&${role.id}>`,           inline: true },
                        { name: 'By',          value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Reason',      value: reason,                      inline: false }
                    )
                    .setColor(0x00FF88)
                    .setTimestamp();
                logsChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    }
};
