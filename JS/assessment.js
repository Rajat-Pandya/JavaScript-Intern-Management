import { load, save, KEYS } from './storage.js';
import { Intern, SUBJECTS } from './models.js';
import { validateAssessment, clearErrors, showErrors } from './validation.js';
import {
  calculatePercentage, getGrade,
  calculateAssessmentSummary, calculateSubjectPerformance,
} from './calculations.js';
import { escapeHTML, formatDate, showToast, todayISO, generateId } from './utils.js';
import { seedIfNeeded } from './seed.js';


let interns = [];
let assessments = [];
let recordFilter = '';   

// DOM
const form = document.getElementById('assessment-form');
const internSelect = document.getElementById('assessment-intern');
const subjectSelect = document.getElementById('assessment-subject');
const preview = document.getElementById('grade-preview');
const summaryBody = document.getElementById('summary-table-body');
const recordsBody = document.getElementById('records-table-body');
const filterSelect = document.getElementById('record-filter');
const subjectDialog = document.getElementById('subject-dialog');
const subjectContent = document.getElementById('subject-content');


function gradeBadge(grade) {
  const cls = `grade-${grade.toLowerCase().replace('+', 'plus').replace('/', '')}`;
  return `<span class="badge ${cls}">${grade}</span>`;
}

function optionList(items, placeholder) {
  return `<option value="">${placeholder}</option>` + items.join('');
}

