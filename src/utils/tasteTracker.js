const db = require('../database/db');

function getTaste(userId, guildId) {
    return db.get(`taste_${guildId}_${userId}`) || {
        ratings: [],
        genres: {},
        reactions: { funny: 0, scary: 0, plottwist: 0, cringe: 0 },
        avgRating: 0
    };
}

function updateRating(userId, guildId, score, genres = []) {
    const taste = getTaste(userId, guildId);
    taste.ratings.push(score);
    if (taste.ratings.length > 50) taste.ratings.shift();
    taste.avgRating = parseFloat((taste.ratings.reduce((a, b) => a + b, 0) / taste.ratings.length).toFixed(1));
    for (const g of genres) {
        taste.genres[g] = (taste.genres[g] || 0) + 1;
    }
    db.set(`taste_${guildId}_${userId}`, taste);
}

function updateReaction(userId, guildId, reactionType) {
    const taste = getTaste(userId, guildId);
    if (taste.reactions[reactionType] !== undefined) {
        taste.reactions[reactionType]++;
        db.set(`taste_${guildId}_${userId}`, taste);
    }
}

function getTopGenres(taste, count = 3) {
    return Object.entries(taste.genres)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([g]) => g);
}

function getDominantReaction(taste) {
    const emojis = { funny: '😂', scary: '😱', plottwist: '🤯', cringe: '💀' };
    const top = Object.entries(taste.reactions).sort((a, b) => b[1] - a[1])[0];
    if (!top || top[1] === 0) return 'None yet';
    return `${emojis[top[0]] || ''} ${top[0]}`;
}

module.exports = { getTaste, updateRating, updateReaction, getTopGenres, getDominantReaction };
