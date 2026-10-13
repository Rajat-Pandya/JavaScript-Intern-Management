# Comprehensive Testing Checklist

This document details the test scenarios, boundary conditions, edge cases, and failure modes across all modules of the **Intern Training & Performance Management System**.

Tick the **Result** column when verifying tests on your deployed live site or local environment.

---

## 1. Intern Management (`interns.html`)

| Area | Test Case | Expected Behavior | Result |
|---|---|---|---|
| Validation | Submit empty intern form | All required field errors displayed; no record saved | [ ] |
| Validation | Invalid mobile: `5876543210` (starts with 5) | Error: "Enter a 10-digit mobile number starting with 6-9" | [ ] |
| Validation | Short mobile: `98765`, Long mobile: `98765432101` | Error: Rejected by 10-digit format check | [ ] |
| Validation | Invalid name: Single character `A`, Numbers `123` | Error: "Name must be 2-50 letters" | [ ] |
| Validation | Invalid email: `test@`, `plainaddress`, `@domain.com` | Error: "Enter a valid email, e.g. name@example.com" | [ ] |
| Validation | Duplicate Intern ID in different casing (e.g., `int001` vs `INT001`) | Error: "This Intern ID already exists" | [ ] |
| Validation | Future joining date | Error: "Joining date cannot be in the future" | [ ] |
| Edit Mode | Click "Edit" on intern | Form populates, Intern ID is `readOnly`, title changes to "Edit Intern", cancel button visible | [ ] |
| Edit Mode | Save intern without changing ID | Successfully updates without false "Duplicate ID" error | [ ] |
| View Modal | Click "View" on intern row | Dialog modal opens with read-only details and initials badge | [ ] |
| Deletion | Click "Delete" on intern row | Confirmation dialog triggers; on confirmation, cascades delete across attendance, assessments, and tasks | [ ] |
| Deletion | Cancel deletion prompt | Intern and associated records remain intact | [ ] |
| Search | Type in search bar | Debounces by 300ms; filters live by name, ID, email, specialization, or city | [ ] |
| Filters | Select Specialization / Status / Attendance | Table filters to matching subset; result count updates accurately | [ ] |
| Sorting | Sort by Name, Joining Date, Marks, Attendance | Proper order; interns with no marks/attendance stay at bottom in both asc and desc | [ ] |
| Reset | Click "Reset" button | Clears search input, resets all select dropdowns, restores complete intern list | [ ] |

---

## 2. Attendance Tracking (`attendance.html`)

| Area | Test Case | Expected Behavior | Result |
|---|---|---|---|
| Validation | Submit empty attendance form | Highlights required fields (intern, date, status) | [ ] |
| Validation | Future attendance date | Error: "Attendance cannot be recorded for a future date" | [ ] |
| Validation | Date prior to intern's joining date | Error: "Date is before this intern's joining date" | [ ] |
| Data Update | Log attendance for intern on an existing date | Existing record for that date is updated in place with toast notification | [ ] |
| Statistics | Intern with no records | Percentage displays `0.0%`, Category badge is `No Data`, no errors | [ ] |
| Calculations | 2 Present, 1 Half Day, 1 Absent (4 working days) | Attended = 2.5; Percentage = 62.5%; Category badge is `Warning` | [ ] |
| Category Tiers | Percentage 90.0% / 75.0% / 60.0% / 59.9% | Correct badges: Excellent (>=90), Good (>=75), Warning (>=60), Critical (<60) | [ ] |
| History Modal | Click "History" on an intern | Modal opens displaying chronological list of all attendance dates and badges | [ ] |

---

## 3. Assessments (`assessment.html`)

| Area | Test Case | Expected Behavior | Result |
|---|---|---|---|
| Validation | Marks > Total Marks (e.g. 105 / 100) | Error: "Marks cannot exceed total marks" | [ ] |
| Validation | Negative marks (`-5`), Total marks `0` or negative | Validation errors triggered; form blocked | [ ] |
| Validation | Blank marks or total marks | Error: "Marks are required" / "Total marks is required" | [ ] |
| Validation | Total marks > 1000 | Error: "Total marks cannot exceed 1000" | [ ] |
| Live Preview | Enter marks: `85`, Total marks: `100` | Preview updates dynamically: "Percentage: 85.00% — Grade A" | [ ] |
| Live Preview | Clear marks input or enter invalid value | Preview text clears without throwing error | [ ] |
| Aggregation | 80/100 and 30/50 | Total 110/150 = 73.33%; Grade is `B` (not mean of 80% and 60% = 70%) | [ ] |
| Grade Tiers | Scores: 92%, 85%, 72%, 64%, 55%, 42% | Grades: A+, A, B, C, D, F respectively | [ ] |
| Subject Modal | Click "View" under Subject-wise | Modal displays breakdown of attempts, overall %, and letter grade per subject | [ ] |
| Delete Record | Click "Delete" on single assessment record | Confirmation prompt triggers; removes record and recalculates summary | [ ] |

---

## 4. Task Management (`tasks.html`)

