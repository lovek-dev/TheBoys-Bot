const https = require('https');

function httpsGetJSON(urlString) {
    return new Promise((resolve, reject) => {
        const u = new URL(urlString);
        const opts = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DiscordBot)', 'Accept': 'application/json' }
        };
        const req = https.get(opts, (res) => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => { try { resolve(JSON.parse(raw)); } catch (e) { reject(e); } });
        });
        req.setTimeout(6000, () => { req.destroy(); reject(new Error('timeout')); });
        req.on('error', reject);
    });
}

async function searchSeries(name) {
    const tmdbKey = process.env.TMDB_API_KEY;
    if (tmdbKey) {
        try {
            const data = await httpsGetJSON(`https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(name)}&api_key=${tmdbKey}`);
            if (data.results && data.results.length > 0) {
                const show = data.results[0];
                return {
                    id: show.id,
                    title: show.name,
                    overview: show.overview,
                    rating: show.vote_average?.toFixed(1) || 'N/A',
                    poster: show.poster_path ? `https://image.tmdb.org/t/p/w300${show.poster_path}` : null,
                    source: 'tmdb'
                };
            }
        } catch (e) { /* fallthrough to OMDB */ }
    }

    const omdbKey = process.env.OMDB_API_KEY;
    if (omdbKey) {
        try {
            const data = await httpsGetJSON(`https://www.omdbapi.com/?t=${encodeURIComponent(name)}&type=series&apikey=${omdbKey}`);
            if (data.Response === 'True') {
                return {
                    id: null,
                    title: data.Title,
                    overview: data.Plot,
                    rating: data.imdbRating || 'N/A',
                    totalSeasons: parseInt(data.totalSeasons) || null,
                    poster: data.Poster !== 'N/A' ? data.Poster : null,
                    source: 'omdb',
                    omdbTitle: data.Title
                };
            }
        } catch (e) { /* fallthrough */ }
    }

    return null;
}

async function getShowDetails(showId) {
    const tmdbKey = process.env.TMDB_API_KEY;
    if (!tmdbKey) return null;
    try {
        const data = await httpsGetJSON(`https://api.themoviedb.org/3/tv/${showId}?api_key=${tmdbKey}`);
        return data;
    } catch (e) { return null; }
}

async function getSeasonDetails(showId, season) {
    const tmdbKey = process.env.TMDB_API_KEY;
    if (!tmdbKey) {
        // Fallback: try OMDB for episode list
        const omdbKey = process.env.OMDB_API_KEY;
        if (!omdbKey) return null;
        try {
            const data = await httpsGetJSON(`https://www.omdbapi.com/?t=&Season=${season}&apikey=${omdbKey}`);
            return data;
        } catch (e) { return null; }
    }
    try {
        const data = await httpsGetJSON(`https://api.themoviedb.org/3/tv/${showId}/season/${season}?api_key=${tmdbKey}`);
        return data;
    } catch (e) { return null; }
}

async function getEpisodeDetails(showId, season, episode) {
    const tmdbKey = process.env.TMDB_API_KEY;
    if (!tmdbKey) return null;
    try {
        const data = await httpsGetJSON(`https://api.themoviedb.org/3/tv/${showId}/season/${season}/episode/${episode}?api_key=${tmdbKey}`);
        return data;
    } catch (e) { return null; }
}

module.exports = { searchSeries, getShowDetails, getSeasonDetails, getEpisodeDetails };
