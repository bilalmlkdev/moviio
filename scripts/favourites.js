import { state } from "./state.js";

export function loadFavourites() {
  try {
    const stored = JSON.parse(localStorage.getItem("moviio_favourites") || "[]");
    stored.forEach((movie) => state.favourites.set(String(movie.id), movie));
  } catch (e) {}
}

export function saveFavourites() {
  const movies = Array.from(state.favourites.values());
  localStorage.setItem("moviio_favourites", JSON.stringify(movies));
}

export function toggleFavorite(movie) {
  if (!movie || !movie.id) return;
  const key = String(movie.id);
  if (state.favourites.has(key)) state.favourites.delete(key);
  else state.favourites.set(key, movie);
  saveFavourites();
  updateFavouritesUI();
}

export function isFavorite(id) {
  return state.favourites.has(String(id));
}

export function updateFavouritesUI() {
  document.querySelectorAll(".favorite-btn").forEach((btn) => {
    const id = btn.dataset.movieId;
    if (id && isFavorite(id)) {
      btn.classList.add("in-favourites");
      const icon = btn.querySelector("i");
      if (icon) icon.className = "fa-solid fa-heart";
    } else {
      btn.classList.remove("in-favourites");
      const icon = btn.querySelector("i");
      if (icon) icon.className = "fa-regular fa-heart";
    }
  });
  const count = document.querySelector(".favourites-count");
  if (count) count.textContent = state.favourites.size;
}
