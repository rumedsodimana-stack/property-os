
import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap, BookOpen, Calendar, Users, Award, FileText,
  BarChart2, Clock, CheckCircle, AlertTriangle, Play, Search,
  ChevronRight, TrendingUp, Star, Loader2, Filter, Download,
  Video, FileCheck, Brain, Target, Zap, RefreshCw, Eye,
  PlusCircle, ArrowUpRight, BookOpenCheck, Layers
} from 'lucide-react';
import type {
  Course, TrainingSession, Certification, LMSContent,
  EmployeeProgress, CourseCategory, CourseFormat, SessionStatus,
  CertificationStatus, ContentType
} from '../../../types/training';

// ============================================================================
// Training Academy - Hotel Singularity OS
// Learning Management & Employee Development Center
// ============================================================================

type Tab = 'Courses' | 'Schedule' | 'Progress' | 'Certifications' | 'LMS' | 'Reports';

// ── Mock Data Generators ────────────────────────────────────────────────────

const DEPARTMENTS = ['Front Office', 'Housekeeping', 'F&B Service', 'Kitchen', 'Engineering', 'Security', 'Finance', 'HR', 'Spa & Recreation', 'Sales'];
const INSTRUCTORS = ['Maria Santos', 'James Chen', 'Aisha Mohammed', 'Roberto Silva', 'Kim Nguyen', 'David Park', 'Fatima Al-Hassan', 'Priya Sharma'];

