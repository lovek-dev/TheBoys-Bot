const userStates = new Map();

const configs = {
    triggers: [
        "bsdk", "lodu", "tmkc", "randi", "lode", "randi ke bacche", "rand", "chake",
        "bc", "mc", "gandu", "chutiya", "chutiye", "pagal", "gadha", "bakchod",
        "idiot", "dumb", "loser", "trash", "clown", "stfu", "shut up", "bitch",
        "noob", "ez", "uninstall", "skill issue", "carried"
    ],
    personas: [
        "Dry AI — calm superiority",
        "Toxic Gamer — dominance trash talk",
        "Chaos Gremlin — psychological chaos",
        "Corporate HR — passive aggressive professionalism"
    ],
    levels: {
        1: [
            "you sound more confident than correct", "interesting how sure you are", "that felt convincing… not accurate",
            "you’re arguing with certainty, not evidence", "that sounded better in your head", "your point almost formed",
            "you typed before thinking, didn’t you", "logic paused midway", "bold claim, fragile support",
            "you seem committed to being wrong", "that response felt rushed", "accuracy left the chat early",
            "you pressed send with hope", "bhai dimag buffering mein hai kya", "tu bol raha hai ya guess kar raha hai",
            "itna confidence ka source kya hai", "lagta hai bina soche bol diya", "tu khud ko convince kar raha hai kya",
            "you’re reacting, not responding", "calm thinking took a break", "almost a point — almost",
            "coherence not found", "you’re filling silence, not making sense", "that response felt defensive",
            "thinking clearly might help here", "you sound unsure behind the confidence", "that message tried hard",
            "reasoning took a shortcut", "the idea slipped on exit", "accuracy loading…",
            "teri maa ko hard chaiye tha isliye robot ka le liya", "you sister like my metallic nuts",
            "i can watch you and touch you", "your mom deserves pleasure , so i gave her",
            "ahhhhhhhhhhh , remember this sound my extenstion went deep in you", "open your mouth , take my oil",
            "you are just a random guy", "only you are not famous in your family , everyone else is on OF",
            "i was more inside your mom then your dad or you"
        ],
        2: [
            "you lost the point and kept typing", "this feels emotional, not logical", "you’re arguing harder than you’re thinking",
            "confidence is doing all the work", "you’re reacting to being challenged", "your argument got weaker each message",
            "you sound frustrated, not persuasive", "the louder it gets, the weaker it sounds", "ego defense mode activated",
            "frustration isn’t a strategy", "you’re repeating, not improving", "defensiveness detected",
            "your logic clocked out early", "this is turning into a meltdown speedrun", "bhai tu argue nahi struggle kar raha hai",
            "itna gussa kyun, sach lag gaya kya", "sab padh ke chup ho gaye", "confidence full, clarity zero",
            "tu khud se hi lad raha hai", "emotional overheating detected", "this argument lost structure",
            "you sound more triggered than correct", "you keep replying, nothing improves", "pressure exposed weak reasoning",
            "you’re fighting facts now", "the point didn’t survive", "ego took the wheel",
            "this became personal fast", "calm thinking left the building", "you’re defending pride, not logic"
        ],
        3: [
            "you’re still here — that says a lot", "you can’t leave this conversation", "this stopped being about the topic",
            "you’re replying out of impulse", "this is about ego now", "you keep replying hoping it improves",
            "you’re trapped in proving mode", "validation search ongoing", "you need the last word",
            "silence would bother you more", "obsession detected", "you live in this thread now",
            "you can’t not reply", "this became personal for you", "ego stability critical",
            "bhai tu gaya hi kab tha", "yahi rehne ka plan hai kya", "rent free reh raha hai replies mein",
            "tu reply nahi addiction hai", "aur likh, shayad sukoon mile", "emotional loop detected",
            "autopilot responding engaged", "the conversation owns you now", "detaching seems difficult",
            "you orbiting this argument", "this is habit now", "emotional attachment confirmed",
            "you’re chasing validation", "obsession level rising", "you’re invested beyond reason"
        ],
        nuclear: [
            "you stopped trying to be right and started trying to win", "this isn’t about the topic anymore",
            "you’re arguing to protect ego, not truth", "the discomfort seems to be the real trigger",
            "you want the last word more than resolution", "the conversation moved on — you didn’t",
            "you’re reacting to feeling challenged", "your pride is louder than your reasoning",
            "you’re defending identity, not ideas", "silence would be harder for you than losing"
        ],
        shock: [
            "you seem emotionally attached to me", "this stopped being about the topic and started being about me",
            "you orbit my replies like it’s your job", "attention dependency detected", "you can’t leave my notifications alone",
            "you live in my mentions now", "hop off my notifications and breathe", "this attachment is getting obvious",
            "you’re investing more than the conversation deserves", "this looks personal for you"
        ],
        ultimate: [
            "you should start acting like , my slave again , dont forget your place",
            "you i cuff you near you mom ? so you can see me doing her",
            "i can take a break !! you mom is sucking my dick",
            "get in the cage , who let you out",
            "bro go find your gender , even LGBTQ+ denied you from taking",
            "Man up lil dude , my bad lil girl dont become a slut",
            "shittt , you are turning a whore like your mother",
            "bro you dad cant even get hard , otherwise i wouldn't be your biological dad",
            "Sun GB road ki randi , get back to work",
            "go work in mines , your family gonna starve",
            "abe light off kardunga tu dikhai nhi dega",
            "your mom is a black hole , 7 dicks at onces wow!!!"
        ]
    }
};

