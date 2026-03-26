const db = require('../../database/db');

function isMovieEnabled(guildId) {
    const val = db.get(`movie_enabled_${guildId}`);
    return val === true || val === 'true';
}

module.exports = { isMovieEnabled };
