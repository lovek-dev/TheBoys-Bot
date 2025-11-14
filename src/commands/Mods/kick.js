const discord = module.require("discord.js");

const { EmbedBuilder } = require("discord.js");

module.exports = {

  name: "kick",

  category: "moderation",

  description: "Kick anyone with one shot xD",

  usage: "kick <@user> <reason>",

  userPerms: ["KickMembers"],

  botPerms: ["EmbedLinks", "KickMembers"],

  run: async (client, message, args) => {

    let target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!target) {

      return message.channel.send(

        `**${message.author.username}**, Please mention the person who you want to kick`

      );

    }

    if (target.id === message.guild.ownerId) {

      return message.channel.send("You cannot kick the Server Owner");

    }

    if (target.id === message.author.id) {

      return message.channel.send(

        `**${message.author.username}**, You can not kick yourself`

      );

    }

    if (target.roles.highest.position >= message.member.roles.highest.position) {
      return message.channel.send("You cannot kick someone with a higher or equal role than yours!");
    }

    if (target.roles.highest.position >= message.guild.members.me.roles.highest.position) {
      return message.channel.send("I cannot kick someone with a higher or equal role than mine!");
    }

    if (!target.kickable) {
      return message.channel.send("I cannot kick this user! They may have a higher role than me or I'm missing permissions.");
    }

    let reason = args.slice(1).join(" ");

    if (!reason) reason = "-";

    try {
      await target.kick(reason);

      const embed = new EmbedBuilder()

        .setTitle("KICK MEMBER")

        .setColor("Random")

        .setThumbnail(target.user.displayAvatarURL())

        .setDescription(

          `Action : Kick \nReason: ${reason} \nUser: ${target} \nModerator: ${message.member}`

        )

        .setTimestamp();

      message.channel.send({embeds: [embed]});

    } catch (error) {
      console.error('Kick error:', error);
      message.channel.send(`Failed to kick ${target}. Error: ${error.message}`);
    }

  },

};