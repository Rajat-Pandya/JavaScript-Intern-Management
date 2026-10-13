# Intern Training & Performance Management System

A production-ready browser application for managing end-to-end internship programmes: intern profiles, daily attendance, subject assessments, task tracking, and weighted performance analytics. Built entirely with **HTML5, CSS3, and vanilla JavaScript (ES6 modules)** with zero external dependencies, libraries, or build systems.

**Live demo:** https://YOUR-USERNAME.github.io/YOUR-REPO/

## Screenshots

| Dashboard | Interns | Performance | Dark Mode | Mobile (375px) |
|---|---|---|---|---|
| ![Dashboard](screenshots/dashboard.png) | ![Interns](screenshots/interns.png) | ![Performance](screenshots/performance.png) | ![Dark Mode](screenshots/dark-mode.png) | ![Mobile](screenshots/mobile.png) |

*(Screenshots will appear above once captured and added to the `screenshots/` directory)*

## Features

### Dashboard (`dashboard.html`)
- **Key Performance Indicators (KPIs):** Real-time metrics for total interns, active interns, average attendance (interns with records), average score (interns assessed), and pending tasks with overdue sub-counts.
- **Visual Analytics:** Breakdown distribution bars for attendance categories and internship specializations.
- **Top 5 Performers:** Highlighting elite interns with complete evaluation records.
- **Quote of the Day:** Asynchronous integration with external API featuring error fallback and loading indicators.
- **Data Management:** Integrated JSON export and validated import facility.

### Intern Profiles (`interns.html`)
- Complete CRUD workflow: Add, View (modal), Edit (locked ID in edit mode), and Delete with cascading cleanup.
- Validation for standard Indian mobile numbers (10 digits starting with 6-9), valid email addresses, name formatting, and non-future joining dates.
- Debounced live search (300ms) across name, ID, email, specialization, and city.
- Multi-criteria filtering by specialization, status, and attendance tier.
- Sorting by Name (A-Z / Z-A), Joining Date (newest / oldest), Average Marks, and Attendance % (records without data consistently positioned at the bottom).

### Attendance Tracking (`attendance.html`)
- Record daily status: **Present**, **Absent**, **Half Day**, or **Leave**.
- Enforces non-future dates and prevents logging dates prior to an intern's joining date.
- Auto-updates existing logs on matching intern/date combinations.
- Comprehensive summary table showing total working days, counts per status, rounded percentage, and category badge.
- Interactive modal displaying chronological attendance history per intern.

### Assessment Management (`assessment.html`)
- Log subject assessments with obtained and total marks (up to 1000).
- Real-time grade preview during input.
- Aggregated overall percentage calculated as total marks obtained divided by total marks possible (not an arithmetic average of percentages).
- Subject-wise performance modal breaking down attempts, average scores, and letter grades.
- Chronological records table with single-record deletion and intern filtering.

### Task Management (`tasks.html`)
- Assign tasks with priority levels (High, Medium, Low) and statuses (Pending, In Progress, Completed).
- Date validation: due date cannot precede assigned date, and assigned date cannot precede joining date.
- Real-time derived overdue calculation (tasks due today are not overdue).
- Filter by status, priority, and "Overdue only" toggle.
- Fast inline status transitions directly inside the table.

### Performance Analytics (`performance.html`)
- Weighted score synthesis: Attendance (30%) + Assessment (50%) + Tasks (20%).
- Missing data handling: unrecorded areas are excluded and remaining integer weights are rescaled.
- Top 5 Leaderboard: strictly ranks interns with all three evaluated areas (sorted by score desc, then assessment % desc, then name A-Z).
- Filterable and sortable performance report with area completion indicators.

### Application Tools (`js/app.js`, `js/data-tools.js`)
- Universal live digital clock updating every second.
- Seamless Dark/Light theme toggle with persistent user preference in `localStorage` and zero-flash inline theme loader.
- Safe JSON import/export with schema validation, dry-run reports, duplicate detection, and orphan cleanup.

## Tech and Concepts Used

- **HTML5 & Web APIs:** Semantic structure, `<dialog>` modals, `<input type="date">`, `FileReader`, `Blob` downloads, `AbortController`.
- **CSS3:** Flexbox, CSS Grid, media queries (desktop, `<=900px`, `<=700px`, `<=420px`), `prefers-color-scheme`, `prefers-reduced-motion`, custom utility badge classes.
- **Vanilla JavaScript (ES6+):** Pure ES Modules, JavaScript classes (`Intern`), Map and Set data structures, array functional pipelines (`reduce`, `map`, `filter`, `some`, `sort`), nullish coalescing (`??`), optional chaining (`?.`), destructuring.
- **Clean Architecture:** Separation of concerns — pure calculations (`calculations.js`), pure validators (`validation.js`), isolated storage (`storage.js`), resilient network client (`api.js`), and isolated UI controllers.

## Run Locally

Because ES Modules are blocked by CORS policies when accessed directly via the `file://` protocol, serve the project root via any local HTTP server:

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git
cd YOUR-REPO

# Option 1: Python built-in HTTP server
python -m http.server 8000

# Option 2: Node.js (via npx http-server)
npx http-server -p 8000

# Option 3: VS Code Live Server Extension
# Right click "index.html" and select "Open with Live Server"
```

Open your browser at `http://localhost:8000`.

