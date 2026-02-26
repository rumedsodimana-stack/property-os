import { db } from '../kernel/firebase';
import { collection, query, getDocs, doc, setDoc } from 'firebase/firestore';
import { PerformanceReview, StaffMember } from '../../types';

export const performanceService = {
    getAllReviews: async (): Promise<PerformanceReview[]> => {
        const q = query(collection(db, 'performanceReviews'));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as PerformanceReview));
    },

    getOrSeedReviews: async (staff: StaffMember[]): Promise<PerformanceReview[]> => {
        let reviews = await performanceService.getAllReviews();

        if (reviews.length === 0 && staff.length > 0) {
            // Seed data for demo purposes so the UI isn't empty, but save to Firestore so it persists
            const activeStaff = staff.filter(s => s.status === 'Active');
            reviews = activeStaff.map((s, i) => generateSeededReview(s, i));

            // Save to Firestore
            await Promise.all(reviews.map(r => setDoc(doc(db, 'performanceReviews', r.id), r)));
        }

        return reviews;
    }
};

function generateSeededReview(s: StaffMember, i: number): PerformanceReview {
    const scores = [88, 92, 75, 95, 68, 85, 90, 72];
    const score = scores[i % scores.length];
    return {
        id: `pr-${i}-${Date.now()}`,
        employeeId: s.id,
        employeeName: s.fullName,
        reviewerId: 'mgr-01',
        reviewerName: 'General Manager',
        reviewType: 'Annual',
        period: 'Q1 2026',
        reviewDate: Date.now() - i * 7 * 24 * 60 * 60 * 1000,
        kpiScores: [
            { kpiName: 'Guest Satisfaction', target: '90%', actual: `${score}%`, score: score },
            { kpiName: 'Upsell Revenue', target: 'BHD 500', actual: `BHD ${Math.floor(score * 5)}`, score: Math.min(100, score + 5) },
            { kpiName: 'Attendance', target: '98%', actual: `${95 + (score % 5)}%`, score: 93 },
        ],
        behaviouralRatings: [
            { competency: 'Guest Focus', rating: score >= 90 ? 5 : score >= 75 ? 4 : 3 },
            { competency: 'Teamwork', rating: 4 },
            { competency: 'Communication', rating: score >= 85 ? 5 : 3 },
        ],
        overallRating: score >= 90 ? 'Exceeds Expectations' : score >= 75 ? 'Meets Expectations' : 'Needs Improvement',
        overallScore: score,
        managerNotes: 'Strong performer with excellent guest relations. Autosaved to Firestore.',
        nineBoxPerformance: score >= 90 ? 'High' : score >= 75 ? 'Medium' : 'Low',
        nineBoxPotential: i % 3 === 0 ? 'High' : i % 3 === 1 ? 'Medium' : 'Low',
        promotionRecommended: score >= 90,
        promotionReadinessScore: Math.max(60, score - 10 + i * 3),
        guestSatisfactionScore: score,
        attendanceScore: 95,
        status: 'Submitted',
    };
}
