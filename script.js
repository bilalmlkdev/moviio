(function () {
  //  Core config
  const TRANS_MS = 360;
  const DRAG_THRESHOLD_PX = 40;
  const MAX_STEPS = 1;

  //  DOM refs
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

  //  Centralized State
  const state = {
    feed: [],
    feedIndex: 0,
    currentQuery: "popular",
    currentPage: 1,
    totalResults: 0,
    isLoading: false,
    cache: new Map(),
    abortController: null,
  };

  //  Load URL params on start
  function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    const filter = params.get("filter");
    if (search && search.trim()) {
      state.currentQuery = search.trim();
      fetchMovies(state.currentQuery);
    } else if (
      filter &&
      ["popular", "top_rated", "upcoming"].includes(filter)
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

  //  Update URL when search/filter changes
  function updateURL(query, filter) {
    const url = new URL(window.location);
    if (
      query &&
      query !== "popular" &&
      !["top_rated", "upcoming"].includes(query)
    ) {
      url.searchParams.set("search", query);
    } else {
      url.searchParams.delete("search");
    }
    if (filter && ["popular", "top_rated", "upcoming"].includes(filter)) {
      url.searchParams.set("filter", filter);
    } else {
      url.searchParams.delete("filter");
    }
    window.history.pushState({}, "", url);
  }

  //  Skeleton UI
  function showSkeletons() {
    const cards = track.querySelectorAll(".card");
    cards.forEach((card) => {
      card.classList.add("skeleton-loading");
      // Clear previous content but keep structure
      const img = card.querySelector("img");
      if (img) {
        img.style.display = "none";
      }
      const content = card.querySelector(".card-content");
      if (content) {
        content.innerHTML = `
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        `;
      }
      const rating = card.querySelector(".movie-rating h2");
      if (rating) {
        rating.innerHTML = '<span class="skeleton skeleton-text tiny"></span>';
      }
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
      // The actual data will be injected by populateCards
    });
  }

  //  Data fetching with AbortController
  async function fetchPage(query, page = 1) {
    if (state.abortController) {
      state.abortController.abort();
    }
    state.abortController = new AbortController();

    const key = `${query}::${page}`;
    if (state.cache.has(key)) return state.cache.get(key);

    let url;
    const isFilter = ["popular", "top_rated", "upcoming"].includes(query);
    if (isFilter) {
      url = `/api/tmdb?mode=${query}&page=${page}`;
    } else {
      url = `/api/tmdb?search=${encodeURIComponent(query)}&page=${page}`;
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

  //  Load more infinite
  async function loadMoreIntoFeed() {
    if (state.isLoading) return;
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
    if (state.feedIndex + 5 >= state.feed.length) {
      loadMoreIntoFeed();
    }
    const item = state.feed[state.feedIndex % state.feed.length];
    state.feedIndex++;
    return item;
  }

  //  Populate cards with actual data (after skeleton)
  function populateCards(items) {
    const cards = track.querySelectorAll(".card");
    cards.forEach((card, i) => {
      const item = items[i];
      if (!item) return;
      card.dataset.movieId = item.id;
      card.querySelector("h3").textContent = item.title;
      card.querySelector(".movie-data").textContent = item.date;
      card.querySelector(".what-type").textContent = item.type;
      const ratingNode = card.querySelector(".movie-rating h2");
      if (ratingNode) {
        ratingNode.innerHTML = `${item.rating} <span><i class="fa-solid fa-star"></i></span>`;
      }
      card.querySelector(".badge-top-left").textContent = item.badgeLeft;
      card.querySelector(".badge-top-right").textContent = item.badgeRight;
      const img = card.querySelector("img");
      if (img) {
        img.src = item.imgSrc;
        img.alt = item.imgAlt;
        img.style.display = "block";
      }
      // Restore card-content structure
      const content = card.querySelector(".card-content");
      if (content) {
        content.innerHTML = `
          <h3>${item.title}</h3>
          <div class="movie-dateType">
            <span class="movie-data">${item.date}</span> •
            <span class="what-type">${item.type}</span>
          </div>
        `;
      }
    });
  }

  //  Main fetchMovies (URL sync, skeletons, populate)
  async function fetchMovies(query) {
    if (!query || !query.trim()) query = "popular";
    state.currentQuery = query;
    state.currentPage = 1;
    state.feedIndex = 0;

    // Update URL
    const isFilter = ["popular", "top_rated", "upcoming"].includes(query);
    updateURL(isFilter ? "" : query, isFilter ? query : "");

    // Show skeletons
    showSkeletons();

    const first = await fetchPage(query, 1);
    state.feed = first.items || [];
    state.totalResults = first.total;

    // Preload next page
    loadMoreIntoFeed();

    // Populate cards
    populateCards(state.feed.slice(0, 7));
    hideSkeletons();

    finalizeKeep7();
  }

  //  card creation logic
  function createCard(item) {
    if (!item) return null;
    const el = document.createElement("div");
    el.dataset.movieId = item.id;
    el.className = "card";
    el.style.left = "50%";
    el.style.top = "50%";
    el.innerHTML = `
      <div class="movie-details">
        <div class="details-top">
          <div class="movie-type">
            <div class="badge-top-left">${item.badgeLeft || ""}</div>
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
              <span class="what-type">${item.type || ""}</span>
            </div>
          </div>
        </div>
      </div>
      <img src="${item.imgSrc || ""}" alt="${item.imgAlt || ""}">
    `;
    return el;
  }

  //  shift logic
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

  //  Drag 
  let startX = 0;
  let dragging = false;
  let didDrag = false;

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
    }
  });

  window.addEventListener("pointerup", () => {
    dragging = false;
  });

  document
    .querySelector(".move-right")
    ?.addEventListener("click", () => shiftRight(1));
  document
    .querySelector(".move-left")
    ?.addEventListener("click", () => shiftLeft(1));

  //  Search & Filters (with URL sync)
  let searchTimer = null;
  function debouncedSearch(value) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => fetchMovies(value.trim()), 200);
  }

  const searchBox = document.getElementById("searchBox");
  const searchBtn = document.getElementById("searchBtn");

  searchBtn?.addEventListener("click", () => {
    const value = searchBox?.value?.trim() || "";
    debouncedSearch(value || "");
  });

  searchBox?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const value = e.target.value.trim();
      debouncedSearch(value || "");
    }
  });

  const buttons = document.querySelectorAll(".filter-btn");
  const indicator = document.querySelector(".active-indicator");

  function moveIndicator(btn) {
    if (!indicator) return;
    const rect = btn.getBoundingClientRect();
    const parentRect = btn.parentElement.getBoundingClientRect();
    indicator.style.width = rect.width + "px";
    indicator.style.left = rect.left - parentRect.left + "px";
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".filter-btn.active")?.classList.remove("active");
      btn.classList.add("active");
      moveIndicator(btn);
      const filter = btn.getAttribute("data-attribute");
      // Update URL filter param
      const url = new URL(window.location);
      url.searchParams.set("filter", filter);
      url.searchParams.delete("search");
      window.history.pushState({}, "", url);
      fetchMovies(filter);
    });
    if (btn.classList.contains("active")) moveIndicator(btn);
  });

  //  Enhanced Trailer Overlay (fetch details, runtime, cast)
  const overlay = document.getElementById("trailer-overlay");
  const iframe = document.getElementById("trailerPlayer");
  const closeBtn = document.getElementById("closeTrailer");

  let trailerOpenBusy = false;
  let ytPlayer = null;

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
          }
        },
      },
    });
  };

  async function fetchTrailerAndDetails(movieId) {
    try {
      // Fetch trailer
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

      // Fetch details (runtime, cast, genres)
      const detailsRes = await fetch(`/api/tmdb?details=${movieId}`);
      let details = null;
      if (detailsRes.ok) {
        details = await detailsRes.json();
      }
      return { key, details };
    } catch (err) {
      console.error(err);
      return null;
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
  }

  if (closeBtn) closeBtn.addEventListener("click", closeTrailerOverlay);
  if (overlay)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeTrailerOverlay();
    });

  //  Keyboard Controls
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      shiftLeft(1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      shiftRight(1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const active = document.querySelector(".card.active");
      if (active) active.click();
    } else if (e.key === "Escape") {
      closeTrailerOverlay();
    }
  });

  //  Card click to open trailer (updated to show details)
  track.addEventListener("click", async (e) => {
    if (didDrag) {
      didDrag = false;
      return;
    }
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
    if (trailerOpenBusy) return;
    trailerOpenBusy = true;

    try {
      const result = await fetchTrailerAndDetails(movieId);
      if (!result || !result.key) {
        showApiMessage("Trailer not found for this movie.");
        return;
      }

      // Fill title info
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

      // Fill enhanced details (runtime, cast)
      const details = result.details;
      const metaContainer = document.querySelector(".meta");
      if (details && details.runtime) {
        const hours = Math.floor(details.runtime / 60);
        const minutes = details.runtime % 60;
        const runtimeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        let runtimeEl = metaContainer.querySelector(".runtime-info");
        if (!runtimeEl) {
          runtimeEl = document.createElement("span");
          runtimeEl.className = "runtime-info";
          runtimeEl.innerHTML = `<i class="fa-regular fa-clock"></i> `;
          metaContainer.appendChild(runtimeEl);
        }
        runtimeEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${runtimeStr}`;
      }
      if (details && details.credits && details.credits.cast) {
        const castList = details.credits.cast
          .slice(0, 5)
          .map((c) => c.name)
          .join(", ");
        let castEl = metaContainer.querySelector(".cast-info");
        if (!castEl) {
          castEl = document.createElement("span");
          castEl.className = "cast-info";
          castEl.innerHTML = `<i class="fa-solid fa-user"></i> `;
          metaContainer.appendChild(castEl);
        }
        castEl.innerHTML = `<i class="fa-solid fa-user"></i> ${castList}`;
      }
      if (details && details.genres) {
        const genreNames = details.genres.map((g) => g.name).join(" • ");
        let genreEl = metaContainer.querySelector(".genre-info");
        if (!genreEl) {
          genreEl = document.createElement("span");
          genreEl.className = "genre-info";
          genreEl.innerHTML = `<i class="fa-solid fa-film"></i> `;
          metaContainer.appendChild(genreEl);
        }
        genreEl.innerHTML = `<i class="fa-solid fa-film"></i> ${genreNames}`;
      }

      // Set iframe
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
      console.error("Error opening trailer:", err);
      showApiMessage("Error opening trailer.");
    } finally {
      trailerOpenBusy = false;
    }
  });

  //  Utility: API message
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

  //  Initialize
  loadFromURL();

  // Handle browser back/forward buttons (URL sync)
  window.addEventListener("popstate", () => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search");
    const filter = params.get("filter");
    if (search && search.trim()) {
      fetchMovies(search.trim());
    } else if (
      filter &&
      ["popular", "top_rated", "upcoming"].includes(filter)
    ) {
      fetchMovies(filter);
    } else {
      fetchMovies("popular");
    }
  });
})();
