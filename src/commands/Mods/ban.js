const discord = module.require("discord.js");

module.exports = {

  name: "ban",

  category: "moderation",

  description: "Ban anyone with one shot whithout knowing anyone xD",

  usage: "ban <@user> <reason>",

  userPerms: ["BanMembers"],

  botPerms: ["EmbedLinks", "BanMembers"],

  run: async (client, message, args) => {

    let reason = args.slice(1).join(" ");

    if (!reason) reason = "Unspecified";

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!target) {

      return message.channel.send(

        `**${message.author.username}**, Please mention the person who you want to ban.`

      );

    }

    if (target.id === message.author.id) {

      return message.channel.send(

        `**${message.author.username}**, You can not ban yourself!`

      );

    }

    if (target.id === message.guild.ownerId) {

      return message.channel.send("You cannot Ban The Server Owner");

    }

    if (target.roles.highest.position >= message.member.roles.highest.position) {
      return message.channel.send("You cannot ban someone with a higher or equal role than yours!");
    }

    if (target.roles.highest.position >= message.guild.members.me.roles.highest.position) {
      return message.channel.send("I cannot ban someone with a higher or equal role than mine!");
    }

    if (!target.bannable) {
      return message.channel.send("I cannot ban this user! They may have a higher role than me or I'm missing permissions.");
    }

    try {
      await message.guild.bans.create(target, {
        reason: reason
      });

      let embed = new discord.EmbedBuilder()

        .setTitle("Action : Ban")

        .setDescription(`Banned ${target} (${target.id})\nReason: ${reason}`)

        .setColor("#ff2050")

        .setThumbnail(target.user.displayAvatarURL())

        .setFooter({ text: `Banned by ${message.author.tag}` });

      message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error('Ban error:', error);
      message.channel.send(`Failed to ban ${target}. Error: ${error.message}`);
    }

  },

};