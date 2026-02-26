import { db } from '../kernel/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { AttendanceLog, StaffMember } from '../../types';

export const attendanceService = {
    // Get logs for a specific date
    getLogsByDate: async (date: number): Promise<AttendanceLog[]> => {
        const startOfDay = new Date(date).setHours(0, 0, 0, 0);
        const endOfDay = new Date(date).setHours(23, 59, 59, 999);

        const q = query(
            collection(db, 'attendanceLogs'),
            where('date', '>=', startOfDay),
            where('date', '<=', endOfDay)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceLog));
    },

    // Clock in
    clockIn: async (employeeId: string, scheduledStart?: string, scheduledEnd?: string): Promise<string> => {
        const now = Date.now();
        const startOfDay = new Date(now).setHours(0, 0, 0, 0);

        const id = `al-${employeeId}-${startOfDay}`;
        const logRef = doc(db, 'attendanceLogs', id);

        // Simplistic late calculation
        let status: AttendanceLog['status'] = 'Present';
        let lateMinutes = 0;

        if (scheduledStart) {
            const [sh, sm] = scheduledStart.split(':').map(Number);
            const scheduledTime = new Date(now).setHours(sh, sm, 0, 0);
            if (now > scheduledTime) {
                status = 'Late';
                lateMinutes = Math.floor((now - scheduledTime) / 60000);
            }
        }

        const newLog: AttendanceLog = {
            id,
            employeeId,
            date: startOfDay,
            scheduledStart: scheduledStart || '09:00',
            scheduledEnd: scheduledEnd || '17:00',
            actualClockIn: now,
            status,
            lateMinutes,
            manualOverride: false
        };

        await setDoc(logRef, newLog);
        return id;
    },

    // Clock out
    clockOut: async (logId: string): Promise<void> => {
        const logRef = doc(db, 'attendanceLogs', logId);
        const snap = await getDoc(logRef);
        if (!snap.exists()) return;

        const log = snap.data() as AttendanceLog;
        const now = Date.now();

        const totalMs = now - (log.actualClockIn || now);
        const totalHoursWorked = totalMs / (1000 * 60 * 60);

        // Basic OT calc: > 8 hours is OT
        const regularHours = Math.min(8, totalHoursWorked);
        const overtimeHours = Math.max(0, totalHoursWorked - 8);

        await updateDoc(logRef, {
            actualClockOut: now,
            totalHoursWorked,
            regularHours,
            overtimeHours
        });
    },

    // Mark Absent
    markAbsent: async (employeeId: string, scheduledStart?: string, scheduledEnd?: string): Promise<string> => {
        const now = Date.now();
        const startOfDay = new Date(now).setHours(0, 0, 0, 0);

        const id = `al-${employeeId}-${startOfDay}`;
        const logRef = doc(db, 'attendanceLogs', id);

        const newLog: AttendanceLog = {
            id,
            employeeId,
            date: startOfDay,
            scheduledStart: scheduledStart || '09:00',
            scheduledEnd: scheduledEnd || '17:00',
            status: 'Absent',
            manualOverride: true
        };

        await setDoc(logRef, newLog);
        return id;
    },

    // Update / Manual Override
    updateLog: async (logId: string, updates: Partial<AttendanceLog>): Promise<void> => {
        const logRef = doc(db, 'attendanceLogs', logId);
        await updateDoc(logRef, { ...updates, manualOverride: true });
    }
};

/**
 * Fetch logs for today, injecting dummy 'Off'/pending states for UI if they haven't clocked in
 */
export const getTodayAttendance = async (staff: StaffMember[]): Promise<AttendanceLog[]> => {
    const today = Date.now();
    const startOfDay = new Date(today).setHours(0, 0, 0, 0);
    const existingLogs = await attendanceService.getLogsByDate(today);

    const logs = [...existingLogs];

    staff.forEach(s => {
        if (!logs.find(l => l.employeeId === s.id)) {
            // Virtual log just for rendering in the UI so we can clock them in
            logs.push({
                id: `pending-${s.id}`,
                employeeId: s.id,
                date: startOfDay,
                scheduledStart: '09:00',
                scheduledEnd: '17:00',
                status: 'Off',
                manualOverride: false
            });
        }
    });

    return logs;
};
