import { state } from './state.js';
import { fetchMovies } from './controls.js'; // circular? better to avoid; we'll handle in main.js

// Watchlist functions
export function loadWatchlist() {
  try {
    const stored = JSON.parse(localStorage.getItem("moviio_watchlist") || "[]");
    stored.forEach((movie) => state.watchlist.set(String(movie.id), movie));
  } catch (e) {}
}

export function saveWatchlist() {
  const movies = Array.from(state.watchlist.values());
  localStorage.setItem("moviio_watchlist", JSON.stringify(movies));
}

export function toggleWatchlist(movie) {
  if (!movie || !movie.id) return;
  const key = String(movie.id);
  if (state.watchlist.has(key)) state.watchlist.delete(key);
  else state.watchlist.set(key, movie);
  saveWatchlist();
  updateWatchlistUI();
  // If currently viewing watchlist, refresh
  if (state.currentQuery === "watchlist") {
    // We'll call fetchMovies from controls.js later to avoid circular import
    const { fetchMovies } = await import('./controls.js');
    fetchMovies("watchlist");
  }
}

export function isInWatchlist(id) {
  return state.watchlist.has(String(id));
}

export function updateWatchlistUI() {
  document.querySelectorAll(".watchlist-btn").forEach((btn) => {
    const id = btn.dataset.movieId;
    if (id && isInWatchlist(id)) {
      btn.classList.add("in-watchlist");
      const icon = btn.querySelector("i");
      if (icon) icon.className = "fa-solid fa-heart";
    } else {
      btn.classList.remove("in-watchlist");
      const icon = btn.querySelector("i");
      if (icon) icon.className = "fa-regular fa-heart";
    }
  });
}
