import { state } from "./state.js";
import { fetchPage, loadMoreIntoFeed } from "./api.js";
import { showSkeletons, hideSkeletons, populateCards } from "./ui.js";
import { finalizeKeep7, shiftLeft, shiftRight } from "./carousel.js";
import { showApiMessage } from "./utils.js";
import { toggleFavorite } from "./favorites.js";
import { closeTrailerOverlay } from "./trailer.js";

export async function fetchMovies(query) {
  if (!query || !query.trim()) query = "popular";
  state.currentQuery = query;
  state.currentPage = 1;
  state.feedIndex = 0;

  const isFilter = ["popular", "top_rated", "upcoming"].includes(query);
  updateURL(
    isFilter ? "" : query,
    isFilter ? query : "",
    state.selectedGenre,
    state.selectedYear,
  );

  showSkeletons();
  const first = await fetchPage(query, 1);
  state.feed = first.items || [];
  state.totalResults = first.total;
  loadMoreIntoFeed();
  populateCards(state.feed.slice(0, 7));
  hideSkeletons();
  finalizeKeep7();

  const container = document.querySelector(".wheel-container");
  const emptyStateEl = document.getElementById("emptyState");
  const isEmptyFavorites = query === "favorites" && state.feed.length === 0;
  if (container) container.classList.toggle("is-empty", isEmptyFavorites);
  if (emptyStateEl) emptyStateEl.classList.toggle("hidden", !isEmptyFavorites);

  if (state.isAutoRotating) {
    stopAutoRotate();
    startAutoRotate();
  }
}

function updateURL(query, filter, genre, year) {
  const url = new URL(window.location);
  url.searchParams.delete("search");
  url.searchParams.delete("filter");
  url.searchParams.delete("genre");
  url.searchParams.delete("year");
  url.searchParams.delete("movie_id");

  if (
    query &&
    query !== "popular" &&
    !["top_rated", "upcoming"].includes(query)
  ) {
    url.searchParams.set("search", query);
  } else if (filter && ["popular", "top_rated", "upcoming"].includes(filter)) {
    url.searchParams.set("filter", filter);
  }
  if (genre) url.searchParams.set("genre", genre);
  if (year) url.searchParams.set("year", year);
  window.history.pushState({}, "", url);
}

export function startAutoRotate() {
  if (state.autoRotateInterval) clearInterval(state.autoRotateInterval);
  state.isAutoRotating = true;
  const btn = document.getElementById("autoRotateBtn");
  if (btn) {
    const icon = btn.querySelector("i");
    if (icon) icon.className = "fa-solid fa-pause";
  }
  state.autoRotateInterval = setInterval(() => {
    if (!state.isAutoRotating) return;
    shiftLeft(1);
  }, 800);
}

export function stopAutoRotate() {
  state.isAutoRotating = false;
  if (state.autoRotateInterval) {
    clearInterval(state.autoRotateInterval);
    state.autoRotateInterval = null;
  }
  const btn = document.getElementById("autoRotateBtn");
  if (btn) {
    const icon = btn.querySelector("i");
    if (icon) icon.className = "fa-solid fa-play";
  }
}

export function toggleAutoRotate() {
  if (state.isAutoRotating) stopAutoRotate();
  else startAutoRotate();
}

let searchTimer = null;
export function debouncedSearch(value) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchMovies(value.trim()), 200);
}

export function initFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const indicator = document.querySelector(".active-indicator");
  function moveIndicator(btn) {
    if (!indicator) return;
    const rect = btn.getBoundingClientRect();
    const parentRect = btn.parentElement.getBoundingClientRect();
    indicator.style.width = rect.width + "px";
    indicator.style.left = rect.left - parentRect.left + "px";
  }
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".filter-btn.active")?.classList.remove("active");
      btn.classList.add("active");
      moveIndicator(btn);
      const filter = btn.getAttribute("data-attribute");
      state.selectedGenre = "";
      state.selectedYear = "";
      const genreSel = document.getElementById("genreSelect");
      const yearSel = document.getElementById("yearSelect");
      if (genreSel) genreSel.value = "";
      if (yearSel) yearSel.value = "";
      window.__syncDropdownLabels?.();
      fetchMovies(filter);
    });
    if (btn.classList.contains("active")) moveIndicator(btn);
  });
}

