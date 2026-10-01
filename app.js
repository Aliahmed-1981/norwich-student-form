const form = document.querySelector('#studentForm');
const siblingsArea = document.querySelector('#siblingsArea');
const siblingsList = document.querySelector('#siblingsList');
const addSiblingButton = document.querySelector('#addSibling');
const message = document.querySelector('#formMessage');
const successPanel = document.querySelector('#successPanel');
const draftKey = 'via-student-intake-draft';
const submittedKeysKey = 'via-submitted-student-keys';
// Paste the deployed Google Apps Script Web App URL here to enable online submission.
const SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwty-HIOAT0QsQhU-GxbyPmULdB5buzwj-1z_mlR_sCAQ_OROrJSqCh9wbGEZ-G390O/exec';
let lastPayload = null;

const today = new Date().toISOString().split('T')[0];
document.querySelector('[name="birthDate"]').max = today;

function siblingTemplate(index) {
  return `<div class="sibling-row" data-sibling="${index}">
    <label class="field"><span>Sibling full name <b>*</b></span><input data-key="name" type="text" required /></label>
    <label class="field"><span>Class / Grade <b>*</b></span><input data-key="classGrade" type="text" required placeholder="Grade 3" /></label>
    <label class="field"><span>Birth date <b>*</b></span><input data-key="birthDate" type="date" max="${today}" required /></label>
    <button type="button" class="remove-sibling" aria-label="Remove sibling">Remove</button>
  </div>`;
}

function addSibling(values = {}) {
  const index = siblingsList.children.length + 1;
  siblingsList.insertAdjacentHTML('beforeend', siblingTemplate(index));
  const row = siblingsList.lastElementChild;
  Object.entries(values).forEach(([key, value]) => {
    const input = row.querySelector(`[data-key="${key}"]`);
    if (input) input.value = value || '';
  });
}

function collectSiblings() {
  return [...siblingsList.querySelectorAll('.sibling-row')].map(row => ({
    name: row.querySelector('[data-key="name"]').value.trim(),
    classGrade: row.querySelector('[data-key="classGrade"]').value.trim(),
    birthDate: row.querySelector('[data-key="birthDate"]').value
  }));
}

function collectData() {
  const data = Object.fromEntries(new FormData(form).entries());
  data.hasSiblings = data.hasSiblings === 'Yes';
  data.siblings = data.hasSiblings ? collectSiblings() : [];
  data.submittedAt = new Date().toISOString();
  return data;
}

function duplicateKey(data) {
  return [data.firstName, data.middleName, data.lastName, data.birthDate]
    .map(value => String(value || '').trim().toLowerCase()).join('|');
}

function wasSubmittedBefore(data) {
  const keys = JSON.parse(localStorage.getItem(submittedKeysKey) || '[]');
  return keys.includes(duplicateKey(data));
}

function rememberSubmission(data) {
  const keys = JSON.parse(localStorage.getItem(submittedKeysKey) || '[]');
  const key = duplicateKey(data);
  if (!keys.includes(key)) localStorage.setItem(submittedKeysKey, JSON.stringify([...keys, key]));
}

function showError(text) {
  message.textContent = text;
  message.className = 'form-message error';
  message.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearError() {
  message.textContent = '';
  message.className = 'form-message';
}

function validate() {
  clearError();
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  let firstInvalid = null;
  form.querySelectorAll('[required]').forEach(input => {
    if (!input.value.trim()) {
      input.classList.add('invalid');
      firstInvalid ||= input;
    }
  });
  const emails = ['studentEmail', 'fatherEmail', 'motherEmail'];
  emails.forEach(name => {
    const input = form.elements[name];
    if (input.value && !input.validity.valid) { input.classList.add('invalid'); firstInvalid ||= input; }
  });
  const birthDate = form.elements.birthDate;
  if (birthDate.value && birthDate.value > today) { birthDate.classList.add('invalid'); firstInvalid ||= birthDate; }
  if (firstInvalid) {
    showError('Please complete all required fields and check the information entered.');
    firstInvalid.focus();
    return false;
  }
  return true;
}

function saveLocal(data) {
  localStorage.setItem('via-last-submission', JSON.stringify(data, null, 2));
  localStorage.removeItem(draftKey);
}

function sendToGoogleSheet(data) {
  if (!SHEET_WEB_APP_URL) return;
  fetch(SHEET_WEB_APP_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(data)
  }).catch(() => {});
}

function restoreDraft() {
  const raw = localStorage.getItem(draftKey);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.entries(data).forEach(([key, value]) => {
      const input = form.elements[key];
      if (input && input.type !== 'radio') input.value = value;
    });
    const radio = form.querySelector(`input[name="hasSiblings"][value="${data.hasSiblings ? 'Yes' : 'No'}"]`);
    if (radio) radio.checked = true;
    if (data.hasSiblings) {
      siblingsArea.hidden = false;
      (data.siblings || []).forEach(addSibling);
    }
    message.textContent = 'The last draft saved on this device has been restored.';
    message.className = 'form-message';
    message.style.display = 'block';
  } catch (error) { localStorage.removeItem(draftKey); }
}

document.querySelectorAll('input[name="hasSiblings"]').forEach(radio => radio.addEventListener('change', event => {
  const show = event.target.value === 'Yes';
  siblingsArea.hidden = !show;
  if (show && !siblingsList.children.length) addSibling();
  if (!show) siblingsList.innerHTML = '';
}));

addSiblingButton.addEventListener('click', () => addSibling());
siblingsList.addEventListener('click', event => {
  if (event.target.matches('.remove-sibling')) event.target.closest('.sibling-row').remove();
});

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!validate()) return;
  lastPayload = collectData();
  if (wasSubmittedBefore(lastPayload)) {
    showError('This student information has already been submitted from this browser.');
    return;
  }
  saveLocal(lastPayload);
  rememberSubmission(lastPayload);
  sendToGoogleSheet(lastPayload);
  form.hidden = true;
  successPanel.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.querySelector('#saveDraft').addEventListener('click', () => {
  localStorage.setItem(draftKey, JSON.stringify(collectData(), null, 2));
  message.textContent = 'The draft has been saved in this browser only.';
  message.className = 'form-message';
  message.style.display = 'block';
});

document.querySelector('#backToForm').addEventListener('click', () => { successPanel.hidden = true; form.hidden = false; });
form.addEventListener('reset', () => { siblingsList.innerHTML = ''; siblingsArea.hidden = true; clearError(); });
restoreDraft();
