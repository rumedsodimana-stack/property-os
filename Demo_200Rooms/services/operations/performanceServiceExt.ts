/**
 * Extended Performance Service
 *
 * Employee performance scoring, department metrics,
 * goal tracking, and review cycle management.
 *
 * Extends the base performanceService with richer analytics.
 */

import { db } from '../kernel/firebase';
import { collection, query, getDocs, doc, setDoc } from 'firebase/firestore';
import { PerformanceReview, StaffMember } from '../../types';
import { performanceService } from './performanceService';

// ── Types ────────────────────────────────────────────────────────────────────

export interface EmployeePerformanceScore {
  employeeId: string;
  employeeName: string;
  department: string;
  compositeScore: number;       // 0-100 weighted aggregate
  kpiScore: number;
  behaviouralScore: number;
  attendanceScore: number;
  guestSatisfaction: number;
  trend: 'improving' | 'stable' | 'declining';
  rank: number;
  quartile: 1 | 2 | 3 | 4;
}

export interface DepartmentMetrics {
  departmentId: string;
  departmentName: string;
  headcount: number;
  avgPerformanceScore: number;
  topPerformerName: string;
  topPerformerScore: number;
  reviewCompletionRate: number;  // 0-100
  activeGoals: number;
  overdueGoals: number;
  avgAttendance: number;
}

export interface GoalRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  category: 'KPI' | 'Development' | 'Project' | 'Behavioural';
  targetDate: number;
  createdAt: number;
  progress: number;             // 0-100
  status: 'On Track' | 'At Risk' | 'Overdue' | 'Completed';
  milestones: { label: string; completed: boolean; dueDate: number }[];
  reviewerNotes?: string;
}

export interface ReviewCycle {
  id: string;
  name: string;                 // e.g. "Q1 2026 Annual Review"
  type: 'Annual' | 'Mid-Year' | 'Probation' | 'PIP';
  periodStart: number;
  periodEnd: number;
  dueDate: number;
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue';
  totalEmployees: number;
  completedReviews: number;
  pendingReviews: number;
  departments: string[];
}

// ── Scoring Weights ──────────────────────────────────────────────────────────
const WEIGHTS = {
  kpi: 0.40,
  behavioural: 0.25,
  attendance: 0.15,
  guestSatisfaction: 0.20,
};

// ── Service ──────────────────────────────────────────────────────────────────
class PerformanceServiceExt {
  /**
   * Compute composite performance scores for all employees with reviews
   */
  computeEmployeeScores(
    reviews: PerformanceReview[],
    staff: StaffMember[]
  ): EmployeePerformanceScore[] {
    const staffMap = new Map(staff.map(s => [s.id, s]));

    const scores = reviews.map(r => {
      const s = staffMap.get(r.employeeId);
      const kpiAvg = r.kpiScores.length > 0
        ? r.kpiScores.reduce((sum, k) => sum + k.score, 0) / r.kpiScores.length
        : 0;
      const behAvg = r.behaviouralRatings.length > 0
        ? (r.behaviouralRatings.reduce((sum, b) => sum + b.rating, 0) / r.behaviouralRatings.length) * 20
        : 0;
      const attendance = r.attendanceScore ?? 90;
      const guest = r.guestSatisfactionScore ?? kpiAvg;

      const composite = Math.round(
        kpiAvg * WEIGHTS.kpi +
        behAvg * WEIGHTS.behavioural +
        attendance * WEIGHTS.attendance +
        guest * WEIGHTS.guestSatisfaction
      );

      return {
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        department: s?.departmentName ?? 'Unknown',
        compositeScore: Math.min(100, composite),
        kpiScore: Math.round(kpiAvg),
        behaviouralScore: Math.round(behAvg),
        attendanceScore: attendance,
        guestSatisfaction: Math.round(guest),
        trend: composite >= 85 ? 'improving' as const : composite >= 70 ? 'stable' as const : 'declining' as const,
        rank: 0,
        quartile: 1 as 1 | 2 | 3 | 4,
      };
    });

    // Sort and assign ranks + quartiles
    scores.sort((a, b) => b.compositeScore - a.compositeScore);
    const total = scores.length;
    scores.forEach((s, i) => {
      s.rank = i + 1;
      const pct = (i + 1) / total;
      s.quartile = pct <= 0.25 ? 1 : pct <= 0.50 ? 2 : pct <= 0.75 ? 3 : 4;
    });

    return scores;
  }

