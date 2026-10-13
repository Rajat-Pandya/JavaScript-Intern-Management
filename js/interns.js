import { load, save, KEYS } from "./storage.js";
import {
  Intern,
  SPECIALIZATIONS,
  STATUSES,
  ATTENDANCE_CATEGORIES,
} from "./models.js";
import { validateIntern, clearErrors, showErrors } from "./validation.js";
import { escapeHTML, formatDate, showToast, debounce } from "./utils.js";
import { seedIfNeeded } from "./seed.js";
import {
  calculateAttendanceStats,
  calculateAssessmentSummary,
} from "./calculations.js";

let interns = [];
let editingId = null;

const filters = {
  query: "",
  specialization: "",
  status: "",
  attendance: "",
  sortBy: "name-asc",
};

const attendanceFilter = document.getElementById("filter-attendance");

let metrics = new Map();
const EMPTY_METRICS = {
  attendance: calculateAttendanceStats([]),
  assessment: calculateAssessmentSummary([]),
};
const getMetrics = (internId) => metrics.get(internId) ?? EMPTY_METRICS;

const form = document.getElementById("intern-form");
const tableBody = document.getElementById("intern-table-body");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const viewDialog = document.getElementById("view-dialog");
const viewContent = document.getElementById("view-content");

const searchInput = document.getElementById("search-input");
const specFilter = document.getElementById("filter-specialization");
const statusFilter = document.getElementById("filter-status");
const sortSelect = document.getElementById("sort-select");
const resetBtn = document.getElementById("reset-filters");
const resultCount = document.getElementById("result-count");

function persist(previousInterns) {
  const ok = save(KEYS.INTERNS, interns);
  if (!ok) {
    if (previousInterns) interns = previousInterns;
    showToast("Could not save data. Storage may be full.", "error");
  }
  return ok;
}

function fillSelect(selectId, options, placeholder) {
  const select = document.getElementById(selectId);
  select.innerHTML =
    `<option value="">${placeholder}</option>` +
    options
      .map(
        (opt) =>
          `<option value="${escapeHTML(opt)}">${escapeHTML(opt)}</option>`,
      )
      .join("");
}

function resetForm() {
  form.reset();
  clearErrors(form);
  editingId = null;
  form.elements.internId.readOnly = false;
  form.elements.status.value = "Active";
  formTitle.textContent = "Add Intern";
  submitBtn.textContent = "Add Intern";
  cancelBtn.hidden = true;
}

