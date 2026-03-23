async function fetchSeries(name) {
    const apiKey = process.env.OMDB_API_KEY;
    if (!apiKey) {
        return { title: name, year: 'Unknown', plot: 'No info available (no API key set).', totalSeasons: 'Unknown', imdbRating: 'N/A', poster: null };
    }
    try {
        const fetch = (await import('node-fetch')).default;
        const url = `https://www.omdbapi.com/?t=${encodeURIComponent(name)}&type=series&apikey=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.Response === 'False') {
            return { title: name, year: 'Unknown', plot: 'Series not found.', totalSeasons: 'Unknown', imdbRating: 'N/A', poster: null };
        }
        return {
            title: data.Title || name,
            year: data.Year || 'Unknown',
            plot: data.Plot || 'No plot available.',
            totalSeasons: data.totalSeasons || 'Unknown',
            imdbRating: data.imdbRating || 'N/A',
            genre: data.Genre || 'Unknown',
            poster: data.Poster !== 'N/A' ? data.Poster : null,
        };
    } catch (e) {
        return { title: name, year: 'Unknown', plot: 'Failed to fetch series info.', totalSeasons: 'Unknown', imdbRating: 'N/A', poster: null };
    }
}

module.exports = { fetchSeries };
