import { state } from "./state.js";
import { loadWatchlist, updateWatchlistUI } from "./watchlist.js";
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
} from "./controls.js";
import { shiftLeft, shiftRight } from "./carousel.js";
import {
  openMovieOverlayById,
  initTrailerControls,
  loadYouTubeAPI,
} from "./trailer.js";
import { initWelcomeModal } from "./modal.js";
import { showApiMessage } from "./utils.js";

// Initialize everything
async function init() {
  // Load watchlist and update UI
  loadWatchlist();
  updateWatchlistUI();

  // Fetch genres
  await fetchGenres();

  // Initialize filters and dropdowns
  initFilters();
  initDropdowns();

  // Initialize trailer controls and load YouTube API
  initTrailerControls();
  loadYouTubeAPI();

  // Initialize welcome modal
  initWelcomeModal();

  // Set up event listeners for arrows, auto-rotate, shuffle, search
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

  document
    .getElementById("autoRotateBtn")
    ?.addEventListener("click", toggleAutoRotate);
  document
    .getElementById("shuffleBtn")
    ?.addEventListener("click", shuffleMovies);

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

  // Genre and year changes
  document.getElementById("genreSelect")?.addEventListener("change", (e) => {
    state.selectedGenre = e.target.value;
    if (state.currentQuery === "watchlist") state.currentQuery = "popular";
    fetchMovies(state.currentQuery);
  });
  document.getElementById("yearSelect")?.addEventListener("change", (e) => {
    state.selectedYear = e.target.value;
    if (state.currentQuery === "watchlist") state.currentQuery = "popular";
    fetchMovies(state.currentQuery);
  });

  // Shortcuts dropdown toggle
  const shortcutsBtn = document.getElementById("shortcutsBtn");
  const shortcutsDropdown = document.getElementById("shortcutsDropdown");
  shortcutsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    shortcutsDropdown?.classList.toggle("hidden");
    shortcutsBtn.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (
      shortcutsDropdown &&
      !shortcutsDropdown.classList.contains("hidden") &&
      !shortcutsDropdown.contains(e.target) &&
      e.target !== shortcutsBtn
    ) {
      shortcutsDropdown.classList.add("hidden");
      shortcutsBtn?.classList.remove("active");
    }
  });

  // Close dropdowns on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".custom-dropdown")) {
      document
        .querySelectorAll(".custom-dropdown.open")
        .forEach((el) => el.classList.remove("open"));
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document
        .querySelectorAll(".custom-dropdown.open")
        .forEach((el) => el.classList.remove("open"));
    }
  });

  // Card click handler
  const track = document.querySelector(".wheel-track");
  track?.addEventListener("click", async (e) => {
    if (e.target.closest(".watchlist-btn")) return;
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

  // Keyboard navigation
  initKeyboardNav();

  // Load initial content from URL
  const params = new URLSearchParams(window.location.search);
  const search = params.get("search");
  const filter = params.get("filter");
  const genre = params.get("genre");
  const year = params.get("year");
  const movieId = params.get("movie_id");

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
  } else if (
    filter &&
    ["popular", "top_rated", "upcoming", "watchlist"].includes(filter)
  ) {
    state.currentQuery = filter;
    document
      .querySelector(`.filter-btn[data-attribute="${filter}"]`)
      ?.classList.add("active");
    document.querySelector(".filter-btn.active")?.classList.remove("active");
    fetchMovies(filter);
  } else {
    fetchMovies("popular");
  }

  // Popstate handler
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
    else if (
      filter &&
      ["popular", "top_rated", "upcoming", "watchlist"].includes(filter)
    )
      fetchMovies(filter);
    else fetchMovies("popular");
  });
}

// Start the app
init();
