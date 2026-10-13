import { load, save, KEYS } from './storage.js';
import { Intern, ATTENDANCE_STATUSES } from './models.js';
import { validateAttendance, clearErrors, showErrors } from './validation.js';
import { calculateAttendanceStats } from './calculations.js';
import { escapeHTML, formatDate, showToast, todayISO } from './utils.js';
import { seedIfNeeded } from './seed.js';


let interns = [];
let attendance = [];   


const form = document.getElementById('attendance-form');
const internSelect = document.getElementById('attendance-intern');
const statusSelect = document.getElementById('attendance-status');
const tableBody = document.getElementById('attendance-table-body');
const historyDialog = document.getElementById('history-dialog');
const historyContent = document.getElementById('history-content');

function fillInternSelect() {
  const activeInterns = interns.filter((intern) => intern.isActive());
  internSelect.innerHTML =
    '<option value="">-- Select intern --</option>' +
    activeInterns
      .map((i) => `<option value="${escapeHTML(i.internId)}">${escapeHTML(i.internId)} — ${escapeHTML(i.name)}</option>`)
      .join('');
}

function fillStatusSelect() {
  statusSelect.innerHTML =
    '<option value="">-- Select status --</option>' +
    ATTENDANCE_STATUSES.map((s) => `<option value="${s}">${s}</option>`).join('');
}

function handleSubmit(event) {
  event.preventDefault();
  clearErrors(form);

  const data = Object.fromEntries(new FormData(form));
  const { isValid, errors } = validateAttendance(data, interns);

  if (!isValid) {
    showErrors(form, errors);
    showToast('Please fix the highlighted fields.', 'error');
    return;
  }

  const record = { internId: data.internId, date: data.date, status: data.status };

  
  const index = attendance.findIndex(
    (r) => r.internId === record.internId && r.date === record.date
  );

  if (index >= 0) {
    attendance[index] = record;
    showToast('Existing record for that date was updated.');
  } else {
    attendance.push(record);
    showToast('Attendance recorded.');
  }

  if (save(KEYS.ATTENDANCE, attendance)) {
    renderSummary();
    
    form.elements.internId.value = '';
    form.elements.status.value = '';
  } else {
    showToast('Could not save data. Storage may be full.', 'error');
  }
}

function renderSummary() {
  if (interns.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="10" class="empty">No interns found.</td></tr>';
    return;
  }

  tableBody.innerHTML = interns
    .map((intern) => {
      const records = attendance.filter((r) => r.internId === intern.internId);
      const stats = calculateAttendanceStats(records);
      const categoryClass = `cat-${stats.category.toLowerCase().replace(' ', '')}`;

      return `
        <tr>
          <td>${escapeHTML(intern.internId)}</td>
          <td>${escapeHTML(intern.name)}</td>
          <td>${stats.workingDays}</td>
          <td>${stats.present}</td>
          <td>${stats.halfDay}</td>
          <td>${stats.absent}</td>
          <td>${stats.leave}</td>
          <td>${stats.percentage.toFixed(1)}%</td>
          <td><span class="badge ${categoryClass}">${stats.category}</span></td>
          <td><button class="btn" data-action="history" data-id="${escapeHTML(intern.internId)}">History</button></td>
        </tr>`;
    })
    .join('');
}

function showHistory(id) {
  const intern = interns.find((i) => i.internId === id);
  if (!intern) return;

  const records = attendance
    .filter((r) => r.internId === id)
    .sort((a, b) => b.date.localeCompare(a.date)); 

  const rows = records.length
    ? records.map((r) => `<tr><td>${formatDate(r.date)}</td><td>${r.status}</td></tr>`).join('')
    : '<tr><td colspan="2" class="empty">No attendance recorded yet.</td></tr>';

  historyContent.innerHTML = `
    <h3>${escapeHTML(intern.name)} — Attendance History</h3>
    <div class="history-list">
      <table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
    </div>`;
  historyDialog.showModal();
}

tableBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="history"]');
  if (button) showHistory(button.dataset.id);
});

form.addEventListener('submit', handleSubmit);

async function init() {
  await seedIfNeeded();
  interns = load(KEYS.INTERNS).map(Intern.fromJSON);
  attendance = load(KEYS.ATTENDANCE);

  fillInternSelect();
  fillStatusSelect();
  form.elements.date.value = todayISO();
  form.elements.date.max = todayISO();   

  renderSummary();
}

init();