// scripts/main.js
import { state } from "./state.js";
import { loadFavourites, updateFavouritesUI } from "./favourites.js";
import { fetchGenres } from "./api.js";
import {
  fetchMovies,
  initFilters,
  initDropdowns,
  startAutoRotate,
  stopAutoRotate,
  toggleAutoRotate,
  debouncedSearch,
  shuffleMovies,
  initKeyboardNav,
  initFavouritesPopup,
} from "./controls.js";
import { shiftLeft, shiftRight, initDrag, wasDragMoved } from "./carousel.js";
import {
  openMovieOverlayById,
  initTrailerControls,
  loadYouTubeAPI,
} from "./trailer.js";
import { initWelcomeModal, initInstructionsModal } from "./modal.js";
import { showApiMessage } from "./utils.js";

async function init() {
  loadFavourites();
  updateFavouritesUI();

  await fetchGenres();

  initFilters();
  initDropdowns();
  initTrailerControls();
  loadYouTubeAPI();
  initWelcomeModal();
  initInstructionsModal();
  initFavouritesPopup();

  //  Drag support
  initDrag();

  // Arrows
  document.querySelector(".move-right")?.addEventListener("click", () => {
    shiftRight(1);
    if (state.isAutoRotating) {
      stopAutoRotate();
      startAutoRotate();
    }
  });

  document.querySelector(".move-left")?.addEventListener("click", () => {
    shiftLeft(1);
    if (state.isAutoRotating) {
      stopAutoRotate();
      startAutoRotate();
    }
  });

  // Header buttons
  document
    .getElementById("autoRotateBtn")
    ?.addEventListener("click", toggleAutoRotate);
  document
    .getElementById("shuffleBtn")
    ?.addEventListener("click", shuffleMovies);

  // Search
  const searchBox = document.getElementById("searchBox");
  const searchBtn = document.getElementById("searchBtn");
  searchBtn?.addEventListener("click", () => {
    const v = searchBox?.value?.trim() || "";
    debouncedSearch(v || "");
  });
  searchBox?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = e.target.value.trim();
      debouncedSearch(v || "");
    }
  });

  // Genre & year
  document.getElementById("genreSelect")?.addEventListener("change", (e) => {
    state.selectedGenre = e.target.value;
    if (state.currentQuery === "favourites") state.currentQuery = "popular";
    if (searchBox) searchBox.value = "";
    fetchMovies(state.currentQuery);
  });
  document.getElementById("yearSelect")?.addEventListener("change", (e) => {
    state.selectedYear = e.target.value;
    if (state.currentQuery === "favourites") state.currentQuery = "popular";
    if (searchBox) searchBox.value = "";
    fetchMovies(state.currentQuery);
  });

  // Card click – skip if a drag just happened
  const track = document.querySelector(".wheel-track");
  track?.addEventListener("click", async (e) => {
    if (e.target.closest(".favourite-btn")) return;
    if (wasDragMoved()) return; // <-- PREVENT CLICK AFTER DRAG
    const card = e.target.closest(".card");
    if (!card) return;
    let movieId = card.dataset.movieId || null;
    let item = null;
    if (!movieId) {
      const title = card.querySelector("h3")?.textContent?.trim();
      if (title) {
        item = state.feed.find(
          (m) => String(m.title).trim() === String(title).trim(),
        );
        if (item) {
          movieId = item.id;
          card.dataset.movieId = movieId;
        }
      }
    } else {
      item = state.feed.find((m) => String(m.id) === String(movieId));
    }
    if (!movieId || !item) {
      showApiMessage("Movie data missing.");
      return;
    }
    openMovieOverlayById(movieId);
  });

  // Keyboard nav
  initKeyboardNav();

  //  Initial load from URL
  const params = new URLSearchParams(window.location.search);
  const search = params.get("search");
  const filter = params.get("filter");
  const genre = params.get("genre");
  const year = params.get("year");
  const movieId = params.get("movie_id");

  // Populate search box if a search query came from landing page
  if (search && searchBox) {
    searchBox.value = search;
  }

  if (genre) state.selectedGenre = genre;
  if (year) state.selectedYear = year;

  if (movieId) {
    openMovieOverlayById(movieId);
    fetchMovies("popular");
    return;
  }

  if (search && search.trim()) {
    state.currentQuery = search.trim();
    fetchMovies(state.currentQuery);
  } else if (filter && ["popular", "top_rated", "upcoming"].includes(filter)) {
    state.currentQuery = filter;
    document.querySelector(".filter-btn.active")?.classList.remove("active");
    document
      .querySelector(`.filter-btn[data-attribute="${filter}"]`)
      ?.classList.add("active");
    fetchMovies(filter);
  } else {
    fetchMovies("popular");
  }

  // Popstate
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    const filter = params.get("filter");
    const genre = params.get("genre");
    const year = params.get("year");
    const movieId = params.get("movie_id");

    if (movieId) {
      openMovieOverlayById(movieId);
      return;
    }

    state.selectedGenre = genre || "";
    state.selectedYear = year || "";
    const genreSel = document.getElementById("genreSelect");
    const yearSel = document.getElementById("yearSelect");
    if (genreSel) genreSel.value = state.selectedGenre;
    if (yearSel) yearSel.value = state.selectedYear;
    window.__syncDropdownLabels?.();

    if (search && search.trim()) fetchMovies(search.trim());
    else if (filter && ["popular", "top_rated", "upcoming"].includes(filter))
      fetchMovies(filter);
    else fetchMovies("popular");
  });
}

init();
