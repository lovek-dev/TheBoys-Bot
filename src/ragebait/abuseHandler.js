const roastPhrases = {
    universal: [
        "big anger, tiny vocabulary.",
        "you argue like patch notes nobody asked for.",
        "keep typing, maybe a good point will spawn.",
        "you sound better in your head.",
        "I’ve seen stronger arguments in loading screens.",
        "congratulations, you played yourself.",
        "your insult arrived, but the intelligence didn’t.",
        "you’re not roasting, you’re microwaving leftovers.",
        "this isn’t a fight, it’s a typing tantrum.",
        "bold words from someone losing."
    ],
    gamer: [
        "skill issue detected.",
        "lost the match, started typing.",
        "talk less, aim better.",
        "bronze lobby energy.",
        "rage typing won’t boost rank.",
        "controller unplugged behavior."
    ],
    hinglish: [
        "itna gussa kyun, wifi slow hai kya?",
        "dimag buffering mein hai lagta hai.",
        "bhai calm ho ja, keyboard toot jayega.",
        "itni mehnat padhai mein karta toh topper hota.",
        "gussa kam, logic zyada try kar.",
        "server nahi, tu lag kar raha hai."
    ],
    safety: "that crossed the line. try again without hate."
};

const abusePatterns = [
    /\bfuck\b/i, /\bbitch\b/i, /\basshole\b/i, /\bdumbass\b/i, /\bidiot\b/i,
    /\bmoron\b/i, /\bbastard\b/i, /\bshithead\b/i, /\bdick\b/i, /\bpussy\b/i,
    /\bloser\b/i, /\bclown\b/i, /\btrash\b/i, /\bnoob\b/i, /\bstfu\b/i,
    /\bbc\b/i, /\bmc\b/i, /\bchutiya\b/i, /\bgadha\b/i, /\bpagal\b/i,
    /\bkutta\b/i, /\bkamina\b/i, /\bharami\b/i, /\bbakchod\b/i
];

const hatePatterns = [
    /\bnigger\b/i, /\bretard\b/i, /\bfaggot\b/i // Add more as per safety policy
];

const lastRoast = new Map();

async function handleAbuse(message, client) {
    if (message.author.bot || !message.guild) return;

    const content = message.content.toLowerCase();
    
    // Ignore friendly joking
    if (content.includes('lol') || content.includes('😂') || content.includes('lmao')) return;

    // Cooldown: 1 roast per 10s per user
    const now = Date.now();
    if (lastRoast.has(message.author.id) && now - lastRoast.get(message.author.id) < 10000) return;

    // Safety check first
    if (hatePatterns.some(pattern => pattern.test(content))) {
        lastRoast.set(message.author.id, now);
        return message.reply(roastPhrases.safety);
    }

    // Abuse detection
    if (abusePatterns.some(pattern => pattern.test(content))) {
        lastRoast.set(message.author.id, now);
        
        let pool = [...roastPhrases.universal, ...roastPhrases.gamer, ...roastPhrases.hinglish];
        
        // Persona adaptation if available
        const persona = client.currentPersona; // Set by ragebait handler or random
        if (persona) {
            if (persona.abusiveReplies) pool = persona.abusiveReplies;
        }

        const roast = pool[Math.floor(Math.random() * pool.length)];
        
        // Randomly roast owner if they are the target or just because
        const ownerId = message.guild.ownerId;
        if (message.author.id === ownerId || content.includes(`<@${ownerId}>`)) {
            return message.reply(`Even the boss isn't safe. ${roast}`);
        }

        return message.reply(roast);
    }
}

module.exports = { handleAbuse };
