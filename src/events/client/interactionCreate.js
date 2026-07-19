const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isButton()) {
            if (interaction.customId === 'join_movie_form') {
                // 12-hour cooldown check
                const lastApply = client.db.get(`movie_apply_${interaction.user.id}`);
                if (lastApply) {
                    const hoursSince = (Date.now() - lastApply) / (1000 * 60 * 60);
                    if (hoursSince < 12) {
                        const hoursLeft = (12 - hoursSince).toFixed(1);
                        return interaction.reply({
                            content: `⏳ You already submitted an application recently. Please wait **${hoursLeft} more hours** before applying again.`,
                            flags: 64
                        });
                    }
                }

                const modal = new ModalBuilder()
                    .setCustomId('movie_join_modal')
                    .setTitle('Movie Club Application');

                const whyInput = new TextInputBuilder()
                    .setCustomId('movie_why')
                    .setLabel('Why do you want to join?')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const seriesInput = new TextInputBuilder()
                    .setCustomId('movie_series')
                    .setLabel('Series Suggestions')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('e.g. Breaking Bad, Squid Game...')
                    .setRequired(false);

                const movieInput = new TextInputBuilder()
                    .setCustomId('movie_suggestions')
                    .setLabel('Movie Suggestions')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('e.g. Inception, Parasite...')
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(whyInput),
                    new ActionRowBuilder().addComponents(seriesInput),
                    new ActionRowBuilder().addComponents(movieInput)
                );

                await interaction.showModal(modal);
                return;
            }

            if (interaction.customId.startsWith('movie_accept_')) {
                const userId = interaction.customId.split('_')[2];
                const roleId = client.db.get(`movie_form_role_${interaction.guildId}`);

                await interaction.deferUpdate();
                try {
                    const member = await interaction.guild.members.fetch(userId);
                    let roleNote = '';
                    if (roleId) {
                        try {
                            await member.roles.add(roleId, 'Accepted into Movie Club');
                            roleNote = ` (role <@&${roleId}> assigned)`;
                        } catch (e) {
                            console.error('[MOVIE ACCEPT] Failed to add role:', e.message);
                            roleNote = ` (⚠️ failed to assign role — check my permissions and role hierarchy)`;
                        }
                    } else {
                        roleNote = ` (no role configured — use \`/movieformrole\`)`;
                    }
                    await member.send('🎬 Your Movie Club application has been **accepted**! Welcome to the club!').catch(() => {});
                    await interaction.editReply({ content: `✅ <@${userId}> has been accepted into the Movie Club.${roleNote}`, components: [], embeds: interaction.message.embeds });
                } catch (error) {
                    console.error('Error in movie_accept:', error);
                    await interaction.followUp({ content: 'Failed to accept. Member may have left.', flags: 64 });
                }
                return;
            }

            if (interaction.customId.startsWith('movie_deny_')) {
                const userId = interaction.customId.split('_')[2];
                const modal = new ModalBuilder()
                    .setCustomId(`movie_deny_modal_${userId}`)
                    .setTitle('Reject Movie Club Application');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('movie_deny_reason')
                    .setLabel('Reason for rejection')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Tell the applicant why their application was rejected...')
                    .setRequired(true)
                    .setMaxLength(1000);

                modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
                await interaction.showModal(modal);
                return;
            }

            if (interaction.customId === 'verify_start') {
                const userId = interaction.user.id;
                const ownerIds = client.config.OWNER || [];
                if (ownerIds.includes(userId)) {
                    return interaction.reply({ 
                        content: 'Owners do not need to verify!', 
                        flags: 64
                    });
                }
                
                const verifyChannelId = client.db.get(`verify_channel_${interaction.guildId}`);
                if (!verifyChannelId) {
                    return interaction.reply({ 
                        content: 'Verification system is not set up yet! Please ask an admin to use `/verifyforms`.', 
                        flags: 64 
                    });
                }

                const roleId = client.db.get(`verify_role_${interaction.guildId}`);
                
                // Check if user already has the role
                if (roleId && interaction.member.roles.cache.has(roleId)) {
                    return interaction.reply({ 
                        content: 'You are already verified!', 
                        flags: 64 
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
                        flags: 64 
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
                if (!roleId) return interaction.reply({ content: 'Verification role not set!', flags: 64 });

                await interaction.deferUpdate();

                try {
                    const member = await interaction.guild.members.fetch(userId);
                    await member.roles.add(roleId);

                    // DM the user: accepted + ask for IGN
                    const dmChannel = await member.user.createDM().catch(() => null);
                    if (dmChannel) {
                        await dmChannel.send(
                            '✅ **Congratulations! Your verification has been accepted!** Welcome to the server.\n\n' +
                            '📝 Please reply to **this message** with your **IGN (in-game name)** to set it up.'
                        ).catch(() => {});
                        // Track that we're waiting for this user's IGN
                        if (!client.pendingIgn) client.pendingIgn = new Map();
                        client.pendingIgn.set(userId, { guildId: interaction.guildId });
                    }

                    await interaction.editReply({ content: `✅ User <@${userId}> accepted. DM sent asking for their IGN.`, components: [], embeds: interaction.message.embeds });
                } catch (error) {
                    console.error('Error in verify_accept:', error);
                    await interaction.followUp({ content: 'Failed to accept verification. Member might have left.', flags: 64 });
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
            if (interaction.customId === 'movie_join_modal') {
                await interaction.deferReply({ flags: 64 });

                const why = interaction.fields.getTextInputValue('movie_why');
                const series = interaction.fields.getTextInputValue('movie_series') || 'None';
                const movies = interaction.fields.getTextInputValue('movie_suggestions') || 'None';

                const channelId = client.db.get(`movie_forms_channel_${interaction.guildId}`);
                if (!channelId) {
                    return interaction.editReply({ content: '❌ Movie club applications channel is not set up yet. Ask an admin to use `/movieforms`.' });
                }

                const channel = interaction.guild.channels.cache.get(channelId);
                if (!channel) {
                    return interaction.editReply({ content: '❌ Application channel not found. Please contact an admin.' });
                }

                // Save cooldown timestamp
                client.db.set(`movie_apply_${interaction.user.id}`, Date.now());

                const embed = new EmbedBuilder()
                    .setTitle('📋 New Movie Club Application')
                    .addFields(
                        { name: '👤 Applicant', value: `${interaction.user.username} (<@${interaction.user.id}>)`, inline: false },
                        { name: '🎬 Why they want to join', value: why, inline: false },
                        { name: '🔵 Series Suggestions', value: series, inline: true },
                        { name: '🎬 Movie Suggestions', value: movies, inline: true }
                    )
                    .setColor(0x5865F2)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`movie_accept_${interaction.user.id}`).setLabel('Accept').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`movie_deny_${interaction.user.id}`).setLabel('Reject').setStyle(ButtonStyle.Danger)
                );

                // Ping owners
                const ownerIds = client.config.OWNER || [];
                const ownerPing = ownerIds.map(id => `<@${id}>`).join(' ');

                await channel.send({ content: `${ownerPing} New application received!`, embeds: [embed], components: [row] });
                await interaction.editReply({ content: '✅ Your application has been submitted! The team will review it shortly.' });
                return;
            }

            if (interaction.customId === 'verify_modal') {
                await interaction.deferReply({ flags: 64 });
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

            if (interaction.customId.startsWith('movie_deny_modal_')) {
                const userId = interaction.customId.split('_')[3];
                const reason = interaction.fields.getTextInputValue('movie_deny_reason');

                await interaction.deferUpdate();

                try {
                    const member = await interaction.guild.members.fetch(userId).catch(() => null);
                    if (member) {
                        await member.send(`❌ Your Movie Club application has been **rejected**.\n\n**Reason:** ${reason}\n\nYou're welcome to apply again in the future.`).catch(() => {});
                    }
                    await interaction.editReply({
                        content: `❌ <@${userId}>'s application has been rejected.\n**Reason:** ${reason}`,
                        components: [],
                        embeds: interaction.message.embeds
                    });
                } catch (error) {
                    console.error('Error in movie_deny_modal:', error);
                    await interaction.followUp({ content: 'Failed to reject. Member may have left.', flags: 64 });
                }
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
                    await interaction.followUp({ content: 'Failed to deny verification. Member might have left.', flags: 64 });
                }
                return;
            }

            if (interaction.customId.startsWith('dm_modal_')) {
                const type = interaction.customId.split('_')[2]; // 'user' or 'role'
                const targetId = interaction.customId.split('_')[3];
                const message = interaction.fields.getTextInputValue('dm_message');

                await interaction.deferReply({ flags: 64 });

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

                await interaction.deferReply({ flags: 64 });

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
                        await interaction.followUp({ content: `Finished sending DMs to ${role.name}. Success: ${successCount}`, flags: 64 });
                    }
                } catch (error) {
                    await interaction.editReply('Error: ' + error.message);
                }
                return;
            }
        }
        
        // ══════════════════════════════════════════════════════════
        //  SUMMERSMP MODULE — Button & Modal Interactions
        // ══════════════════════════════════════════════════════════

        if (interaction.isButton()) {
            // ── /summer verify → Join button ──────────────────────────────────
            if (interaction.customId === 'summer_join') {
                const modal = new ModalBuilder()
                    .setCustomId('summer_join_modal')
                    .setTitle('⚔️ SummerSMP Clan Application');

                const ignInput = new TextInputBuilder()
                    .setCustomId('summer_ign')
                    .setLabel('IGN (In-Game Name)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Your Minecraft username')
                    .setRequired(true);

                const rankInput = new TextInputBuilder()
                    .setCustomId('summer_rank')
                    .setLabel('Rank In Summer')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const tierInput = new TextInputBuilder()
                    .setCustomId('summer_tier')
                    .setLabel('Tier')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const maceInput = new TextInputBuilder()
                    .setCustomId('summer_mace')
                    .setLabel('Do You Have A Mace? (Yes / No)')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Yes or No')
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(ignInput),
                    new ActionRowBuilder().addComponents(rankInput),
                    new ActionRowBuilder().addComponents(tierInput),
                    new ActionRowBuilder().addComponents(maceInput)
                );

                await interaction.showModal(modal);
                return;
            }

            // ── Accept summer application ─────────────────────────────────────
            if (interaction.customId.startsWith('summer_accept_')) {
                if (!interaction.member.permissions.has('ManageRoles')) {
                    return interaction.reply({ content: '❌ You need the **Manage Roles** permission to accept applications.', flags: 64 });
                }
                const userId = interaction.customId.replace('summer_accept_', '');
                const roleId = client.db.get(`summer_role_${interaction.guildId}`);

                await interaction.deferUpdate();
                try {
                    const member = await interaction.guild.members.fetch(userId);
                    let roleNote = '';
                    if (roleId) {
                        try {
                            await member.roles.add(roleId, 'Accepted into SummerSMP');
                            roleNote = ` Role <@&${roleId}> assigned.`;
                        } catch (e) {
                            roleNote = ` ⚠️ Failed to assign role — check bot permissions and role hierarchy.`;
                        }
                    } else {
                        roleNote = ` ⚠️ No member role configured — use \`/summerrole\`.`;
                    }

                    await member.send(
                        '✅ **Congratulations! Your SummerSMP clan application has been ACCEPTED!**\n\n' +
                        'Welcome to the clan! Make sure to read the rules and represent SummerSMP with pride. ⚔️'
                    ).catch(() => {});

                    await interaction.editReply({
                        content: `✅ <@${userId}> has been accepted into SummerSMP.${roleNote}`,
                        components: [],
                        embeds: interaction.message.embeds
                    });
                } catch (error) {
                    console.error('[SUMMER ACCEPT]', error);
                    await interaction.followUp({ content: '❌ Failed to accept. Member may have left the server.', flags: 64 });
                }
                return;
            }

            // ── Reject summer application → ask reason ────────────────────────
            if (interaction.customId.startsWith('summer_reject_')) {
                if (!interaction.member.permissions.has('ManageRoles')) {
                    return interaction.reply({ content: '❌ You need the **Manage Roles** permission to reject applications.', flags: 64 });
                }
                const userId = interaction.customId.replace('summer_reject_', '');
                const modal = new ModalBuilder()
                    .setCustomId(`summer_reject_modal_${userId}`)
                    .setTitle('Reject Application — Provide Reason');

                const reasonInput = new TextInputBuilder()
                    .setCustomId('summer_reject_reason')
                    .setLabel('Reason for rejection')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Explain why this application is being rejected...')
                    .setRequired(true)
                    .setMaxLength(1000);

                modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
                await interaction.showModal(modal);
                return;
            }

            // ── Ticket — Claim button ─────────────────────────────────────────
            if (interaction.customId.startsWith('ticket_claim_')) {
                if (!interaction.member.permissions.has('ManageRoles')) {
                    return interaction.reply({ content: '❌ Only staff can claim tickets.', flags: 64 });
                }
                const channelId = interaction.customId.replace('ticket_claim_', '');
                const ticketData = client.db.get(`ticket_${channelId}`);
                if (!ticketData) return interaction.reply({ content: '❌ Ticket data not found.', flags: 64 });

                if (ticketData.claimedBy) {
                    return interaction.reply({ content: `❌ This ticket is already claimed by <@${ticketData.claimedBy}>.`, flags: 64 });
                }

                ticketData.claimedBy = interaction.user.id;
                client.db.set(`ticket_${channelId}`, ticketData);

                const claimedRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`ticket_claim_${channelId}`)
                        .setLabel(`🙋 Claimed by ${interaction.user.username}`)
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`ticket_close_${channelId}`)
                        .setLabel('🔒 Close')
                        .setStyle(ButtonStyle.Danger)
                );

                await interaction.update({ components: [claimedRow] });
                await interaction.followUp({ content: `✅ <@${interaction.user.id}> has claimed this ticket and will assist you shortly.` });
                return;
            }

            // ── Ticket — Close button → ask for reason via modal ─────────────
            if (interaction.customId.startsWith('ticket_close_')) {
                if (!interaction.member.permissions.has('ManageRoles')) {
                    return interaction.reply({ content: '❌ Only staff can close tickets.', flags: 64 });
                }
                const channelId = interaction.customId.replace('ticket_close_', '');
                const reasonModal = new ModalBuilder()
                    .setCustomId(`ticket_close_modal_${channelId}`)
                    .setTitle('Close Ticket');
                const reasonInput = new TextInputBuilder()
                    .setCustomId('close_reason')
                    .setLabel('Reason for closing')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Explain why this ticket is being closed...')
                    .setRequired(true)
                    .setMaxLength(1000);
                reasonModal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
                await interaction.showModal(reasonModal);
                return;
            }

            // ── Ticket — Report button ────────────────────────────────────────
            if (interaction.customId === 'summer_ticket_report') {
                const modal = new ModalBuilder()
                    .setCustomId('summer_report_modal')
                    .setTitle('⚔️ Report a Teammate');

                const ignInput = new TextInputBuilder()
                    .setCustomId('report_ign')
                    .setLabel('Your IGN')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const killerInput = new TextInputBuilder()
                    .setCustomId('report_killer')
                    .setLabel('Who Killed / Betrayed You?')
                    .setStyle(TextInputStyle.Short)
                    .setPlaceholder('Their IGN or Discord tag')
                    .setRequired(true);

                const proofInput = new TextInputBuilder()
                    .setCustomId('report_proof')
                    .setLabel('Proof (screenshot link / description)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const lostInput = new TextInputBuilder()
                    .setCustomId('report_lost')
                    .setLabel('What Did You Lose?')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Items, gear, resources...')
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(ignInput),
                    new ActionRowBuilder().addComponents(killerInput),
                    new ActionRowBuilder().addComponents(proofInput),
                    new ActionRowBuilder().addComponents(lostInput)
                );

                await interaction.showModal(modal);
                return;
            }

            // ── Ticket — Promotion Request button ────────────────────────────
            if (interaction.customId === 'summer_ticket_promo') {
                const modal = new ModalBuilder()
                    .setCustomId('summer_promo_modal')
                    .setTitle('🏆 Promotion Request');

                const ignInput = new TextInputBuilder()
                    .setCustomId('promo_ign')
                    .setLabel('Your IGN')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const statusInput = new TextInputBuilder()
                    .setCustomId('promo_status')
                    .setLabel('Current Status / Rank')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const roleWantInput = new TextInputBuilder()
                    .setCustomId('promo_role_want')
                    .setLabel('What Role Are You Requesting?')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const whyInput = new TextInputBuilder()
                    .setCustomId('promo_why')
                    .setLabel('Why Do You Deserve This Promotion?')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true);

                const proofInput = new TextInputBuilder()
                    .setCustomId('promo_proof')
                    .setLabel('Proof / Contributions')
                    .setStyle(TextInputStyle.Paragraph)
                    .setPlaceholder('Links, screenshots, achievements...')
                    .setRequired(true);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(ignInput),
                    new ActionRowBuilder().addComponents(statusInput),
                    new ActionRowBuilder().addComponents(roleWantInput),
                    new ActionRowBuilder().addComponents(whyInput),
                    new ActionRowBuilder().addComponents(proofInput)
                );

                await interaction.showModal(modal);
                return;
            }
        }

        if (interaction.isModalSubmit()) {
            // ── Ticket — Close reason submitted ───────────────────────────────
            if (interaction.customId.startsWith('ticket_close_modal_')) {
                const channelId = interaction.customId.replace('ticket_close_modal_', '');
                const reason    = interaction.fields.getTextInputValue('close_reason');
                const ticketData = client.db.get(`ticket_${channelId}`);

                await interaction.deferReply({ flags: 64 });

                // DM the ticket opener
                if (ticketData?.openerUserId) {
                    try {
                        const opener = await interaction.client.users.fetch(ticketData.openerUserId);
                        const dmEmbed = new EmbedBuilder()
                            .setTitle('🔒 Your Ticket Has Been Closed')
                            .setDescription(`Your ticket in **${interaction.guild.name}** has been closed by <@${interaction.user.id}>.`)
                            .addFields({ name: '📋 Reason', value: reason })
                            .setColor(0x888888)
                            .setTimestamp();
                        await opener.send({ embeds: [dmEmbed] }).catch(() => {});
                    } catch (_) {}
                }

                // Lock the channel — remove opener's send permission
                if (ticketData?.openerUserId) {
                    await interaction.channel.permissionOverwrites.edit(ticketData.openerUserId, {
                        SendMessages: false
                    }).catch(() => {});
                }

                // Rename to closed-*
                const currentName = interaction.channel.name.replace(/^closed-/, '');
                await interaction.channel.setName(`closed-${currentName}`).catch(() => {});

                // Post closure notice in channel
                const closedEmbed = new EmbedBuilder()
                    .setTitle('🔒 Ticket Closed')
                    .addFields(
                        { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Reason',    value: reason,                       inline: false }
                    )
                    .setColor(0x888888)
                    .setTimestamp();
                await interaction.channel.send({ embeds: [closedEmbed] }).catch(() => {});

                // Log to summer logs
                const logsChannelId = client.db.get(`summer_logs_channel_${interaction.guildId}`);
                if (logsChannelId) {
                    const logsChannel = interaction.guild.channels.cache.get(logsChannelId);
                    if (logsChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setTitle('🔒 Ticket Closed')
                            .addFields(
                                { name: 'Type',       value: ticketData?.type === 'report' ? '⚔️ Report' : '🏆 Promotion', inline: true },
                                { name: 'Opener',     value: ticketData?.openerUserId ? `<@${ticketData.openerUserId}>` : 'Unknown', inline: true },
                                { name: 'Closed By',  value: `<@${interaction.user.id}>`,  inline: true },
                                { name: 'Claimed By', value: ticketData?.claimedBy ? `<@${ticketData.claimedBy}>` : 'Unclaimed', inline: true },
                                { name: 'Reason',     value: reason, inline: false }
                            )
                            .setColor(0x888888)
                            .setTimestamp();
                        logsChannel.send({ embeds: [logEmbed] }).catch(() => {});
                    }
                }

                // Mark ticket as closed in DB (keep it, don't delete)
                if (ticketData) {
                    ticketData.closed   = true;
                    ticketData.closedBy = interaction.user.id;
                    ticketData.reason   = reason;
                    client.db.set(`ticket_${channelId}`, ticketData);
                }

                await interaction.editReply({ content: '✅ Ticket closed. The channel has been locked and the opener has been notified.' });
                return;
            }

            // ── Summer join modal submitted ───────────────────────────────────
            if (interaction.customId === 'summer_join_modal') {
                await interaction.deferReply({ flags: 64 });

                const ign   = interaction.fields.getTextInputValue('summer_ign');
                const rank  = interaction.fields.getTextInputValue('summer_rank');
                const tier  = interaction.fields.getTextInputValue('summer_tier');
                const mace  = interaction.fields.getTextInputValue('summer_mace');

                const formChannelId = client.db.get(`summer_form_channel_${interaction.guildId}`);
                if (!formChannelId) {
                    return interaction.editReply({ content: '❌ Applications channel is not set up yet. Ask an admin to use `/summerform`.' });
                }
                const formChannel = interaction.guild.channels.cache.get(formChannelId);
                if (!formChannel) {
                    return interaction.editReply({ content: '❌ Applications channel not found. Please contact an admin.' });
                }

                const embed = new EmbedBuilder()
                    .setTitle('⚔️ New SummerSMP Clan Application')
                    .addFields(
                        { name: '👤 Applicant',      value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: false },
                        { name: '🎮 IGN',             value: ign,  inline: true },
                        { name: '🏅 Rank In Summer',  value: rank, inline: true },
                        { name: '⭐ Tier',            value: tier, inline: true },
                        { name: '🪓 Has a Mace?',     value: mace, inline: true }
                    )
                    .setColor(0xFFAA00)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`summer_accept_${interaction.user.id}`)
                        .setLabel('✅ Accept')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`summer_reject_${interaction.user.id}`)
                        .setLabel('❌ Reject')
                        .setStyle(ButtonStyle.Danger)
                );

                await formChannel.send({ embeds: [embed], components: [row] });
                await interaction.editReply({ content: '✅ Your application has been submitted! The staff team will review it shortly. Good luck! ⚔️' });
                return;
            }

            // ── Summer reject reason modal ────────────────────────────────────
            if (interaction.customId.startsWith('summer_reject_modal_')) {
                const userId = interaction.customId.replace('summer_reject_modal_', '');
                const reason = interaction.fields.getTextInputValue('summer_reject_reason');

                await interaction.deferUpdate();
                try {
                    const member = await interaction.guild.members.fetch(userId).catch(() => null);
                    if (member) {
                        await member.send(
                            '❌ **Your SummerSMP clan application has been rejected.**\n\n' +
                            `**Reason:** ${reason}\n\n` +
                            'You\'re welcome to improve and apply again in the future. Best of luck! 🙏'
                        ).catch(() => {});
                    }
                    await interaction.editReply({
                        content: `❌ <@${userId}>'s application has been rejected.\n**Reason:** ${reason}`,
                        components: [],
                        embeds: interaction.message.embeds
                    });
                } catch (error) {
                    console.error('[SUMMER REJECT]', error);
                    await interaction.followUp({ content: '❌ Failed to reject. Member may have left.', flags: 64 });
                }
                return;
            }

            // ── Summer report ticket submitted → create private channel ──────
            if (interaction.customId === 'summer_report_modal') {
                await interaction.deferReply({ flags: 64 });

                const ign    = interaction.fields.getTextInputValue('report_ign');
                const killer = interaction.fields.getTextInputValue('report_killer');
                const proof  = interaction.fields.getTextInputValue('report_proof');
                const lost   = interaction.fields.getTextInputValue('report_lost');

                const categoryId = client.db.get(`summer_ticket_category_${interaction.guildId}`);
                const safeName   = (interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user').slice(0, 20);

                let ticketChannel;
                try {
                    ticketChannel = await interaction.guild.channels.create({
                        name: `report-${safeName}`,
                        type: ChannelType.GuildText,
                        parent: categoryId || null,
                        permissionOverwrites: [
                            { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                            { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageChannels] }
                        ]
                    });
                } catch (e) {
                    console.error('[TICKET CREATE]', e);
                    return interaction.editReply({ content: '❌ Failed to create ticket channel. Check my permissions.' });
                }

                client.db.set(`ticket_${ticketChannel.id}`, {
                    type: 'report',
                    openerUserId: interaction.user.id,
                    claimedBy: null,
                    guildId: interaction.guildId
                });

                const embed = new EmbedBuilder()
                    .setTitle('⚔️ Teammate Report')
                    .setDescription(`Ticket opened by <@${interaction.user.id}>`)
                    .addFields(
                        { name: '🎮 IGN',              value: ign,    inline: true },
                        { name: '⚠️ Reported Player',  value: killer, inline: true },
                        { name: '📦 What Was Lost',    value: lost,   inline: false },
                        { name: '📸 Proof',            value: proof,  inline: false }
                    )
                    .setColor(0xFF4444)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();

                const controlRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`ticket_claim_${ticketChannel.id}`).setLabel('🙋 Claim').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`ticket_close_${ticketChannel.id}`).setLabel('🔒 Close').setStyle(ButtonStyle.Danger)
                );

                const pingUserId = client.db.get(`summer_ticket_ping_${interaction.guildId}`);
                const pingContent = pingUserId
                    ? `<@${interaction.user.id}> — Your report ticket has been created. Staff will assist you shortly.\n📣 <@${pingUserId}>`
                    : `<@${interaction.user.id}> — Your report ticket has been created. Staff will assist you shortly.`;

                await ticketChannel.send({ content: pingContent, embeds: [embed], components: [controlRow] });
                await interaction.editReply({ content: `✅ Your report ticket has been created: ${ticketChannel}` });

                // Log
                const logsChannelId = client.db.get(`summer_logs_channel_${interaction.guildId}`);
                if (logsChannelId) {
                    const logsChannel = interaction.guild.channels.cache.get(logsChannelId);
                    if (logsChannel) {
                        logsChannel.send({ embeds: [new EmbedBuilder().setTitle('🎫 Ticket Opened — Report').addFields({ name: 'Opener', value: `<@${interaction.user.id}>`, inline: true }, { name: 'Channel', value: `${ticketChannel}`, inline: true }).setColor(0xFF4444).setTimestamp()] }).catch(() => {});
                    }
                }
                return;
            }

            // ── Summer promo ticket submitted → create private channel ────────
            if (interaction.customId === 'summer_promo_modal') {
                await interaction.deferReply({ flags: 64 });

                const ign      = interaction.fields.getTextInputValue('promo_ign');
                const status   = interaction.fields.getTextInputValue('promo_status');
                const roleWant = interaction.fields.getTextInputValue('promo_role_want');
                const why      = interaction.fields.getTextInputValue('promo_why');
                const proof    = interaction.fields.getTextInputValue('promo_proof');

                const categoryId = client.db.get(`summer_ticket_category_${interaction.guildId}`);
                const safeName   = (interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '') || 'user').slice(0, 20);

                let ticketChannel;
                try {
                    ticketChannel = await interaction.guild.channels.create({
                        name: `promo-${safeName}`,
                        type: ChannelType.GuildText,
                        parent: categoryId || null,
                        permissionOverwrites: [
                            { id: interaction.guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                            { id: client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageChannels] }
                        ]
                    });
                } catch (e) {
                    console.error('[TICKET CREATE]', e);
                    return interaction.editReply({ content: '❌ Failed to create ticket channel. Check my permissions.' });
                }

                client.db.set(`ticket_${ticketChannel.id}`, {
                    type: 'promo',
                    openerUserId: interaction.user.id,
                    claimedBy: null,
                    guildId: interaction.guildId
                });

                const embed = new EmbedBuilder()
                    .setTitle('🏆 Promotion Request')
                    .setDescription(`Ticket opened by <@${interaction.user.id}>`)
                    .addFields(
                        { name: '🎮 IGN',             value: ign,      inline: true },
                        { name: '📊 Current Status',  value: status,   inline: true },
                        { name: '🎖️ Requesting Role', value: roleWant, inline: true },
                        { name: '💬 Why?',            value: why,      inline: false },
                        { name: '📸 Proof',           value: proof,    inline: false }
                    )
                    .setColor(0xFFAA00)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();

                const controlRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`ticket_claim_${ticketChannel.id}`).setLabel('🙋 Claim').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`ticket_close_${ticketChannel.id}`).setLabel('🔒 Close').setStyle(ButtonStyle.Danger)
                );

                const pingUserId = client.db.get(`summer_ticket_ping_${interaction.guildId}`);
                const pingContent = pingUserId
                    ? `<@${interaction.user.id}> — Your promotion request ticket has been created. Staff will review it shortly.\n📣 <@${pingUserId}>`
                    : `<@${interaction.user.id}> — Your promotion request ticket has been created. Staff will review it shortly.`;

                await ticketChannel.send({ content: pingContent, embeds: [embed], components: [controlRow] });
                await interaction.editReply({ content: `✅ Your promotion request ticket has been created: ${ticketChannel}` });

                // Log
                const logsChannelId = client.db.get(`summer_logs_channel_${interaction.guildId}`);
                if (logsChannelId) {
                    const logsChannel = interaction.guild.channels.cache.get(logsChannelId);
                    if (logsChannel) {
                        logsChannel.send({ embeds: [new EmbedBuilder().setTitle('🎫 Ticket Opened — Promotion').addFields({ name: 'Opener', value: `<@${interaction.user.id}>`, inline: true }, { name: 'Channel', value: `${ticketChannel}`, inline: true }).setColor(0xFFAA00).setTimestamp()] }).catch(() => {});
                    }
                }
                return;
            }
        }

        // ══════════════════════════════════════════════════════════
        //  END SUMMERSMP MODULE
        // ══════════════════════════════════════════════════════════

        if (!interaction.isChatInputCommand()) return;

        const command = client.slashCommands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`[COMMAND ERROR] Error in ${interaction.commandName}:`, error);
            const errorMessage = { content: '⚠️ An error occurred while executing this command.', flags: 64 };
            
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
