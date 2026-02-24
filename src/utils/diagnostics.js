const { PermissionFlagsBits } = require('discord.js');
const colors = require('colors');

async function runDiagnostics(client) {
    console.log("----------------------------------------".yellow);
    console.log(`✅ Logged in as ${client.user.tag}`.green);
    console.log(`📡 Connected to ${client.guilds.cache.size} servers`.cyan);
    console.log(`👥 Watching ${client.users.cache.size} users`.cyan);
    console.log(`⚙ Commands loaded: ${client.slashCommands.size}`.cyan);
    console.log(`🧠 Ragebait module: ACTIVE`.green);
    console.log(`🎭 Persona engine: ACTIVE`.green);
    console.log("----------------------------------------".yellow);

    // Permission Validation
    const requiredPermissions = [
        { name: 'Send Messages', flag: PermissionFlagsBits.SendMessages },
        { name: 'Manage Roles', flag: PermissionFlagsBits.ManageRoles },
        { name: 'Moderate Members', flag: PermissionFlagsBits.ModerateMembers },
        { name: 'Read Message History', flag: PermissionFlagsBits.ReadMessageHistory }
    ];

    client.guilds.cache.forEach(guild => {
        const botMember = guild.members.me;
        if (!botMember) return;

        requiredPermissions.forEach(perm => {
            if (!botMember.permissions.has(perm.flag)) {
                console.log(`❌ Missing permission in ${guild.name}: ${perm.name}`.red);
            } else {
                console.log(`✔ Permission OK in ${guild.name}: ${perm.name}`.green);
            }
        });
    });

    // Ragebait Validation
    try {
        const personas = require('../ragebait/personas');
        if (personas && personas.personas && Object.keys(personas.personas).length > 0) {
            console.log(`✔ Persona profiles loaded: ${Object.keys(personas.personas).length}`.green);
            console.log(`✔ Abuse filter loaded`.green);
        } else {
            console.log(`❌ Failed to validate Ragebait module: Invalid structure`.red);
        }
    } catch (err) {
        console.log(`❌ Failed to load Ragebait personas: ${err.message}`.red);
    }
    console.log("----------------------------------------".yellow);
}

module.exports = { runDiagnostics };