const generateCourses = (): Course[] => {
  const courses: Course[] = [
    { id: 'CRS-001', code: 'ONB-101', title: 'Singularity OS Onboarding', description: 'Complete system orientation and brand immersion', category: 'Onboarding', format: 'Blended', level: 'Beginner', status: 'Published', durationMinutes: 480, maxParticipants: 20, prerequisites: [], instructorId: 'INS-001', instructorName: 'Maria Santos', department: 'All', isMandatory: true, recertificationMonths: null, passingScore: 80, createdAt: Date.now() - 90 * 86400000, updatedAt: Date.now() - 5 * 86400000, tags: ['onboarding', 'mandatory'] },
    { id: 'CRS-002', code: 'CMP-201', title: 'Fire Safety & Emergency Response', description: 'Annual fire safety and evacuation protocol certification', category: 'Compliance', format: 'Classroom', level: 'Beginner', status: 'Published', durationMinutes: 240, maxParticipants: 30, prerequisites: [], instructorId: 'INS-002', instructorName: 'James Chen', department: 'All', isMandatory: true, recertificationMonths: 12, passingScore: 90, createdAt: Date.now() - 180 * 86400000, updatedAt: Date.now() - 2 * 86400000, tags: ['compliance', 'safety', 'mandatory'] },
    { id: 'CRS-003', code: 'SVC-301', title: 'Luxury Guest Experience Mastery', description: 'Advanced service choreography and anticipatory hospitality', category: 'Service Excellence', format: 'Workshop', level: 'Advanced', status: 'Published', durationMinutes: 360, maxParticipants: 15, prerequisites: ['ONB-101'], instructorId: 'INS-003', instructorName: 'Aisha Mohammed', department: 'Front Office', isMandatory: false, recertificationMonths: 24, passingScore: 85, createdAt: Date.now() - 120 * 86400000, updatedAt: Date.now() - 10 * 86400000, tags: ['luxury', 'guest-experience'] },
    { id: 'CRS-004', code: 'TEC-401', title: 'PMS Advanced Operations', description: 'Deep-dive into property management system features', category: 'Technical Skills', format: 'E-Learning', level: 'Intermediate', status: 'Published', durationMinutes: 180, maxParticipants: 25, prerequisites: ['ONB-101'], instructorId: 'INS-004', instructorName: 'Roberto Silva', department: 'Front Office', isMandatory: false, recertificationMonths: null, passingScore: 75, createdAt: Date.now() - 60 * 86400000, updatedAt: Date.now() - 1 * 86400000, tags: ['technical', 'pms'] },
    { id: 'CRS-005', code: 'LDR-501', title: 'Emerging Leaders Program', description: 'Leadership development for supervisors and high-potentials', category: 'Leadership', format: 'Blended', level: 'Advanced', status: 'Published', durationMinutes: 960, maxParticipants: 12, prerequisites: ['SVC-301'], instructorId: 'INS-005', instructorName: 'Kim Nguyen', department: 'All', isMandatory: false, recertificationMonths: null, passingScore: 80, createdAt: Date.now() - 45 * 86400000, updatedAt: Date.now() - 3 * 86400000, tags: ['leadership', 'development'] },
    { id: 'CRS-006', code: 'FB-601', title: 'HACCP & Food Safety Certification', description: 'Hazard analysis and critical control point protocols', category: 'F&B Operations', format: 'Classroom', level: 'Intermediate', status: 'Published', durationMinutes: 300, maxParticipants: 20, prerequisites: [], instructorId: 'INS-006', instructorName: 'David Park', department: 'Kitchen', isMandatory: true, recertificationMonths: 12, passingScore: 90, createdAt: Date.now() - 200 * 86400000, updatedAt: Date.now() - 7 * 86400000, tags: ['food-safety', 'mandatory', 'haccp'] },
    { id: 'CRS-007', code: 'HK-701', title: 'Housekeeping Excellence Standards', description: 'Room preparation protocols and quality inspection techniques', category: 'Housekeeping Standards', format: 'On-the-Job', level: 'Beginner', status: 'Published', durationMinutes: 240, maxParticipants: 10, prerequisites: ['ONB-101'], instructorId: 'INS-007', instructorName: 'Fatima Al-Hassan', department: 'Housekeeping', isMandatory: true, recertificationMonths: 6, passingScore: 85, createdAt: Date.now() - 150 * 86400000, updatedAt: Date.now() - 14 * 86400000, tags: ['housekeeping', 'standards'] },
    { id: 'CRS-008', code: 'SEC-801', title: 'Guest Data Protection & GDPR', description: 'Data privacy regulations and guest information handling', category: 'Safety & Security', format: 'E-Learning', level: 'Beginner', status: 'Published', durationMinutes: 120, maxParticipants: 50, prerequisites: [], instructorId: 'INS-008', instructorName: 'Priya Sharma', department: 'All', isMandatory: true, recertificationMonths: 12, passingScore: 90, createdAt: Date.now() - 100 * 86400000, updatedAt: Date.now() - 20 * 86400000, tags: ['gdpr', 'data-protection', 'mandatory'] },
    { id: 'CRS-009', code: 'RVM-901', title: 'Revenue Optimization Fundamentals', description: 'Yield management principles and dynamic pricing strategies', category: 'Revenue Management', format: 'Classroom', level: 'Advanced', status: 'Published', durationMinutes: 420, maxParticipants: 15, prerequisites: ['TEC-401'], instructorId: 'INS-001', instructorName: 'Maria Santos', department: 'Revenue', isMandatory: false, recertificationMonths: null, passingScore: 80, createdAt: Date.now() - 30 * 86400000, updatedAt: Date.now() - 4 * 86400000, tags: ['revenue', 'pricing'] },
    { id: 'CRS-010', code: 'BRD-101', title: 'Brand Standards Immersion', description: 'Complete brand identity, voice, and visual standards training', category: 'Brand Standards', format: 'Simulation', level: 'Intermediate', status: 'Published', durationMinutes: 300, maxParticipants: 20, prerequisites: ['ONB-101'], instructorId: 'INS-003', instructorName: 'Aisha Mohammed', department: 'All', isMandatory: true, recertificationMonths: 24, passingScore: 85, createdAt: Date.now() - 75 * 86400000, updatedAt: Date.now() - 8 * 86400000, tags: ['brand', 'standards', 'mandatory'] },
  ];
  return courses;
};

