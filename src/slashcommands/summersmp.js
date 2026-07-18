const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('summersmp')
        .setDescription('SummerSMP module — view status and all configuration commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction, client) {
        const formChannel   = client.db.get(`summer_form_channel_${interaction.guildId}`);
        const role          = client.db.get(`summer_role_${interaction.guildId}`);
        const ticketChannel = client.db.get(`summer_ticket_channel_${interaction.guildId}`);
        const logsChannel   = client.db.get(`summer_logs_channel_${interaction.guildId}`);

        const embed = new EmbedBuilder()
            .setTitle('☀️ SummerSMP Module')
            .setDescription('The SummerSMP module is **active**. Use the commands below to configure each feature.')
            .addFields(
                { name: '📋 Applications Channel', value: formChannel   ? `<#${formChannel}>`   : '❌ Not set — `/summerform #channel`',   inline: true },
                { name: '✅ Member Role',           value: role          ? `<@&${role}>`         : '❌ Not set — `/summerrole @role`',       inline: true },
                { name: '🎫 Ticket Channel',        value: ticketChannel ? `<#${ticketChannel}>` : '❌ Not set — `/summerticket`',           inline: true },
                { name: '📜 Logs Channel',          value: logsChannel   ? `<#${logsChannel}>`   : '❌ Not set — `/logssummer #channel`',    inline: true },
                { name: '\u200b', value: '**━━━━━━━━ Available Commands ━━━━━━━━**', inline: false },
                { name: '`/summer verify`',            value: 'Send the clan application panel',          inline: true },
                { name: '`/summerform #channel`',      value: 'Set where applications are reviewed',      inline: true },
                { name: '`/summerrole @role`',         value: 'Set the accepted member role',             inline: true },
                { name: '`/summerticket`',             value: 'Send the support ticket panel',            inline: true },
                { name: '`/promotion @user @role`',    value: 'Announce a promotion',                     inline: true },
                { name: '`/demotion @user @role`',     value: 'Announce a demotion',                      inline: true },
                { name: '`/logssummer #channel`',      value: 'Set the summer logs channel',              inline: true },
            )
            .setColor(0xFFAA00)
            .setFooter({ text: 'SummerSMP — Anti-Nuke & Auto-Mod always active' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
