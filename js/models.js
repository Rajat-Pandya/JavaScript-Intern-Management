export const SPECIALIZATIONS = [
  "Data Analytics",
  "Data Engineering",
  "Full Stack Java",
  "Full Stack .NET",
  "Full Stack Node.js",
  "Testing",
  "Cloud Computing",
];

export const STATUSES = ["Active", "Inactive", "Completed"];
export const ATTENDANCE_STATUSES = ["Present", "Absent", "Half Day", "Leave"];

export const SUBJECTS = [
  "HTML & CSS",
  "JavaScript",
  "SQL & Databases",
  "Core Java",
  "C# & .NET",
  "Node.js",
  "Python",
  "Cloud Fundamentals",
  "Software Testing",
  "Data Analysis",
];

export const TASK_STATUSES = ["Pending", "In Progress", "Completed"];
export const TASK_PRIORITIES = ["High", "Medium", "Low"];

export const ATTENDANCE_CATEGORIES = [
  "Excellent",
  "Good",
  "Warning",
  "Critical",
  "No Data",
];

export class Intern {
  constructor({
    internId,
    name,
    email,
    mobile,
    gender,
    city,
    specialization,
    joiningDate,
    status = "Active",
  }) {
    this.internId = String(internId).trim().toUpperCase();
    this.name = String(name).trim();
    this.email = String(email).trim().toLowerCase();
    this.mobile = String(mobile).trim();
    this.gender = gender;
    this.city = String(city).trim();
    this.specialization = specialization;
    this.joiningDate = joiningDate;
    this.status = status;
  }

  get initials() {
    return this.name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0].toUpperCase())
      .slice(0, 2)
      .join("");
  }

  isActive() {
    return this.status === "Active";
  }

  matches(query) {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [
      this.name,
      this.internId,
      this.email,
      this.specialization,
      this.city,
    ].some((field) => field.toLowerCase().includes(q));
  }

  static fromJSON(obj) {
    return new Intern(obj);
  }
}
