export function getAttendanceCategory(percentage){
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Warning';
    return 'Critical';
}

export function calculateAttendanceStats(records) {
    const counts = records.reduce((totals, { status }) => {
        totals[status] = (totals[status] ?? 0) + 1;
        return totals;
}, {});
    const present = counts['Present'] ?? 0;
    const halfDay = counts['Half Day'] ?? 0;
    const absent = counts['Absent'] ?? 0;
    const leave = counts['Leave'] ?? 0;

    const workingDays = records.length;
    const attended = present + halfDay * 0.5;

    const percentage =
    workingDays === 0 ? 0 : Math.round((attended / workingDays) * 10000) / 100;

    return {
        workingDays, present, halfDay, absent, leave, percentage,
        category: workingDays === 0 ? 'No Data' : getAttendanceCategory(percentage),
    };
}

export function calculatePercentage(marks, totalMarks){
    if (!totalMarks || totalMarks <= 0) return 0;
    return Math.round((marks/totalMarks) * 10000 / 100);
}

export function getGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
}

export function calculateAssessmentSummary(records){
    if (records.length === 0) return {count: 0, percentage: 0, grade: 'N/A'};
    const {obtained , possibe} = records.reduce(
        (total, {marks, totalMarks}) => ({
            obtained: totals.obtained + marks,
            possibe: totals.possibe + totalMarks,
        }),
        {obtained: 0, possibe: 0}
    );
    const percentage = calculatePercentage(obtained, possibe);
    return {count: records.length, percentage, grade: getGrade(percentage)};
}

export function calculateSubjectPerformance(records){
    const bySubject = records.reduce((groups, record) => {
        (groups[record.subject] ??= []).push(record);
        return groups;
    },{});

    return Object .entries(bySubject)
    .map(([subject, items]) => {
        const {count, percentage, grade} = calculateAssessmentSummary(items);
        return {subject, attempts: count, percentage, grade};
    })
    .sort((a, b) => a.subject.localeCompare(b.subject));
}