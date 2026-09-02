export function initWelcomeModal() {
  const STORAGE_KEY = "moviio_welcome_seen";
  const modal = document.getElementById("welcomeModal");
  if (!modal) return;

  function showModal() {
    modal.classList.remove("hidden");
  }
  function hideModal() {
    modal.classList.add("hidden");
  }
  function markSeen() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
  }

  const hasSeen = (() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  })();

  if (!hasSeen) showModal();

  modal.querySelector("#welcomeCloseBtn")?.addEventListener("click", () => {
    hideModal();
    markSeen();
  });

  modal.querySelector("#welcomeGotItBtn")?.addEventListener("click", () => {
    hideModal();
    markSeen();
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideModal();
      markSeen();
    }
  });
}