**Resetting the App:** To re-trigger initial sample data seeding, clear the application storage in DevTools (Application → Local Storage → Delete keys starting with `itpms_`) and reload the page.

## Project Structure

```
.
├── 404.html                     # Fallback friendly 404 error page
├── index.html                   # Entry redirecting to dashboard.html
├── dashboard.html               # Main dashboard with KPIs and charts
├── interns.html                 # Intern directory and management
├── attendance.html              # Attendance tracking and history
├── assessment.html              # Subject assessments and results
├── tasks.html                   # Task tracking and overdue detection
├── performance.html             # Weighted performance report and Top 5
├── css/
│   ├── style.css                # Base stylesheet, themes, badges, modals
│   └── responsive.css           # Responsive breakpoints and reduced-motion rules
├── js/
│   ├── api.js                   # External API wrapper with timeout and fallback
│   ├── app.js                   # Universal navbar clock and theme manager
│   ├── assessment.js            # Assessment controller
│   ├── attendance.js            # Attendance controller
│   ├── calculations.js          # Pure calculation routines (stats, grades, scores)
│   ├── dashboard.js             # Dashboard controller and analytics
│   ├── data-tools.js            # Export/Import UI handlers and dialogs
│   ├── data-transfer.js         # JSON validation, sanitization, import logic
│   ├── interns.js               # Intern directory controller
│   ├── models.js                # Intern model class and shared domain constants
│   ├── performance.js           # Performance report and leaderboard controller
│   ├── seed.js                  # Sample data loader and dynamic record generator
│   ├── storage.js               # LocalStorage wrapper with error handling
│   ├── tasks.js                 # Task manager controller
│   ├── utils.js                 # Shared helpers (formatting, escaping, toasts, dates)
│   └── validation.js            # Form and entity validation logic
├── data/
│   └── sample-data.json         # Initial baseline dataset with 15 interns
├── screenshots/
│   └── .gitkeep                 # Placeholder keeping screenshots directory in git
├── .gitignore                   # Ignored files (OS, IDE, logs, dependencies)
├── LICENSE                      # MIT Open Source License
├── README.md                    # Project documentation and specifications
└── TESTING.md                   # Complete test plan and manual verification guide
```

## Business Rules and Design Decisions

- **Attendance % Formula:**
  $$\text{Attendance \%} = \frac{\text{Present} + 0.5 \times \text{Half Day}}{\text{Working Days}} \times 100$$
  Working days equal the count of records for that intern. *Leave* counts as a working day without attendance credit. Rounded to 2 decimal places. Interns with no records receive $0\%$ and category `"No Data"`.
- **Attendance Tiers:**
  $\ge 90\%$ Excellent, $\ge 75\%$ Good, $\ge 60\%$ Warning, $< 60\%$ Critical.
- **Grading Scale:**
  $\ge 90\%$ A+, $\ge 80\%$ A, $\ge 70\%$ B, $\ge 60\%$ C, $\ge 50\%$ D, $< 50\%$ F. Zero records evaluate to `"N/A"`.
- **Intern Overall Assessment %:**
  Calculated as $\frac{\sum \text{Marks Obtained}}{\sum \text{Total Possible}} \times 100$ rather than a mean of individual test percentages.
- **Overdue Task Evaluation:**
  Derived dynamically when `status !== "Completed" && dueDate < today`. Tasks due *today* are never classified as overdue. Overdue flags are never persisted.
- **Weighted Overall Performance:**
  $$\text{Score} = \frac{\text{Attendance} \times 30 + \text{Assessment} \times 50 + \text{Tasks} \times 20}{100}$$
  *Missing Data Policy:* If an intern has no data in an area, that area's weight is omitted and the remaining weights are rescaled (e.g. Attendance and Assessment with no tasks evaluates over 80 points: $\frac{A \times 30 + S \times 50}{80}$). Missing data is never treated as zero. Interns with no data in any area evaluate to $0$ and `"No Data"`.
- **Overall Performance Categories:**
  $\ge 90$ Outstanding, $\ge 80$ Excellent, $\ge 70$ Good, $\ge 60$ Average, $< 60$ Needs Improvement.
- **Top 5 Leaderboard Qualification:**
  Requires recorded data in all three areas. Ranked by overall score descending, assessment % descending, then intern name alphabetically (A-Z).
- **Timezone-Safe Dates:**
  Dates are stored as ISO `YYYY-MM-DD` strings. `todayISO()` constructs local dates from `getFullYear()`, `getMonth()`, and `getDate()` to prevent UTC date shifting across Indian Standard Time (IST) boundaries. `formatDate()` formats plain dates using `timeZone: "UTC"` to maintain absolute display integrity.

## Testing

A comprehensive manual and automated test plan is documented in [`TESTING.md`](TESTING.md).
The system includes validation of all domain calculations, input boundaries, data imports, and failure resilience.

## Known Limitations

- **Browser-Local Storage:** Data is persisted in browser `localStorage` (approximately 5MB quota) without multi-user authentication or cloud backend.
- **Third-Party API Dependency:** The quote of the day relies on a public external service (`dummyjson.com`). Network timeouts or outages fail gracefully without disrupting application workflows.
- **CSS Dark Mode:** Implemented via root dataset selector overrides (`[data-theme="dark"]`) and `color-scheme` controls rather than CSS custom property preprocessing.

## Author

**Student Name** · B.Tech Computer Science and Engineering