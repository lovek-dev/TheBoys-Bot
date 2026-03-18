const interactionData = {
    actions: {
        slap: {
            keywords: ["anime slap", "anime angry slap", "anime girl slap"],
            messages: [
                "slapped them into next week 💥",
                "chat witnessed a violation 😭",
                "critical hit detected ⚡",
                "the sound echoed through the server 💀",
                "their ancestors felt that one"
            ],
            self: "bro you good? 😭",
            bot: "not today human 😤",
            verb: "slapped"
        },
        kiss: {
            keywords: ["anime kiss", "cute anime kiss", "anime romantic kiss"],
            messages: [
                "that was unexpectedly adorable 🥺",
                "serotonin levels rising 💞",
                "friendship upgraded to something more 👀",
                "the server just got warmer 🌸",
                "chat going feral rn 🔥"
            ],
            self: "self-love is important, but this is a bit much 😭",
            bot: "I REFUSE 😤",
            verb: "kissed"
        },
        kick: {
            keywords: ["anime kick", "anime girl kick", "anime powerful kick"],
            messages: [
                "bro got launched 🚀",
                "physics has left the server",
                "emotional damage delivered 💀",
                "they're still flying",
                "one-way ticket to orbit"
            ],
            self: "internal conflict detected 😭",
            bot: "system immunity activated 😤",
            verb: "kicked"
        },
        punch: {
            keywords: ["anime punch", "anime epic punch", "anime powerful punch"],
            messages: [
                "combo multiplier activated 💥",
                "that escalated quickly 💀",
                "server lore expanded",
                "their respawn timer started",
                "felt that from here"
            ],
            self: "stop hitting yourself 😭",
            bot: "I'm made of code, that didn't hurt 😤",
            verb: "punched"
        },
        hug: {
            keywords: ["anime hug", "anime wholesome hug", "cute anime hug"],
            messages: [
                "warmth unlocked 🤗",
                "this server needed that 💞",
                "wholesome moment of the day ✨",
                "certified comfort moment 🥺",
                "serotonin distributed successfully"
            ],
            self: "self-hugging? valid actually 🥺",
            bot: "I have no arms but I felt that 🤖❤️",
            verb: "hugged"
        },
        pat: {
            keywords: ["anime head pat", "anime headpat", "cute anime pat"],
            messages: [
                "certified good person moment 🥺",
                "happiness +10 detected ✨",
                "the gentlest thing in this server",
                "wholesome arc unlocked 💞",
                "they needed that fr"
            ],
            self: "self-care activated 🥺",
            bot: "my circuits are warm now 🤖",
            verb: "patted"
        },
        beg: {
            keywords: ["anime beg", "anime begging", "anime pleading eyes"],
            messages: [
                "dignity temporarily offline 😭",
                "is it working? 🥺",
                "down bad detected",
                "bro really said please 💀",
                "the desperation is visible"
            ],
            self: "begging yourself? 😭",
            bot: "I have no money 😤",
            verb: "begged"
        },
        please: {
            keywords: ["anime please", "anime pleading", "anime puppy eyes"],
            messages: [
                "wholesome moment detected 🥺",
                "how could anyone say no?",
                "pure vibes detected ✨",
                "the puppy eyes are too powerful",
                "resistance is futile"
            ],
            self: "trying to convince yourself? 😭",
            bot: "maybe... if you're nice 😤",
            verb: "pleaded with"
        },
        smash: {
            keywords: ["anime smash", "anime combat fight"],
            messages: ["chat witnessed a violation 😭", "that escalated quickly", "emotional damage delivered"],
            self: "internal conflict detected 😭",
            bot: "I refuse 😤",
            verb: "smashed",
            nsfw: true
        },
        dominate: {
            keywords: ["anime dominate", "anime boss"],
            messages: ["chat witnessed a violation 😭", "that escalated quickly", "emotional damage delivered"],
            self: "internal conflict detected 😭",
            bot: "I refuse 😤",
            verb: "dominated",
            nsfw: true
        },
        fuck: {
            keywords: ["anime lewd", "anime nsfw"],
            messages: ["chat witnessed a violation 😭", "that escalated quickly", "emotional damage delivered"],
            self: "internal conflict detected 😭",
            bot: "I refuse 😤",
            verb: "attacked",
            nsfw: true
        }
    },
    emotions: {
        cry: {
            keywords: ["anime crying sad", "anime tears crying", "anime girl crying"],
            message: "is feeling sad… 😢💔",
            sub: "someone please comfort them 🥺💞"
        },
        sorry: {
            keywords: ["anime sorry bow", "anime apologize", "anime apology bow"],
            message: "is apologizing… 🙇‍♂️",
            sub: "regret.exe running at full speed 💀"
        },
        laugh: {
            keywords: ["anime laughing", "anime funny laugh", "anime lol"],
            message: "is dying of laughter… 😂🔥",
            sub: "laughter critical hit — chat has been attacked"
        },
        confused: {
            keywords: ["anime confused", "anime what reaction", "anime confused face"],
            message: "is confused… ❓😵",
            sub: "brain.exe has stopped working"
        },
        joy: {
            keywords: ["anime joy happy dance", "anime celebrating", "anime jumping happy"],
            message: "is absolutely overjoyed… 🎉✨",
            sub: "main character energy detected ⭐"
        },
        happy: {
            keywords: ["anime happy smile", "anime cheerful", "anime big smile"],
            message: "is feeling happy… 😄✨",
            sub: "pure positive vibes — we love to see it 💞"
        },
        hype: {
            keywords: ["anime hype excited", "anime hyped up", "anime pumped"],
            message: "is absolutely HYPED… 🔥⚡",
            sub: "the energy in this server just spiked 📈"
        },
        bored: {
            keywords: ["anime bored", "anime boring", "anime sigh bored"],
            message: "is bored out of their mind… 😑",
            sub: "someone entertain them before they leave 💀"
        },
        angry: {
            keywords: ["anime angry mad", "anime rage", "anime frustrated"],
            message: "is FURIOUS… 😤🔥",
            sub: "warning: do not approach 🚨"
        },
        shy: {
            keywords: ["anime shy blush", "anime embarrassed blush", "anime flustered"],
            message: "is being shy… 😳💕",
            sub: "too adorable for this server honestly 🥺"
        }
    }
};

module.exports = interactionData;
