const fs = require('fs');
const path = require('path');
const colors = require('colors');

module.exports = (client) => {
    console.log("----------------------------------------".yellow);

    const commandsPath = path.join(__dirname, '../commands');

    let dirs;
    try {
        dirs = fs.readdirSync(commandsPath);
    } catch (err) {
        console.error(`[HANDLER - COMMAND] Failed to read commands directory: ${err.message}`.red.bold);
        return;
    }

    dirs.forEach(dir => {
        let commands;
        try {
            commands = fs.readdirSync(path.join(commandsPath, dir)).filter(file => file.endsWith('.js'));
        } catch (err) {
            console.error(`[HANDLER - COMMAND] Failed to read folder ${dir}: ${err.message}`.red.bold);
            return;
        }

        for (let file of commands) {
            try {
                let pull = require(path.join(commandsPath, dir, file));
                if (pull.name) {
                    client.commands.set(pull.name, pull);
                    console.log(`[HANDLER - COMMAND] Loaded a file : ${pull.name}`.green);
                } else {
                    console.log("\n" + "----------------------------------------".red);
                    console.log(`[HANDLER - COMMAND] Couldn't load the file ${file}, missing module name value.`.red.bold);
                    console.log("----------------------------------------".red);
                }

                if (pull.aliases && Array.isArray(pull.aliases)) {
                    pull.aliases.forEach(alias => client.aliases.set(alias, pull.name));
                }
            } catch (err) {
                console.error(`[HANDLER - COMMAND] Error loading ${dir}/${file}: ${err.message}`.red.bold);
            }
        }
    });
}
