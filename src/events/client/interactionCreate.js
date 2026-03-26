const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isButton()) {
            if (interaction.customId === 'verify_start') {
                const userId = interaction.user.id;
                const ownerIds = client.config.OWNER || [];
                if (ownerIds.includes(userId)) {
                    return interaction.reply({ 
                        content: 'Owners do not need to verify!', 
                        ephemeral: true 
                    });
                }
                
                const verifyChannelId = client.db.get(`verify_channel_${interaction.guildId}`);
                if (!verifyChannelId) {
                    return interaction.reply({ 
                        content: 'Verification system is not set up yet! Please ask an admin to use `/verifyforms`.', 
                        ephemeral: true 
                    });
                }

                const roleId = client.db.get(`verify_role_${interaction.guildId}`);
                
                // Check if user already has the role
                if (roleId && interaction.member.roles.cache.has(roleId)) {
                    return interaction.reply({ 
                        content: 'You are already verified!', 
                        ephemeral: true 
                    });
                }

                const now = Date.now();
                const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
                
                let userRequests = client.db.get(`verify_requests_${userId}`) || [];
                // Filter requests from the last 3 days
                userRequests = userRequests.filter(timestamp => now - timestamp < threeDaysMs);
                
                if (userRequests.length >= 4) {
                    return interaction.reply({ 
                        content: 'You have reached the limit of 4 verification requests in 3 days. Please try again later.', 
                        ephemeral: true 
                    });
                }

                const modal = new ModalBuilder()
                    .setCustomId('verify_modal')
                    .setTitle('Verification Form');

                const ignInput = new TextInputBuilder()
                    .setCustomId('ign')
                    .setLabel('IGN:')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const inviteInput = new TextInputBuilder()
                    .setCustomId('invited_by')
                    .setLabel('Who Invited You?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const reasonInput = new TextInputBuilder()
                    .setCustomId('reason')
                    .setLabel('Why You Wanna Join?')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const langInput = new TextInputBuilder()
                    .setCustomId('languages')
                    .setLabel('Languages:')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(ignInput),
                    new ActionRowBuilder().addComponents(inviteInput),
                    new ActionRowBuilder().addComponents(reasonInput),
                    new ActionRowBuilder().addComponents(langInput)
                );

                await interaction.showModal(modal);
                return;
            }

            if (interaction.customId.startsWith('verify_accept_')) {
                const userId = interaction.customId.split('_')[2];
                const roleId = client.db.get(`verify_role_${interaction.guildId}`);
                if (!roleId) return interaction.reply({ content: 'Verification role not set!', ephemeral: true });

                await interaction.deferUpdate();

                try {
                    const member = await interaction.guild.members.fetch(userId);
                    await member.roles.add(roleId);
                    await member.send('You have been verified successfully!').catch(() => {});
                    
                    await interaction.editReply({ content: `✅ User <@${userId}> accepted.`, components: [], embeds: interaction.message.embeds });
                } catch (error) {
                    console.error('Error in verify_accept:', error);
                    await interaction.followUp({ content: 'Failed to accept verification. Member might have left.', ephemeral: true });
                }
                return;
            }

            if (interaction.customId.startsWith('verify_deny_')) {
                const userId = interaction.customId.split('_')[2];
                const modal = new ModalBuilder()
                    .setCustomId(`deny_modal_${userId}`)
                    .setTitle('Deny Reason');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('deny_reason')
                    .setLabel('Reason?')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
                await interaction.showModal(modal);
                return;
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'verify_modal') {
                await interaction.deferReply({ ephemeral: true });
                const userId = interaction.user.id;
                const now = Date.now();
                const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
                
                let userRequests = client.db.get(`verify_requests_${userId}`) || [];
                userRequests = userRequests.filter(timestamp => now - timestamp < threeDaysMs);
                userRequests.push(now);
                client.db.set(`verify_requests_${userId}`, userRequests);

                const ign = interaction.fields.getTextInputValue('ign');
                const invitedBy = interaction.fields.getTextInputValue('invited_by');
                const reason = interaction.fields.getTextInputValue('reason');
                const languages = interaction.fields.getTextInputValue('languages');

                const verifyChannelId = client.db.get(`verify_channel_${interaction.guildId}`);
                if (!verifyChannelId) return interaction.editReply({ content: 'Verification channel not set!' });

                const channel = interaction.guild.channels.cache.get(verifyChannelId);
                if (!channel) return interaction.editReply({ content: 'Verification channel not found!' });

                const embed = new EmbedBuilder()
                    .setTitle('New Verification Request')
                    .addFields(
                        { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})` },
                        { name: 'IGN', value: ign },
                        { name: 'Invited By', value: invitedBy },
                        { name: 'Reason', value: reason },
                        { name: 'Languages', value: languages }
                    )
                    .setColor(0x0099ff);

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`verify_accept_${interaction.user.id}`).setLabel('Accept').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`verify_deny_${interaction.user.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger)
                );

                await channel.send({ embeds: [embed], components: [row] });
                await interaction.editReply({ content: 'Your verification form has been submitted!' });
                return;
            }

            if (interaction.customId.startsWith('deny_modal_')) {
                const userId = interaction.customId.split('_')[2];
                const reason = interaction.fields.getTextInputValue('deny_reason');
                
                await interaction.deferUpdate();

                try {
                    const member = await interaction.guild.members.fetch(userId);
                    await member.send(`Your verification request was denied. Reason: ${reason}`).catch(() => {});
                    
                    await interaction.editReply({ content: `❌ User <@${userId}> denied for: ${reason}`, components: [], embeds: [] });
                } catch (error) {
                    console.error('Error in deny_modal:', error);
                    await interaction.followUp({ content: 'Failed to deny verification. Member might have left.', ephemeral: true });
                }
                return;
            }

            if (interaction.customId.startsWith('dm_modal_')) {
                const type = interaction.customId.split('_')[2]; // 'user' or 'role'
                const targetId = interaction.customId.split('_')[3];
                const message = interaction.fields.getTextInputValue('dm_message');

                await interaction.deferReply({ ephemeral: true });

                try {
                    if (type === 'user') {
                        const user = await client.users.fetch(targetId);
                        await user.send(message);
                        await interaction.editReply(`Successfully sent DM to <@${targetId}>`);
                    } else {
                        const role = interaction.guild.roles.cache.get(targetId);
                        if (!role) return interaction.editReply('Role not found.');
                        
                        let successCount = 0;
                        let failCount = 0;
                        
                        const members = await interaction.guild.members.fetch();
                        const roleMembers = members.filter(m => m.roles.cache.has(targetId) && !m.user.bot);

                        for (const [id, member] of roleMembers) {
                            try {
                                await member.send(message);
                                successCount++;
                            } catch (e) {
                                failCount++;
                            }
                        }
                        await interaction.editReply(`DM process finished. Success: ${successCount}, Failed: ${failCount} (likely closed DMs)`);
                    }
                } catch (error) {
                    console.error(error);
                    await interaction.editReply('Failed to send DM. Make sure the ID is correct and I have permissions.');
                }
                return;
            }
        }
        
        if (interaction.isButton()) {
            if (interaction.customId === 'dm_user' || interaction.customId === 'dm_role') {
                const type = interaction.customId === 'dm_user' ? 'user' : 'role';
                const modal = new ModalBuilder()
                    .setCustomId(`dm_select_modal_${type}`)
                    .setTitle(`Send DM to ${type === 'user' ? 'User' : 'Role'}`);

                const idInput = new TextInputBuilder()
                    .setCustomId('target_id')
                    .setLabel(`${type === 'user' ? 'User' : 'Role'} ID:`)
                    .setPlaceholder(`Paste the ${type} ID here...`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const messageInput = new TextInputBuilder()
                    .setCustomId('dm_message')
                    .setLabel('Message:')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(idInput),
                    new ActionRowBuilder().addComponents(messageInput)
                );

                await interaction.showModal(modal);
                return;
            }
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId.startsWith('dm_select_modal_')) {
                const type = interaction.customId.split('_')[3];
                const targetId = interaction.fields.getTextInputValue('target_id');
                const message = interaction.fields.getTextInputValue('dm_message');

                await interaction.deferReply({ ephemeral: true });

                try {
                    if (type === 'user') {
                        const user = await client.users.fetch(targetId);
                        await user.send(message);
                        await interaction.editReply(`Successfully sent DM to <@${targetId}>`);
                    } else {
                        const role = interaction.guild.roles.cache.get(targetId);
                        if (!role) return interaction.editReply('Role not found.');
                        
                        const members = await interaction.guild.members.fetch();
                        const roleMembers = members.filter(m => m.roles.cache.has(targetId) && !m.user.bot);
                        
                        await interaction.editReply(`Sending DMs to ${roleMembers.size} members...`);
                        
                        let successCount = 0;
                        for (const [id, member] of roleMembers) {
                            try {
                                await member.send(message);
                                successCount++;
                            } catch (e) {}
                        }
                        await interaction.followUp({ content: `Finished sending DMs to ${role.name}. Success: ${successCount}`, ephemeral: true });
                    }
                } catch (error) {
                    await interaction.editReply('Error: ' + error.message);
                }
                return;
            }
        }
        
        if (!interaction.isChatInputCommand()) return;

        const command = client.slashCommands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`[COMMAND ERROR] Error in ${interaction.commandName}:`, error);
            const errorMessage = { content: '⚠️ An error occurred while executing this command.', ephemeral: true };
            
            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            } catch (replyError) {
                if (replyError.code === 10062) {
                    console.log(`[REPLY INFO] Interaction for ${interaction.commandName} expired before error reply could be sent.`);
                } else {
                    console.error('[REPLY ERROR] Failed to send error message:', replyError);
                }
            }
        }
    }
};
