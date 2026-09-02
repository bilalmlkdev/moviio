import { state } from "./state.js";
import { isFavorite, toggleFavorite, updateFavouritesUI } from "./favourites.js";
import { showApiMessage, showCardLoader, hideCardLoader } from "./utils.js";

let trailerOpenBusy = false;
let ytPlayer = null;
let currentTrailerMovie = null;

export async function openMovieOverlayById(movieId) {
  if (trailerOpenBusy) return;
  trailerOpenBusy = true;
  showCardLoader();
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
    document.getElementById("trailerTitle").textContent = item.title || "-";
    document.getElementById("trailerYear").textContent = (item.date || "-")
      .toString()
      .slice(0, 4);
    document.getElementById("trailerRating").textContent = item.rating || "-";
    document.getElementById("trailerOverview").textContent =
      item.overview || "No description available.";

    const overlayFavBtn = document.getElementById("overlayFavoriteBtn");
    if (overlayFavBtn) {
      const icon = overlayFavBtn.querySelector("i");
      icon.className = isFavorite(item.id)
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
    if (ytPlayer && ytPlayer.loadVideoById) {
      ytPlayer.loadVideoById(result.key);
      try {
        ytPlayer.setPlaybackQuality("hd1080");
      } catch {}
    }
    document.getElementById("trailer-overlay")?.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    showApiMessage("Error opening trailer.");
  } finally {
    trailerOpenBusy = false;
    hideCardLoader();
  }
}

export function closeTrailerOverlay() {
  document.getElementById("trailer-overlay")?.classList.add("hidden");
  if (ytPlayer) {
    try {
      ytPlayer.stopVideo();
    } catch {}
  } else {
    const iframe = document.getElementById("trailerPlayer");
    if (iframe) iframe.src = "";
  }
  trailerOpenBusy = false;
  currentTrailerMovie = null;
  const url = new URL(window.location);
  if (url.searchParams.get("movie_id")) {
    url.searchParams.delete("movie_id");
    window.history.replaceState({}, "", url);
  }
}

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

export function initTrailerControls() {
  const overlay = document.getElementById("trailer-overlay");
  const closeBtn = document.getElementById("closeTrailer");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const overlayFavBtn = document.getElementById("overlayFavoriteBtn");
  const shareBtn = document.getElementById("shareBtn");

  closeBtn?.addEventListener("click", closeTrailerOverlay);
  overlay?.addEventListener("click", (e) => {
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

  overlayFavBtn?.addEventListener("click", () => {
    if (currentTrailerMovie) {
      toggleFavorite(currentTrailerMovie);
      updateFavouritesUI();
      const icon = overlayFavBtn.querySelector("i");
      if (isFavorite(currentTrailerMovie.id))
        icon.className = "fa-solid fa-heart";
      else icon.className = "fa-regular fa-heart";
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
        .then(() => showApiMessage("📋 Movie link copied to clipboard!"))
        .catch(() => showApiMessage("Error copying link."));
    }
  });
}

export function loadYouTubeAPI() {
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
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) {
          try {
            e.target.setPlaybackQuality("hd2160");
          } catch {}
          const playPauseBtn = document.getElementById("playPauseBtn");
          if (playPauseBtn)
            playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
        } else if (e.data === YT.PlayerState.PAUSED) {
          const playPauseBtn = document.getElementById("playPauseBtn");
          if (playPauseBtn)
            playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play';
        }
      },
    },
  });
};
