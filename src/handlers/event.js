const fs = require('fs');
const colors = require('colors');

module.exports = (client) => {
    console.log("----------------------------------------".yellow);

    const eventFolders = fs.readdirSync('./src/events/');
    for (const folder of eventFolders) {
        const folderPath = `./src/events/${folder}`;
        if (!fs.lstatSync(folderPath).isDirectory()) continue;

        const eventFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            try {
                const pull = require(`../events/${folder}/${file}`);
                if (pull.name && typeof pull.execute === 'function') {
                    const execute = (...args) => pull.execute(...args, client);
                    client.events.set(pull.name, pull);
                    if (pull.once) {
                        client.once(pull.name, execute);
                    } else {
                        client.on(pull.name, execute);
                    }
                    console.log(`[HANDLER - EVENTS] Loaded a file : ${pull.name}`.green);
                } else if (pull.name || pull.execute) {
                    console.log("\n" + "----------------------------------------".red);
                    console.log(`[HANDLER - EVENTS] Couldn't load the file ${file}, missing name or execute function`.red.bold);
                    console.log("----------------------------------------".red);
                }
                // Files with neither name nor execute are silently skipped (stub files)
            } catch (err) {
                console.error(`[HANDLER - EVENTS] Error loading ${folder}/${file}: ${err.message}`.red.bold);
            }
        }
    }
    console.log("----------------------------------------".yellow);
};