const dropdownSyncers = [];
function initCustomDropdown(wrapperId) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;
  const select = wrapper.querySelector("select");
  const trigger = wrapper.querySelector(".dropdown-trigger");
  const valueLabel = wrapper.querySelector(".dropdown-value");
  const menu = wrapper.querySelector(".dropdown-menu");

  function renderOptions() {
    menu.innerHTML = "";
    Array.from(select.options).forEach((opt) => {
      const item = document.createElement("div");
      item.className =
        "dropdown-option" + (opt.value === select.value ? " selected" : "");
      item.setAttribute("role", "option");
      item.textContent = opt.textContent;
      item.addEventListener("click", () => {
        if (select.value !== opt.value) {
          select.value = opt.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        syncLabel();
        closeDropdown();
      });
      menu.appendChild(item);
    });
  }

  function syncLabel() {
    const selectedOpt = select.options[select.selectedIndex];
    valueLabel.textContent = selectedOpt ? selectedOpt.textContent : "";
    menu.querySelectorAll(".dropdown-option").forEach((el, i) => {
      el.classList.toggle(
        "selected",
        select.options[i] && select.options[i].value === select.value,
      );
    });
  }

  function openDropdown() {
    document.querySelectorAll(".custom-dropdown.open").forEach((el) => {
      if (el !== wrapper) el.classList.remove("open");
    });
    wrapper.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
  }

  function closeDropdown() {
    wrapper.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (wrapper.classList.contains("open")) closeDropdown();
    else {
      renderOptions();
      openDropdown();
    }
  });

  select.addEventListener("change", syncLabel);
  const observer = new MutationObserver(() => {
    renderOptions();
    syncLabel();
  });
  observer.observe(select, { childList: true });

  renderOptions();
  syncLabel();
  dropdownSyncers.push(syncLabel);
}

export function initDropdowns() {
  initCustomDropdown("genreDropdown");
  initCustomDropdown("yearDropdown");
  window.__syncDropdownLabels = () => dropdownSyncers.forEach((fn) => fn());
}

export async function shuffleMovies() {
  const randomPage = Math.floor(Math.random() * 500) + 1;
  showApiMessage("🎲 Shuffling the deck...");
  const url = `/api/tmdb?discover=1&page=${randomPage}&sort_by=popularity.desc`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
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
      state.feed = items;
      state.feedIndex = 0;
      state.currentQuery = "random";
      populateCards(state.feed.slice(0, 7));
      finalizeKeep7();
    } else {
      showApiMessage("No movies found on that page, try again!");
    }
  } catch (err) {
    console.error(err);
    showApiMessage("Error shuffling movies.");
  }
}

export function initFavoritesPopup() {
  const popup = document.getElementById("favoritesPopup");
  const btn = document.getElementById("favoritesBtn");
  const closeBtn = document.getElementById("favoritesCloseBtn");
  const list = document.getElementById("favoritesList");

  function renderFavorites() {
    list.innerHTML = "";
    const favorites = Array.from(state.favorites.values());
    if (favorites.length === 0) {
      list.innerHTML = '<p class="empty-favorites">No favourites yet.</p>';
      return;
    }
    favorites.forEach((movie) => {
      const item = document.createElement("div");
      item.className = "favorite-item";
      item.innerHTML = `
        <img src="${movie.imgSrc || ""}" alt="${movie.title}" />
        <div class="fav-info">
          <h4>${movie.title}</h4>
          <span>${movie.date || ""}</span>
        </div>
        <button class="remove-fav" data-id="${movie.id}"><i class="fa-solid fa-xmark"></i></button>
      `;
      item.querySelector(".remove-fav").addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(movie);
        renderFavorites();
      });
      list.appendChild(item);
    });
  }

  btn.addEventListener("click", () => {
    popup.classList.toggle("hidden");
    renderFavorites();
  });

  closeBtn.addEventListener("click", () => popup.classList.add("hidden"));
  popup.addEventListener("click", (e) => {
    if (e.target === popup) popup.classList.add("hidden");
  });
}

export function initKeyboardNav() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      shiftLeft(1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      shiftRight(1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      document.querySelector(".card.active")?.click();
    } else if (e.key === "Escape") {
      closeTrailerOverlay();
      document.getElementById("shortcutsDropdown")?.classList.add("hidden");
      document.getElementById("shortcutsBtn")?.classList.remove("active");
    }
  });
}
