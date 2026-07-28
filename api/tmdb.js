export default async function handler(req, res) {
  const API_KEY = process.env.TMDB_KEY;
  const { mode, search, page = 1, trailer, details, genres } = req.query;

  let url = "";

  if (trailer) {
    url = `https://api.themoviedb.org/3/movie/${trailer}/videos?api_key=${API_KEY}`;
  } else if (details) {
    url = `https://api.themoviedb.org/3/movie/${details}?api_key=${API_KEY}&append_to_response=credits,genres`;
  } else if (genres) {
    url = `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`;
  } else if (mode) {
    url = `https://api.themoviedb.org/3/movie/${mode}?api_key=${API_KEY}&page=${page}`;
  } else if (search) {
    url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(search)}&page=${page}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "TMDB fetch failed" });
  }
}
