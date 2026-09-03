// scripts/trailer-page.js
import { state } from "./state.js";
import { loadFavourites, isFavourite, toggleFavourite, updateFavouritesUI } from "./favourites.js";
import { showApiMessage, showCardLoader, hideCardLoader } from "./utils.js";
import { openWatchNowModal } from "./controls.js";

let ytPlayer = null;
let currentMovie = null;

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

async function loadTrailerPage(movieId) {
  showCardLoader();
  try {
    const detailsRes = await fetch(`/api/tmdb?details=${movieId}`);
    if (!detailsRes.ok) {
      showApiMessage("Movie not found.");
      hideCardLoader();
      return;
    }
    const data = await detailsRes.json();
    const item = {
      id: data.id,
      title: data.title || "",
      date: data.release_date ? data.release_date.slice(0, 4) : "",
      type: "movie",
      rating: data.vote_average ? data.vote_average.toFixed(1) : "-",
      badgeLeft: "MOVIE",
      badgeRight: data.original_language?.toUpperCase() || "",
      imgSrc: data.poster_path
        ? `https://image.tmdb.org/t/p/w400${data.poster_path}`
        : "",
      imgAlt: data.title || "",
      poster_path: data.poster_path || null,
      overview: data.overview || "",
    };

    const result = await fetchTrailerAndDetails(movieId);
    if (!result || !result.key) {
      showApiMessage("Trailer not found.");
      hideCardLoader();
      return;
    }

    currentMovie = item;
    document.title = `${item.title || "Trailer"} - Moviio`;

    document.getElementById("trailerTitle").textContent = item.title || "-";
    document.getElementById("trailerYear").textContent = (item.date || "-")
      .toString()
      .slice(0, 4);
    document.getElementById("trailerRating").textContent = item.rating || "-";
    document.getElementById("trailerOverview").textContent =
      item.overview || "No description available.";

    const overlayFavBtn = document.getElementById("overlayFavouriteBtn");
    if (overlayFavBtn) {
      const icon = overlayFavBtn.querySelector("i");
      icon.className = isFavourite(item.id)
        ? "fa-solid fa-heart"
        : "fa-regular fa-heart";
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

    const iframe = document.getElementById("trailerPlayer");
    if (iframe) {
      iframe.src = `https://www.youtube-nocookie.com/embed/${result.key}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${result.key}&enablejsapi=1`;
    }

    hideCardLoader();
  } catch (err) {
    console.error(err);
    showApiMessage("Error loading trailer.");
    hideCardLoader();
  }
}

function initControls() {
  const backBtn = document.getElementById("backToApp");
  const watchNowBtn = document.getElementById("playPauseBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const overlayFavBtn = document.getElementById("overlayFavouriteBtn");
  const shareBtn = document.getElementById("shareBtn");

  backBtn?.addEventListener("click", () => {
    // Prefer real browser history so "back" feels native; fall back to app.html
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      window.location.href = "app.html";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") backBtn?.click();
  });

  watchNowBtn?.addEventListener("click", () => {
    if (currentMovie) {
      openWatchNowModal(currentMovie.title, currentMovie.id);
    }
  });

  fullscreenBtn?.addEventListener("click", () => {
    if (ytPlayer) {
      const el = ytPlayer.getIframe();
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
    }
  });

  overlayFavBtn?.addEventListener("click", () => {
    if (currentMovie) {
      toggleFavourite(currentMovie);
      updateFavouritesUI();
      const icon = overlayFavBtn.querySelector("i");
      if (isFavourite(currentMovie.id)) icon.className = "fa-solid fa-heart";
      else icon.className = "fa-regular fa-heart";
    }
  });

  shareBtn?.addEventListener("click", () => {
    if (!currentMovie) return;
    const url = `${window.location.origin}/trailer.html?movie_id=${currentMovie.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: currentMovie.title,
          text: `Check out ${currentMovie.title} on Moviio!`,
          url,
        })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(url)
        .then(() => showApiMessage("📋 Movie link copied to clipboard!"))
        .catch(() => showApiMessage("Error copying link."));
    }
  });
}

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return;
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player("trailerPlayer", {
    events: {
      onReady: (e) => {
        try {
          e.target.setPlaybackQuality("hd2160");
        } catch {}
      },
    },
  });
};

function init() {
  loadFavourites();
  initControls();
  loadYouTubeAPI();

  const params = new URLSearchParams(window.location.search);
  const movieId = params.get("movie_id");
  if (!movieId) {
    showApiMessage("No movie specified.");
    window.location.href = "app.html";
    return;
  }
  loadTrailerPage(movieId);
}

init();
