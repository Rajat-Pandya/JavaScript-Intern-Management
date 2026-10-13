# Intern Training & Performance Management System

A browser-based application for managing an internship programme: intern profiles,
attendance, assessments, tasks, and overall performance. Built with **HTML5, CSS3 and
vanilla JavaScript (ES6 modules)**, with no frameworks or libraries.

**Live demo:** https://YOUR-USERNAME.github.io/YOUR-REPO/

## Screenshots

| Dashboard | Interns | Performance |
|---|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Interns](screenshots/interns.png) | ![Performance](screenshots/performance.png) |

(Add dark mode and mobile screenshots too.)

## Features

- **Dashboard:** total/active interns, average attendance, average score and pending tasks,
  all calculated from stored data; attendance and specialization charts; Top 5 performers.
- **Interns:** add, view, edit, delete; unique IDs; confirmation before delete; debounced search;
  filters (specialization, status, attendance category); sorting (name, joining date, marks, attendance).
- **Attendance:** Present / Absent / Half Day / Leave; working days, percentage and category
  (Excellent / Good / Warning / Critical); per-intern history.
- **Assessments:** marks and total marks, automatic percentage and grade (A+ to F),
  subject-wise results.
- **Tasks:** title, intern, dates, priority, status; automatic overdue detection; inline status change.
- **Performance report:** overall score (Attendance 30% + Assessment 50% + Tasks 20%),
  category and Top 5 ranking.
- **Extras:** light/dark theme (saved), live clock, toast notifications, JSON export/import
  with validation, public API integration (quote of the day), responsive layout.

## Tech and concepts

HTML5 · CSS3 (Grid, Flexbox, media queries, custom theming) · ES6 modules · classes ·
destructuring, spread/rest, optional chaining, `??` · array methods (`map`, `filter`, `find`,
`findIndex`, `reduce`, `some`, `sort`, `includes`) · regular expressions · LocalStorage + JSON ·
Fetch API, Promises, `async/await`, `AbortController` · `FileReader` and `Blob` downloads · debouncing.

## Run locally

ES modules do not work from `file://`, so serve the folder:

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO
python -m http.server 8000      # or use the VS Code "Live Server" extension
```

Open http://localhost:8000. Sample data (15 interns plus generated attendance, assessments
and tasks) loads automatically on first run. To reset, clear the `itpms_` keys in
DevTools → Application → Local Storage.

## Project structure

```
index.html, dashboard.html, interns.html, attendance.html,
assessment.html, tasks.html, performance.html
css/    style.css, responsive.css
js/     app.js          theme + clock (all pages)
        storage.js      the only file that touches localStorage
        utils.js        debounce, dates, escapeHTML, toasts
        models.js       Intern class and shared constants
        validation.js   validators for every form and for imports
        calculations.js pure business rules (no DOM, no storage)
        seed.js         first-run sample data
        api.js          fetch wrapper with timeout and error handling
        data-transfer.js, data-tools.js   JSON export/import
        dashboard.js, interns.js, attendance.js, assessment.js,
        tasks.js, performance.js          one UI file per page
data/   sample-data.json
```

**Design principle:** models, validation and calculations never touch the DOM; page files
only handle the UI. The same functions power forms, the dashboard and the importer.

## Business rules and design decisions

- **Attendance %** = (Present + 0.5 × Half Day) ÷ working days × 100. Working days = days with a
  record; Leave counts as a working day but not as attended.
- **Grade %** = marks ÷ total marks. An intern's overall % = total obtained ÷ total possible
  (a 100-mark test outweighs a 50-mark one). Grades use the rounded percentage.
- **Overall performance** = Attendance × 30% + Assessment × 50% + Tasks × 20%. If an area has
  **no data**, it is left out and the remaining weights are rescaled; missing data is never
  treated as 0. Top 5 only ranks interns with all three areas.
- **Overdue task** = due date before today and status not Completed (due today is not overdue).
  Never stored; calculated on every render.
- **Dashboard averages** are taken over interns who have data. **Pending tasks** = every task
  not yet Completed.
- **Dates** are handled as `YYYY-MM-DD` strings using the user's local date.
- **Import** validates every record with the same rules as the forms, skips bad rows with
  reasons, asks for confirmation, and never writes partial data.

## Testing

Manual test plan covering valid, invalid, empty and boundary data: see `TESTING.md`.

## Known limitations

- Data lives in the browser's LocalStorage (about 5 MB, one browser only); there is no login or server.
- The quote card depends on a third-party API. If it is unreachable, the card shows an error and
  the rest of the app is unaffected.
- Dark mode uses override rules rather than CSS variables.

## Author

YOUR NAME · B.Tech Computer Science, Government Engineering College, Banswara