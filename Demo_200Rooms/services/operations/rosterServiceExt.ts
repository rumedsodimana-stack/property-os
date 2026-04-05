/**
 * Extended Roster Service
 *
 * Shift generation from templates, conflict detection,
 * auto-assignment, swap request management, and coverage gap detection.
 *
 * Extends the base rosterService (CRUD) with scheduling intelligence.
 */

import { ShiftPattern, RosterShift, StaffMember } from '../../types';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ShiftConflict {
  employeeId: string;
  employeeName: string;
  type: 'double_booking' | 'overtime' | 'rest_violation' | 'skill_mismatch';
  description: string;
  shiftA: string;
  shiftB?: string;
  severity: 'warning' | 'critical';
}

export interface SwapRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  targetId: string;
  targetName: string;
  shiftDate: number;
  shiftPatternId: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: number;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface CoverageGap {
  date: string;
  department: string;
  shiftType: string;
  requiredStaff: number;
  assignedStaff: number;
  deficit: number;
  severity: 'low' | 'medium' | 'critical';
}

export interface AutoAssignmentResult {
  date: string;
  assignments: { employeeId: string; employeeName: string; shiftPatternId: string; score: number }[];
  unfilledSlots: number;
  conflicts: ShiftConflict[];
}

export interface GeneratedShift {
  employeeId: string;
  shiftPatternId: string;
  date: number;
  status: 'Scheduled';
  notes?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_WEEKLY_HOURS = 48;
const MIN_REST_HOURS = 10; // minimum rest between consecutive shifts
const DEPARTMENTS = ['Front Office', 'Housekeeping', 'F&B', 'Engineering', 'Security'];
const SHIFTS_PER_DEPARTMENT: Record<string, number> = {
  'Front Office': 4,
  'Housekeeping': 6,
  'F&B': 5,
  'Engineering': 2,
  'Security': 3,
};

// ── Helper: parse HH:MM to minutes ──────────────────────────────────────────
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function shiftsOverlap(a: ShiftPattern, b: ShiftPattern): boolean {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);
  return aStart < bEnd && bStart < aEnd;
}

// ── Service ──────────────────────────────────────────────────────────────────
class RosterServiceExt {
  /**
   * Generate shifts from a template pattern for a date range
   */
  generateShiftsFromTemplate(
    pattern: ShiftPattern,
    employees: StaffMember[],
    startDate: Date,
    days: number
  ): GeneratedShift[] {
    const shifts: GeneratedShift[] = [];
    const activeEmployees = employees.filter(e => e.status === 'Active');

    for (let d = 0; d < days; d++) {
      const shiftDate = new Date(startDate);
      shiftDate.setDate(shiftDate.getDate() + d);
      const dayTimestamp = shiftDate.setHours(0, 0, 0, 0);

      // Rotate employees through the pattern
      const perDay = Math.min(activeEmployees.length, Math.ceil(activeEmployees.length * 0.6));
      for (let i = 0; i < perDay; i++) {
        const empIndex = (d * perDay + i) % activeEmployees.length;
        shifts.push({
          employeeId: activeEmployees[empIndex].id,
          shiftPatternId: pattern.id,
          date: dayTimestamp,
          status: 'Scheduled',
          notes: `Auto-generated from template: ${pattern.name}`,
        });
      }
    }

    return shifts;
  }

  /**
   * Detect scheduling conflicts: double-bookings, overtime, rest violations
   */
  detectConflicts(
    roster: RosterShift[],
    patterns: ShiftPattern[],
    staff: StaffMember[]
  ): ShiftConflict[] {
    const conflicts: ShiftConflict[] = [];
    const patternMap = new Map(patterns.map(p => [p.id, p]));
    const staffMap = new Map(staff.map(s => [s.id, s]));

    // Group shifts by employee
    const byEmployee = new Map<string, RosterShift[]>();
    roster.forEach(shift => {
      if (!byEmployee.has(shift.employeeId)) byEmployee.set(shift.employeeId, []);
      byEmployee.get(shift.employeeId)!.push(shift);
    });

    byEmployee.forEach((empShifts, empId) => {
      const empName = staffMap.get(empId)?.fullName ?? empId;

      // Sort by date
      const sorted = [...empShifts].sort((a, b) => a.date - b.date);

      // Check double-booking (same date, overlapping times)
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          if (sorted[i].date === sorted[j].date) {
            const pA = patternMap.get(sorted[i].shiftPatternId);
            const pB = patternMap.get(sorted[j].shiftPatternId);
            if (pA && pB && shiftsOverlap(pA, pB)) {
              conflicts.push({
                employeeId: empId,
                employeeName: empName,
                type: 'double_booking',
                description: `Double-booked on ${new Date(sorted[i].date).toLocaleDateString()}: ${pA.name} and ${pB.name}`,
                shiftA: sorted[i].id,
                shiftB: sorted[j].id,
                severity: 'critical',
              });
            }
          }
        }
      }

      // Check weekly overtime
      const weekMap = new Map<string, number>();
      sorted.forEach(shift => {
        const d = new Date(shift.date);
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        const pattern = patternMap.get(shift.shiftPatternId);
        const hours = pattern?.totalHours ?? 8;
        weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + hours);
      });

      weekMap.forEach((hours, week) => {
        if (hours > MAX_WEEKLY_HOURS) {
          conflicts.push({
            employeeId: empId,
            employeeName: empName,
            type: 'overtime',
            description: `Week of ${week}: ${hours}h exceeds ${MAX_WEEKLY_HOURS}h limit`,
            shiftA: `week-${week}`,
            severity: 'warning',
          });
        }
      });