// Compare by a number, always pushing interns with NO data (null) to the bottom,
// whether the sort is ascending or descending.
function byNumber(getValue, direction) {
  return (a, b) => {
    const x = getValue(a);
    const y = getValue(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1; // a has no data -> after b
    if (y === null) return -1; // b has no data -> after a
    return direction === "asc" ? x - y : y - x;
  };
}

const marksValue = (intern) => {
  const { count, percentage } = getMetrics(intern.internId).assessment;
  return count > 0 ? percentage : null;
};

const attendanceValue = (intern) => {
  const { workingDays, percentage } = getMetrics(intern.internId).attendance;
  return workingDays > 0 ? percentage : null;
};

const SORTERS = {
  "name-asc": (a, b) => a.name.localeCompare(b.name),
  "name-desc": (a, b) => b.name.localeCompare(a.name),
  "joining-newest": (a, b) => new Date(b.joiningDate) - new Date(a.joiningDate),
  "joining-oldest": (a, b) => new Date(a.joiningDate) - new Date(b.joiningDate),
  "marks-desc": byNumber(marksValue, "desc"),
  "marks-asc": byNumber(marksValue, "asc"),
  "attendance-desc": byNumber(attendanceValue, "desc"),
  "attendance-asc": byNumber(attendanceValue, "asc"),
};

function getVisibleInterns() {
  const { query, specialization, status, attendance, sortBy } = filters;

  const filtered = interns.filter(
    (intern) =>
      intern.matches(query) &&
      (!specialization || intern.specialization === specialization) &&
      (!status || intern.status === status) &&
      (!attendance ||
        getMetrics(intern.internId).attendance.category === attendance),
  );

  return [...filtered].sort(SORTERS[sortBy] ?? SORTERS["name-asc"]);
}

function attendanceCell(intern) {
  const { workingDays, percentage, category } = getMetrics(
    intern.internId,
  ).attendance;
  if (workingDays === 0) return '<span class="badge cat-nodata">No Data</span>';
  const categoryClass = `cat-${category.toLowerCase()}`;
  return `${percentage.toFixed(1)}% <span class="badge ${categoryClass}">${category}</span>`;
}

function marksCell(intern) {
  const { count, percentage } = getMetrics(intern.internId).assessment;
  return count > 0 ? `${percentage.toFixed(1)}%` : "—";
}
function renderTable() {
  const visible = getVisibleInterns();
  resultCount.textContent = `Showing ${visible.length} of ${interns.length} interns`;

  if (visible.length === 0) {
    const message =
      interns.length === 0
        ? "No interns yet. Add one using the form above."
        : "No interns match your search or filters.";
    tableBody.innerHTML = `<tr><td colspan="11" class="empty">${message}</td></tr>`;
    return;
  }

  tableBody.innerHTML = visible
    .map(
      (intern) => `
      <tr>
        <td>${escapeHTML(intern.internId)}</td>
        <td>${escapeHTML(intern.name)}</td>
        <td>${escapeHTML(intern.email)}</td>
        <td>${escapeHTML(intern.mobile)}</td>
        <td>${escapeHTML(intern.city)}</td>
        <td>${escapeHTML(intern.specialization)}</td>
        <td>${attendanceCell(intern)}</td>
        <td>${marksCell(intern)}</td>
        <td>${formatDate(intern.joiningDate)}</td>
        <td><span class="badge status-${intern.status.toLowerCase()}">${escapeHTML(intern.status)}</span></td>
        <td>
          <button class="btn" data-action="view" data-id="${escapeHTML(intern.internId)}">View</button>
          <button class="btn" data-action="edit" data-id="${escapeHTML(intern.internId)}">Edit</button>
          <button class="btn btn-danger" data-action="delete" data-id="${escapeHTML(intern.internId)}">Delete</button>
        </td>
      </tr>`,
    )
    .join("");
}

function handleSubmit(event) {
  event.preventDefault();
  clearErrors(form);

  const data = Object.fromEntries(new FormData(form));
  const { isValid, errors } = validateIntern(data, interns, editingId);

  if (!isValid) {
    showErrors(form, errors);
    showToast("Please fix the highlighted fields.", "error");
    return;
  }

  const intern = new Intern(data);

  const previousInterns = [...interns];

  if (editingId) {
    const index = interns.findIndex((i) => i.internId === editingId);
    interns[index] = intern;
    showToast("Intern updated successfully.");
  } else {
    interns.push(intern);
    showToast("Intern added successfully.");
  }

  if (persist(previousInterns)) {
    renderTable();
    resetForm();
  }
}

function startEdit(id) {
  const intern = interns.find((i) => i.internId === id);
  if (!intern) return;

  editingId = id;
  clearErrors(form);

  Object.entries(intern).forEach(([field, value]) => {
    if (form.elements[field]) form.elements[field].value = value;
  });

  form.elements.internId.readOnly = true;
  formTitle.textContent = `Edit Intern (${id})`;
  submitBtn.textContent = "Update Intern";
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: "smooth" });
}

