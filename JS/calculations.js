import { todayISO } from "./utils.js";

export function getAttendanceCategory(percentage) {
  if (percentage >= 90) return "Excellent";
  if (percentage >= 75) return "Good";
  if (percentage >= 60) return "Warning";
  return "Critical";
}

export function calculateAttendanceStats(records) {
  const counts = records.reduce((totals, { status }) => {
    totals[status] = (totals[status] ?? 0) + 1;
    return totals;
  }, {});
  const present = counts["Present"] ?? 0;
  const halfDay = counts["Half Day"] ?? 0;
  const absent = counts["Absent"] ?? 0;
  const leave = counts["Leave"] ?? 0;

  const workingDays = records.length;
  const attended = present + halfDay * 0.5;

  const percentage =
    workingDays === 0 ? 0 : Math.round((attended / workingDays) * 10000) / 100;

  return {
    workingDays,
    present,
    halfDay,
    absent,
    leave,
    percentage,
    category: workingDays === 0 ? "No Data" : getAttendanceCategory(percentage),
  };
}

export function calculatePercentage(marks, totalMarks) {
  if (!totalMarks || totalMarks <= 0) return 0;
  return Math.round(((marks / totalMarks) * 10000) / 100);
}

export function getGrade(percentage) {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

export function calculateAssessmentSummary(records) {
  if (records.length === 0) return { count: 0, percentage: 0, grade: "N/A" };
  const { obtained, possibe } = records.reduce(
    (totals, { marks, totalMarks }) => ({
      obtained: totals.obtained + marks,
      possibe: totals.possibe + totalMarks,
    }),
    { obtained: 0, possibe: 0 },
  );
  const percentage = calculatePercentage(obtained, possibe);
  return { count: records.length, percentage, grade: getGrade(percentage) };
}

export function calculateSubjectPerformance(records) {
  const bySubject = records.reduce((groups, record) => {
    (groups[record.subject] ??= []).push(record);
    return groups;
  }, {});

  return Object.entries(bySubject)
    .map(([subject, items]) => {
      const { count, percentage, grade } = calculateAssessmentSummary(items);
      return { subject, attempts: count, percentage, grade };
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

export function isTaskOverdue(task, today = todayISO()) {
  return task.status !== "Completed" && task.dueDate < today;
}

export function calculateTaskStats(tasks, today = todayISO()) {
  const counts = tasks.reduce((totals, { status }) => {
    totals[status] = (totals[status] ?? 0) + 1;
    return totals;
  }, {});

  const total = tasks.length;
  const completed = counts["Completed"] ?? 0;

  return {
    total,
    completed,
    inProgress: counts["In Progress"] ?? 0,
    pending: counts["Pending"] ?? 0,
    open: total - completed,
    overdue: tasks.filter((task) => isTaskOverdue(task, today)).length,
    completionPercentage:
      total === 0 ? 0 : Math.round((completed / total) * 10000) / 100,
  };
}

export const WEIGHTS = { attendance: 30, assessment: 50, tasks: 20 };

export function getOverallCategory(score) {
  if (score >= 90) return "Outstanding";
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 60) return "Average";
  return "Needs Improvement";
}

export function calculateOverallPerformance(
  attendanceStats,
  assessmentSummary,
  taskStats,
) {
  const components = [
    {
      weight: WEIGHTS.attendance,
      value: attendanceStats.percentage,
      hasData: attendanceStats.workingDays > 0,
    },
    {
      weight: WEIGHTS.assessment,
      value: assessmentSummary.percentage,
      hasData: assessmentSummary.count > 0,
    },
    {
      weight: WEIGHTS.tasks,
      value: taskStats.completionPercentage,
      hasData: taskStats.total > 0,
    },
  ];

  const used = components.filter((c) => c.hasData);
  const totalWeight = used.reduce((sum, c) => sum + c.weight, 0);

  if (totalWeight === 0) {
    return {
      score: 0,
      category: "No Data",
      isComplete: false,
      componentsUsed: 0,
    };
  }

  const weightedSum = used.reduce((sum, c) => sum + c.value * c.weight, 0);
  const score = Math.round((weightedSum / totalWeight) * 100) / 100;

  return {
    score,
    category: getOverallCategory(score),
    isComplete: used.length === components.length,
    componentsUsed: used.length,
  };
}

export function buildPerformanceRows(interns, attendance, assessments, tasks) {
  return interns.map((intern) => {
    const mine = (records) =>
      records.filter((r) => r.internId === intern.internId);

    const attendanceStats = calculateAttendanceStats(mine(attendance));
    const assessmentSummary = calculateAssessmentSummary(mine(assessments));
    const taskStats = calculateTaskStats(mine(tasks));

    return {
      intern,
      attendance: attendanceStats,
      assessment: assessmentSummary,
      tasks: taskStats,
      performance: calculateOverallPerformance(
        attendanceStats,
        assessmentSummary,
        taskStats,
      ),
    };
  });
}

export function getTopPerformers(rows, limit = 5) {
  return rows
    .filter((row) => row.performance.isComplete)
    .sort(
      (a, b) =>
        b.performance.score - a.performance.score ||
        b.assessment.percentage - a.assessment.percentage ||
        a.intern.name.localeCompare(b.intern.name),
    )
    .slice(0, limit);
}

export function average(values) {
  if (values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

export function calculateDashboardStats(rows) {
  const withAttendance = rows.filter((row) => row.attendance.workingDays > 0);
  const withAssessment = rows.filter((row) => row.assessment.count > 0);

  const attendanceCategories = rows.reduce((counts, row) => {
    const category = row.attendance.category;
    counts[category] = (counts[category] ?? 0) + 1;
    return counts;
  }, {});

  const specializationCounts = rows.reduce((counts, row) => {
    const name = row.intern.specialization;
    counts[name] = (counts[name] ?? 0) + 1;
    return counts;
  }, {});

  return {
    totalInterns: rows.length,
    activeInterns: rows.filter((row) => row.intern.isActive()).length,
    averageAttendance: average(
      withAttendance.map((row) => row.attendance.percentage),
    ),
    averageScore: average(
      withAssessment.map((row) => row.assessment.percentage),
    ),
    attendanceDataCount: withAttendance.length,
    assessmentDataCount: withAssessment.length,
    pendingTasks: rows.reduce((sum, row) => sum + row.tasks.open, 0),
    overdueTasks: rows.reduce((sum, row) => sum + row.tasks.overdue, 0),
    attendanceCategories,
    specializationCounts,
  };
}
