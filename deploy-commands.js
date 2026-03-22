// Run this script to manually register all slash commands to your guilds:
//   node deploy-commands.js

const { REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1438868417372356659';
const TARGET_GUILDS = ['1190999620818567220', '1485325427361845288'];

if (!TOKEN) {
    console.error('❌ TOKEN environment variable is not set.');
    process.exit(1);
}

const commands = [];
const slashCommandsPath = path.join(__dirname, 'src', 'slashcommands');
const files = fs.readdirSync(slashCommandsPath).filter(f => f.endsWith('.js'));

for (const file of files) {
    const command = require(path.join(slashCommandsPath, file));
    if ('data' in command) {
        commands.push(command.data.toJSON());
        console.log(`  Loaded: ${command.data.name}`);
    }
}

console.log(`\nPreparing to register ${commands.length} commands to ${TARGET_GUILDS.length} guilds...\n`);

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        // Clear global commands first
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
        console.log('✅ Cleared global commands\n');

        for (const guildId of TARGET_GUILDS) {
            const data = await rest.put(
                Routes.applicationGuildCommands(CLIENT_ID, guildId),
                { body: commands }
            );
            console.log(`✅ Registered ${data.length} commands in guild ${guildId}`);
        }

        console.log('\n🎉 All done! Commands should appear in Discord within a few seconds.');
    } catch (err) {
        console.error('❌ Registration failed:', err.message);
        if (err.code === 50001) console.error('   → Bot is not a member of that guild, or missing applications.commands scope.');
        if (err.code === 0) console.error('   → Invalid token or network error.');
    }
})();
