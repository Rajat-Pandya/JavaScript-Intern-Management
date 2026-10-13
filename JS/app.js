import { load, save, KEYS } from "./storage.js";

const THEMES = ["light", "dark"];

function getInitialTheme() {
  const saved = load(KEYS.THEME, null);
  if (THEMES.includes(saved)) return saved;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = document.getElementById("theme-toggle");
  if (button) {
    button.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
    button.setAttribute("aria-pressed", String(theme === "dark"));
  }
}

function toggleTheme() {
  const next =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  save(KEYS.THEME, next);
}

const clockFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

function updateClock() {
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = clockFormat.format(new Date());
}

function startClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function injectNavTools() {
  const nav = document.querySelector(".navbar");
  if (!nav) return;

  nav.insertAdjacentHTML(
    "beforeend",
    `<div class="nav-tools">
       <span id="clock" aria-label="Current date and time"></span>
       <button id="theme-toggle" type="button" class="btn btn-small"></button>
     </div>`,
  );
  document
    .getElementById("theme-toggle")
    .addEventListener("click", toggleTheme);
}

injectNavTools();
applyTheme(getInitialTheme());
startClock();
