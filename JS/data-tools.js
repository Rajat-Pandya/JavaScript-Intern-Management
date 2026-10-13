// data-tools.js — buttons, file download, FileReader, confirmation, report. Used by the dashboard.
import { load, save, KEYS } from "./storage.js";
import {
  buildExport,
  parseImportText,
  prepareImport,
  MAX_FILE_SIZE,
} from "./data-transfer.js";
import { showToast, escapeHTML, todayISO } from "./utils.js";

const STORAGE_KEY_BY_NAME = {
  interns: KEYS.INTERNS,
  attendance: KEYS.ATTENDANCE,
  assessments: KEYS.ASSESSMENTS,
  tasks: KEYS.TASKS,
};

// DOM
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const fileInput = document.getElementById("import-file");
const reportBox = document.getElementById("import-report");

function loadAll() {
  return Object.fromEntries(
    Object.entries(STORAGE_KEY_BY_NAME).map(([name, key]) => [name, load(key)]),
  );
}
function downloadJSON(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link); // some browsers only honour the click if it's in the page
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000); // free the memory afterwards
}

function handleExport() {
  const selected = [
    ...document.querySelectorAll('input[name="export-set"]:checked'),
  ].map((checkbox) => checkbox.value);

  if (selected.length === 0) {
    showToast("Select at least one dataset to export.", "error");
    return;
  }

  try {
    downloadJSON(
      `intern-data-${todayISO()}.json`,
      buildExport(loadAll(), selected),
    );
    showToast(`Exported: ${selected.join(", ")}.`);
  } catch (error) {
    console.error("Export failed:", error);
    showToast("Export failed. Please try again.", "error");
  }
}
// FileReader uses old-style callbacks. Wrapping it in a Promise lets us use async/await.
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsText(file);
  });
}
function summarise(report) {
  return Object.values(report).reduce((sum, item) => sum + item.accepted, 0);
}

function renderReport(heading, report, orphansRemoved) {
  const items = Object.entries(report)
    .map(([name, item]) => {
      const skipped = item.skipped ? `, ${item.skipped} skipped` : "";
      const problems = item.problems.length
        ? `<ul class="report-problems">${item.problems.map((p) => `<li>${escapeHTML(p)}</li>`).join("")}</ul>`
        : "";
      return `<li><strong>${name}</strong>: ${item.accepted} of ${item.received} valid${skipped}${problems}</li>`;
    })
    .join("");

  const orphanNote = orphansRemoved
    ? `<p class="report-problems">${orphansRemoved} record(s) pointing to missing interns were removed.</p>`
    : "";

  reportBox.innerHTML = `<p><strong>${escapeHTML(heading)}</strong></p><ul>${items}</ul>${orphanNote}`;
}

function saveAll(final) {
  const previous = loadAll();
  const names = Object.keys(STORAGE_KEY_BY_NAME);

  const failed = names.some(
    (name) => !save(STORAGE_KEY_BY_NAME[name], final[name]),
  );
  if (failed) {
    names.forEach((name) => save(STORAGE_KEY_BY_NAME[name], previous[name])); // roll back
    throw new Error("Could not save the imported data. Nothing was changed.");
  }

  // Imported data now exists, so never mix sample data into it later
  save(KEYS.SEEDED, true);
}

async function handleImport(onDataChanged) {
  const file = fileInput.files[0];

  if (!file) return showToast("Choose a .json file first.", "error");
  if (!file.name.toLowerCase().endsWith(".json"))
    return showToast("Only .json files can be imported.", "error");
  if (file.size === 0) return showToast("That file is empty.", "error");
  if (file.size > MAX_FILE_SIZE)
    return showToast("File is too large (maximum 2 MB).", "error");

  importBtn.disabled = true;
  try {
    const text = await readFileAsText(file);
    const incoming = parseImportText(text);
    const mode = document.querySelector(
      'input[name="import-mode"]:checked',
    ).value;
    const { final, report, orphansRemoved } = prepareImport(
      incoming,
      loadAll(),
      mode,
    );

    if (summarise(report) === 0) {
      renderReport("Nothing imported", report, 0);
      showToast(
        "Nothing new to import (all records were invalid or already exist).",
        "error",
      );
      return;
    }

    const lines = Object.entries(report)
      .map(
        ([name, item]) =>
          `• ${name}: ${item.accepted} of ${item.received} valid`,
      )
      .join("\n");
    const action =
      mode === "replace"
        ? `This will REPLACE your current ${Object.keys(report).join(", ")}.`
        : "Your existing records are kept; only new ones are added.";
    const orphanLine = orphansRemoved
      ? `\n${orphansRemoved} record(s) that point to missing interns will be removed.`
      : "";

    if (!confirm(`Import this file?\n\n${lines}\n\n${action}${orphanLine}`)) {
      renderReport("Import cancelled", report, orphansRemoved);
      return;
    }

    saveAll(final);
    renderReport("Import complete", report, orphansRemoved);
    showToast("Data imported successfully.");
    fileInput.value = "";
    onDataChanged();
  } catch (error) {
    console.error("Import failed:", error);
    showToast(error.message, "error");
  } finally {
    importBtn.disabled = false;
  }
}

export function initDataTools({ onDataChanged }) {
  exportBtn.addEventListener("click", handleExport);
  importBtn.addEventListener("click", () => handleImport(onDataChanged));
}
