export const KEYS ={
    INTERNS: "itpms_interns",
    ATTENDANCE: "itpms_attendance",
    ASSESSMENTS: "itpms_assessments",
    TASKS: "itpms_tasks",
    THEME: "itpms_theme"
};

export function load(key, fallback = []) {
    try{
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    }catch(error){
        console.error(`Could not read ${key} from localStorage`, error);
        return fallback;
    }
}

export function save(key, data) {
    try{
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    }catch(error){
        console.error(`Could not save ${key} to localStorage`, error);
        return false;
    }
}

export function remove(key) {
    localStorage.removeItem(key);
}
