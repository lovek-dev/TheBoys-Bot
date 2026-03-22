const interactionData = {
    actions: {
        slap: {
            keywords: ["anime slap"],
            neko: "slap",
            messages: ["slapped them into next week 💥", "chat witnessed a violation 😭", "that escalated quickly", "physics has left the server 🚀", "emotional damage delivered"],
            self: "bro you good? 😭 self damage is wild",
            bot: "not today human 😤 system immunity activated",
            verb: "slaps"
        },
        kiss: {
            keywords: ["anime kiss"],
            neko: "kiss",
            messages: ["that was unexpectedly adorable 🥺", "serotonin levels rising", "friendship increased +10", "wholesome moment detected"],
            self: "self-love is important, but this is a bit much 😭",
            bot: "I refuse 😤",
            verb: "kisses"
        },
        kick: {
            keywords: ["anime kick"],
            neko: "kick",
            messages: ["bro got launched 🚀", "physics has left the server", "emotional damage delivered", "that escalated quickly"],
            self: "internal conflict detected 😭",
            bot: "system immunity activated 😤",
            verb: "kicks"
        },
        punch: {
            keywords: ["anime punch"],
            neko: "punch",
            messages: ["combo multiplier activated ⚡", "that escalated quickly", "server lore expanded", "critical hit detected ⚡"],
            self: "stop hitting yourself 😭",
            bot: "I'm made of code, that didn't hurt 😤",
            verb: "punches"
        },
        beg: {
            keywords: ["anime beg"],
            neko: "pout",
            messages: ["dignity temporarily offline", "is it working? 🥺", "down bad detected"],
            self: "begging yourself? 😭",
            bot: "I have no money 😤",
            verb: "begs"
        },
        please: {
            keywords: ["anime please"],
            neko: "handhold",
            messages: ["wholesome moment detected", "how could anyone say no? 🥺", "pure vibes detected"],
            self: "trying to convince yourself? 😭",
            bot: "maybe... if you're nice 😤",
            verb: "pleads with"
        },
        smash: {
            keywords: ["anime smash"],
            neko: "hug",
            messages: ["chat witnessed a violation 😭", "that escalated quickly", "emotional damage delivered"],
            self: "internal conflict detected 😭",
            bot: "I refuse 😤",
            verb: "smashes",
            nsfw: true
        },
        dominate: {
            keywords: ["anime boss"],
            neko: "stare",
            messages: ["chat witnessed a violation 😭", "that escalated quickly", "emotional damage delivered"],
            self: "internal conflict detected 😭",
            bot: "I refuse 😤",
            verb: "dominates",
            nsfw: true
        },
        fuck: {
            keywords: ["anime lewd"],
            neko: "hug",
            messages: ["chat witnessed a violation 😭", "that escalated quickly", "emotional damage delivered"],
            self: "internal conflict detected 😭",
            bot: "I refuse 😤",
            verb: "fucks",
            nsfw: true
        }
    },
    emotions: {
        cry: { keywords: ["anime crying"], neko: "cry", message: "is feeling sad… 😢💔", sub: "someone give them a hug 🥺" },
        sorry: { keywords: ["anime sorry"], neko: "facepalm", message: "is feeling sorry… 🙇", sub: "regret.exe running" },
        laugh: { keywords: ["anime laugh"], neko: "laugh", message: "is laughing… 😂🔥", sub: "laughter critical hit" },
        confused: { keywords: ["anime confused"], neko: "think", message: "is confused… ❓😵", sub: "brain not braining" },
        joy: { keywords: ["anime joy"], neko: "happy", message: "is full of joy… 🎉✨", sub: "main character energy" },
        happy: { keywords: ["anime happy"], neko: "smile", message: "is feeling happy… 😄✨", sub: "pure vibes detected" },
        beg: { keywords: ["anime beg"], neko: "pout", message: "is begging… 🥺🙏", sub: "dignity temporarily offline" }
    }
};

module.exports = interactionData;
