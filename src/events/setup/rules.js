const { ButtonBuilder } = require("@discordjs/builders");
const { stripIndent } = require("common-tags");
const { EmbedBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const server = require("../../config/server.json");
const rules = require("../../config/rules");

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        if (!interaction.channel?.isTextBased?.()) return;

        // 🟢 When user clicks the "rule" button
        if (interaction.customId === 'rule') {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Accept')
                        .setStyle(ButtonStyle.Success)
                        .setCustomId('accept'),

                    new ButtonBuilder()
                        .setLabel('Discord Terms & Service')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.com/terms'),

                    new ButtonBuilder()
                        .setLabel('Discord Community Guidelines')
                        .setStyle(ButtonStyle.Link)
                        .setURL('https://discord.com/guidelines')
                );

            const embed = new EmbedBuilder()
                .setAuthor({ name: `${interaction.guild?.name}'s Discord Rules` })
                .setDescription(stripIndent`${rules}`)
                .setColor('#2F3136');

            if (server?.images?.rulesImage) {
                embed.setImage(server.images.rulesImage);
            }

            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });
        }

        // 🟣 When user clicks the "Accept" button
        else if (interaction.customId === 'accept') {
            await interaction.reply({
                content: "✅ You have accepted the rules! Welcome to the server!",
                ephemeral: true
            });

            // 🔥 ROLE ASSIGN SECTION 🔥
            const roleId = "1438519984602218546"; // ← replace with your real role ID
            const role = interaction.guild.roles.cache.get(roleId);
            const member = interaction.guild.members.cache.get(interaction.user.id);

            if (role && member) {
                try {
                    await member.roles.add(role);
                    console.log(`✅ Added role ${role.name} to ${member.user.tag}`);
                } catch (err) {
                    console.error(`❌ Failed to add role:`, err);
                }
            } else {
                console.log("⚠️ Role or member not found!");
            }
        }
    }
};