function fillDropdowns() {
  const activeOptions = interns
    .filter((i) => i.isActive())
    .map((i) => `<option value="${escapeHTML(i.internId)}">${escapeHTML(i.internId)} — ${escapeHTML(i.name)}</option>`);

  const allOptions = interns
    .map((i) => `<option value="${escapeHTML(i.internId)}">${escapeHTML(i.internId)} — ${escapeHTML(i.name)}</option>`);

  const subjectOptions = SUBJECTS.map((s) => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`);

  internSelect.innerHTML = optionList(activeOptions, '-- Select intern --');
  subjectSelect.innerHTML = optionList(subjectOptions, '-- Select subject --');
  filterSelect.innerHTML = optionList(allOptions, 'All interns');
}

function updatePreview() {
  const marksText = form.elements.marks.value;
  const totalText = form.elements.totalMarks.value;
  const marks = Number(marksText);
  const total = Number(totalText);

  // !(x > 0) is true for NaN too, so one check covers "not a positive number"
  if (marksText === '' || totalText === '' || !(total > 0) || !(marks >= 0) || marks > total) {
    preview.textContent = '';
    return;
  }

  const percentage = calculatePercentage(marks, total);
  preview.textContent = `Percentage: ${percentage.toFixed(2)}% — Grade ${getGrade(percentage)}`;
}

form.elements.marks.addEventListener('input', updatePreview);
form.elements.totalMarks.addEventListener('input', updatePreview);

function handleSubmit(event) {
  event.preventDefault();
  clearErrors(form);

  const data = Object.fromEntries(new FormData(form));
  const { isValid, errors } = validateAssessment(data, interns);

  if (!isValid) {
    showErrors(form, errors);
    showToast('Please fix the highlighted fields.', 'error');
    return;
  }

  const record = {
    id: generateId('as'),
    internId: data.internId,
    subject: data.subject,
    marks: Number(data.marks),          // store NUMBERS, not strings
    totalMarks: Number(data.totalMarks),
    date: data.date,
  };

  assessments.push(record);

  if (save(KEYS.ASSESSMENTS, assessments)) {
    showToast('Assessment saved.');
    renderAll();
    form.elements.marks.value = '';     // keep intern/subject/date for faster entry
    preview.textContent = '';
  } else {
    assessments.pop();                  // roll back the in-memory change
    showToast('Could not save data. Storage may be full.', 'error');
  }
}

function deleteRecord(id) {
  const record = assessments.find((r) => r.id === id);
  if (!record) return;

  if (!confirm(`Delete this ${record.subject} result (${record.marks}/${record.totalMarks})?`)) return;

  assessments = assessments.filter((r) => r.id !== id);
  if (save(KEYS.ASSESSMENTS, assessments)) {
    renderAll();
    showToast('Assessment deleted.');
  } else {
    showToast('Could not save data. Storage may be full.', 'error');
  }
}

function renderSummary() {
  if (interns.length === 0) {
    summaryBody.innerHTML = '<tr><td colspan="6" class="empty">No interns found.</td></tr>';
    return;
  }

  summaryBody.innerHTML = interns
    .map((intern) => {
      const records = assessments.filter((r) => r.internId === intern.internId);
      const { count, percentage, grade } = calculateAssessmentSummary(records);

      return `
        <tr>
          <td>${escapeHTML(intern.internId)}</td>
          <td>${escapeHTML(intern.name)}</td>
          <td>${count}</td>
          <td>${count ? percentage.toFixed(1) + '%' : '—'}</td>
          <td>${gradeBadge(grade)}</td>
          <td><button class="btn" data-action="subjects" data-id="${escapeHTML(intern.internId)}">View</button></td>
        </tr>`;
    })
    .join('');
}

function renderRecords() {
  const internById = new Map(interns.map((i) => [i.internId, i]));   // fast lookup by ID

  const visible = assessments
    .filter((r) => !recordFilter || r.internId === recordFilter)
    .sort((a, b) => b.date.localeCompare(a.date));                   // newest first

  if (visible.length === 0) {
    recordsBody.innerHTML = '<tr><td colspan="7" class="empty">No assessment records found.</td></tr>';
    return;
  }

  recordsBody.innerHTML = visible
    .map((r) => {
      const percentage = calculatePercentage(r.marks, r.totalMarks);   // derived, never stored
      const internName = internById.get(r.internId)?.name ?? 'Unknown intern';

      return `
        <tr>
          <td>${formatDate(r.date)}</td>
          <td>${escapeHTML(r.internId)} — ${escapeHTML(internName)}</td>
          <td>${escapeHTML(r.subject)}</td>
          <td>${r.marks} / ${r.totalMarks}</td>
          <td>${percentage.toFixed(1)}%</td>
          <td>${gradeBadge(getGrade(percentage))}</td>
          <td><button class="btn btn-danger" data-action="delete" data-id="${escapeHTML(r.id)}">Delete</button></td>
        </tr>`;
    })
    .join('');
}

function showSubjectWise(id) {
  const intern = interns.find((i) => i.internId === id);
  if (!intern) return;

  const records = assessments.filter((r) => r.internId === id);
  const subjects = calculateSubjectPerformance(records);
  const overall = calculateAssessmentSummary(records);

  const rows = subjects.length
    ? subjects
        .map((s) => `
          <tr>
            <td>${escapeHTML(s.subject)}</td>
            <td>${s.attempts}</td>
            <td>${s.percentage.toFixed(1)}%</td>
            <td>${gradeBadge(s.grade)}</td>
          </tr>`)
        .join('')
    : '<tr><td colspan="4" class="empty">No assessments recorded yet.</td></tr>';

  subjectContent.innerHTML = `
    <h3>${escapeHTML(intern.name)} — Subject-wise Performance</h3>
    <div class="history-list">
      <table>
        <thead><tr><th>Subject</th><th>Attempts</th><th>Average</th><th>Grade</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p><strong>Overall:</strong> ${overall.count ? overall.percentage.toFixed(1) + '%' : '—'} ${gradeBadge(overall.grade)}</p>`;
  subjectDialog.showModal();
}

function renderAll() {
  renderSummary();
  renderRecords();
}

form.addEventListener('submit', handleSubmit);

filterSelect.addEventListener('change', (event) => {
  recordFilter = event.target.value;
  renderRecords();
});

// Event delegation again: one listener per table
summaryBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="subjects"]');
  if (button) showSubjectWise(button.dataset.id);
});

recordsBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="delete"]');
  if (button) deleteRecord(button.dataset.id);
});

async function init() {
  await seedIfNeeded();
  interns = load(KEYS.INTERNS).map(Intern.fromJSON);
  assessments = load(KEYS.ASSESSMENTS);

  fillDropdowns();
  form.elements.date.value = todayISO();
  form.elements.date.max = todayISO();

  renderAll();
}

init();