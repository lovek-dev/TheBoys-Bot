const fs = require('fs');
const colors = require('colors');

module.exports = (client) => {
    console.log("----------------------------------------".yellow);

    fs.readdirSync('./src/events/').forEach(dir => {
        const eventFiles = fs.readdirSync(`./src/events/${dir}`).filter(file => file.endsWith('.js'));
        for (let file of eventFiles) {
            let pull = require(`../events/${dir}/${file}`);
            if (pull.name) {
                const execute = (...args) => pull.execute(...args, client);
                client.events.set(pull.name, pull);
                
                if (pull.once) {
                    client.once(pull.name, execute);
                } else {
                    client.on(pull.name, execute);
                }
                
                console.log(`[HANDLER - EVENTS] Loaded a file : ${pull.name}`.green)
            } else {
                console.log("\n" + "----------------------------------------".red)
                console.log(`[HANDLER - EVENTS] Couldn't load the file ${file}, missing name`.red.bold)
                console.log("----------------------------------------".red)
                continue;
            }
        }
    })
    console.log("----------------------------------------".yellow);
}