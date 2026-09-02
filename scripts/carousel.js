// scripts/carousel.js
import { state } from "./state.js";
import { TRANS_MS, MAX_STEPS } from "./config.js";
import { loadMoreIntoFeed } from "./api.js";
import { createCard } from "./ui.js";

//  Core wheel management
export function finalizeKeep7() {
  const track = document.querySelector(".wheel-track");
  if (!track) return;
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

export async function getNextItem() {
  if (!state.feed.length) return null;
  if (state.feedIndex + 5 >= state.feed.length) loadMoreIntoFeed();
  const item = state.feed[state.feedIndex % state.feed.length];
  state.feedIndex++;
  return item;
}

export async function singleShiftLeft() {
  const track = document.querySelector(".wheel-track");
  if (!track || track.classList.contains("animating")) return;
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

export async function singleShiftRight() {
  const track = document.querySelector(".wheel-track");
  if (!track || track.classList.contains("animating")) return;
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

export async function shiftLeft(steps = 1) {
  for (let i = 0; i < Math.min(MAX_STEPS, steps); i++) {
    await singleShiftLeft();
  }
}

export async function shiftRight(steps = 1) {
  for (let i = 0; i < Math.min(MAX_STEPS, steps); i++) {
    await singleShiftRight();
  }
}

//  DRAG & SWIPE
const dragState = {
  startX: 0,
  currentX: 0,
  isDragging: false,
  moved: false,
};

export function initDrag() {
  const container = document.querySelector(".wheel-container");
  const track = document.querySelector(".wheel-track");
  if (!track || !container) return;

  // Prevent page scroll and touch interactions on the container
  container.style.touchAction = "none";
  container.style.overscrollBehavior = "none";
  track.style.touchAction = "none";

  function onStart(e) {
    const point = e.touches ? e.touches[0] : e;
    dragState.startX = point.clientX;
    dragState.currentX = point.clientX;
    dragState.isDragging = true;
    dragState.moved = false;
    track.classList.add("dragging");
    track.style.transition = "none";
    // Disable pointer events on cards during drag to avoid accidental clicks
    track.style.pointerEvents = "none";
  }

  function onMove(e) {
    if (!dragState.isDragging) return;
    const point = e.touches ? e.touches[0] : e;
    dragState.currentX = point.clientX;
    const delta = dragState.currentX - dragState.startX;
    if (Math.abs(delta) > 5) {
      dragState.moved = true;
      e.preventDefault(); // crucial: prevent scroll
      // Visual feedback
      track.style.transform = `translate3d(-50%, -50%, 0) translateX(${delta * 0.3}px)`;
    }
  }

  function onEnd(e) {
    if (!dragState.isDragging) return;
    dragState.isDragging = false;
    track.classList.remove("dragging");
    track.style.transition = "";
    track.style.transform = "";
    track.style.pointerEvents = ""; // re-enable clicks

    const delta = dragState.currentX - dragState.startX;
    if (dragState.moved && Math.abs(delta) > 40) {
      if (delta < 0) {
        shiftLeft(1);
      } else {
        shiftRight(1);
      }
    }
    // Keep moved flag true for a moment so click handler can ignore it
    setTimeout(() => {
      dragState.moved = false;
    }, 200);
  }

  // Mouse
  track.addEventListener("mousedown", onStart);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onEnd);

  // Touch
  track.addEventListener("touchstart", onStart, { passive: true });
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd, { passive: true });

  // Prevent context menu on long press
  track.addEventListener("contextmenu", (e) => e.preventDefault());
}

// Export the moved flag for click guard
export function wasDragMoved() {
  return dragState.moved;
}