| Area | Test Case | Expected Behavior | Result |
|---|---|---|---|
| Validation | Due date before assigned date | Error: "Due date cannot be before the assigned date" | [ ] |
| Validation | Due date equal to assigned date | Accepted as valid | [ ] |
| Validation | Assigned date before intern's joining date | Error: "Cannot be before the intern's joining date" | [ ] |
| Validation | Title < 3 characters or > 100 characters | Error: "Title must be 3-100 characters" | [ ] |
| Overdue Status | Task due yesterday with status "Pending" | Highlighted row (`row-overdue`), counted in overdue stats | [ ] |
| Overdue Status | Task due today with status "Pending" | NOT overdue; normal row styling | [ ] |
| Overdue Status | Task due yesterday with status "Completed" | NOT overdue (completion clears overdue condition) | [ ] |
| Inline Status | Change status directly from table dropdown | Updates task status immediately, recalculates completion % and KPI cards | [ ] |
| Filter Overdue | Check "Overdue only" checkbox | Displays only non-completed tasks past their due date | [ ] |

---

## 5. Performance Analytics (`performance.html`)

| Area | Test Case | Expected Behavior | Result |
|---|---|---|---|
| Overall Formula | Complete data (Attendance 80%, Assessment 70%, Tasks 100%) | Score = 79.0; Category = `Good`; "Based on: All 3 areas" | [ ] |
| Missing Area | Intern with no tasks (Attendance 80%, Assessment 70%) | Score = 73.75; Category = `Good`; "Based on: 2 of 3 areas" | [ ] |
| No Data | Intern with zero records in all three areas | Score = "—"; Category = `No Data`; "Based on: 0 of 3 areas" | [ ] |
| Leaderboard | Top 5 performers ranking | Only includes interns with complete data (all 3 areas); sorted score desc | [ ] |
| Leaderboard Tie | Same overall score between two interns | Tie broken by higher assessment %, then alphabetically by name (A-Z) | [ ] |
| Category Filter | Filter by "Outstanding", "Good", etc. | Correctly filters table rows; updates result count banner | [ ] |

---

## 6. Dashboard (`dashboard.html`) & System Tools

| Area | Test Case | Expected Behavior | Result |
|---|---|---|---|
| KPI Cards | Total / Active Interns, Avg Attendance, Avg Score, Pending Tasks | Dynamically calculated from stored data without hard-coding | [ ] |
| Averages KPI | Average calculations with subset of recorded interns | Calculates average only across interns who possess data | [ ] |
| Progress Bars | Attendance Categories & Specializations | Render relative width bars corresponding to real intern distribution | [ ] |
| External API | Thought of the Day loads on startup | Displays quote text and author; handles network latency with spinner | [ ] |
| API Failure | Offline mode (DevTools Network -> Offline) + click "New quote" | Graceful error message ("Network error. Check your internet connection.") | [ ] |
| Live Clock | Observe navbar digital clock | Updates live second-by-second in local Indian/browser format | [ ] |
| Theme Toggle | Click Dark/Light toggle button | Toggles dark stylesheet variables/overrides, updates icon, persists in storage | [ ] |
| Theme Persistence | Reload page after setting dark theme | Theme applies instantly in `<head>` without flashing light theme | [ ] |

---

## 7. Data Transfer & Import/Export (`js/data-transfer.js`)

| Area | Test Case | Expected Behavior | Result |
|---|---|---|---|
| Export | Check datasets and click "Download JSON" | Downloads formatted JSON named `intern-data-YYYY-MM-DD.json` | [ ] |
| Export | Deselect all dataset checkboxes and click Download | Toast warning: "Select at least one dataset to export" | [ ] |
| Import Format | Upload non-JSON file (e.g. `.txt`, `.png`) | Error: "Only .json files can be imported" | [ ] |
| Import Format | Upload corrupted/invalid JSON syntax file | Error: "This file is not valid JSON" | [ ] |
| Import Size | Upload file exceeding 2MB | Error: "File is too large (maximum 2 MB)" | [ ] |
| Import Validation | File with attendance pointing to non-existent intern | Dry-run report notes skipped row; accepted rows imported safely | [ ] |
| Import Modes | "Merge" mode vs "Replace" mode | Merge keeps existing records; Replace overwrites and purges orphan records | [ ] |
| Rollback | Simulated storage failure during import | Reverts storage back to initial state; displays error toast | [ ] |

---

## 8. Cross-Browser, Layout & Storage Boundaries

| Area | Test Case | Expected Behavior | Result |
|---|---|---|---|
| Mobile View | Screen width 375px (iPhone / small mobile) | Single-column form, responsive table horizontal scroll, wrapped navbar | [ ] |
| Tablet View | Screen width 700px - 900px | Grid items collapse cleanly without horizontal page body scroll | [ ] |
| Reduced Motion | OS setting `prefers-reduced-motion: reduce` | Animations and spinner slow down / simplify per accessibility rules | [ ] |
| Storage Corrupt | Put invalid JSON into `localStorage.itpms_interns = "invalid{"` | Safe fallback without crashing; logs warning and returns empty array | [ ] |
| 404 Routing | Navigate to non-existent URL (e.g. `unknown.html`) | 404 page renders cleanly with working navigation back to dashboard | [ ] |