function viewIntern(id) {
  const intern = interns.find((i) => i.internId === id);
  if (!intern) return;

  viewContent.innerHTML = `
    <h3>${escapeHTML(intern.name)} (${escapeHTML(intern.initials)})</h3>
    <p><strong>ID:</strong> ${escapeHTML(intern.internId)}</p>
    <p><strong>Email:</strong> ${escapeHTML(intern.email)}</p>
    <p><strong>Mobile:</strong> ${escapeHTML(intern.mobile)}</p>
    <p><strong>Gender:</strong> ${escapeHTML(intern.gender)}</p>
    <p><strong>City:</strong> ${escapeHTML(intern.city)}</p>
    <p><strong>Specialization:</strong> ${escapeHTML(intern.specialization)}</p>
    <p><strong>Joined:</strong> ${formatDate(intern.joiningDate)}</p>
    <p><strong>Status:</strong> ${escapeHTML(intern.status)}</p>`;
  viewDialog.showModal();
}

function deleteIntern(id) {
  const intern = interns.find((i) => i.internId === id);
  if (!intern) return;

  const confirmed = confirm(
    `Delete ${intern.name} (${id})? This cannot be undone.`,
  );
  if (!confirmed) return;

  const previousInterns = [...interns];
  interns = interns.filter((i) => i.internId !== id);

  if (persist(previousInterns)) {
    renderTable();
    if (editingId === id) resetForm();
    showToast("Intern deleted.");

    // Cascade delete across attendance, assessments, and tasks
    const remainingAttendance = load(KEYS.ATTENDANCE).filter(
      (r) => r.internId !== id,
    );
    save(KEYS.ATTENDANCE, remainingAttendance);

    const remainingAssessments = load(KEYS.ASSESSMENTS).filter(
      (r) => r.internId !== id,
    );
    save(KEYS.ASSESSMENTS, remainingAssessments);

    const remainingTasks = load(KEYS.TASKS).filter((t) => t.internId !== id);
    save(KEYS.TASKS, remainingTasks);
  }
}

tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "view") viewIntern(id);
  if (action === "edit") startEdit(id);
  if (action === "delete") deleteIntern(id);
});

form.addEventListener("submit", handleSubmit);
cancelBtn.addEventListener("click", resetForm);

const applySearch = debounce((value) => {
  filters.query = value;
  renderTable();
}, 300);

searchInput.addEventListener("input", (event) =>
  applySearch(event.target.value),
);

specFilter.addEventListener("change", (event) => {
  filters.specialization = event.target.value;
  renderTable();
});

statusFilter.addEventListener("change", (event) => {
  filters.status = event.target.value;
  renderTable();
});

sortSelect.addEventListener("change", (event) => {
  filters.sortBy = event.target.value;
  renderTable();
});

resetBtn.addEventListener("click", () => {
  Object.assign(filters, {
    query: "",
    specialization: "",
    status: "",
    attendance: "",
    sortBy: "name-asc",
  });
  searchInput.value = "";
  specFilter.value = "";
  statusFilter.value = "";
  sortSelect.value = "name-asc";
  attendanceFilter.value = "";
  renderTable();
});

attendanceFilter.addEventListener("change", (event) => {
  filters.attendance = event.target.value;
  renderTable();
});

async function init() {
  await seedIfNeeded();
  interns = load(KEYS.INTERNS).map(Intern.fromJSON);

  const attendanceRecords = load(KEYS.ATTENDANCE);
  const assessmentRecords = load(KEYS.ASSESSMENTS);
  metrics = new Map(
    interns.map((intern) => [
      intern.internId,
      {
        attendance: calculateAttendanceStats(
          attendanceRecords.filter((r) => r.internId === intern.internId),
        ),
        assessment: calculateAssessmentSummary(
          assessmentRecords.filter((r) => r.internId === intern.internId),
        ),
      },
    ]),
  );

  fillSelect("specialization", SPECIALIZATIONS, "-- Select --");
  fillSelect("status", STATUSES, "-- Select --");
  fillSelect("filter-specialization", SPECIALIZATIONS, "All Specializations");
  fillSelect("filter-status", STATUSES, "All Statuses");
  fillSelect("filter-attendance", ATTENDANCE_CATEGORIES, "All Attendance");
  form.elements.status.value = "Active";

  renderTable();
}

init();
