const fs = require('fs');
const path = require('path');
const roastsConfig = require('../config/roasts.json');

const userStates = new Map();
const recentRoasts = new Map(); // Global or per-user tracking to avoid repetition

function getRoast(userId, content, isPing = false, client) {
    const now = Date.now();
    let state = userStates.get(userId) || { 
        intensity: 1, 
        lastRoast: 0, 
        lastMessage: '', 
        count: 0, 
        personaIndex: 0, 
        messageHistory: [] 
    };
    
    // Cooldown check
    const cooldown = isPing ? 3000 : 7000;
    if (now - state.lastRoast < cooldown) return null;
    
    // Persona Rotation (every 12 messages)
    if (state.count > 0 && state.count % 12 === 0) {
        state.personaIndex = (state.personaIndex + 1) % 3; // Assume 3 personas
    }

    let pool;
    const lowerContent = content.toLowerCase();
    
    // Extreme Toxicity / Defiance Triggers / Abuse Detection
    const defianceTriggers = ['bet', 'try it', 'go on', 'broke', 'stfu', 'fuck you'];
    const abusePatterns = [
        /\b(fuck|bitch|asshole|dumbass|idiot|moron|bastard|shithead|dick|pussy|loser|clown|trash|garbage)\b/i,
        /\b(noob|bot|uninstall|ez kid|carried|bronze|skill issue)\b/i,
        /\b(bc|mc|chutiya|gadha|pagal|kutta|kamina|nalayak|bakchod|harami|bewakoof)\b/i,
        /shut up/i,
        /you are (a )?\w+/i,
        /tu \w+ hai/i,
        /tera dimag kharab hai/i,
        /get lost/i
    ];

    const hasDefiance = defianceTriggers.some(t => lowerContent.includes(t));
    const hasAbuse = abusePatterns.some(pattern => pattern.test(lowerContent));

    if (hasDefiance || hasAbuse) {
        state.intensity = 4; // Go crazy
        pool = roastsConfig.levels["4"];
    } else if (isPing) {
        pool = roastsConfig.ping_roasts;
    } else {
        const isTrigger = roastsConfig.triggers.some(t => lowerContent.includes(t));
        if (!isTrigger) return null;
        
        state.count++;
        
        if (state.count > 15) state.intensity = 3;
        else if (state.count > 7) state.intensity = 2;
        else state.intensity = 1;

        pool = roastsConfig.levels[state.intensity.toString()];
    }

    // Filter out recently used roasts (last 7)
    let availableRoasts = pool.filter(r => !state.messageHistory.includes(r));
    
    // Fallback if all roasts were used recently
    if (availableRoasts.length === 0) {
        state.messageHistory = [];
        availableRoasts = pool;
    }

    let roast = availableRoasts[Math.floor(Math.random() * availableRoasts.length)];
    
    // Special toxic responses for high count
    if (state.count > 20 && Math.random() < 0.3) {
        const specials = [
            "Sit down, I've had enough of you.",
            "Wanna see the way out?",
            "Should I just kick you now or wait for you to embarrass yourself more?",
            "Wanna leave or get kicked? Choice is yours, kid."
        ];
        roast = specials[Math.floor(Math.random() * specials.length)];
    }

    state.lastRoast = now;
    state.lastMessage = roast;
    state.messageHistory.push(roast);
    if (state.messageHistory.length > 7) state.messageHistory.shift();
    
    userStates.set(userId, state);
    
    return { roast, hasDefiance, count: state.count };
}

module.exports = { getRoast };