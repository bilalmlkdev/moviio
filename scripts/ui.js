import { isFavourite, toggleFavourite } from "./favourites.js";

export function showSkeletons() {
  const track = document.querySelector(".wheel-track");
  if (!track) return;
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

export function hideSkeletons() {
  const track = document.querySelector(".wheel-track");
  if (!track) return;
  const cards = track.querySelectorAll(".card");
  cards.forEach((card) => {
    card.classList.remove("skeleton-loading");
    const img = card.querySelector("img");
    if (img) img.style.display = "block";
  });
}

export function populateCards(items) {
  const track = document.querySelector(".wheel-track");
  if (!track) return;

  let cards = Array.from(track.querySelectorAll(".card"));

  // Create card shells dynamically if the track is empty on first load
  if (cards.length === 0 && items.length > 0) {
    track.innerHTML = "";
    items.slice(0, 7).forEach((item, i) => {
      const newCard = createCard(item);
      if (newCard) {
        newCard.className = `card card-${i}`;
        if (i === 3) newCard.classList.add("active");
        track.appendChild(newCard);
      }
    });
    return;
  }

  cards.forEach((card, i) => {
    const item = items[i];
    if (!item) return;

    card.dataset.movieId = item.id;

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

    const ratingNode = card.querySelector(".movie-rating h2");
    if (ratingNode) {
      ratingNode.innerHTML = `${item.rating || "-"} <span><i class="fa-solid fa-star"></i></span>`;
    }

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

    const img = card.querySelector("img");
    if (img) {
      img.src = item.imgSrc || "";
      img.alt = item.imgAlt || item.title || "";
      img.style.display = "block";
    }

    let favBtn = card.querySelector(".favourite-btn");
    if (favBtn) favBtn.remove();
    favBtn = document.createElement("button");
    favBtn.className = "favourite-btn";
    favBtn.dataset.movieId = item.id;
    const inFav = isFavourite(item.id);
    if (inFav) favBtn.classList.add("in-favourites");
    favBtn.innerHTML = `<i class="fa-${inFav ? "solid" : "regular"} fa-heart"></i>`;
    card.appendChild(favBtn);

    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavourite(item);
    });
  });
}

export function createCard(item) {
  if (!item) return null;
  const el = document.createElement("div");
  el.dataset.movieId = item.id;
  el.className = "card";
  el.style.left = "50%";
  el.style.top = "50%";
  const inFav = isFavourite(item.id);
  el.innerHTML = `
    <button class="favourite-btn ${inFav ? "in-favourites" : ""}" data-movie-id="${item.id}">
      <i class="fa-${inFav ? "solid" : "regular"} fa-heart"></i>
    </button>
    <div class="movie-details">
      <div class="details-top">
        <div class="movie-type">
          <div class="badge-top-left">${item.badgeLeft || "MOVIE"}</div>
          <div class="badge-top-right">${item.badgeRight || ""}</div>
        </div>
        <div class="movie-rating">
          <h2>${item.rating || "-"} <span><i class="fa-solid fa-star"></i></span></h2>
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

  const favBtn = el.querySelector(".favourite-btn");
  if (favBtn) {
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavourite(item);
    });
  }

  return el;
}
