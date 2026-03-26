async function fetchMovie(name) {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) {
        return { title: name, year: 'Unknown', plot: 'No plot available (no API key set).', runtime: 'Unknown', imdbRating: 'N/A', poster: null };
    }
    try {
        const fetch = (await import('node-fetch')).default;
        const url = `https://www.omdbapi.com/?t=${encodeURIComponent(name)}&apikey=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.Response === 'False') {
            return { title: name, year: 'Unknown', plot: 'Movie not found.', runtime: 'Unknown', imdbRating: 'N/A', poster: null };
        }
        return {
            title: data.Title || name,
            year: data.Year || 'Unknown',
            plot: data.Plot || 'No plot available.',
            runtime: data.Runtime || 'Unknown',
            imdbRating: data.imdbRating || 'N/A',
            genre: data.Genre || 'Unknown',
            poster: data.Poster !== 'N/A' ? data.Poster : null,
        };
    } catch (e) {
        return { title: name, year: 'Unknown', plot: 'Failed to fetch movie info.', runtime: 'Unknown', imdbRating: 'N/A', poster: null };
    }
}

module.exports = { fetchMovie };
