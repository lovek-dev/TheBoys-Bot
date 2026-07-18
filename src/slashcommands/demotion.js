const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('demotion')
        .setDescription('Announce and apply a member demotion')
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('The member being demoted')
                .setRequired(true))
        .addRoleOption(opt =>
            opt.setName('role')
                .setDescription('The role they are being demoted to')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('reason')
                .setDescription('Reason for the demotion')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction, client) {
        const user   = interaction.options.getUser('user');
        const role   = interaction.options.getRole('role');
        const reason = interaction.options.getString('reason');
        const member = interaction.options.getMember('user');

        // Apply the demotion role
        let roleNote = '';
        if (member) {
            try {
                await member.roles.add(role.id, `Demoted by ${interaction.user.tag} — ${reason}`);
                roleNote = ` Role <@&${role.id}> assigned.`;
            } catch (e) {
                console.error('[DEMOTION] Failed to assign role:', e.message);
                roleNote = ` ⚠️ Failed to assign role — check bot permissions and role hierarchy.`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('📉 Demotion Announcement')
            .setDescription(`<@${user.id}> has been demoted.`)
            .addFields(
                { name: '👤 Member',      value: `<@${user.id}>`,            inline: true },
                { name: '📉 Demoted To', value: `<@&${role.id}>`,           inline: true },
                { name: '👮 Demoted By', value: `<@${interaction.user.id}>`, inline: true },
                { name: '📝 Reason',     value: reason,                      inline: false }
            )
            .setColor(0xFF4444)
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Mirror to summer logs channel
        const logsChannelId = client.db.get(`summer_logs_channel_${interaction.guildId}`);
        if (logsChannelId) {
            const logsChannel = interaction.guild.channels.cache.get(logsChannelId);
            if (logsChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('📉 Demotion Logged')
                    .addFields(
                        { name: 'Member',     value: `<@${user.id}>`,            inline: true },
                        { name: 'Demoted To', value: `<@&${role.id}>`,           inline: true },
                        { name: 'By',         value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Reason',     value: reason,                      inline: false }
                    )
                    .setColor(0xFF4444)
                    .setTimestamp();
                logsChannel.send({ embeds: [logEmbed] }).catch(() => {});
            }
        }
    }
};
