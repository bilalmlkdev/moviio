import { state } from "./state.js";

export function loadFavorites() {
  try {
    const stored = JSON.parse(localStorage.getItem("moviio_favorites") || "[]");
    stored.forEach((movie) => state.favorites.set(String(movie.id), movie));
  } catch (e) {}
}

export function saveFavorites() {
  const movies = Array.from(state.favorites.values());
  localStorage.setItem("moviio_favorites", JSON.stringify(movies));
}

export function toggleFavorite(movie) {
  if (!movie || !movie.id) return;
  const key = String(movie.id);
  if (state.favorites.has(key)) state.favorites.delete(key);
  else state.favorites.set(key, movie);
  saveFavorites();
  updateFavoritesUI();
}

export function isFavorite(id) {
  return state.favorites.has(String(id));
}

export function updateFavoritesUI() {
  document.querySelectorAll(".favorite-btn").forEach((btn) => {
    const id = btn.dataset.movieId;
    if (id && isFavorite(id)) {
      btn.classList.add("in-favorites");
      const icon = btn.querySelector("i");
      if (icon) icon.className = "fa-solid fa-heart";
    } else {
      btn.classList.remove("in-favorites");
      const icon = btn.querySelector("i");
      if (icon) icon.className = "fa-regular fa-heart";
    }
  });
  const count = document.querySelector(".favorites-count");
  if (count) count.textContent = state.favorites.size;
}