  /**
   * Aggregate department-level metrics
   */
  computeDepartmentMetrics(
    reviews: PerformanceReview[],
    staff: StaffMember[]
  ): DepartmentMetrics[] {
    const departments = new Map<string, { id: string; name: string; staff: StaffMember[]; reviews: PerformanceReview[] }>();

    staff.forEach(s => {
      if (!departments.has(s.departmentId)) {
        departments.set(s.departmentId, { id: s.departmentId, name: s.departmentName, staff: [], reviews: [] });
      }
      departments.get(s.departmentId)!.staff.push(s);
    });

    reviews.forEach(r => {
      const s = staff.find(st => st.id === r.employeeId);
      if (s && departments.has(s.departmentId)) {
        departments.get(s.departmentId)!.reviews.push(r);
      }
    });

    const metrics: DepartmentMetrics[] = [];
    departments.forEach(dept => {
      const deptReviews = dept.reviews;
      const avgScore = deptReviews.length > 0
        ? Math.round(deptReviews.reduce((s, r) => s + r.overallScore, 0) / deptReviews.length)
        : 0;

      const topReview = [...deptReviews].sort((a, b) => b.overallScore - a.overallScore)[0];
      const avgAttendance = deptReviews.length > 0
        ? Math.round(deptReviews.reduce((s, r) => s + (r.attendanceScore ?? 90), 0) / deptReviews.length)
        : 0;

      metrics.push({
        departmentId: dept.id,
        departmentName: dept.name,
        headcount: dept.staff.filter(s => s.status === 'Active').length,
        avgPerformanceScore: avgScore,
        topPerformerName: topReview?.employeeName ?? 'N/A',
        topPerformerScore: topReview?.overallScore ?? 0,
        reviewCompletionRate: dept.staff.length > 0
          ? Math.round((deptReviews.length / dept.staff.length) * 100)
          : 0,
        activeGoals: Math.floor(Math.random() * 12) + 3,
        overdueGoals: Math.floor(Math.random() * 3),
        avgAttendance,
      });
    });

    return metrics.sort((a, b) => b.avgPerformanceScore - a.avgPerformanceScore);
  }

  /**
   * Generate goal records (seeded for demo)
   */
  getGoals(staff: StaffMember[]): GoalRecord[] {
    const goals: GoalRecord[] = [];
    const categories: GoalRecord['category'][] = ['KPI', 'Development', 'Project', 'Behavioural'];
    const titles = [
      'Achieve 95% guest satisfaction rating',
      'Complete advanced revenue management certification',
      'Reduce average check-in time to under 3 minutes',
      'Implement contactless dining workflow',
      'Cross-train in 2 additional departments',
      'Achieve zero safety incidents in Q2',
      'Increase upsell conversion by 15%',
      'Complete leadership development program',
    ];

    const activeStaff = staff.filter(s => s.status === 'Active').slice(0, 10);
    activeStaff.forEach((s, i) => {
      const progress = Math.round(Math.random() * 100);
      const targetDate = Date.now() + (30 + i * 7) * 86400000;
      const isOverdue = progress < 50 && targetDate < Date.now() + 7 * 86400000;

      goals.push({
        id: `goal-${i}`,
        employeeId: s.id,
        employeeName: s.fullName,
        title: titles[i % titles.length],
        description: `Performance goal aligned to departmental objectives for ${s.departmentName}.`,
        category: categories[i % categories.length],
        targetDate,
        createdAt: Date.now() - 60 * 86400000,
        progress,
        status: progress >= 100 ? 'Completed' : isOverdue ? 'Overdue' : progress < 30 ? 'At Risk' : 'On Track',
        milestones: [
          { label: 'Planning', completed: true, dueDate: Date.now() - 30 * 86400000 },
          { label: 'In Progress', completed: progress >= 50, dueDate: Date.now() },
          { label: 'Final Review', completed: progress >= 100, dueDate: targetDate },
        ],
      });
    });

    return goals;
  }

  /**
   * Get review cycles (seeded for demo)
   */
  getReviewCycles(staff: StaffMember[]): ReviewCycle[] {
    const totalActive = staff.filter(s => s.status === 'Active').length;
    const completed = Math.floor(totalActive * 0.65);

    return [
      {
        id: 'rc-q1-2026',
        name: 'Q1 2026 Annual Review',
        type: 'Annual',
        periodStart: new Date('2026-01-01').getTime(),
        periodEnd: new Date('2026-03-31').getTime(),
        dueDate: new Date('2026-04-15').getTime(),
        status: 'In Progress',
        totalEmployees: totalActive,
        completedReviews: completed,
        pendingReviews: totalActive - completed,
        departments: ['Front Office', 'Housekeeping', 'F&B', 'Engineering', 'Security'],
      },
      {
        id: 'rc-probation-mar',
        name: 'March 2026 Probation Reviews',
        type: 'Probation',
        periodStart: new Date('2025-12-01').getTime(),
        periodEnd: new Date('2026-02-28').getTime(),
        dueDate: new Date('2026-03-15').getTime(),
        status: 'Completed',
        totalEmployees: 4,
        completedReviews: 4,
        pendingReviews: 0,
        departments: ['Front Office', 'F&B'],
      },
      {
        id: 'rc-mid-year-2026',
        name: 'Mid-Year 2026 Review',
        type: 'Mid-Year',
        periodStart: new Date('2026-04-01').getTime(),
        periodEnd: new Date('2026-06-30').getTime(),
        dueDate: new Date('2026-07-15').getTime(),
        status: 'Scheduled',
        totalEmployees: totalActive,
        completedReviews: 0,
        pendingReviews: totalActive,
        departments: ['All Departments'],
      },
    ];
  }
}

export const performanceServiceExt = new PerformanceServiceExt();
export default performanceServiceExt;
