import { load, save, KEYS } from "./storage.js";
import { Intern, TASK_STATUSES, TASK_PRIORITIES } from "./models.js";
import { validateTask, clearErrors, showErrors } from "./validation.js";
import { isTaskOverdue, calculateTaskStats } from "./calculations.js";
import {
  escapeHTML,
  formatDate,
  showToast,
  todayISO,
  generateId,
} from "./utils.js";
import { seedIfNeeded } from "./seed.js";

// STATE
let interns = [];
let tasks = [];
let editingId = null;
const filters = { status: "", priority: "", overdueOnly: false };

// DOM
const form = document.getElementById("task-form");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const internSelect = document.getElementById("task-intern");
const prioritySelect = document.getElementById("task-priority");
const statusSelect = document.getElementById("task-status");
const statusFilter = document.getElementById("filter-status");
const priorityFilter = document.getElementById("filter-priority");
const overdueFilter = document.getElementById("filter-overdue");
const resetBtn = document.getElementById("reset-filters");
const tableBody = document.getElementById("task-table-body");
const statsBox = document.getElementById("task-stats");

function optionsHTML(items, placeholder) {
  return (
    `<option value="">${placeholder}</option>` +
    items
      .map((v) => `<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`)
      .join("")
  );
}

function fillDropdowns() {
  internSelect.innerHTML =
    '<option value="">-- Select intern --</option>' +
    interns
      .map((i) => {
        const label = i.isActive() ? "" : ` (${escapeHTML(i.status)})`;
        return `<option value="${escapeHTML(i.internId)}">${escapeHTML(i.internId)} — ${escapeHTML(i.name)}${label}</option>`;
      })
      .join("");

  prioritySelect.innerHTML = optionsHTML(
    TASK_PRIORITIES,
    "-- Select priority --",
  );
  statusSelect.innerHTML = optionsHTML(TASK_STATUSES, "-- Select status --");
  priorityFilter.innerHTML = optionsHTML(TASK_PRIORITIES, "All priorities");
  statusFilter.innerHTML = optionsHTML(TASK_STATUSES, "All statuses");
}

function resetForm() {
  form.reset();
  clearErrors(form);
  editingId = null;
  form.elements.assignedDate.value = todayISO();
  form.elements.priority.value = "Medium";
  form.elements.status.value = "Pending";
  formTitle.textContent = "Create Task";
  submitBtn.textContent = "Create Task";
  cancelBtn.hidden = true;
}

function persist(previousTasks) {
  if (save(KEYS.TASKS, tasks)) return true;
  tasks = previousTasks; // roll back so memory matches storage
  showToast("Could not save data. Storage may be full.", "error");
  return false;
}

function handleSubmit(event) {
  event.preventDefault();
  clearErrors(form);

  const data = Object.fromEntries(new FormData(form));
  const { isValid, errors } = validateTask(data, interns);

  if (!isValid) {
    showErrors(form, errors);
    showToast("Please fix the highlighted fields.", "error");
    return;
  }

  const task = {
    id: editingId ?? generateId("tk"),
    title: data.title.trim(),
    internId: data.internId,
    assignedDate: data.assignedDate,
    dueDate: data.dueDate,
    priority: data.priority,
    status: data.status,
  };

  const previous = tasks;
  tasks = editingId
    ? tasks.map((t) => (t.id === editingId ? task : t)) // replace the edited task
    : [...tasks, task]; // append a new one

  if (persist(previous)) {
    showToast(editingId ? "Task updated." : "Task created.");
    resetForm();
    renderAll();
  }
}

function startEdit(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  editingId = id;
  clearErrors(form);
  [
    "title",
    "internId",
    "assignedDate",
    "dueDate",
    "priority",
    "status",
  ].forEach((field) => {
    form.elements[field].value = task[field];
  });

  formTitle.textContent = "Edit Task";
  submitBtn.textContent = "Update Task";
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: "smooth" });
}

function changeStatus(id, newStatus) {
  if (!TASK_STATUSES.includes(newStatus)) return;

  const previous = tasks;
  tasks = tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
  if (persist(previous)) showToast(`Status changed to ${newStatus}.`);
  renderAll();
}

function deleteTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  if (!confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;

  const previous = tasks;
  tasks = tasks.filter((t) => t.id !== id);
  if (persist(previous)) {
    if (editingId === id) resetForm();
    renderAll();
    showToast("Task deleted.");
  }
}

function renderStats() {
  const stats = calculateTaskStats(tasks);
  const cards = [
    ["Total", stats.total, ""],
    ["Pending", stats.pending, ""],
    ["In Progress", stats.inProgress, ""],
    ["Completed", stats.completed, ""],
    ["Overdue", stats.overdue, "stat-danger"],
  ];

  statsBox.innerHTML = cards
    .map(
      ([label, value, extraClass]) => `
      <div class="stat ${extraClass}">
        <span class="stat-value">${value}</span>
        <span class="stat-label">${label}</span>
      </div>`,
    )
    .join("");
}

function renderTable() {
  const today = todayISO();
  const internById = new Map(interns.map((i) => [i.internId, i]));

  const visible = tasks
    .filter(
      (t) =>
        (!filters.status || t.status === filters.status) &&
        (!filters.priority || t.priority === filters.priority) &&
        (!filters.overdueOnly || isTaskOverdue(t, today)),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)); // earliest deadline first

  if (visible.length === 0) {
    const message =
      tasks.length === 0
        ? "No tasks yet. Create one above."
        : "No tasks match your filters.";
    tableBody.innerHTML = `<tr><td colspan="7" class="empty">${message}</td></tr>`;
    return;
  }

  tableBody.innerHTML = visible
    .map((t) => {
      const overdue = isTaskOverdue(t, today);
      const dueToday = t.status !== "Completed" && t.dueDate === today;
      const internName = internById.get(t.internId)?.name ?? "Unknown intern";
      const dueBadge = overdue
        ? ' <span class="badge cat-critical">Overdue</span>'
        : dueToday
          ? ' <span class="badge cat-warning">Due today</span>'
          : "";

      const statusOptions = TASK_STATUSES.map(
        (s) =>
          `<option value="${s}" ${s === t.status ? "selected" : ""}>${s}</option>`,
      ).join("");

      return `
        <tr class="${overdue ? "row-overdue" : ""}">
          <td>${escapeHTML(t.title)}</td>
          <td>${escapeHTML(t.internId)} — ${escapeHTML(internName)}</td>
          <td>${formatDate(t.assignedDate)}</td>
          <td>${formatDate(t.dueDate)}${dueBadge}</td>
          <td><span class="badge priority-${t.priority.toLowerCase()}">${escapeHTML(t.priority)}</span></td>
          <td><select class="status-select" data-action="status" data-id="${escapeHTML(t.id)}">${statusOptions}</select></td>
          <td>
            <button class="btn" data-action="edit" data-id="${escapeHTML(t.id)}">Edit</button>
            <button class="btn btn-danger" data-action="delete" data-id="${escapeHTML(t.id)}">Delete</button>
          </td>
        </tr>`;
    })
    .join("");
}

function renderAll() {
  renderStats();
  renderTable();
}

form.addEventListener("submit", handleSubmit);
cancelBtn.addEventListener("click", resetForm);

// Event delegation: one click listener and one change listener for the whole table
tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "edit") startEdit(id);
  if (action === "delete") deleteTask(id);
});

tableBody.addEventListener("change", (event) => {
  const select = event.target.closest('select[data-action="status"]');
  if (select) changeStatus(select.dataset.id, select.value);
});

statusFilter.addEventListener("change", (e) => {
  filters.status = e.target.value;
  renderTable();
});
priorityFilter.addEventListener("change", (e) => {
  filters.priority = e.target.value;
  renderTable();
});
overdueFilter.addEventListener("change", (e) => {
  filters.overdueOnly = e.target.checked;
  renderTable();
});

resetBtn.addEventListener("click", () => {
  Object.assign(filters, { status: "", priority: "", overdueOnly: false });
  statusFilter.value = "";
  priorityFilter.value = "";
  overdueFilter.checked = false;
  renderTable();
});

async function init() {
  await seedIfNeeded();
  interns = load(KEYS.INTERNS).map(Intern.fromJSON);
  tasks = load(KEYS.TASKS);

  fillDropdowns();
  resetForm();
  renderAll();
}

init();