const generateSessions = (): TrainingSession[] => {
  const statuses: SessionStatus[] = ['Scheduled', 'Completed', 'In Progress', 'Scheduled', 'Completed', 'Scheduled'];
  return Array.from({ length: 12 }, (_, i) => ({
    id: `SES-${String(i + 1).padStart(3, '0')}`,
    courseId: `CRS-${String((i % 10) + 1).padStart(3, '0')}`,
    courseTitle: generateCourses()[i % 10].title,
    instructorId: `INS-${String((i % 8) + 1).padStart(3, '0')}`,
    instructorName: INSTRUCTORS[i % 8],
    location: ['Grand Ballroom A', 'Training Room 1', 'E-Learning Lab', 'Conference Suite B', 'Kitchen Training Area', 'Executive Boardroom'][i % 6],
    scheduledDate: Date.now() + (i - 4) * 86400000 * 3,
    startTime: ['09:00', '10:00', '14:00', '09:30'][i % 4],
    endTime: ['12:00', '13:00', '17:00', '12:30'][i % 4],
    status: statuses[i % statuses.length],
    enrolledCount: Math.floor(Math.random() * 15) + 5,
    maxCapacity: [20, 30, 15, 25, 20, 12][i % 6],
    attendees: [],
    notes: '',
  }));
};

const generateCertifications = (): Certification[] => {
  const names = ['Elena Vasquez', 'Rashid Khan', 'Sophie Laurent', 'Marcus Thompson', 'Yuki Tanaka', 'Carlos Mendoza', 'Anna Petrova', 'Kwame Asante', 'Lisa Chang', 'Omar Haddad', 'Ingrid Svensson', 'Pedro Alvarez'];
  const certStatuses: CertificationStatus[] = ['Active', 'Active', 'Active', 'Pending Renewal', 'Expired', 'Active'];
  return names.map((name, i) => ({
    id: `CERT-${String(i + 1).padStart(3, '0')}`,
    employeeId: `EMP-${String(i + 100).padStart(4, '0')}`,
    employeeName: name,
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    courseId: `CRS-${String((i % 10) + 1).padStart(3, '0')}`,
    courseTitle: generateCourses()[i % 10].title,
    certificationName: generateCourses()[i % 10].title + ' Certified',
    issuedDate: Date.now() - (i * 30 + 10) * 86400000,
    expiryDate: i % 3 === 0 ? null : Date.now() + (180 - i * 20) * 86400000,
    status: certStatuses[i % certStatuses.length],
    score: Math.floor(Math.random() * 15) + 85,
    certificateNumber: `SNG-${2025}-${String(i + 1).padStart(5, '0')}`,
    issuedBy: INSTRUCTORS[i % 8],
  }));
};

const generateLMSContent = (): LMSContent[] => {
  const types: ContentType[] = ['Video', 'Document', 'Quiz', 'Interactive', 'Presentation', 'Checklist', 'Assessment'];
  return Array.from({ length: 14 }, (_, i) => ({
    id: `LMS-${String(i + 1).padStart(3, '0')}`,
    courseId: `CRS-${String((i % 10) + 1).padStart(3, '0')}`,
    title: [
      'Welcome to Singularity', 'Brand DNA Overview', 'Emergency Procedures Walkthrough',
      'Guest Journey Mapping', 'PMS Navigation Guide', 'Leadership Self-Assessment',
      'HACCP Module 1: Principles', 'Room Inspection Checklist', 'Data Privacy Essentials',
      'Revenue Basics: Supply & Demand', 'Final Assessment: Onboarding', 'Service Recovery Scenarios',
      'Brand Voice Guidelines', 'Fire Drill Simulation'
    ][i],
    type: types[i % types.length],
    url: `/content/lms/${i + 1}`,
    durationMinutes: [15, 30, 20, 45, 25, 10, 35, 15, 20, 40, 30, 25, 20, 45][i],
    orderIndex: i + 1,
    isRequired: i % 3 !== 2,
    description: `Training content module ${i + 1}`,
    uploadedBy: INSTRUCTORS[i % 8],
    uploadedAt: Date.now() - (i + 5) * 86400000,
    fileSize: `${(Math.random() * 50 + 2).toFixed(1)} MB`,
    completionRate: Math.floor(Math.random() * 40) + 55,
  }));
};

