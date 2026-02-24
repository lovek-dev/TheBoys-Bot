const fs = require('fs');
const path = require('path');
const roastsConfig = require('../config/roasts.json');

const userStates = new Map();

function getRoast(userId, content) {
    const now = Date.now();
    let state = userStates.get(userId) || { intensity: 1, lastRoast: 0, lastMessage: '', count: 0 };
    
    // Cooldown check (10 seconds)
    if (now - state.lastRoast < 10000) return null;
    
    const isTrigger = roastsConfig.triggers.some(t => content.toLowerCase().includes(t));
    if (!isTrigger) return null;

    // Increase intensity for repeated behavior
    state.count++;
    
    // Mix intensities: 70% current level, 30% chance for a different level
    let intensity = 1;
    if (state.count > 5) intensity = 3;
    else if (state.count > 2) intensity = 2;
    else intensity = 1;

    // 30% chance to mix it up
    if (Math.random() < 0.3) {
        const otherLevels = [1, 2, 3].filter(l => l !== intensity);
        intensity = otherLevels[Math.floor(Math.random() * otherLevels.length)];
    }

    // Nuclear drop chance (2%) - overrides everything
    if (Math.random() < 0.02) intensity = 4;

    state.intensity = intensity;

    const pool = roastsConfig.levels[state.intensity.toString()];
    let roast = pool[Math.floor(Math.random() * pool.length)];
    
    // Avoid duplicate roasts (check against user's last message AND global last message to be safe)
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