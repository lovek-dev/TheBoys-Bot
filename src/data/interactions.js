const interactionData = {
    actions: {
        slap: {
            neko: 'slap',
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
            neko: 'kiss',
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
            neko: 'kick',
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
            neko: 'punch',
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
            neko: 'hug',
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
            neko: 'pat',
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
            neko: 'pout',
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
            neko: 'pout',
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
            neko: 'punch',
            messages: ["chat witnessed a violation 😭", "that escalated quickly", "emotional damage delivered"],
            self: "internal conflict detected 😭",
            bot: "I refuse 😤",
            verb: "smashed",
            nsfw: true
        },
        dominate: {
            neko: 'smug',
            messages: ["chat witnessed a violation 😭", "that escalated quickly", "emotional damage delivered"],
            self: "internal conflict detected 😭",
            bot: "I refuse 😤",
            verb: "dominated",
            nsfw: true
        },
        fuck: {
            neko: 'yeet',
            messages: ["chat witnessed a violation 😭", "that escalated quickly", "emotional damage delivered"],
            self: "internal conflict detected 😭",
            bot: "I refuse 😤",
            verb: "attacked",
            nsfw: true
        }
    },
    emotions: {
        cry: {
            neko: 'cry',
            message: "is feeling sad… 😢💔",
            sub: "someone please comfort them 🥺💞"
        },
        sorry: {
            neko: 'cry',
            message: "is apologizing… 🙇‍♂️",
            sub: "regret.exe running at full speed 💀"
        },
        laugh: {
            neko: 'laugh',
            message: "is dying of laughter… 😂🔥",
            sub: "laughter critical hit — chat has been attacked"
        },
        confused: {
            neko: 'think',
            message: "is confused… ❓😵",
            sub: "brain.exe has stopped working"
        },
        joy: {
            neko: 'dance',
            message: "is absolutely overjoyed… 🎉✨",
            sub: "main character energy detected ⭐"
        },
        happy: {
            neko: 'happy',
            message: "is feeling happy… 😄✨",
            sub: "pure positive vibes — we love to see it 💞"
        },
        hype: {
            neko: 'dance',
            message: "is absolutely HYPED… 🔥⚡",
            sub: "the energy in this server just spiked 📈"
        },
        bored: {
            neko: 'bored',
            message: "is bored out of their mind… 😑",
            sub: "someone entertain them before they leave 💀"
        },
        angry: {
            neko: 'angry',
            message: "is FURIOUS… 😤🔥",
            sub: "warning: do not approach 🚨"
        },
        shy: {
            neko: 'blush',
            message: "is being shy… 😳💕",
            sub: "too adorable for this server honestly 🥺"
        }
    }
};

module.exports = interactionData;