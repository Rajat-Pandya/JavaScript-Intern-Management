import { load, save, KEYS } from './storage.js';
import { Intern, SPECIALIZATIONS, STATUSES } from './models.js';
import { validateInternId, clearErrors, showErrors } from './validation.js';
import { escapeHTML, formatDate, showToast } from './utils.js';


let interns = load(KEYS.INTERNS).map(Intern.fromJSON);
let editingId = null; 


const form = document.getElementById('intern-form');
const tableBody = document.getElementById('intern-table-body');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const viewDialog = document.getElementById('view-dialog');
const viewContent = document.getElementById('view-content');

function persist() {
    const ok = save(KEYS.INTERNS, interns);
    if (!ok) showToast('Could not save data. Storage may be full.', 'error');
    return ok;
}

function fillSelect(selectId, options, placeholder) {
    const select = document.getElementById(selectId);
    select.innerHTML =
    `<option value="">${placeholder}</option>` +
    options.map((opt) => `<option value="${escapeHTML(opt)}">${escapeHTML(opt)}</option>`).join('');
}

function resetForm() {
    form.reset();
    clearErrors(form);
    editingId = null;
    form.elements.internId.readOnly = false;
    formTitle.textContent = 'Add Intern';
    submitBtn.textContent = 'Add Intern';
    cancelBtn.hidden = true;
}

function renderTable() {
  if (interns.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="9" class="empty">No interns found. Add one using the form above.</td></tr>';
    return;
  }

  tableBody.innerHTML = interns
    .map(
      (intern) => `
      <tr>
        <td>${escapeHTML(intern.internId)}</td>
        <td>${escapeHTML(intern.name)}</td>
        <td>${escapeHTML(intern.email)}</td>
        <td>${escapeHTML(intern.mobile)}</td>
        <td>${escapeHTML(intern.city)}</td>
        <td>${escapeHTML(intern.specialization)}</td>
        <td>${formatDate(intern.joiningDate)}</td>
        <td><span class="badge status-${intern.status.toLowerCase()}">${escapeHTML(intern.status)}</span></td>
        <td>
          <button class="btn" data-action="view" data-id="${escapeHTML(intern.internId)}">View</button>
          <button class="btn" data-action="edit" data-id="${escapeHTML(intern.internId)}">Edit</button>
          <button class="btn btn-danger" data-action="delete" data-id="${escapeHTML(intern.internId)}">Delete</button>
        </td>
      </tr>`
    )
    .join('');
}

function handleSubmit(event) {
  event.preventDefault(); 
  clearErrors(form);

  const data = Object.fromEntries(new FormData(form));
  const { isValid, errors } = validateInternId(data, interns, editingId);

  if (!isValid) {
    showErrors(form, errors);
    showToast('Please fix the highlighted fields.', 'error');
    return; 
  }

  const intern = new Intern(data);

  if (editingId) {
    const index = interns.findIndex((i) => i.internId === editingId);
    interns[index] = intern;
    showToast('Intern updated successfully.');
  } else {
    interns.push(intern);
    showToast('Intern added successfully.');
  }

  if (persist()) {
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
  submitBtn.textContent = 'Update Intern';
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: 'smooth' });
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

  const confirmed = confirm(`Delete ${intern.name} (${id})? This cannot be undone.`);
  if (!confirmed) return;

  interns = interns.filter((i) => i.internId !== id);
  if (persist()) {
    renderTable();
    if (editingId === id) resetForm(); 
    showToast('Intern deleted.');
  }
}

tableBody.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === 'view') viewIntern(id);
  if (action === 'edit') startEdit(id);
  if (action === 'delete') deleteIntern(id);
});

form.addEventListener('submit', handleSubmit);
cancelBtn.addEventListener('click', resetForm);


fillSelect('specialization', SPECIALIZATIONS, '-- Select --');
fillSelect('status', STATUSES, '-- Select --');
form.elements.status.value = 'Active'; 
renderTable();