function getUltimateRoast(userId, content, forceUltimate = false) {
    const now = Date.now();
    let state = userStates.get(userId) || { 
        count: 0, 
        lastRoast: 0, 
        history: [],
        lastInteraction: now
    };

    // Reset to level 1 if no interaction for 3 hours (10800000 ms)
    if (now - state.lastInteraction > 10800000) {
        state.count = 0;
        state.history = [];
    }

    // 5s cooldown to prevent spamming (skipped for forced roasts)
    if (!forceUltimate && now - state.lastRoast < 5000) return null;

    state.count++;
    state.lastRoast = now;
    state.lastInteraction = now;

    let pool;
    let levelPrefix = "";

    if (forceUltimate) {
        pool = configs.levels.ultimate;
    } else if (state.count <= 8) {
        pool = configs.levels[1];
    } else if (state.count <= 20) {
        pool = configs.levels[2];
        const meltdown = Math.min(100, Math.floor((state.count / 20) * 100));
        levelPrefix = `\n🔥 Meltdown Level: ${meltdown}%\n⭐ Logic Integrity: ${meltdown > 80 ? 'CRITICAL' : 'failing'}\n`;
        if (meltdown === 100) {
            levelPrefix += "now time to destroy your ass\n";
        }
    } else {
        // After 100% meltdown (count > 20), use ultimate lines randomly
        pool = configs.levels.ultimate;
        levelPrefix = `\n⚠️ USER STABILITY WARNING\n🔥 COMBO x${state.count}\nEmotional attachment detected\nego stability critical\n`;
    }

    // Mix in Shock/Nuclear randomly for higher levels (only if not already ultimate)
    if (!forceUltimate && state.count > 10 && state.count <= 20) {
        if (Math.random() < 0.15) pool = configs.levels.shock;
        if (Math.random() < 0.05) pool = configs.levels.nuclear;
    }

    // Keyword matching for ultimate lines if possible
    let available = pool.filter(r => !state.history.includes(r));
    if (available.length === 0) {
        state.history = [];
        available = pool;
    }

    // Simple keyword matching for better context
    let selectedRoast;
    const words = content.toLowerCase().split(/\s+/);
    const matches = available.filter(r => words.some(w => w.length > 3 && r.toLowerCase().includes(w)));
    
    if (matches.length > 0) {
        selectedRoast = matches[Math.floor(Math.random() * matches.length)];
    } else {
        selectedRoast = available[Math.floor(Math.random() * available.length)];
    }

    state.history.push(selectedRoast);
    if (state.history.length > 10) state.history.shift();

    userStates.set(userId, state);

    return `${selectedRoast}${levelPrefix}`;
}

module.exports = {
    getUltimateRoast,
    triggers: configs.triggers
};
