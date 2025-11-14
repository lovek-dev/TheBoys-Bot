const { ActivityType } = require('discord.js');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}!`);
    console.log(`🤖 Bot is ready and serving ${client.guilds.cache.size} servers!`);
    
    client.user.setActivity('music with /play', { type: ActivityType.Listening });
  },
};
