// Shared light/dark theme toggle.
(function () {
  const STORAGE_KEY = "moviio-theme";
  const root = document.documentElement;

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  function getPreferredTheme() {
    const stored = getStoredTheme();
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
    document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      );
    });
  }

  function toggleTheme() {
    const current =
      root.getAttribute("data-theme") === "light" ? "light" : "dark";
    applyTheme(current === "light" ? "dark" : "light");
  }

  applyTheme(getPreferredTheme());

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
      btn.addEventListener("click", toggleTheme);
    });
  });

  window.__moviioTheme = { toggle: toggleTheme, apply: applyTheme };
})();