const generateProgress = (): EmployeeProgress[] => {
  const names = ['Elena Vasquez', 'Rashid Khan', 'Sophie Laurent', 'Marcus Thompson', 'Yuki Tanaka', 'Carlos Mendoza', 'Anna Petrova', 'Kwame Asante', 'Lisa Chang', 'Omar Haddad', 'Ingrid Svensson', 'Pedro Alvarez', 'Mei Wong', 'Dmitri Volkov', 'Fatou Diallo'];
  const roles = ['Receptionist', 'Concierge', 'Room Attendant', 'Chef de Partie', 'Duty Manager', 'Bellman', 'Bartender', 'Engineer', 'Security Officer', 'Accountant', 'Spa Therapist', 'Sales Executive', 'Night Auditor', 'F&B Supervisor', 'HR Coordinator'];
  return names.map((name, i) => ({
    employeeId: `EMP-${String(i + 100).padStart(4, '0')}`,
    employeeName: name,
    department: DEPARTMENTS[i % DEPARTMENTS.length],
    role: roles[i % roles.length],
    coursesCompleted: Math.floor(Math.random() * 6) + 2,
    coursesInProgress: Math.floor(Math.random() * 3),
    coursesOverdue: Math.floor(Math.random() * 2),
    totalScore: Math.floor(Math.random() * 15) + 80,
    activeCertifications: Math.floor(Math.random() * 4) + 1,
    expiringSoon: Math.floor(Math.random() * 2),
    lastActivityDate: Date.now() - Math.floor(Math.random() * 14) * 86400000,
    hoursCompleted: Math.floor(Math.random() * 60) + 10,
  }));
};

// ── Stat Card ───────────────────────────────────────────────────────────────

const KPICard = ({ label, value, icon, color, bg }: { label: string; value: string | number; icon: React.ReactNode; color: string; bg: string }) => (
  <div className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
    <div className={`p-2 rounded-lg bg-zinc-900/50 ${color}`}>{icon}</div>
    <div>
      <div className={`text-xl font-light ${color}`}>{value}</div>
      <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider leading-tight">{label}</div>
    </div>
  </div>
);

// ── Content Type Icon ───────────────────────────────────────────────────────

const ContentIcon = ({ type }: { type: ContentType }) => {
  switch (type) {
    case 'Video': return <Video className="w-4 h-4 text-rose-400" />;
    case 'Document': return <FileText className="w-4 h-4 text-blue-400" />;
    case 'Quiz': return <Brain className="w-4 h-4 text-violet-400" />;
    case 'Interactive': return <Zap className="w-4 h-4 text-amber-400" />;
    case 'Presentation': return <Layers className="w-4 h-4 text-teal-400" />;
    case 'Checklist': return <FileCheck className="w-4 h-4 text-emerald-400" />;
    case 'Assessment': return <Target className="w-4 h-4 text-orange-400" />;
    default: return <FileText className="w-4 h-4 text-zinc-400" />;
  }
};

// ── Format Badge Color ──────────────────────────────────────────────────────

const formatBadgeColor = (format: CourseFormat) => {
  const map: Record<CourseFormat, string> = {
    'Classroom': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'E-Learning': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'Blended': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    'On-the-Job': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Workshop': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Simulation': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  return map[format] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
};

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    'Scheduled': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'In Progress': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Completed': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Cancelled': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    'Postponed': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'Active': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Expired': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    'Pending Renewal': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Published': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Draft': 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
    'Archived': 'text-zinc-500 bg-zinc-600/10 border-zinc-600/20',
  };
  return map[status] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
};

// ============================================================================
// Main Component
// ============================================================================

