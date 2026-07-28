(function () {
  // Core config
  const TRANS_MS = 360;
  const DRAG_THRESHOLD_PX = 40;
  const MAX_STEPS = 1;

  // DOM refs
  const container = document.querySelector(".wheel-container");
  if (!container) return;
  let track = container.querySelector(".wheel-track");
  if (!track) {
    track = document.createElement("div");
    track.className = "wheel-track";
    const existing = Array.from(container.querySelectorAll(":scope > .card"));
    existing.forEach((c) => track.appendChild(c));
    container.appendChild(track);
  }

  function centerCards() {
    Array.from(track.querySelectorAll(".card")).forEach((c) => {
      c.style.left = "50%";
      c.style.top = "50%";
    });
  }
  centerCards();

  // Centralized State
  const state = {
    feed: [],
    feedIndex: 0,
    currentQuery: "popular",
    currentPage: 1,
    totalResults: 0,
    isLoading: false,
    cache: new Map(),
    abortController: null,
    watchlist: new Map(),
    genres: [],
    selectedGenre: "",
    selectedYear: "",
    isAutoRotating: false,
    autoRotateInterval: null,
  };

  // Watchlist functions
  function loadWatchlist() {
    try {
      const stored = JSON.parse(
        localStorage.getItem("moviio_watchlist") || "[]",
      );
      stored.forEach((movie) => state.watchlist.set(String(movie.id), movie));
    } catch (e) {
      /* ignore */
    }
  }

  function saveWatchlist() {
    const movies = Array.from(state.watchlist.values());
    localStorage.setItem("moviio_watchlist", JSON.stringify(movies));
  }

  function toggleWatchlist(movie) {
    if (!movie || !movie.id) return;
    const key = String(movie.id);
    if (state.watchlist.has(key)) state.watchlist.delete(key);
    else state.watchlist.set(key, movie);
    saveWatchlist();
    updateWatchlistUI();
    if (state.currentQuery === "watchlist") fetchMovies("watchlist");
  }

  function isInWatchlist(id) {
    return state.watchlist.has(String(id));
  }

  function updateWatchlistUI() {
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

  // URL handling
  function loadFromURL() {
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
      !["top_rated", "upcoming", "watchlist"].includes(query)
    ) {
      url.searchParams.set("search", query);
    } else if (
      filter &&
      ["popular", "top_rated", "upcoming", "watchlist"].includes(filter)
    ) {
      url.searchParams.set("filter", filter);
    }
    if (genre) url.searchParams.set("genre", genre);
    if (year) url.searchParams.set("year", year);
    window.history.pushState({}, "", url);
  }

  // Fetch genres
  async function fetchGenres() {
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

  // Skeletons
  function showSkeletons() {
    const cards = track.querySelectorAll(".card");
    cards.forEach((card) => {
      card.classList.add("skeleton-loading");
      const img = card.querySelector("img");
      if (img) img.style.display = "none";
      const content = card.querySelector(".card-content");
      if (content) {
        content.innerHTML = `
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        `;
      }
      const rating = card.querySelector(".movie-rating h2");
      if (rating)
        rating.innerHTML = '<span class="skeleton skeleton-text tiny"></span>';
      const badges = card.querySelectorAll(".badge-top-left, .badge-top-right");
      badges.forEach((b) => {
        b.textContent = "";
        b.classList.add("skeleton");
        b.style.width = "40px";
        b.style.height = "12px";
      });
    });
  }

  function hideSkeletons() {
    const cards = track.querySelectorAll(".card");
    cards.forEach((card) => {
      card.classList.remove("skeleton-loading");
      const img = card.querySelector("img");
      if (img) img.style.display = "block";
    });
  }

  // Data fetching
  async function fetchPage(query, page = 1) {
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
        rating: m.vote_average ? m.vote_average.toFixed(1) : "—",
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

  async function loadMoreIntoFeed() {
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

  async function getNextItem() {
    if (!state.feed.length) return null;
    if (state.feedIndex + 5 >= state.feed.length) loadMoreIntoFeed();
    const item = state.feed[state.feedIndex % state.feed.length];
    state.feedIndex++;
    return item;
  }

  // Populate initial 7 cards safely
  function populateCards(items) {
    const cards = track.querySelectorAll(".card");
    cards.forEach((card, i) => {
      const item = items[i];
      if (!item) return;

      card.dataset.movieId = item.id;

      // Inner card content
      const content = card.querySelector(".card-content");
      if (content) {
        content.innerHTML = `
          <h3>${item.title || ""}</h3>
          <div class="movie-dateType">
            <span class="movie-data">${item.date || ""}</span> •
            <span class="what-type">${item.type || "movie"}</span>
          </div>
        `;
      }

      // Rating
      const ratingNode = card.querySelector(".movie-rating h2");
      if (ratingNode) {
        ratingNode.innerHTML = `${item.rating || "—"} <span><i class="fa-solid fa-star"></i></span>`;
      }

      // Badges
      const badgeLeft = card.querySelector(".badge-top-left");
      if (badgeLeft) {
        badgeLeft.textContent = item.badgeLeft || "MOVIE";
        badgeLeft.classList.remove("skeleton");
        badgeLeft.style.width = "";
        badgeLeft.style.height = "";
      }
      const badgeRight = card.querySelector(".badge-top-right");
      if (badgeRight) {
        badgeRight.textContent = item.badgeRight || "";
        badgeRight.classList.remove("skeleton");
        badgeRight.style.width = "";
        badgeRight.style.height = "";
      }

      // Image
      const img = card.querySelector("img");
      if (img) {
        img.src = item.imgSrc || "";
        img.alt = item.imgAlt || item.title || "";
        img.style.display = "block";
      }

      // Inject heart button
      let wlBtn = card.querySelector(".watchlist-btn");
      if (wlBtn) wlBtn.remove();
      wlBtn = document.createElement("button");
      wlBtn.className = "watchlist-btn";
      wlBtn.dataset.movieId = item.id;
      const inWl = isInWatchlist(item.id);
      if (inWl) wlBtn.classList.add("in-watchlist");
      wlBtn.innerHTML = `<i class="fa-${inWl ? "solid" : "regular"} fa-heart"></i>`;
      card.appendChild(wlBtn);

      wlBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleWatchlist(item);
      });
    });
  }

  // Create card DOM node dynamically with heart button
  function createCard(item) {
    if (!item) return null;
    const el = document.createElement("div");
    el.dataset.movieId = item.id;
    el.className = "card";
    el.style.left = "50%";
    el.style.top = "50%";
    const inWl = isInWatchlist(item.id);
    el.innerHTML = `
      <button class="watchlist-btn ${inWl ? "in-watchlist" : ""}" data-movie-id="${item.id}">
        <i class="fa-${inWl ? "solid" : "regular"} fa-heart"></i>
      </button>
      <div class="movie-details">
        <div class="details-top">
          <div class="movie-type">
            <div class="badge-top-left">${item.badgeLeft || "MOVIE"}</div>
            <div class="badge-top-right">${item.badgeRight || ""}</div>
          </div>
          <div class="movie-rating">
            <h2>${item.rating || "—"} <span><i class="fa-solid fa-star"></i></span></h2>
          </div>
        </div>
        <div class="details-bottom">
          <div class="card-content">
            <h3>${item.title || ""}</h3>
            <div class="movie-dateType">
              <span class="movie-data">${item.date || ""}</span> •
              <span class="what-type">${item.type || "movie"}</span>
            </div>
          </div>
        </div>
      </div>
      <img src="${item.imgSrc || ""}" alt="${item.imgAlt || item.title || ""}" style="display:block;">
    `;

    const wlBtn = el.querySelector(".watchlist-btn");
    if (wlBtn) {
      wlBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleWatchlist(item);
      });
    }

    return el;
  }

  // Fetch Movies
  async function fetchMovies(query) {
    if (!query || !query.trim()) query = "popular";
    state.currentQuery = query;
    state.currentPage = 1;
    state.feedIndex = 0;

    const isFilter = ["popular", "top_rated", "upcoming", "watchlist"].includes(
      query,
    );
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

    if (state.isAutoRotating) {
      stopAutoRotate();
      startAutoRotate();
    }
  }

  // Carousel logic
  function finalizeKeep7() {
    const all = Array.from(track.querySelectorAll(".card"));
    if (all.length > 7) {
      for (let i = all.length - 1; i >= 7; i--) all[i].remove();
    }
    const nodes = Array.from(track.querySelectorAll(".card")).slice(0, 7);
    nodes.forEach((n, i) => {
      n.className = `card card-${i}`;
      n.style.left = "50%";
      n.style.top = "50%";
    });
    if (nodes[3]) nodes[3].classList.add("active");
  }

  function waitForAnimation() {
    return new Promise((resolve) => setTimeout(resolve, TRANS_MS + 20));
  }

  async function singleShiftLeft() {
    if (track.classList.contains("animating")) return;
    track.classList.add("animating");
    try {
      const next = await getNextItem();
      if (!next) return;
      const newCard = createCard(next);
      newCard.classList.add("card-6");
      track.appendChild(newCard);
      const nodes = Array.from(track.querySelectorAll(".card"));
      for (let i = 0; i < 7; i++) {
        const node = nodes[i + 1];
        if (!node) continue;
        node.className = `card card-${i}`;
      }
      await waitForAnimation();
      const first = track.querySelector(".card");
      if (first) first.remove();
      finalizeKeep7();
    } finally {
      track.classList.remove("animating");
    }
  }

  async function singleShiftRight() {
    if (track.classList.contains("animating")) return;
    track.classList.add("animating");
    try {
      const next = await getNextItem();
      if (!next) return;
      const newCard = createCard(next);
      newCard.classList.add("card-0");
      track.insertBefore(newCard, track.firstChild);
      const nodes = Array.from(track.querySelectorAll(".card"));
      for (let i = 0; i < 7; i++) {
        const node = nodes[i];
        if (!node) continue;
        node.className = `card card-${i}`;
      }
      await waitForAnimation();
      const all = Array.from(track.querySelectorAll(".card"));
      while (all.length > 7) {
        all[all.length - 1].remove();
        all.pop();
      }
      finalizeKeep7();
    } finally {
      track.classList.remove("animating");
    }
  }

  async function shiftLeft(steps = 1) {
    for (let i = 0; i < Math.min(MAX_STEPS, steps); i++) {
      await singleShiftLeft();
    }
  }

  async function shiftRight(steps = 1) {
    for (let i = 0; i < Math.min(MAX_STEPS, steps); i++) {
      await singleShiftRight();
    }
  }

  // Auto-rotate controls
  function startAutoRotate() {
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

  function stopAutoRotate() {
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

  function toggleAutoRotate() {
    if (state.isAutoRotating) stopAutoRotate();
    else startAutoRotate();
  }

  // Drag logic
  let startX = 0,
    dragging = false,
    didDrag = false;
  track.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
  });
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    if (Math.abs(delta) > DRAG_THRESHOLD_PX) {
      dragging = false;
      didDrag = true;
      if (delta < 0) shiftLeft(1);
      else shiftRight(1);
      if (state.isAutoRotating) {
        stopAutoRotate();
        startAutoRotate();
      }
    }
  });
  window.addEventListener("pointerup", () => {
    dragging = false;
  });

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

  container.addEventListener("mouseenter", () => {
    if (state.isAutoRotating) stopAutoRotate();
  });

  // Parallax Tilt
  container.addEventListener("pointermove", (e) => {
    const activeCard = document.querySelector(".card.active");
    if (!activeCard) return;
    const rect = activeCard.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * -10;
    const rotateX = ((y - centerY) / centerY) * 10;
    activeCard.style.setProperty("--tilt-y", rotateY + "deg");
    activeCard.style.setProperty("--tilt-x", rotateX + "deg");
  });
  container.addEventListener("pointerleave", () => {
    const activeCard = document.querySelector(".card.active");
    if (activeCard) {
      activeCard.style.setProperty("--tilt-y", "0deg");
      activeCard.style.setProperty("--tilt-x", "0deg");
    }
  });

  // Shuffle
  document.getElementById("shuffleBtn")?.addEventListener("click", async () => {
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
          rating: m.vote_average ? m.vote_average.toFixed(1) : "—",
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
  });

  // Search & Filters
  let searchTimer = null;
  function debouncedSearch(value) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => fetchMovies(value.trim()), 200);
  }

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
      fetchMovies(filter);
    });
    if (btn.classList.contains("active")) moveIndicator(btn);
  });

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

  // Trailer Overlay
  const overlay = document.getElementById("trailer-overlay");
  const iframe = document.getElementById("trailerPlayer");
  const closeBtn = document.getElementById("closeTrailer");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const overlayWlBtn = document.getElementById("overlayWatchlistBtn");
  const shareBtn = document.getElementById("shareBtn");

  let trailerOpenBusy = false;
  let ytPlayer = null;
  let currentTrailerMovie = null;

  (function loadYTApi() {
    if (window.YT && window.YT.Player) return;
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  })();

  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player("trailerPlayer", {
      events: {
        onReady: (e) => {
          try {
            e.target.setPlaybackQuality("hd2160");
          } catch {}
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) {
            try {
              e.target.setPlaybackQuality("hd2160");
            } catch {}
            if (playPauseBtn)
              playPauseBtn.innerHTML =
                '<i class="fa-solid fa-pause"></i> Pause';
          } else if (e.data === YT.PlayerState.PAUSED) {
            if (playPauseBtn)
              playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
          }
        },
      },
    });
  };

  async function fetchTrailerAndDetails(movieId) {
    try {
      const trailerRes = await fetch(`/api/tmdb?trailer=${movieId}`);
      if (!trailerRes.ok) return null;
      const trailerData = await trailerRes.json();
      const pick =
        trailerData.results?.find(
          (v) => v.type === "Trailer" && v.official && v.site === "YouTube",
        ) ||
        trailerData.results?.find(
          (v) => v.type === "Trailer" && v.site === "YouTube",
        ) ||
        trailerData.results?.find((v) => v.site === "YouTube");
      const key = pick ? pick.key : null;

      const detailsRes = await fetch(`/api/tmdb?details=${movieId}`);
      let details = null;
      if (detailsRes.ok) details = await detailsRes.json();
      return { key, details };
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async function openMovieOverlayById(movieId) {
    if (trailerOpenBusy) return;
    trailerOpenBusy = true;
    try {
      let item = state.feed.find((m) => String(m.id) === String(movieId));
      if (!item) {
        const res = await fetch(`/api/tmdb?details=${movieId}`);
        const data = await res.json();
        if (data) {
          item = {
            id: data.id,
            title: data.title || "",
            date: data.release_date ? data.release_date.slice(0, 4) : "",
            type: "movie",
            rating: data.vote_average ? data.vote_average.toFixed(1) : "—",
            badgeLeft: "MOVIE",
            badgeRight: data.original_language?.toUpperCase() || "",
            imgSrc: data.poster_path
              ? `https://image.tmdb.org/t/p/w400${data.poster_path}`
              : "",
            imgAlt: data.title || "",
            poster_path: data.poster_path || null,
            overview: data.overview || "",
          };
        }
      }

      if (!item) {
        showApiMessage("Movie not found.");
        return;
      }

      const result = await fetchTrailerAndDetails(movieId);
      if (!result || !result.key) {
        showApiMessage("Trailer not found.");
        return;
      }

      currentTrailerMovie = item;
      document.getElementById("trailerTitle").textContent = item.title || "—";
      document.getElementById("trailerYear").textContent = (
        item.release_date ||
        item.date ||
        "—"
      )
        .toString()
        .slice(0, 4);
      document.getElementById("trailerRating").textContent =
        item.vote_average || item.rating || "—";
      document.getElementById("trailerOverview").textContent =
        item.overview || "No description available.";

      if (overlayWlBtn) {
        if (isInWatchlist(item.id)) {
          overlayWlBtn.querySelector("i").className = "fa-solid fa-heart";
        } else {
          overlayWlBtn.querySelector("i").className = "fa-regular fa-heart";
        }
      }

      const metaContainer = document.querySelector(".meta");
      if (metaContainer) {
        metaContainer
          .querySelectorAll(
            ".runtime-info, .cast-info, .genre-info, .director-info",
          )
          .forEach((el) => el.remove());

        const details = result.details;
        if (details) {
          if (details.runtime) {
            const hours = Math.floor(details.runtime / 60);
            const mins = details.runtime % 60;
            const runtimeEl = document.createElement("span");
            runtimeEl.className = "runtime-info";
            runtimeEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${hours}h ${mins}m`;
            metaContainer.appendChild(runtimeEl);
          }
          if (details.credits) {
            const director = details.credits.crew?.find(
              (c) => c.job === "Director",
            );
            if (director) {
              const dirEl = document.createElement("span");
              dirEl.className = "director-info";
              dirEl.innerHTML = `<i class="fa-solid fa-video"></i> ${director.name}`;
              metaContainer.appendChild(dirEl);
            }
            const castList = details.credits.cast
              ?.slice(0, 5)
              .map((c) => c.name)
              .join(", ");
            if (castList) {
              const castEl = document.createElement("span");
              castEl.className = "cast-info";
              castEl.innerHTML = `<i class="fa-solid fa-user"></i> ${castList}`;
              metaContainer.appendChild(castEl);
            }
          }
          if (details.genres) {
            const genreNames = details.genres.map((g) => g.name).join(" • ");
            const genreEl = document.createElement("span");
            genreEl.className = "genre-info";
            genreEl.innerHTML = `<i class="fa-solid fa-film"></i> ${genreNames}`;
            metaContainer.appendChild(genreEl);
          }
        }
      }

      if (iframe) {
        iframe.src = `https://www.youtube-nocookie.com/embed/${result.key}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${result.key}&enablejsapi=1`;
      }
      if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(result.key);
        try {
          ytPlayer.setPlaybackQuality("hd1080");
        } catch {}
      }
      if (overlay) overlay.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      showApiMessage("Error opening trailer.");
    } finally {
      trailerOpenBusy = false;
    }
  }

  function closeTrailerOverlay() {
    if (overlay) overlay.classList.add("hidden");
    if (ytPlayer) {
      try {
        ytPlayer.stopVideo();
      } catch {}
    } else if (iframe) {
      iframe.src = "";
    }
    trailerOpenBusy = false;
    currentTrailerMovie = null;
    const url = new URL(window.location);
    if (url.searchParams.get("movie_id")) {
      url.searchParams.delete("movie_id");
      window.history.replaceState({}, "", url);
    }
  }

  if (closeBtn) closeBtn.addEventListener("click", closeTrailerOverlay);
  if (overlay)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeTrailerOverlay();
    });

  playPauseBtn?.addEventListener("click", () => {
    if (!ytPlayer) return;
    if (ytPlayer.getPlayerState() === YT.PlayerState.PLAYING)
      ytPlayer.pauseVideo();
    else ytPlayer.playVideo();
  });

  fullscreenBtn?.addEventListener("click", () => {
    if (ytPlayer) {
      const el = ytPlayer.getIframe();
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    }
  });

  overlayWlBtn?.addEventListener("click", () => {
    if (currentTrailerMovie) {
      toggleWatchlist(currentTrailerMovie);
      updateWatchlistUI();
      if (isInWatchlist(currentTrailerMovie.id)) {
        overlayWlBtn.querySelector("i").className = "fa-solid fa-heart";
      } else {
        overlayWlBtn.querySelector("i").className = "fa-regular fa-heart";
      }
    }
  });

  shareBtn?.addEventListener("click", () => {
    if (!currentTrailerMovie) return;
    const url = `https://moviio.vercel.app/?movie_id=${currentTrailerMovie.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: currentTrailerMovie.title,
          text: `Check out ${currentTrailerMovie.title} on Moviio!`,
          url: url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          showApiMessage("📋 Movie link copied to clipboard!");
        })
        .catch(() => {
          showApiMessage("Error copying link.");
        });
    }
  });

  // Card click handler (Opening trailer vs heart button click)
  track.addEventListener("click", async (e) => {
    if (didDrag) {
      didDrag = false;
      return;
    }
    if (e.target.closest(".watchlist-btn")) return; // Ignore card open if heart icon clicked
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
    } else if (e.key === "Escape") closeTrailerOverlay();
  });

  // API message popup
  function showApiMessage(text) {
    const box = document.getElementById("api-status");
    if (!box) {
      console.warn(text);
      return;
    }
    box.textContent = text;
    box.style.display = "block";
    setTimeout(() => {
      box.style.display = "none";
    }, 3000);
  }

  // Initialize
  loadWatchlist();
  fetchGenres();
  loadFromURL();

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

    if (search && search.trim()) fetchMovies(search.trim());
    else if (
      filter &&
      ["popular", "top_rated", "upcoming", "watchlist"].includes(filter)
    )
      fetchMovies(filter);
    else fetchMovies("popular");
  });
})();
