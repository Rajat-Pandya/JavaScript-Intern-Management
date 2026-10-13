import { load, KEYS } from "./storage.js";
import { Intern, ATTENDANCE_CATEGORIES } from "./models.js";
import {
  buildPerformanceRows,
  calculateDashboardStats,
  getTopPerformers,
} from "./calculations.js";
import { escapeHTML, overallBadge } from "./utils.js";
import { seedIfNeeded } from "./seed.js";
import { getRandomQuote } from "./api.js";
import { initDataTools } from "./data-tools.js";

const kpiGrid = document.getElementById("kpi-grid");
const attendanceBox = document.getElementById("attendance-breakdown");
const specializationBox = document.getElementById("specialization-breakdown");
const topList = document.getElementById("dashboard-top");
const quoteBox = document.getElementById("quote-box");
const quoteBtn = document.getElementById("quote-refresh");
let isLoadingQuote = false;

async function loadQuote() {
  if (isLoadingQuote) return; // ignore clicks while a request is already running
  isLoadingQuote = true;
  quoteBtn.disabled = true;
  quoteBox.innerHTML = '<span class="spinner"></span>Loading quote…'; // LOADING state

  try {
    const { text, author } = await getRandomQuote();
    quoteBox.innerHTML = `
      <p class="quote-text">“${escapeHTML(text)}”</p>
      <p class="quote-author">— ${escapeHTML(author)}</p>`; // SUCCESS state
  } catch (error) {
    console.error("Quote request failed:", error);
    quoteBox.innerHTML = `<p class="api-error">Could not load a quote. ${escapeHTML(error.message)}</p>`; // ERROR state
  } finally {
    isLoadingQuote = false; // runs on success AND failure
    quoteBtn.disabled = false;
  }
}

quoteBtn.addEventListener("click", loadQuote);

function kpiCard(label, value, note = "", extraClass = "") {
  return `
    <div class="stat ${extraClass}">
      <span class="stat-value">${value}</span>
      <span class="stat-label">${label}</span>
      <span class="stat-note">${note}</span>
    </div>`;
}

function percentOrDash(hasData, value) {
  return hasData ? `${value.toFixed(1)}%` : "—";
}

function renderKpis(stats) {
  const inactive = stats.totalInterns - stats.activeInterns;

  kpiGrid.innerHTML = [
    kpiCard("Total Interns", stats.totalInterns),
    kpiCard("Active Interns", stats.activeInterns, `${inactive} not active`),
    kpiCard(
      "Average Attendance",
      percentOrDash(stats.attendanceDataCount > 0, stats.averageAttendance),
      `${stats.attendanceDataCount} interns with records`,
    ),
    kpiCard(
      "Average Score",
      percentOrDash(stats.assessmentDataCount > 0, stats.averageScore),
      `${stats.assessmentDataCount} interns assessed`,
    ),
    kpiCard(
      "Pending Tasks",
      stats.pendingTasks,
      `${stats.overdueTasks} overdue`,
      stats.overdueTasks > 0 ? "stat-danger" : "",
    ),
  ].join("");
}

function renderBars(container, entries, total, classFor = () => "") {
  if (total === 0) {
    container.innerHTML = '<p class="empty">No data yet.</p>';
    return;
  }

  container.innerHTML = entries
    .map(([label, count]) => {
      const percent = (count / total) * 100;
      return `
        <div class="bar-row">
          <span>${escapeHTML(label)}</span>
          <div class="bar-track"><div class="bar-fill ${classFor(label)}" style="width: ${percent}%"></div></div>
          <span class="bar-count">${count}</span>
        </div>`;
    })
    .join("");
}

function renderTopPerformers(rows) {
  const top = getTopPerformers(rows, 5);

  if (top.length === 0) {
    topList.innerHTML =
      '<li class="empty">No interns have attendance, assessment and task data yet.</li>';
    return;
  }

  topList.innerHTML = top
    .map(
      (row, index) => `
      <li class="top-item">
        <span class="top-rank">${index + 1}</span>
        <div class="top-info">
          <strong>${escapeHTML(row.intern.name)}</strong>
          <small>${escapeHTML(row.intern.specialization)} · ${escapeHTML(row.intern.internId)}</small>
        </div>
        ${overallBadge(row.performance.category)}
        <span class="top-score">${row.performance.score.toFixed(1)}%</span>
      </li>`,
    )
    .join("");
}

function renderDashboard() {
  const interns = load(KEYS.INTERNS).map(Intern.fromJSON);
  const rows = buildPerformanceRows(
    interns,
    load(KEYS.ATTENDANCE),
    load(KEYS.ASSESSMENTS),
    load(KEYS.TASKS),
  );
  const stats = calculateDashboardStats(rows);

  renderKpis(stats);

  renderBars(
    attendanceBox,
    ATTENDANCE_CATEGORIES.map((category) => [
      category,
      stats.attendanceCategories[category] ?? 0,
    ]),
    stats.totalInterns,
    (category) => `cat-${category.toLowerCase().replace(" ", "")}`,
  );

  renderBars(
    specializationBox,
    Object.entries(stats.specializationCounts).sort((a, b) => b[1] - a[1]),
    stats.totalInterns,
  );

  renderTopPerformers(rows);
}

async function init() {
  loadQuote();
  await seedIfNeeded();
  renderDashboard();
  initDataTools({ onDataChanged: renderDashboard });
}

init();
