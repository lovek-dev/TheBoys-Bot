const fs = require('fs');
const path = require('path');
const roastsConfig = require('../config/roasts.json');

const userStates = new Map();

function getRoast(userId, content, isPing = false) {
    const now = Date.now();
    let state = userStates.get(userId) || { intensity: 1, lastRoast: 0, lastMessage: '', count: 0 };
    
    // Cooldown check (5 seconds for pings, 10 for others)
    const cooldown = isPing ? 5000 : 10000;
    if (now - state.lastRoast < cooldown) return null;
    
    let pool;
    if (isPing) {
        pool = roastsConfig.ping_roasts;
    } else {
        const isTrigger = roastsConfig.triggers.some(t => content.toLowerCase().includes(t));
        if (!isTrigger) return null;
        
        // Increase intensity for repeated behavior
        state.count++;
        
        // Mix intensities: 70% current level, 30% chance for a different level
        let intensity = 1;
        if (state.count > 10) intensity = 3; // Harder to reach level 3
        else if (state.count > 5) intensity = 2;
        else intensity = 1;

        // 30% chance to mix it up
        if (Math.random() < 0.3) {
            const otherLevels = [1, 2, 3].filter(l => l !== intensity);
            intensity = otherLevels[Math.floor(Math.random() * otherLevels.length)];
        }

        // Nuclear drop chance (2%) - overrides everything
        if (Math.random() < 0.02) intensity = 4;

        state.intensity = intensity;
        pool = roastsConfig.levels[state.intensity.toString()];
    }

    let roast = pool[Math.floor(Math.random() * pool.length)];
    
    // Avoid duplicate roasts
    if (roast === state.lastMessage && pool.length > 1) {
        const availableRoasts = pool.filter(r => r !== state.lastMessage);
        roast = availableRoasts[Math.floor(Math.random() * availableRoasts.length)];
    }

    state.lastRoast = now;
    state.lastMessage = roast;
    userStates.set(userId, state);
    
    return roast;
}

module.exports = { getRoast };