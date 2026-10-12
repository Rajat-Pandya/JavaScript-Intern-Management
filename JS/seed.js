import { load, save, KEYS } from './storage.js';
import { todayISO } from './utils.js';
import { SUBJECTS } from './models.js';

const SAMPLE_DATA_URL = '/DATA/sample-data.json';
const SAMPLE_RATES = [96, 92, 88, 70, 55, 93, 80, 62, 97, 85, 50, 78, 91, 66, 89];
const OTHER_STATUSES = ['Absent', 'Leave', 'Half Day'];
const SAMPLE_SCORES = [92, 85, 78, 66, 48, 90, 72, 58, 95, 81, 45, 69, 88, 55, 76];

const DATASETS = {
    interns: KEYS.INTERNS,
    attendance: KEYS.ATTENDANCE,
    assessments: KEYS.ASSESSMENTS,
    tasks: KEYS.TASKS,
};

export async function seedIfNeeded(){
    if(load(KEYS.SEEDED, false)) return;

    try{
        const response = await fetch(SAMPLE_DATA_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const sample = await response.json();

        Object.entries(DATASETS).forEach(([name, storageKey]) => {
            const hasSampleRows = Array.isArray(sample[name]);
            const storageIsEmpty = load(storageKey).length === 0;
            if (hasSampleRows && storageIsEmpty) save(storageKey, sample[name]);
        });
        if (Array.isArray(sample.interns) && sample.interns.length > 0) {
            save(KEYS.SEEDED, true);
        }
    }catch(error){
        console.error("Could not load Sample Data", error);
    }
}

function lastWeekdays(count) {
    const days = [];
    const cursor = new Date(todayISO()); 
    while (days.length < count) {
        const dayOfWeek = cursor.getUTCDay(); 
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days.push(cursor.toISOString().split('T')[0]);
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
        status: (d * 7 + i * 13) % 100 < rate ? 'Present' : OTHER_STATUSES[(d + i) % 3],
        }));
    });
}

function addDays(isoDate, Days){
    const d = new date(isoDate);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
}

function generateSampleAssessments(interns, perIntern = 4){
    const today = todayISO();
    const records = [];

    interns.forEach((interns, i) => {
        for (let k = 0; k < perIntern; k++){
            const totalMarks = k % 2 === 0? 100 : 50;
            const wobble = ((k * 7 + i * 5) % 13) - 6;
            const percent = Math.min(100, Math.max(20, SAMPLE_SCORES[i % SAMPLE_SCORES.length] + wobble));
            const date = addDays(interns.joiningDate, 7 * (k + 1));

            records.push({
                id: `AS${String(records.length + 1).padStart(4, '0')}`,
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