      // Check minimum rest between consecutive shifts
      for (let i = 0; i < sorted.length - 1; i++) {
        const pCurrent = patternMap.get(sorted[i].shiftPatternId);
        const pNext = patternMap.get(sorted[i + 1].shiftPatternId);
        if (pCurrent && pNext) {
          const endCurrent = sorted[i].date + timeToMinutes(pCurrent.endTime) * 60000;
          const startNext = sorted[i + 1].date + timeToMinutes(pNext.startTime) * 60000;
          const restHours = (startNext - endCurrent) / 3600000;
          if (restHours < MIN_REST_HOURS && restHours >= 0) {
            conflicts.push({
              employeeId: empId,
              employeeName: empName,
              type: 'rest_violation',
              description: `Only ${restHours.toFixed(1)}h rest between shifts (min ${MIN_REST_HOURS}h)`,
              shiftA: sorted[i].id,
              shiftB: sorted[i + 1].id,
              severity: 'warning',
            });
          }
        }
      }
    });

    return conflicts;
  }

  /**
   * Auto-assign employees to shifts based on skills, availability, and fairness
   */
  autoAssign(
    date: Date,
    patterns: ShiftPattern[],
    staff: StaffMember[],
    existingRoster: RosterShift[]
  ): AutoAssignmentResult {
    const dayTimestamp = new Date(date).setHours(0, 0, 0, 0);
    const dateStr = date.toISOString().split('T')[0];

    // Who is already scheduled for this date?
    const alreadyScheduled = new Set(
      existingRoster.filter(r => r.date === dayTimestamp).map(r => r.employeeId)
    );

    const available = staff.filter(
      s => s.status === 'Active' && !alreadyScheduled.has(s.id)
    );

    const assignments: AutoAssignmentResult['assignments'] = [];
    const conflicts: ShiftConflict[] = [];
    let remaining = [...available];

    patterns.forEach(pattern => {
      if (remaining.length === 0) return;

      // Score each available employee for this pattern
      const scored = remaining.map(emp => {
        let score = 50; // base
        // Skill match bonus
        const skillNames = emp.skills.map(s => s.name.toLowerCase());
        if (skillNames.some(s => pattern.name.toLowerCase().includes(s))) score += 20;
        // Performance bonus
        score += Math.min(20, (emp.performanceScore || 70) / 5);
        // Cross-training bonus
        if (emp.crossTrainedRoleIds.length > 0) score += 10;

        return { emp, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      if (best) {
        assignments.push({
          employeeId: best.emp.id,
          employeeName: best.emp.fullName,
          shiftPatternId: pattern.id,
          score: best.score,
        });
        remaining = remaining.filter(e => e.id !== best.emp.id);
      }
    });

    const unfilledSlots = Math.max(0, patterns.length - assignments.length);

    return { date: dateStr, assignments, unfilledSlots, conflicts };
  }

  /**
   * Manage swap requests (seeded demo data)
   */
  getSwapRequests(staff: StaffMember[]): SwapRequest[] {
    if (staff.length < 4) return [];
    const active = staff.filter(s => s.status === 'Active');
    if (active.length < 4) return [];

    return [
      {
        id: 'swap-1',
        requesterId: active[0].id,
        requesterName: active[0].fullName,
        targetId: active[1].id,
        targetName: active[1].fullName,
        shiftDate: Date.now() + 2 * 86400000,
        shiftPatternId: 'sp-morning',
        reason: 'Medical appointment in the morning',
        status: 'Pending',
        createdAt: Date.now() - 86400000,
      },
      {
        id: 'swap-2',
        requesterId: active[2].id,
        requesterName: active[2].fullName,
        targetId: active[3].id,
        targetName: active[3].fullName,
        shiftDate: Date.now() + 5 * 86400000,
        shiftPatternId: 'sp-evening',
        reason: 'Family event',
        status: 'Approved',
        createdAt: Date.now() - 3 * 86400000,
        resolvedAt: Date.now() - 2 * 86400000,
        resolvedBy: 'mgr-01',
      },
    ];
  }

  /**
   * Detect coverage gaps across departments
   */
  detectCoverageGaps(
    roster: RosterShift[],
    staff: StaffMember[],
    days = 7
  ): CoverageGap[] {
    const gaps: CoverageGap[] = [];

    for (let d = 0; d < days; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      const dayStart = new Date(date).setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      DEPARTMENTS.forEach(dept => {
        const required = SHIFTS_PER_DEPARTMENT[dept] ?? 3;
        const deptStaff = staff.filter(s => s.departmentName === dept && s.status === 'Active');
        const deptRoster = roster.filter(
          r => r.date === dayStart && deptStaff.some(s => s.id === r.employeeId)
        );
        const assigned = deptRoster.length;

        if (assigned < required) {
          const deficit = required - assigned;
          gaps.push({
            date: dateStr,
            department: dept,
            shiftType: 'Standard',
            requiredStaff: required,
            assignedStaff: assigned,
            deficit,
            severity: deficit >= 3 ? 'critical' : deficit >= 2 ? 'medium' : 'low',
          });
        }
      });
    }

    return gaps.sort((a, b) => {
      const sevOrder = { critical: 0, medium: 1, low: 2 };
      return sevOrder[a.severity] - sevOrder[b.severity];
    });
  }
}

export const rosterServiceExt = new RosterServiceExt();
export default rosterServiceExt;
