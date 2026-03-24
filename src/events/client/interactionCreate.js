const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const { stripIndent } = require('common-tags');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (interaction.isButton()) {
            if (interaction.customId === 'rule') {
                try {
                    const server = require('../../config/server.json');
                    const rulesText = require('../../config/rules');
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel('Accept').setStyle(ButtonStyle.Success).setCustomId('accept'),
                        new ButtonBuilder().setLabel('Discord Terms & Service').setStyle(ButtonStyle.Link).setURL('https://discord.com/terms'),
                        new ButtonBuilder().setLabel('Discord Community Guidelines').setStyle(ButtonStyle.Link).setURL('https://discord.com/guidelines')
                    );
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `${interaction.guild?.name}'s Discord Rules` })
                        .setDescription(stripIndent`${rulesText}`)
                        .setColor('#2F3136');
                    if (server?.images?.rulesImage) embed.setImage(server.images.rulesImage);
                    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
                } catch (e) { console.error('[RULES] Error showing rules:', e); return; }
            }

            if (interaction.customId === 'accept') {
                await interaction.reply({ content: '✅ You have accepted the rules! Welcome to the server!', ephemeral: true });
                const roleId = '1438519984602218546';
                const role = interaction.guild.roles.cache.get(roleId);
                const member = interaction.guild.members.cache.get(interaction.user.id);
                if (role && member) {
                    try { await member.roles.add(role); console.log(`✅ Added role ${role.name} to ${member.user.tag}`); }
                    catch (err) { console.error('❌ Failed to add role:', err); }
                } else { console.log('⚠️ Role or member not found!'); }
                return;
            }

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
        
        // ── Movie Club Application System ──────────────────────────────────────
        if (interaction.isButton() && interaction.customId === 'join_movie_form') {
            try {
                const cooldownKey = `movie_form_cooldown_${interaction.user.id}_${interaction.guild.id}`;
                const last = client.db.get(cooldownKey);
                const twelveHours = 12 * 60 * 60 * 1000;
                if (last && Date.now() - last < twelveHours) {
                    const remaining = Math.ceil((twelveHours - (Date.now() - last)) / 3600000);
                    return interaction.reply({ content: `⏳ You already submitted an application recently. Please wait **${remaining}h** before applying again.`, flags: 64 });
                }

                const modal = new ModalBuilder()
                    .setCustomId('movie_join_modal')
                    .setTitle('🎬 Movie Club Application');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('join_reason')
                            .setLabel('Why do you want to join?')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                            .setMaxLength(500)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('series1').setLabel('Series Suggestion 1').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Breaking Bad')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('series2345').setLabel('Series Suggestions 2–5 (one per line)').setStyle(TextInputStyle.Paragraph).setRequired(false).setPlaceholder('Dark\nShogun\nChernobyl\nBand of Brothers')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('movie1').setLabel('Movie Suggestion 1').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('e.g. Inception')
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('movie2345').setLabel('Movie Suggestions 2–5 (one per line)').setStyle(TextInputStyle.Paragraph).setRequired(false).setPlaceholder('Parasite\nInterstellar\nThe Godfather\n1917')
                    )
                );

                return interaction.showModal(modal);
            } catch (e) {
                console.error('[MOVIE FORM] Button error:', e);
                return interaction.reply({ content: '❌ Something went wrong. Please try again.', flags: 64 }).catch(() => {});
            }
        }

        if (interaction.isModalSubmit() && interaction.customId === 'movie_join_modal') {
            await interaction.deferReply({ flags: 64 });
            try {
                const formsChannelId = client.db.get(`movie_forms_channel_${interaction.guild.id}`);
                if (!formsChannelId) return interaction.editReply({ content: '❌ No forms channel set. Ask an admin to use `/movieforms`.' });

                const formsChannel = interaction.guild.channels.cache.get(formsChannelId);
                if (!formsChannel) return interaction.editReply({ content: '❌ Forms channel not found.' });

                const joinReason = interaction.fields.getTextInputValue('join_reason');
                const series1 = interaction.fields.getTextInputValue('series1').trim();
                const series2345Raw = interaction.fields.getTextInputValue('series2345') || '';
                const movie1 = interaction.fields.getTextInputValue('movie1').trim();
                const movie2345Raw = interaction.fields.getTextInputValue('movie2345') || '';

                // Parse all series & movies
                const seriesList = [series1, ...series2345Raw.split('\n').map(s => s.trim()).filter(Boolean)].slice(0, 5);
                const movieList = [movie1, ...movie2345Raw.split('\n').map(m => m.trim()).filter(Boolean)].slice(0, 5);

                // Save to wishlist
                const wishlistKey = `wishlist_${interaction.guild.id}`;
                const wishlist = client.db.get(wishlistKey) || [];
                wishlist.push({
                    userId: interaction.user.id,
                    userTag: interaction.user.tag,
                    series: seriesList,
                    movies: movieList,
                    submittedAt: Date.now()
                });
                client.db.set(wishlistKey, wishlist);

                const seriesDisplay = seriesList.map((s, i) => `**${i + 1}.** ${s}`).join('\n') || 'None';
                const movieDisplay = movieList.map((m, i) => `**${i + 1}.** ${m}`).join('\n') || 'None';

                const embed = new EmbedBuilder()
                    .setTitle('📋 New Movie Club Application')
                    .addFields(
                        { name: '👤 Applicant', value: `${interaction.user.tag} (<@${interaction.user.id}>)` },
                        { name: '🎬 Why they want to join', value: joinReason },
                        { name: '📺 Series Suggestions', value: seriesDisplay, inline: true },
                        { name: '🎥 Movie Suggestions', value: movieDisplay, inline: true }
                    )
                    .setColor(0xe63946)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`movie_accept_${interaction.user.id}`).setLabel('✅ Accept').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(`movie_reject_${interaction.user.id}`).setLabel('❌ Reject').setStyle(ButtonStyle.Danger)
                );

                await formsChannel.send({ content: `📬 New application from <@${interaction.user.id}>!`, embeds: [embed], components: [row] });

                client.db.set(`movie_form_cooldown_${interaction.user.id}_${interaction.guild.id}`, Date.now());

                return interaction.editReply({ content: '✅ Your application has been submitted! You\'ll receive a DM with the result.\n\n💾 Your suggestions have also been saved to the wishlist.' });
            } catch (err) {
                console.error('[MOVIE FORM] Modal submit error:', err);
                return interaction.editReply({ content: '❌ Something went wrong processing your application. Please try again.' }).catch(() => {});
            }
        }

        if (interaction.isButton() && interaction.customId.startsWith('movie_accept_')) {
            const userId = interaction.customId.replace('movie_accept_', '');
            const roleId = client.db.get(`movie_form_role_${interaction.guild.id}`);

            await interaction.deferUpdate();

            try {
                const member = await interaction.guild.members.fetch(userId);
                if (roleId) {
                    const role = interaction.guild.roles.cache.get(roleId);
                    if (role) await member.roles.add(role);
                }
                await member.send(`🎉 Congratulations! Your Movie Club application in **${interaction.guild.name}** has been **accepted**! Welcome aboard! 🍿`).catch(() => {});

                const { EmbedBuilder: EB2 } = require('discord.js');
                const accepted = new EB2()
                    .setDescription(interaction.message.embeds[0]?.description || '')
                    .setFields(...(interaction.message.embeds[0]?.fields || []))
                    .setColor(0x2ecc71)
                    .setTitle('✅ Application Accepted')
                    .setFooter({ text: `Accepted by ${interaction.user.tag}` })
                    .setTimestamp();

                await interaction.editReply({ content: `✅ <@${userId}> has been accepted into the Movie Club!`, embeds: [accepted], components: [] });
            } catch (err) {
                console.error('[MOVIE FORM] Accept error:', err);
                await interaction.followUp({ content: '❌ Failed to accept. The user may have left the server.', flags: 64 });
            }
            return;
        }

        if (interaction.isButton() && interaction.customId.startsWith('movie_reject_')) {
            const userId = interaction.customId.replace('movie_reject_', '');

            await interaction.deferUpdate();

            try {
                const user = await client.users.fetch(userId);
                await user.send(`❌ Your Movie Club application in **${interaction.guild.name}** was **not accepted** this time. You may apply again in 12 hours.`).catch(() => {});

                const { EmbedBuilder: EB3 } = require('discord.js');
                const rejected = new EB3()
                    .setDescription(interaction.message.embeds[0]?.description || '')
                    .setFields(...(interaction.message.embeds[0]?.fields || []))
                    .setColor(0xe74c3c)
                    .setTitle('❌ Application Rejected')
                    .setFooter({ text: `Rejected by ${interaction.user.tag}` })
                    .setTimestamp();

                await interaction.editReply({ content: `❌ <@${userId}>'s application was rejected.`, embeds: [rejected], components: [] });
            } catch (err) {
                console.error('[MOVIE FORM] Reject error:', err);
                await interaction.followUp({ content: '❌ Failed to reject. The user may have left the server.', flags: 64 });
            }
            return;
        }
        // ── End Movie Club Application System ──────────────────────────────────

        if (!interaction.isChatInputCommand()) return;

        const command = client.slashCommands.get(interaction.commandName);
        if (!command) return;

        // Safety-net: if the command hasn't acknowledged within 2s, auto-defer.
        // This prevents "Application did not respond" on slow Render REST connections
        // while preserving normal fast-path behaviour for quick commands.
        let autoDeferFired = false;
        const autoDeferTimer = setTimeout(async () => {
            if (interaction.replied || interaction.deferred) return;
            autoDeferFired = true;
            try {
                await interaction.deferReply();
                // Redirect interaction.reply() → editReply() for the remainder of execute()
                const _origReply = interaction.reply.bind(interaction);
                interaction.reply = async (opts) => {
                    if (interaction.deferred && !interaction.replied) {
                        const clean = typeof opts === 'string' ? { content: opts } : { ...opts };
                        delete clean.ephemeral;
                        delete clean.flags;
                        return interaction.editReply(clean);
                    }
                    return _origReply(opts);
                };
                // Silence double-deferReply() calls from commands that already defer
                const _origDefer = interaction.deferReply.bind(interaction);
                interaction.deferReply = async (opts) => {
                    if (interaction.deferred) return null;
                    return _origDefer(opts);
                };
            } catch (e) {
                if (e.code !== 10062) console.error('[AUTO-DEFER] failed:', e.message);
            }
        }, 2000);

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`[COMMAND ERROR] Error in ${interaction.commandName}:`, error);
            const errorMessage = { content: '⚠️ An error occurred while executing this command.' };
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
        } finally {
            clearTimeout(autoDeferTimer);
        }
    }
};