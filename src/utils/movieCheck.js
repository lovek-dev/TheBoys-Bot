const db = require('../database/db');

const MOVIE_COMMANDS = [
    // Movie commands
    'startmovie', 'movieresults', 'recommend', 'rate', 'ratings',
    'trivia', 'pollmovie', 'marktime', 'resume', 'remindmovie', 'moviestats',
    // Series commands
    'startseries', 'nextepisode', 'seriesresume', 'seriesmark',
    'rateepisode', 'episoderatings', 'seriesprogress', 'recap',
    'episodereactions', 'bingemode', 'pollseries', 'favcharacter', 'topcharacters'
];

function isMovieCommand(commandName) {
    return MOVIE_COMMANDS.includes(commandName);
}

function isMovieEnabled(guildId) {
    const state = db.get(`movie_enabled_${guildId}`);
    return state !== false; // default enabled
}

module.exports = { isMovieEnabled, isMovieCommand, MOVIE_COMMANDS };
