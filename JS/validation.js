import {todayISO} from './utils.js';

const ID_REGEX = /^[A-Za-z0-9-]{3,15}$/;          
const NAME_REGEX = /^[A-Za-z][A-Za-z .'-]{1,49}$/; 
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;  

export function validateInternId(data, existingInterns = [], currentId = null) {
    const errors = {};
    const {internId, name, email, mobile, gender, city, specialization, joiningDate, status} = data;

    const id = internId?.trim().toUpperCase() ?? '';
    if (!id) {
        errors.internId = 'Intern ID is required.';
    } else if (!ID_REGEX.test(id)) {
        errors.internId = 'Use 3-15 letters, digits or hyphens (e.g. INT001).';
    } else if (existingInterns.some((i) => i.internId === id && i.internId !== currentId)) {
        errors.internId = 'This Intern ID already exists.';
    }
    
    if (!name?.trim()) errors.name = 'Name is required.';
    else if (!NAME_REGEX.test(name.trim())) errors.name = 'Name must be 2-50 letters (spaces, . \' - allowed).';


    if (!email?.trim()) errors.email = 'Email is required.';
    else if (!EMAIL_REGEX.test(email.trim())) errors.email = 'Enter a valid email, e.g. name@example.com.';


    if (!mobile?.trim()) errors.mobile = 'Mobile number is required.';
    else if (!MOBILE_REGEX.test(mobile.trim())) errors.mobile = 'Enter a 10-digit mobile number starting with 6-9.';


    if (!gender) errors.gender = 'Please select a gender.';
    if (!city?.trim()) errors.city = 'City is required.';
    if (!specialization) errors.specialization = 'Please select a specialization.';
    if (!status) errors.status = 'Please select a status.';


    if (!joiningDate) {
    errors.joiningDate = 'Joining date is required.';
    } else if (Number.isNaN(new Date(joiningDate).getTime())) {
    errors.joiningDate = 'Enter a valid date.';
    } else if (joiningDate > todayISO()) {
    errors.joiningDate = 'Joining date cannot be in the future.';
    }

    return { isValid: Object.keys(errors).length === 0, errors };
}


export function clearErrors(form) {
    form.querySelectorAll('[data-error-for]').forEach((el) => (el.textContent = ''));
    form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
}

export function showErrors(form, errors) {
    Object.entries(errors).forEach(([field, message]) => {
    const errorEl = form.querySelector(`[data-error-for="${field}"]`);
    const inputEl = form.elements[field];
    if (errorEl) errorEl.textContent = message;
    inputEl?.classList.add('invalid');
    });
}
