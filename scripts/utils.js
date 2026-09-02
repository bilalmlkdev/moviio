export function showApiMessage(text) {
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

export function showCardLoader() {
  const cardLoader = document.getElementById("cardLoader");
  if (cardLoader) cardLoader.classList.remove("hidden");
}

export function hideCardLoader() {
  const cardLoader = document.getElementById("cardLoader");
  if (cardLoader) cardLoader.classList.add("hidden");
}