const TrainingAcademy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const courses = useMemo(() => generateCourses(), []);
  const sessions = useMemo(() => generateSessions(), []);
  const certifications = useMemo(() => generateCertifications(), []);
  const lmsContent = useMemo(() => generateLMSContent(), []);
  const progress = useMemo(() => generateProgress(), []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // ── KPI Calculations ───────────────────────────────────────────────────
  const totalCourses = courses.filter(c => c.status === 'Published').length;
  const upcomingSessions = sessions.filter(s => s.status === 'Scheduled').length;
  const activeCerts = certifications.filter(c => c.status === 'Active').length;
  const expiringCerts = certifications.filter(c => c.status === 'Pending Renewal').length;
  const avgCompletionRate = progress.length ? Math.round(progress.reduce((s, p) => s + p.totalScore, 0) / progress.length) : 0;
  const overdueCount = progress.reduce((s, p) => s + p.coursesOverdue, 0);

  // ── Tabs Config ────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'Courses', label: 'Courses', icon: BookOpen },
    { id: 'Schedule', label: 'Schedule', icon: Calendar },
    { id: 'Progress', label: 'Progress', icon: Users },
    { id: 'Certifications', label: 'Certs', icon: Award },
    { id: 'LMS', label: 'LMS Content', icon: Layers },
    { id: 'Reports', label: 'Reports', icon: BarChart2 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        <span className="ml-3 text-zinc-400">Loading Training Academy...</span>
      </div>
    );
  }

  // ── Tab Renderers ─────────────────────────────────────────────────────

  const renderCourses = () => {
    const categories = ['All', ...new Set(courses.map(c => c.category))];
    const filtered = courses.filter(c =>
      (selectedCategory === 'All' || c.category === selectedCategory) &&
      (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search courses..." className="bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-600 w-full" />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedCategory === cat ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(course => (
            <div key={course.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-zinc-500">{course.code}</span>
                    {course.isMandatory && (
                      <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-bold uppercase tracking-wider rounded border border-rose-500/20">Mandatory</span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-zinc-100 group-hover:text-violet-400 transition truncate">{course.title}</h4>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{course.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${statusColor(course.status)}`}>{course.status}</span>
              </div>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${formatBadgeColor(course.format)}`}>{course.format}</span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock size={10} /> {Math.round(course.durationMinutes / 60)}h {course.durationMinutes % 60}m</span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Users size={10} /> Max {course.maxParticipants}</span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Target size={10} /> Pass: {course.passingScore}%</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/50">
                <span className="text-[10px] text-zinc-500">{course.instructorName}</span>
                <span className="text-[10px] text-zinc-600">{course.department}</span>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500 text-sm">No courses match your search criteria</div>
        )}
      </div>
    );
  };

  const renderSchedule = () => {
    const sorted = [...sessions].sort((a, b) => a.scheduledDate - b.scheduledDate);
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Upcoming & Recent Sessions</h3>
          <button className="px-3 py-1.5 bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-violet-500/20 hover:bg-violet-500/20 transition flex items-center gap-1.5">
            <PlusCircle size={12} /> Schedule Session
          </button>
        </div>
        <div className="space-y-3">
          {sorted.map(session => {
            const dateStr = new Date(session.scheduledDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            const isPast = session.scheduledDate < Date.now();
            return (
              <div key={session.id} className={`bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition ${isPast ? 'opacity-75' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-zinc-100">{session.courseTitle}</h4>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Calendar size={10} /> {dateStr}</span>
                      <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Clock size={10} /> {session.startTime} - {session.endTime}</span>
                      <span className="text-[10px] text-zinc-400">{session.location}</span>
                      <span className="text-[10px] text-zinc-400">{session.instructorName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500 font-mono">{session.enrolledCount}/{session.maxCapacity}</span>
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${statusColor(session.status)}`}>{session.status}</span>
                  </div>
                </div>
                {/* Capacity Bar */}
                <div className="mt-3 pt-3 border-t border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500/60 rounded-full transition-all" style={{ width: `${(session.enrolledCount / session.maxCapacity) * 100}%` }} />
                    </div>
                    <span className="text-[9px] text-zinc-500 font-bold">{Math.round((session.enrolledCount / session.maxCapacity) * 100)}% Full</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProgress = () => {
    const filtered = progress.filter(p =>
      p.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl flex-1">
            <Search className="w-4 h-4 text-zinc-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search employees..." className="bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-600 w-full" />
          </div>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Employee</th>
                <th className="text-left px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Department</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Completed</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">In Progress</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Overdue</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Avg Score</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Hours</th>
                <th className="text-center px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Certs</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.employeeId} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition">
                  <td className="px-4 py-3">
                    <div className="text-sm text-zinc-200">{emp.employeeName}</div>
                    <div className="text-[10px] text-zinc-500">{emp.role}</div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-zinc-400">{emp.department}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-emerald-400">{emp.coursesCompleted}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-medium text-amber-400">{emp.coursesInProgress}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {emp.coursesOverdue > 0 ? (
                      <span className="text-sm font-medium text-rose-400">{emp.coursesOverdue}</span>
                    ) : (
                      <span className="text-sm text-zinc-600">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-medium ${emp.totalScore >= 90 ? 'text-emerald-400' : emp.totalScore >= 80 ? 'text-blue-400' : 'text-amber-400'}`}>{emp.totalScore}%</span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-zinc-400">{emp.hoursCompleted}h</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm text-violet-400">{emp.activeCertifications}</span>
                      {emp.expiringSoon > 0 && (
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCertifications = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Active Certifications</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">{certifications.length} Total</span>
          <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 transition flex items-center gap-1.5">
            <Download size={12} /> Export
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {certifications.map(cert => (
          <div key={cert.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Award className={`w-4 h-4 ${cert.status === 'Active' ? 'text-emerald-400' : cert.status === 'Expired' ? 'text-rose-400' : 'text-amber-400'}`} />
                  <h4 className="text-sm font-medium text-zinc-100 truncate">{cert.employeeName}</h4>
                </div>
                <p className="text-[11px] text-zinc-400">{cert.certificationName}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{cert.department}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${statusColor(cert.status)}`}>{cert.status}</span>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/50 text-[10px] text-zinc-500">
              <span>Score: <strong className="text-zinc-300">{cert.score}%</strong></span>
              <span>Issued: {new Date(cert.issuedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}</span>
              {cert.expiryDate && (
                <span className={cert.status === 'Expired' ? 'text-rose-400' : cert.status === 'Pending Renewal' ? 'text-amber-400' : ''}>
                  Expires: {new Date(cert.expiryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                </span>
              )}
              <span className="font-mono text-zinc-600">{cert.certificateNumber}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLMS = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">LMS Content Library</h3>
        <button className="px-3 py-1.5 bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-violet-500/20 hover:bg-violet-500/20 transition flex items-center gap-1.5">
          <PlusCircle size={12} /> Upload Content
        </button>
      </div>
      <div className="space-y-3">
        {lmsContent.map(content => (
          <div key={content.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition flex items-center gap-4">
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl">
              <ContentIcon type={content.type} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-zinc-100 truncate">{content.title}</h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold">{content.type}</span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1"><Clock size={10} /> {content.durationMinutes}m</span>
                <span className="text-[10px] text-zinc-500">{content.fileSize}</span>
                {content.isRequired && <span className="text-[9px] text-rose-400 font-bold uppercase">Required</span>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-violet-400">{content.completionRate}%</div>
                <div className="text-[9px] text-zinc-500 uppercase font-bold">Completion</div>
              </div>
              <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${content.completionRate}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReports = () => {
    const deptStats = DEPARTMENTS.slice(0, 6).map(dept => {
      const deptProgress = progress.filter(p => p.department === dept);
      const avgScore = deptProgress.length ? Math.round(deptProgress.reduce((s, p) => s + p.totalScore, 0) / deptProgress.length) : 0;
      const completed = deptProgress.reduce((s, p) => s + p.coursesCompleted, 0);
      const overdue = deptProgress.reduce((s, p) => s + p.coursesOverdue, 0);
      return { dept, avgScore, completed, overdue, headcount: deptProgress.length };
    });

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="text-3xl font-light text-emerald-400">{progress.reduce((s, p) => s + p.coursesCompleted, 0)}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Total Completions</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="text-3xl font-light text-violet-400">{avgCompletionRate}%</div>
            <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Avg Score</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="text-3xl font-light text-blue-400">{progress.reduce((s, p) => s + p.hoursCompleted, 0)}h</div>
            <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Training Hours</div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 text-center">
            <div className="text-3xl font-light text-amber-400">{overdueCount}</div>
            <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Overdue Items</div>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Department Performance</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Department</th>
                <th className="text-center px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Staff</th>
                <th className="text-center px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Completed</th>
                <th className="text-center px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Overdue</th>
                <th className="text-center px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Avg Score</th>
                <th className="px-5 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Performance</th>
              </tr>
            </thead>
            <tbody>
              {deptStats.map(d => (
                <tr key={d.dept} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition">
                  <td className="px-5 py-3 text-sm text-zinc-200">{d.dept}</td>
                  <td className="px-5 py-3 text-center text-sm text-zinc-400">{d.headcount}</td>
                  <td className="px-5 py-3 text-center text-sm text-emerald-400">{d.completed}</td>
                  <td className="px-5 py-3 text-center text-sm text-rose-400">{d.overdue}</td>
                  <td className="px-5 py-3 text-center text-sm font-medium text-violet-400">{d.avgScore}%</td>
                  <td className="px-5 py-3">
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${d.avgScore >= 85 ? 'bg-emerald-500/60' : d.avgScore >= 75 ? 'bg-violet-500/60' : 'bg-amber-500/60'}`} style={{ width: `${d.avgScore}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Compliance Snapshot */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4">Mandatory Training Compliance</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {courses.filter(c => c.isMandatory).map(course => {
              const compliance = Math.floor(Math.random() * 25) + 72;
              return (
                <div key={course.id} className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-center">
                  <div className={`text-lg font-light ${compliance >= 90 ? 'text-emerald-400' : compliance >= 75 ? 'text-amber-400' : 'text-rose-400'}`}>{compliance}%</div>
                  <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mt-1 leading-tight">{course.code}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Courses': return renderCourses();
      case 'Schedule': return renderSchedule();
      case 'Progress': return renderProgress();
      case 'Certifications': return renderCertifications();
      case 'LMS': return renderLMS();
      case 'Reports': return renderReports();
      default: return null;
    }
  };

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header glass-panel border border-violet-500/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-600/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-light text-white tracking-tight">Training Academy</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Learning & Development</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setSelectedCategory('All'); }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-zinc-800 text-white shadow-lg shadow-black/40'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/5 border border-violet-500/20 rounded-xl text-[10px] font-bold text-violet-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {totalCourses} ACTIVE COURSES
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 px-1">
        <KPICard label="Published Courses" value={totalCourses} icon={<BookOpen className="w-4 h-4" />} color="text-violet-400" bg="bg-violet-500/5 border-violet-500/20" />
        <KPICard label="Upcoming Sessions" value={upcomingSessions} icon={<Calendar className="w-4 h-4" />} color="text-blue-400" bg="bg-blue-500/5 border-blue-500/20" />
        <KPICard label="Avg Score" value={`${avgCompletionRate}%`} icon={<TrendingUp className="w-4 h-4" />} color="text-emerald-400" bg="bg-emerald-500/5 border-emerald-500/20" />
        <KPICard label="Active Certs" value={activeCerts} icon={<Award className="w-4 h-4" />} color="text-teal-400" bg="bg-teal-500/5 border-teal-500/20" />
        <KPICard label="Expiring Soon" value={expiringCerts} icon={<AlertTriangle className="w-4 h-4" />} color="text-amber-400" bg="bg-amber-500/5 border-amber-500/20" />
        <KPICard label="Overdue" value={overdueCount} icon={<RefreshCw className="w-4 h-4" />} color="text-rose-400" bg="bg-rose-500/5 border-rose-500/20" />
      </div>

      {/* Tab Content */}
      <main className="module-body overflow-y-auto custom-scrollbar">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default TrainingAcademy;
