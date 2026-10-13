import { load, KEYS } from "./storage.js";
import { Intern } from "./models.js";
import { buildPerformanceRows, getTopPerformers } from "./calculations.js";
import { escapeHTML } from "./utils.js";
import { seedIfNeeded } from "./seed.js";

const CATEGORIES = [
  "Outstanding",
  "Excellent",
  "Good",
  "Average",
  "Needs Improvement",
  "No Data",
];

let rows = [];
const view = { category: "", sortBy: "score-desc" };

const topList = document.getElementById("top-performers");
const categoryFilter = document.getElementById("filter-category");
const sortSelect = document.getElementById("sort-report");
const reportBody = document.getElementById("report-table-body");
const reportCount = document.getElementById("report-count");

const CATEGORY_CLASS = {
  Outstanding: "perf-outstanding",
  Excellent: "perf-excellent",
  Good: "perf-good",
  Average: "perf-average",
  "Needs Improvement": "perf-needs",
  "No Data": "perf-nodata",
};

function categoryBadge(category) {
  return `<span class="badge ${CATEGORY_CLASS[category]}">${category}</span>`;
}

function showPercent(hasData, value) {
  return hasData ? `${value.toFixed(1)}%` : "—";
}
function renderTopPerformers() {
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
        ${categoryBadge(row.performance.category)}
        <span class="top-score">${row.performance.score.toFixed(1)}%</span>
      </li>`,
    )
    .join("");
}
const SORTERS = {
  "score-desc": (a, b) => b.performance.score - a.performance.score,
  "score-asc": (a, b) => a.performance.score - b.performance.score,
  "name-asc": (a, b) => a.intern.name.localeCompare(b.intern.name),
};

function renderReport() {
  const visible = rows
    .filter(
      (row) => !view.category || row.performance.category === view.category,
    )
    .sort(SORTERS[view.sortBy] ?? SORTERS["score-desc"]);

  reportCount.textContent = `Showing ${visible.length} of ${rows.length} interns`;

  if (visible.length === 0) {
    const message =
      rows.length === 0 ? "No interns found." : "No interns in this category.";
    reportBody.innerHTML = `<tr><td colspan="8" class="empty">${message}</td></tr>`;
    return;
  }

  reportBody.innerHTML = visible
    .map(({ intern, attendance, assessment, tasks, performance }) => {
      const hasAny = performance.componentsUsed > 0;
      const basedOn = performance.isComplete
        ? "All 3 areas"
        : `<span class="partial-note">${performance.componentsUsed} of 3 areas</span>`;

      return `
        <tr>
          <td>${escapeHTML(intern.internId)}</td>
          <td>${escapeHTML(intern.name)}</td>
          <td>${showPercent(attendance.workingDays > 0, attendance.percentage)}</td>
          <td>${showPercent(assessment.count > 0, assessment.percentage)}</td>
          <td>${showPercent(tasks.total > 0, tasks.completionPercentage)}</td>
          <td><strong>${hasAny ? performance.score.toFixed(1) + "%" : "—"}</strong></td>
          <td>${categoryBadge(performance.category)}</td>
          <td>${basedOn}</td>
        </tr>`;
    })
    .join("");
}
categoryFilter.addEventListener("change", (event) => {
  view.category = event.target.value;
  renderReport();
});

sortSelect.addEventListener("change", (event) => {
  view.sortBy = event.target.value;
  renderReport();
});

async function init() {
  await seedIfNeeded();

  const interns = load(KEYS.INTERNS).map(Intern.fromJSON);
  const attendance = load(KEYS.ATTENDANCE);
  const assessments = load(KEYS.ASSESSMENTS);
  const tasks = load(KEYS.TASKS);

  rows = buildPerformanceRows(interns, attendance, assessments, tasks);

  categoryFilter.innerHTML =
    '<option value="">All categories</option>' +
    CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");

  renderTopPerformers();
  renderReport();
}

init();
