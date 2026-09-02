import { state } from "./state.js";
import { showApiMessage } from "./utils.js";

// Fetch genres
export async function fetchGenres() {
  try {
    const res = await fetch("/api/tmdb?genres=1");
    const data = await res.json();
    if (data.genres) {
      state.genres = data.genres;
      const select = document.getElementById("genreSelect");
      if (select) {
        state.genres.forEach((g) => {
          const opt = document.createElement("option");
          opt.value = g.id;
          opt.textContent = g.name;
          select.appendChild(opt);
        });
        if (state.selectedGenre) select.value = state.selectedGenre;
      }
    }
  } catch (e) {
    console.error("Failed to fetch genres", e);
  }
}

// Fetch a page of movies
export async function fetchPage(query, page = 1) {
  if (state.abortController) state.abortController.abort();
  state.abortController = new AbortController();

  const key = `${query}::${page}::${state.selectedGenre}::${state.selectedYear}`;
  if (state.cache.has(key)) return state.cache.get(key);

  if (query === "watchlist") {
    const items = Array.from(state.watchlist.values());
    return { items, total: items.length };
  }

  let url;
  const isFilter = ["popular", "top_rated", "upcoming"].includes(query);
  if (isFilter) {
    url = `/api/tmdb?mode=${query}&page=${page}`;
  } else {
    url = `/api/tmdb?search=${encodeURIComponent(query)}&page=${page}`;
  }

  if (state.selectedGenre || state.selectedYear) {
    url = `/api/tmdb?discover=1&page=${page}`;
    if (state.selectedGenre) url += `&with_genres=${state.selectedGenre}`;
    if (state.selectedYear)
      url += `&primary_release_year=${state.selectedYear}`;
  }

  try {
    const res = await fetch(url, { signal: state.abortController.signal });
    const data = await res.json();
    if (!res.ok || !data || !data.results) {
      showApiMessage("TMDB fetch error");
      return { items: [], total: 0 };
    }
    const items = data.results.map((m) => ({
      id: m.id,
      title: m.title || "",
      date: m.release_date ? m.release_date.slice(0, 4) : "",
      type: "movie",
      rating: m.vote_average ? m.vote_average.toFixed(1) : "-",
      badgeLeft: "MOVIE",
      badgeRight: m.original_language?.toUpperCase() || "",
      imgSrc: m.poster_path
        ? `https://image.tmdb.org/t/p/w400${m.poster_path}`
        : "",
      imgAlt: m.title || "",
      poster_path: m.poster_path || null,
      overview: m.overview || "",
    }));
    const total = parseInt(data.total_results || items.length) || 0;
    const result = { items, total };
    state.cache.set(key, result);
    return result;
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Fetch error:", err);
      showApiMessage("TMDB fetch error");
    }
    return { items: [], total: 0 };
  }
}

// Load more items into feed
export async function loadMoreIntoFeed() {
  if (state.isLoading || state.currentQuery === "watchlist") return;
  state.isLoading = true;
  try {
    state.currentPage++;
    const pageData = await fetchPage(state.currentQuery, state.currentPage);
    if (pageData && pageData.items && pageData.items.length) {
      state.feed = state.feed.concat(pageData.items);
      state.totalResults = pageData.total;
    }
  } catch (e) {
    console.error(e);
  } finally {
    state.isLoading = false;
  }
}
