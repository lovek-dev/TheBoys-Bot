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
    if (state.count > 5) state.intensity = 3;
    else if (state.count > 2) state.intensity = 2;
    else state.intensity = 1;

    // Nuclear drop chance (2%)
    if (Math.random() < 0.02) state.intensity = 4;

    const pool = roastsConfig.levels[state.intensity.toString()];
    let roast = pool[Math.floor(Math.random() * pool.length)];
    
    // Avoid duplicate consecutive roasts
    if (roast === state.lastMessage) {
        roast = pool[(pool.indexOf(roast) + 1) % pool.length];
    }

    state.lastRoast = now;
    state.lastMessage = roast;
    userStates.set(userId, state);
    
    return roast;
}

module.exports = { getRoast };