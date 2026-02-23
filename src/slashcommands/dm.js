const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dm')
        .setDescription('Send a DM to a user or role')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(option => 
            option.setName('type')
                .setDescription('Who to DM')
                .setRequired(true)
                .addChoices(
                    { name: 'User', value: 'user' },
                    { name: 'Role', value: 'role' }
                ))
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Select the user (if type is User)'))
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('Select the role (if type is Role)'))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(true)),
    async execute(interaction) {
        const type = interaction.options.getString('type');
        const message = interaction.options.getString('message');
        const user = interaction.options.getUser('user');
        const role = interaction.options.getRole('role');

        await interaction.deferReply({ ephemeral: true });

        if (type === 'user') {
            if (!user) return interaction.editReply('Please specify a user.');
            try {
                await user.send(message);
                await interaction.editReply(`Successfully sent DM to ${user.tag}`);
            } catch (error) {
                await interaction.editReply(`Failed to DM ${user.tag}. They might have DMs closed.`);
            }
        } else {
            if (!role) return interaction.editReply('Please specify a role.');
            
            const members = await interaction.guild.members.fetch();
            const roleMembers = members.filter(m => m.roles.cache.has(role.id) && !m.user.bot);
            
            if (roleMembers.size === 0) return interaction.editReply(`No members found with the role ${role.name}.`);

            await interaction.editReply(`Sending DMs to ${roleMembers.size} members...`);

            let success = 0;
            for (const [id, member] of roleMembers) {
                try {
                    await member.send(message);
                    success++;
                } catch (e) {}
            }
            await interaction.editReply(`Finished! Successfully sent to ${success}/${roleMembers.size} members.`);
        }
    },
};
