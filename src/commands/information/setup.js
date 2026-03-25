const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Client, Message } = require('discord.js');
const server = require("../../config/server.json")

module.exports = {
  name: "setup",
  aliases: ["s"],
  ownerOnly: true,
  /**
   * 
   * @param {Client} client 
   * @param {Message} message 
   */
  run: async (client, message, args) => {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('rule')
          .setLabel('View Rules')
          .setStyle(ButtonStyle.Success)
          .setEmoji("📖"),

       
      ) 
     const embed = new EmbedBuilder()
      .setAuthor({ name: `Welcome to ${message.guild.name}` })
      .setDescription(`✦・**Welcome!**・✦

:compass: Make Sure to Read the Rules! ‹3


₊˚:globe_with_meridians: Get verfied at <#1224003744966901782> 


— ୨\🎀୧ Be very welcome! ✦ 

₊˚ʚ :partying_face: ɞ *Hope you like our server!

**Read the rules to avoid punishment**

︶꒷꒥꒷ ‧₊˚ Thanks for joining! :)`)
      .setImage('https://images-ext-1.discordapp.net/external/djDXHiq84o-ekukhtJK7hu6Aav0DbjDejXBmgoRMe8o/https/media.tenor.com/96sQtTGIsPQAAAPo/simpsons-homer.mp4')
      .setColor(`#2f3136`)
    message.channel.send({
      embeds: [embed],
      components: [row]
    })
  }
}