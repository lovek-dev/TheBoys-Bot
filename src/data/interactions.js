const interactionData = {
    actions: {
        slap: {
            keywords: ["anime slap", "anime angry slap"],
            messages: ["slapped them into next week 💥", "chat witnessed a violation 😭", "critical hit detected ⚡"],
            self: "bro you good? 😭",
            bot: "not today human 😤",
            verb: "slaps"
        },
        kiss: {
            keywords: ["anime kiss", "cute anime kiss"],
            messages: ["that was unexpectedly adorable 🥺", "serotonin levels rising", "friendship increased +10"],
            self: "self-love is important, but this is a bit much 😭",
            bot: "I refuse 😤",
            verb: "kisses"
        },
        kick: {
            keywords: ["anime kick", "anime girl kick"],
            messages: ["bro got launched 🚀", "physics has left the server", "emotional damage delivered"],
            self: "internal conflict detected 😭",
            bot: "system immunity activated 😤",
            verb: "kicks"
        },
        punch: {
            keywords: ["anime punch", "anime epic punch"],
            messages: ["combo multiplier activated", "that escalated quickly", "server lore expanded"],
            self: "stop hitting yourself 😭",
            bot: "I'm made of code, that didn't hurt 😤",
            verb: "punches"
        },
        beg: {
            keywords: ["anime beg", "anime begging"],
            messages: ["dignity temporarily offline", "is it working? 🥺", "down bad detected"],
            self: "begging yourself? 😭",
            bot: "I have no money 😤",
            verb: "begs"
        },
        please: {
            keywords: ["anime please", "anime pleading"],
            messages: ["wholesome moment detected", "how could anyone say no? 🥺", "pure vibes detected"],
            self: "trying to convince yourself? 😭",
            bot: "maybe... if you're nice 😤",
            verb: "pleads with"
        },
        fuck: {
            keywords: ["anime fuck", "anime lewd"],
            messages: ["chat witnessed a violation 😭", "that escalated quickly", "emotional damage delivered"],
            self: "internal conflict detected 😭",
            bot: "I refuse 😤",
            verb: "fucks",
            nsfw: true
        }
    },
    emotions: {
        cry: { keywords: ["anime crying"], message: "is feeling sad… 😢💔", sub: "someone give them a hug 🥺" },
        sorry: { keywords: ["anime sorry", "anime bow"], message: "is feeling sorry… 🙇", sub: "regret.exe running" },
        laugh: { keywords: ["anime laugh"], message: "is laughing… 😂🔥", sub: "laughter critical hit" },
        confused: { keywords: ["anime confused reaction"], message: "is confused… ❓😵", sub: "brain not braining" },
        joy: { keywords: ["anime joy"], message: "is full of joy… 🎉✨", sub: "main character energy" },
        happy: { keywords: ["anime happy smile"], message: "is feeling happy… 😄✨", sub: "pure vibes detected" }
    }
};

module.exports = interactionData;
