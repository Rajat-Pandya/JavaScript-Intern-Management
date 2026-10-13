import { todayISO } from "./utils.js";
import {
  ATTENDANCE_STATUSES,
  SUBJECTS,
  TASK_STATUSES,
  TASK_PRIORITIES,
} from "./models.js";

const ID_REGEX = /^[A-Za-z0-9-]{3,15}$/;
const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]{1,49}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

export function validateIntern(data, existingInterns = [], currentId = null) {
  const errors = {};
  const {
    internId,
    name,
    email,
    mobile,
    gender,
    city,
    specialization,
    joiningDate,
    status,
  } = data;

  const id = internId?.trim().toUpperCase() ?? "";
  if (!id) {
    errors.internId = "Intern ID is required.";
  } else if (!ID_REGEX.test(id)) {
    errors.internId = "Use 3-15 letters, digits or hyphens (e.g. INT001).";
  } else if (
    existingInterns.some((i) => i.internId === id && i.internId !== currentId)
  ) {
    errors.internId = "This Intern ID already exists.";
  }

  if (!name?.trim()) errors.name = "Name is required.";
  else if (!NAME_REGEX.test(name.trim()))
    errors.name = "Name must be 2-50 letters (spaces, . ' - allowed).";

  if (!email?.trim()) errors.email = "Email is required.";
  else if (!EMAIL_REGEX.test(email.trim()))
    errors.email = "Enter a valid email, e.g. name@example.com.";

  if (!mobile?.trim()) errors.mobile = "Mobile number is required.";
  else if (!MOBILE_REGEX.test(mobile.trim()))
    errors.mobile = "Enter a 10-digit mobile number starting with 6-9.";

  if (!gender) errors.gender = "Please select a gender.";
  if (!city?.trim()) errors.city = "City is required.";
  if (!specialization)
    errors.specialization = "Please select a specialization.";
  if (!status) errors.status = "Please select a status.";

  if (!joiningDate) {
    errors.joiningDate = "Joining date is required.";
  } else if (Number.isNaN(new Date(joiningDate).getTime())) {
    errors.joiningDate = "Enter a valid date.";
  } else if (joiningDate > todayISO()) {
    errors.joiningDate = "Joining date cannot be in the future.";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export const validateInternId = validateIntern;

export function validateAttendance(data, interns = []) {
  const errors = {};
  const { internId, date, status } = data;
  const cleanInternId = internId !== undefined && internId !== null ? String(internId).trim().toUpperCase() : "";
  const intern = interns.find((i) => i.internId === cleanInternId);

  if (!cleanInternId) errors.internId = "Please select an intern.";
  else if (!intern) errors.internId = "Selected intern does not exist.";

  if (!date) {
    errors.date = "Date is required.";
  } else if (Number.isNaN(new Date(date).getTime())) {
    errors.date = "Enter a valid date.";
  } else if (date > todayISO()) {
    errors.date = "Attendance cannot be recorded for a future date.";
  } else if (intern && date < intern.joiningDate) {
    errors.date = `Date is before this intern's joining date (${intern.joiningDate}).`;
  }

  if (!status) errors.status = "Please select an attendance status.";
  else if (!ATTENDANCE_STATUSES.includes(status))
    errors.status = "Invalid status.";

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function clearErrors(form) {
  form
    .querySelectorAll("[data-error-for]")
    .forEach((el) => (el.textContent = ""));
  form
    .querySelectorAll(".invalid")
    .forEach((el) => el.classList.remove("invalid"));
}

export function showErrors(form, errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const errorEl = form.querySelector(`[data-error-for="${field}"]`);
    const inputEl = form.elements[field];
    if (errorEl) errorEl.textContent = message;
    inputEl?.classList.add("invalid");
  });
}

export function validateAssessment(data, interns = []) {
  const errors = {};
  const { internId, subject, marks, totalMarks, date } = data;
  const cleanInternId = internId !== undefined && internId !== null ? String(internId).trim().toUpperCase() : "";
  const intern = interns.find((i) => i.internId === cleanInternId);

  const isBlank = (value) => String(value ?? "").trim() === "";
  const total = Number(totalMarks);
  const obtained = Number(marks);

  if (!cleanInternId) errors.internId = "Please select an intern";
  else if (!intern) errors.internId = "Selected intern does not exist";

  if (!subject) errors.subject = "Please select a subject";
  else if (!SUBJECTS.includes(subject)) errors.subject = "Invalid subject";

  if (isBlank(totalMarks)) {
    errors.totalMarks = "Total marks is required";
  } else if (!Number.isFinite(total) || total <= 0) {
    errors.totalMarks = "Total marks must be a number greater than 0";
  } else if (total > 1000) {
    errors.totalMarks = "Total marks cannot exceed 1000";
  }

  if (isBlank(marks)) {
    errors.marks = "Marks are required.";
  } else if (!Number.isFinite(obtained) || obtained < 0) {
    errors.marks = "Marks must be a number, 0 or more.";
  } else if (!errors.totalMarks && obtained > total) {
    errors.marks = `Marks cannot exceed total marks (${total}).`;
  }

  if (!date) {
    errors.date = "Date is required.";
  } else if (Number.isNaN(new Date(date).getTime())) {
    errors.date = "Enter a valid date.";
  } else if (date > todayISO()) {
    errors.date = "Assessment date cannot be in the future.";
  } else if (intern && date < intern.joiningDate) {
    errors.date = `Date is before this intern's joining date (${intern.joiningDate}).`;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

export function validateTask(data, interns = []) {
  const errors = {};
  const { title, internId, assignedDate, dueDate, priority, status } = data;
  const cleanInternId = internId !== undefined && internId !== null ? String(internId).trim().toUpperCase() : "";
  const intern = interns.find((i) => i.internId === cleanInternId);
  const isValidDate = (value) =>
    Boolean(value) && !Number.isNaN(new Date(value).getTime());

  const cleanTitle = title?.trim() ?? "";
  if (!cleanTitle) errors.title = "Task title is required.";
  else if (cleanTitle.length < 3 || cleanTitle.length > 100)
    errors.title = "Title must be 3-100 characters.";

  if (!cleanInternId) errors.internId = "Please select an intern.";
  else if (!intern) errors.internId = "Selected intern does not exist.";

  if (!assignedDate) {
    errors.assignedDate = "Assigned date is required.";
  } else if (!isValidDate(assignedDate)) {
    errors.assignedDate = "Enter a valid date.";
  } else if (intern && assignedDate < intern.joiningDate) {
    errors.assignedDate = `Cannot be before the intern's joining date (${intern.joiningDate}).`;
  }

  if (!dueDate) {
    errors.dueDate = "Due date is required.";
  } else if (!isValidDate(dueDate)) {
    errors.dueDate = "Enter a valid date.";
  } else if (!errors.assignedDate && dueDate < assignedDate) {
    errors.dueDate = "Due date cannot be before the assigned date.";
  }

  if (!priority) errors.priority = "Please select a priority.";
  else if (!TASK_PRIORITIES.includes(priority))
    errors.priority = "Invalid priority.";

  if (!status) errors.status = "Please select a status.";
  else if (!TASK_STATUSES.includes(status)) errors.status = "Invalid status.";

  return { isValid: Object.keys(errors).length === 0, errors };
}
