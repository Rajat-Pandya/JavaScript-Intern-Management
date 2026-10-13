import { load, save, KEYS } from "./storage.js";
import { todayISO } from "./utils.js";
import { SUBJECTS, TASK_PRIORITIES } from "./models.js";

const SAMPLE_DATA_URL = "data/sample-data.json";
const SAMPLE_RATES = [
  96, 92, 88, 70, 55, 93, 80, 62, 97, 85, 50, 78, 91, 66, 89,
];
const OTHER_STATUSES = ["Absent", "Leave", "Half Day"];
const SAMPLE_SCORES = [
  92, 85, 78, 66, 48, 90, 72, 58, 95, 81, 45, 69, 88, 55, 76,
];

const DATASETS = {
  interns: KEYS.INTERNS,
  attendance: KEYS.ATTENDANCE,
  assessments: KEYS.ASSESSMENTS,
  tasks: KEYS.TASKS,
};

export async function seedIfNeeded() {
  if (load(KEYS.SEEDED, false)) return;

  try {
    const response = await fetch(SAMPLE_DATA_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const sample = await response.json();

    // NEW: generate any dataset the JSON file doesn't provide
    if (Array.isArray(sample.interns)) {
      sample.attendance ??= generateSampleAttendance(sample.interns);
      sample.assessments ??= generateSampleAssessments(sample.interns);
      sample.tasks ??= generateSampleTasks(sample.interns);
    }

    Object.entries(DATASETS).forEach(([name, storageKey]) => {
      const hasSampleRows = Array.isArray(sample[name]);
      const storageIsEmpty = load(storageKey).length === 0;
      if (hasSampleRows && storageIsEmpty) save(storageKey, sample[name]);
    });
    if (Array.isArray(sample.interns) && sample.interns.length > 0) {
      save(KEYS.SEEDED, true);
    }
  } catch (error) {
    console.error("Could not load Sample Data", error);
  }
}

function lastWeekdays(count) {
  const days = [];
  const cursor = new Date(todayISO());
  while (days.length < count) {
    const dayOfWeek = cursor.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(cursor.toISOString().split("T")[0]);
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days;
}

function generateSampleAttendance(interns, dayCount = 20) {
  const dates = lastWeekdays(dayCount);

  return interns.flatMap((intern, i) => {
    const rate = SAMPLE_RATES[i % SAMPLE_RATES.length];
    return dates
      .filter((date) => date >= intern.joiningDate)
      .map((date, d) => ({
        internId: intern.internId,
        date,
        status:
          (d * 7 + i * 13) % 100 < rate
            ? "Present"
            : OTHER_STATUSES[(d + i) % 3],
      }));
  });
}

function addDays(isoDate, days) {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

function generateSampleAssessments(interns, perIntern = 4) {
  const today = todayISO();
  const records = [];

  interns.forEach((intern, i) => {
    for (let k = 0; k < perIntern; k++) {
      const totalMarks = k % 2 === 0 ? 100 : 50;
      const wobble = ((k * 7 + i * 5) % 13) - 6;
      const percent = Math.min(
        100,
        Math.max(20, SAMPLE_SCORES[i % SAMPLE_SCORES.length] + wobble),
      );
      const date = addDays(intern.joiningDate, 7 * (k + 1));

      records.push({
        id: `AS${String(records.length + 1).padStart(4, "0")}`,
        internId: intern.internId,
        subject: SUBJECTS[(i + (k % 3)) % SUBJECTS.length],
        marks: Math.round((percent / 100) * totalMarks),
        totalMarks,
        date: date > today ? today : date,
      });
    }
  });
  return records;
}

const TASK_TITLES = [
  "Build a responsive landing page",
  "Write unit tests for the login module",
  "Prepare API documentation",
  "Design the database schema",
  "Fix bugs from code review",
  "Create a weekly progress report",
  "Deploy the sample application",
  "Present a learning summary",
];

const TASK_RATES = [
  100, 80, 70, 60, 30, 90, 50, 40, 100, 70, 20, 60, 80, 35, 65,
];

function generateSampleTasks(interns, perIntern = 4) {
  const today = todayISO();
  const tasks = [];

  interns.forEach((intern, i) => {
    const completedCount = Math.round(
      (TASK_RATES[i % TASK_RATES.length] / 100) * perIntern,
    );

    for (let k = 0; k < perIntern; k++) {
      const isLast = k === perIntern - 1;

      const assignedDate = isLast
        ? addDays(today, -2)
        : addDays(intern.joiningDate, 3 + k * 6);
      const dueDate = isLast ? addDays(today, i % 5) : addDays(assignedDate, 7);

      tasks.push({
        id: `TK${String(tasks.length + 1).padStart(4, "0")}`,
        title: TASK_TITLES[(i * 2 + k) % TASK_TITLES.length],
        internId: intern.internId,
        assignedDate,
        dueDate,
        priority: TASK_PRIORITIES[(i + k) % TASK_PRIORITIES.length],
        status:
          k < completedCount
            ? "Completed"
            : k % 2 === 0
              ? "In Progress"
              : "Pending",
      });
    }
  });
  return tasks;
}
