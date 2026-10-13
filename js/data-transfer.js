// data-transfer.js — export/import rules. No DOM, no storage.
import { Intern } from "./models.js";
import {
  validateIntern,
  validateAttendance,
  validateAssessment,
  validateTask,
} from "./validation.js";

export const DATASET_NAMES = ["interns", "attendance", "assessments", "tasks"];
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB: refuse anything bigger
const FORMAT = { app: "intern-management-system", version: 1 };

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

// ---------- Export ----------
export function buildExport(datasets, selectedNames) {
  const data = {};
  selectedNames.forEach((name) => {
    data[name] = datasets[name];
  });
  return { ...FORMAT, exportedAt: new Date().toISOString(), data };
}

// ---------- Import, step 1: turn text into datasets (or throw a friendly error) ----------
export function parseImportText(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error("This file is not valid JSON.");
  }

  if (typeof parsed?.version === "number" && parsed.version > FORMAT.version) {
    throw new Error("This file was made by a newer version of the app.");
  }

  // Accept our wrapper ({ data: {...} }) or a plain { interns: [...] } file
  const source = isPlainObject(parsed?.data) ? parsed.data : parsed;
  if (!isPlainObject(source))
    throw new Error("Unrecognised file: expected a JSON object.");

  const found = DATASET_NAMES.filter((name) => Array.isArray(source[name]));
  if (found.length === 0) {
    throw new Error(
      "No interns, attendance, assessments or tasks were found in this file.",
    );
  }
  return Object.fromEntries(found.map((name) => [name, source[name]]));
}

// ---------- Import, step 2: validate one untrusted record ----------
// Returns null if the record is fine, or ONE readable reason if it is not.
function check(validator, record, context) {
  if (!isPlainObject(record)) return "Not a valid record.";
  try {
    const { isValid, errors } = validator(record, context);
    return isValid ? null : Object.values(errors)[0];
  } catch (error) {
    return "Record has the wrong data types."; // e.g. a number where text was expected
  }
}

const hasId = (record) =>
  typeof record.id === "string" && record.id.trim() ? null : "Missing id.";

// Per-dataset rules: how to validate, how to spot duplicates, which fields to keep.
const RULES = {
  attendance: {
    validator: validateAttendance,
    keyOf: (r) => `${String(r.internId ?? "").trim().toUpperCase()}|${r.date}`,
    pick: ({ internId, date, status }) => ({
      internId: String(internId).trim().toUpperCase(),
      date,
      status,
    }),
  },
  assessments: {
    validator: validateAssessment,
    extra: hasId,
    keyOf: (r) => r.id.trim(),
    pick: ({ id, internId, subject, marks, totalMarks, date }) => ({
      id: id.trim(),
      internId: String(internId).trim().toUpperCase(),
      subject,
      marks: Number(marks),
      totalMarks: Number(totalMarks),
      date,
    }),
  },
  tasks: {
    validator: validateTask,
    extra: hasId,
    keyOf: (r) => r.id.trim(),
    pick: ({
      id,
      title,
      internId,
      assignedDate,
      dueDate,
      priority,
      status,
    }) => ({
      id: id.trim(),
      title: title.trim(),
      internId: String(internId).trim().toUpperCase(),
      assignedDate,
      dueDate,
      priority,
      status,
    }),
  },
};

// ---------- Import, step 3: work out the final datasets WITHOUT saving anything ----------
export function prepareImport(incoming, existing, mode) {
  const report = {};
  const final = { ...existing }; // start with everything unchanged

  const startReport = (name) => {
    report[name] = {
      received: incoming[name].length,
      accepted: 0,
      skipped: 0,
      problems: [],
    };
  };
  const skip = (name, index, reason) => {
    report[name].skipped += 1;
    if (report[name].problems.length < 5)
      report[name].problems.push(`Row ${index + 1}: ${reason}`);
  };

  // 1) Interns first, because every other dataset points at them
  if (incoming.interns) {
    startReport("interns");
    const kept = mode === "merge" ? existing.interns : [];
    const added = [];

    incoming.interns.forEach((record, index) => {
      const reason = check(validateIntern, record, [...kept, ...added]); // also catches duplicate IDs
      if (reason) return skip("interns", index, reason);
      added.push({ ...new Intern(record) }); // the class cleans up case and spaces
    });

    report.interns.accepted = added.length;
    final.interns = [...kept, ...added];
  }

  // 2) Attendance, assessments, tasks: checked against the FINAL list of interns
  Object.entries(RULES).forEach(([name, rule]) => {
    if (!incoming[name]) return;
    startReport(name);

    const kept = mode === "merge" ? existing[name] : [];
    const seen = new Set(kept.map(rule.keyOf));
    const added = [];

    incoming[name].forEach((record, index) => {
      const reason =
        check(rule.validator, record, final.interns) ??
        rule.extra?.(record) ??
        null;
      if (reason) return skip(name, index, reason);

      const key = rule.keyOf(record);
      if (seen.has(key)) return skip(name, index, "Duplicate record.");
      seen.add(key);
      added.push(rule.pick(record));
    });

    report[name].accepted = added.length;
    final[name] = [...kept, ...added];
  });

  // 3) Remove records that point to interns who don't exist
  const internIds = new Set(final.interns.map((intern) => intern.internId));
  let orphansRemoved = 0;
  Object.keys(RULES).forEach((name) => {
    const before = final[name].length;
    final[name] = final[name].filter((record) =>
      internIds.has(record.internId),
    );
    orphansRemoved += before - final[name].length;
  });

  return { final, report, orphansRemoved };
}
