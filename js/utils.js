export function debounce(fn, delay = 300) {
  let timerId;
  return (...args) => {
    clearTimeout(timerId);
    timerId = setTimeout(() => fn(...args), delay);
  };
}

// Today's date in the USER'S timezone, as "YYYY-MM-DD".
export function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // getMonth() is 0-11
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC", // the string is a plain date, so show it exactly as stored
  });
}

export function escapeHTML(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function showToast(message, type = "info", duration = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), duration);
}

export function generateId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

const OVERALL_CLASS = {
  Outstanding: "perf-outstanding",
  Excellent: "perf-excellent",
  Good: "perf-good",
  Average: "perf-average",
  "Needs Improvement": "perf-needs",
  "No Data": "perf-nodata",
};

export function overallBadge(category) {
  return `<span class="badge ${OVERALL_CLASS[category] ?? "perf-nodata"}">${escapeHTML(category)}</span>`;
}
