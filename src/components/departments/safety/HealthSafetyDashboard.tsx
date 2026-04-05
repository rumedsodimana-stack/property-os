
import React, { useState, useMemo } from 'react';
import {
  ShieldAlert, Search, AlertTriangle, CheckCircle2, FileText, Users,
  Calendar, Clock, Filter, Plus, RefreshCw, Flame, Thermometer, Activity,
  AlertOctagon, Award, BookOpen, HardHat, BarChart3, TrendingUp, MapPin,
  ChevronRight, Bell, Siren, HeartPulse, Droplets, Zap
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
import type {
  SafetyIncident, IncidentSeverity, IncidentStatus, ComplianceCert,
  CertificateStatus, HACCPLog, FireEquipment, TrainingRecord,
  RiskAssessment, RiskLevel, RiskAssessmentStatus
} from '../../../types/safety';

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_INCIDENTS: SafetyIncident[] = [
  {
    id: 'si_001', title: 'Slip in kitchen near walk-in cooler', description: 'Employee slipped on wet floor near walk-in cooler entrance. No wet floor sign was posted.',
    category: 'slip_trip_fall', severity: 'moderate', status: 'action_required', location: 'B1 - Main Kitchen',
    reportedBy: 'Carlos Mendez', reportedAt: '2026-03-30T08:45:00',
    injuredParty: { name: 'Ana Rodriguez', type: 'employee', injuryDescription: 'Bruised left knee', treatmentGiven: 'Ice pack, first aid', hospitalised: false },
    witnesses: ['James Okafor', 'Wei Zhang'], immediateAction: 'Area cleaned, wet floor sign placed',
    rootCause: 'Condensation drip from cooler door seal', correctiveActions: ['Replace cooler door gasket', 'Install anti-slip mat'],
    reportableToAuthority: false, photos: [], createdAt: '2026-03-30', updatedAt: '2026-03-31',
  },
  {
    id: 'si_002', title: 'Guest burn from hot beverage at breakfast', description: 'Guest sustained minor burn when coffee carafe handle came loose.',
    category: 'burn_scald', severity: 'minor', status: 'investigating', location: 'L1 - Sunrise Restaurant',
    reportedBy: 'Priya Sharma', reportedAt: '2026-03-29T07:30:00',
    injuredParty: { name: 'Robert Davis', type: 'guest', injuryDescription: 'Minor burn on right hand', treatmentGiven: 'Cold water, burn gel applied', hospitalised: false },
    witnesses: ['Priya Sharma'], immediateAction: 'Carafe removed from service, first aid provided',
    correctiveActions: [], reportableToAuthority: false, photos: [], createdAt: '2026-03-29', updatedAt: '2026-03-30',
  },
  {
    id: 'si_003', title: 'Near-miss: falling ceiling tile in corridor', description: 'Ceiling tile partially dislodged in back-of-house corridor B2. Noticed by housekeeping supervisor before falling.',
    category: 'other', severity: 'near_miss', status: 'resolved', location: 'B2 - Service Corridor',
    reportedBy: 'Diego Morales', reportedAt: '2026-03-28T14:20:00',
    witnesses: [], immediateAction: 'Area cordoned, engineering notified',
    rootCause: 'Water damage from pipe leak above', correctiveActions: ['Pipe repaired', 'Ceiling tile replaced', 'Adjacent tiles inspected'],
    reportableToAuthority: false, closedAt: '2026-03-29', closedBy: 'Raj Patel', photos: [], createdAt: '2026-03-28', updatedAt: '2026-03-29',
  },
  {
    id: 'si_004', title: 'Chemical exposure in laundry room', description: 'Employee experienced irritation after bleach solution splashed due to incorrect dilution ratio.',
    category: 'chemical_exposure', severity: 'moderate', status: 'resolved', location: 'B1 - Laundry',
    reportedBy: 'Maria Chen', reportedAt: '2026-03-25T10:15:00',
    injuredParty: { name: 'Fatima Al-Rashid', type: 'employee', injuryDescription: 'Skin irritation on forearms', treatmentGiven: 'Washed with water, medical evaluation', hospitalised: false },
    witnesses: ['Maria Chen', 'Li Wei'], immediateAction: 'Area ventilated, employee sent to clinic',
    rootCause: 'Dilution chart not visible, employee undertrained', correctiveActions: ['Repost dilution charts', 'PPE compliance check', 'Retraining scheduled'],
    reportableToAuthority: true, authorityReference: 'OSH-2026-0342', closedAt: '2026-03-28', closedBy: 'Safety Officer', photos: [], createdAt: '2026-03-25', updatedAt: '2026-03-28',
  },
];

const MOCK_CERTS: ComplianceCert[] = [
  { id: 'cert_001', name: 'Fire Safety Certificate', issuingAuthority: 'City Fire Department', certificateNumber: 'FS-2025-4821', category: 'fire_safety', issueDate: '2025-06-15', expiryDate: '2026-06-15', status: 'valid', responsiblePerson: 'Raj Patel', renewalCost: 2500 },
  { id: 'cert_002', name: 'Food Hygiene Grade A', issuingAuthority: 'Health Department', certificateNumber: 'FH-2025-9912', category: 'food_hygiene', issueDate: '2025-09-01', expiryDate: '2026-09-01', status: 'valid', responsiblePerson: 'James Okafor' },
  { id: 'cert_003', name: 'Elevator Inspection Certificate', issuingAuthority: 'Building Safety Authority', certificateNumber: 'EL-2025-0087', category: 'elevator', issueDate: '2025-11-20', expiryDate: '2026-05-20', status: 'expiring_soon', responsiblePerson: 'Raj Patel', renewalCost: 1800, notes: 'Renewal inspection scheduled April 15' },
  { id: 'cert_004', name: 'Pool Safety Compliance', issuingAuthority: 'Health Department', certificateNumber: 'PS-2025-3301', category: 'pool', issueDate: '2025-08-10', expiryDate: '2026-08-10', status: 'valid', responsiblePerson: 'Diego Morales' },
  { id: 'cert_005', name: 'Occupational Health License', issuingAuthority: 'Labor Department', certificateNumber: 'OH-2024-7742', category: 'occupational_health', issueDate: '2024-12-01', expiryDate: '2026-12-01', status: 'valid', responsiblePerson: 'HR Director' },
  { id: 'cert_006', name: 'Environmental Compliance Permit', issuingAuthority: 'Environmental Agency', certificateNumber: 'ENV-2025-0156', category: 'environmental', issueDate: '2025-03-01', expiryDate: '2026-03-01', status: 'expired', responsiblePerson: 'Raj Patel', renewalCost: 3200, notes: 'Renewal application submitted, awaiting approval' },
];

const MOCK_HACCP: HACCPLog[] = [
  { id: 'hc_001', checkType: 'temperature', location: 'Walk-In Cooler #1', outlet: 'Main Kitchen', checkedBy: 'James Okafor', checkedAt: '2026-04-01T06:00:00', temperatureReading: 3.2, temperatureUnit: 'C', minThreshold: 0, maxThreshold: 5, inCompliance: true },
  { id: 'hc_002', checkType: 'temperature', location: 'Walk-In Freezer', outlet: 'Main Kitchen', checkedBy: 'James Okafor', checkedAt: '2026-04-01T06:05:00', temperatureReading: -19.5, temperatureUnit: 'C', minThreshold: -25, maxThreshold: -18, inCompliance: true },
  { id: 'hc_003', checkType: 'temperature', location: 'Hot Holding Station', outlet: 'Sunrise Restaurant', checkedBy: 'Wei Zhang', checkedAt: '2026-04-01T06:30:00', temperatureReading: 58, temperatureUnit: 'C', minThreshold: 63, maxThreshold: 100, inCompliance: false, correctiveAction: 'Reheated to 72C, rechecked at 06:50 = 68C. Compliant.' },
  { id: 'hc_004', checkType: 'cleanliness', location: 'Prep Station 3', outlet: 'Main Kitchen', checkedBy: 'Carlos Mendez', checkedAt: '2026-04-01T05:45:00', inCompliance: true, notes: 'Sanitized and ready for service' },
  { id: 'hc_005', checkType: 'storage', location: 'Dry Store', outlet: 'Main Kitchen', checkedBy: 'James Okafor', checkedAt: '2026-04-01T06:10:00', inCompliance: true, notes: 'FIFO maintained, no expired items' },
  { id: 'hc_006', checkType: 'personal_hygiene', location: 'Kitchen Entry', outlet: 'Main Kitchen', checkedBy: 'James Okafor', checkedAt: '2026-04-01T05:55:00', inCompliance: true, notes: 'All staff handwashing and uniform compliance verified' },
  { id: 'hc_007', checkType: 'temperature', location: 'Pastry Fridge', outlet: 'Patisserie', checkedBy: 'Sophie Laurent', checkedAt: '2026-04-01T07:00:00', temperatureReading: 4.8, temperatureUnit: 'C', minThreshold: 0, maxThreshold: 5, inCompliance: true },
];

const MOCK_FIRE_EQUIPMENT: FireEquipment[] = [
  { id: 'fe_001', type: 'extinguisher', location: 'Main Lobby - East', floor: 'Ground', zone: 'A1', serialNumber: 'EXT-2024-001', installDate: '2024-01-15', lastInspection: '2026-03-01', nextInspection: '2026-06-01', status: 'operational', inspectedBy: 'Raj Patel' },
  { id: 'fe_002', type: 'extinguisher', location: 'Kitchen - North Wall', floor: 'B1', zone: 'K1', serialNumber: 'EXT-2024-015', installDate: '2024-01-15', lastInspection: '2026-03-01', nextInspection: '2026-06-01', status: 'operational' },
  { id: 'fe_003', type: 'alarm_panel', location: 'Security Office', floor: 'Ground', zone: 'A1', serialNumber: 'FP-2023-001', installDate: '2023-06-10', lastInspection: '2026-02-15', nextInspection: '2026-05-15', status: 'operational' },
  { id: 'fe_004', type: 'smoke_detector', location: 'Floor 5 - Corridor', floor: '5', zone: 'C5', installDate: '2023-06-10', lastInspection: '2026-01-20', nextInspection: '2026-04-20', status: 'needs_service', notes: 'Battery replacement due' },
  { id: 'fe_005', type: 'emergency_light', location: 'B2 Stairwell', floor: 'B2', zone: 'B2-S', installDate: '2024-03-01', lastInspection: '2026-03-15', nextInspection: '2026-06-15', status: 'operational' },
  { id: 'fe_006', type: 'sprinkler', location: 'Ballroom', floor: 'Ground', zone: 'D1', installDate: '2023-06-10', lastInspection: '2026-02-01', nextInspection: '2026-08-01', status: 'operational' },
  { id: 'fe_007', type: 'fire_door', location: 'Floor 8 - East Wing', floor: '8', zone: 'C8', installDate: '2023-06-10', lastInspection: '2026-03-01', nextInspection: '2026-09-01', status: 'needs_service', notes: 'Auto-closer mechanism sluggish' },
];

const MOCK_TRAINING: TrainingRecord[] = [
  { id: 'tr_001', employeeId: 'emp_042', employeeName: 'Maria Chen', department: 'Housekeeping', courseName: 'Fire Safety & Evacuation', courseType: 'fire_safety', completedDate: '2026-01-15', expiryDate: '2027-01-15', status: 'valid', provider: 'SafetyFirst Ltd', score: 92 },
  { id: 'tr_002', employeeId: 'emp_015', employeeName: 'James Okafor', department: 'F&B', courseName: 'Advanced Food Hygiene (Level 3)', courseType: 'food_hygiene', completedDate: '2025-11-20', expiryDate: '2026-11-20', status: 'valid', provider: 'Food Standards Academy', score: 88 },
  { id: 'tr_003', employeeId: 'emp_055', employeeName: 'Raj Patel', department: 'Engineering', courseName: 'First Aid at Work', courseType: 'first_aid', completedDate: '2025-06-01', expiryDate: '2026-06-01', status: 'expiring_soon', provider: 'Red Cross', score: 95 },
  { id: 'tr_004', employeeId: 'emp_028', employeeName: 'Aisha Rahman', department: 'Front Office', courseName: 'Fire Warden Training', courseType: 'fire_safety', completedDate: '2025-09-10', expiryDate: '2026-09-10', status: 'valid', provider: 'SafetyFirst Ltd', score: 90 },
  { id: 'tr_005', employeeId: 'emp_033', employeeName: 'Diego Morales', department: 'Housekeeping', courseName: 'Manual Handling & Ergonomics', courseType: 'manual_handling', completedDate: '2025-03-20', expiryDate: '2026-03-20', status: 'expired', provider: 'OHS Training Co' },
  { id: 'tr_006', employeeId: 'emp_010', employeeName: 'Sarah Collins', department: 'Front Office', courseName: 'CPR & AED Certification', courseType: 'cpr', completedDate: '2025-08-15', expiryDate: '2026-08-15', status: 'valid', provider: 'Red Cross', score: 100 },
  { id: 'tr_007', employeeId: 'emp_015', employeeName: 'James Okafor', department: 'F&B', courseName: 'HACCP Principles', courseType: 'food_hygiene', completedDate: '2026-02-10', expiryDate: '2027-02-10', status: 'valid', provider: 'Food Standards Academy', score: 94 },
];

const MOCK_RISK_ASSESSMENTS: RiskAssessment[] = [
  {
    id: 'ra_001', title: 'Kitchen Operations Risk Assessment', area: 'Main Kitchen & Prep Areas', department: 'F&B',
    assessedBy: 'James Okafor', assessedDate: '2026-02-15', reviewDate: '2026-08-15', status: 'active', overallRisk: 'medium',
    hazards: [
      { id: 'h1', description: 'Hot surfaces and open flame cooking', riskLevel: 'high', likelihood: 4, impact: 3, riskScore: 12, existingControls: ['PPE provided', 'Training mandatory'], additionalControls: ['Install splash guards'], responsiblePerson: 'Head Chef', targetDate: '2026-04-30', residualRisk: 'medium' },
      { id: 'h2', description: 'Wet floors near dishwash and prep', riskLevel: 'medium', likelihood: 3, impact: 2, riskScore: 6, existingControls: ['Anti-slip mats', 'Wet floor signs'], additionalControls: ['Improve drainage'], responsiblePerson: 'Engineering', targetDate: '2026-05-15', residualRisk: 'low' },
      { id: 'h3', description: 'Sharp knife and equipment handling', riskLevel: 'medium', likelihood: 3, impact: 3, riskScore: 9, existingControls: ['Cut-resistant gloves', 'Knife skills training'], additionalControls: [], responsiblePerson: 'Head Chef', targetDate: '2026-04-01', residualRisk: 'low' },
    ],
  },
  {
    id: 'ra_002', title: 'Swimming Pool & Deck Safety', area: 'Level 3 Pool Deck & Cabana', department: 'Recreation',
    assessedBy: 'Diego Morales', assessedDate: '2026-01-20', reviewDate: '2026-07-20', status: 'active', overallRisk: 'medium',
    hazards: [
      { id: 'h4', description: 'Drowning risk - guests and children', riskLevel: 'high', likelihood: 2, impact: 5, riskScore: 10, existingControls: ['Lifeguard on duty', 'Depth markers', 'Safety signage'], additionalControls: ['Install pool alarm'], responsiblePerson: 'Pool Manager', targetDate: '2026-04-15', residualRisk: 'low' },
      { id: 'h5', description: 'Slip hazard on wet deck surface', riskLevel: 'medium', likelihood: 3, impact: 2, riskScore: 6, existingControls: ['Non-slip surface', 'Warning signs'], additionalControls: [], responsiblePerson: 'Engineering', targetDate: '2026-04-01', residualRisk: 'low' },
    ],
  },
  {
    id: 'ra_003', title: 'Laundry Chemical Handling', area: 'B1 Laundry Room', department: 'Housekeeping',
    assessedBy: 'Maria Chen', assessedDate: '2026-03-01', reviewDate: '2026-09-01', status: 'under_review', overallRisk: 'high',
    hazards: [
      { id: 'h6', description: 'Chemical splash and inhalation', riskLevel: 'high', likelihood: 3, impact: 4, riskScore: 12, existingControls: ['PPE provided', 'MSDS posted', 'Ventilation system'], additionalControls: ['Automated dispensing', 'Additional eye wash station'], responsiblePerson: 'Laundry Supervisor', targetDate: '2026-04-15', residualRisk: 'medium' },
      { id: 'h7', description: 'Incorrect chemical mixing', riskLevel: 'high', likelihood: 3, impact: 4, riskScore: 12, existingControls: ['Dilution charts', 'Training'], additionalControls: ['Color-coded dispensers', 'Refresher training'], responsiblePerson: 'Laundry Supervisor', targetDate: '2026-04-10', residualRisk: 'low' },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const severityColor = (s: IncidentSeverity | string): string => {
  const map: Record<string, string> = {
    critical: 'text-rose-400', major: 'text-orange-400', moderate: 'text-amber-400', minor: 'text-sky-400', near_miss: 'text-zinc-400',
  };
  return map[s] || 'text-zinc-400';
};

const severityBg = (s: string): string => {
  const map: Record<string, string> = {
    critical: 'bg-rose-500/10 border-rose-500/20', major: 'bg-orange-500/10 border-orange-500/20',
    moderate: 'bg-amber-500/10 border-amber-500/20', minor: 'bg-sky-500/10 border-sky-500/20',
    near_miss: 'bg-zinc-500/10 border-zinc-500/20',
  };
  return map[s] || 'bg-zinc-500/10 border-zinc-500/20';
};

const statusColor = (s: IncidentStatus | CertificateStatus | string): string => {
  const map: Record<string, string> = {
    resolved: 'text-emerald-400', closed: 'text-emerald-400', valid: 'text-emerald-400', operational: 'text-emerald-400', active: 'text-emerald-400',
    investigating: 'text-amber-400', expiring_soon: 'text-amber-400', needs_service: 'text-amber-400', under_review: 'text-amber-400',
    reported: 'text-sky-400', pending_renewal: 'text-sky-400', draft: 'text-sky-400',
    action_required: 'text-rose-400', expired: 'text-rose-400', out_of_service: 'text-rose-400',
  };
  return map[s] || 'text-zinc-400';
};

const statusBg = (s: string): string => {
  const map: Record<string, string> = {
    resolved: 'bg-emerald-500/10 border-emerald-500/20', closed: 'bg-emerald-500/10 border-emerald-500/20',
    valid: 'bg-emerald-500/10 border-emerald-500/20', operational: 'bg-emerald-500/10 border-emerald-500/20', active: 'bg-emerald-500/10 border-emerald-500/20',
    investigating: 'bg-amber-500/10 border-amber-500/20', expiring_soon: 'bg-amber-500/10 border-amber-500/20',
    needs_service: 'bg-amber-500/10 border-amber-500/20', under_review: 'bg-amber-500/10 border-amber-500/20',
    reported: 'bg-sky-500/10 border-sky-500/20', pending_renewal: 'bg-sky-500/10 border-sky-500/20', draft: 'bg-sky-500/10 border-sky-500/20',
    action_required: 'bg-rose-500/10 border-rose-500/20', expired: 'bg-rose-500/10 border-rose-500/20', out_of_service: 'bg-rose-500/10 border-rose-500/20',
  };
  return map[s] || 'bg-zinc-500/10 border-zinc-500/20';
};

const riskBadge = (r: RiskLevel): string => {
  const map: Record<string, string> = {
    extreme: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  return map[r] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const KpiCard = ({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) => (
  <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition group">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-xl border ${color.includes('emerald') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : color.includes('amber') ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : color.includes('rose') ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : color.includes('violet') ? 'bg-violet-500/10 border-violet-500/20 text-violet-400' : 'bg-sky-500/10 border-sky-500/20 text-sky-400'}`}>
        {icon}
      </div>
    </div>
    <div className={`text-2xl font-light tracking-tight ${color}`}>{value}</div>
    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">{label}</div>
    {sub && <div className="text-[10px] text-zinc-600 mt-1">{sub}</div>}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

type HSTab = 'compliance' | 'incidents' | 'haccp' | 'fire_safety' | 'training' | 'risk_assessment';

const HealthSafetyDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HSTab>('compliance');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { id: HSTab; label: string; icon: React.FC<{ size?: number }> }[] = [
    { id: 'compliance', label: 'Compliance', icon: Award },
    { id: 'incidents', label: 'Incidents', icon: AlertOctagon },
    { id: 'haccp', label: 'HACCP', icon: Thermometer },
    { id: 'fire_safety', label: 'Fire Safety', icon: Flame },
    { id: 'training', label: 'Training', icon: BookOpen },
    { id: 'risk_assessment', label: 'Risk Assessment', icon: ShieldAlert },
  ];

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const openIncidents = MOCK_INCIDENTS.filter(i => !['resolved', 'closed'].includes(i.status)).length;
  const validCerts = MOCK_CERTS.filter(c => c.status === 'valid').length;
  const expiringCerts = MOCK_CERTS.filter(c => c.status === 'expiring_soon' || c.status === 'expired').length;
  const haccpCompliance = useMemo(() => {
    const total = MOCK_HACCP.length;
    const compliant = MOCK_HACCP.filter(h => h.inCompliance).length;
    return total ? Math.round((compliant / total) * 100) : 100;
  }, []);
  const expiredTraining = MOCK_TRAINING.filter(t => t.status === 'expired').length;
  const highRisks = MOCK_RISK_ASSESSMENTS.filter(ra => ra.overallRisk === 'high' || ra.overallRisk === 'extreme').length;

  // ── Compliance Tab ───────────────────────────────────────────────────────
  const renderCompliance = () => (
    <div className="space-y-6">
      {/* Certificate Summary Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-light text-emerald-400">{validCerts}</div>
          <div className="text-[10px] text-emerald-500/60 uppercase font-bold tracking-widest mt-1">Valid</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-light text-amber-400">{MOCK_CERTS.filter(c => c.status === 'expiring_soon').length}</div>
          <div className="text-[10px] text-amber-500/60 uppercase font-bold tracking-widest mt-1">Expiring Soon</div>
        </div>
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-light text-rose-400">{MOCK_CERTS.filter(c => c.status === 'expired').length}</div>
          <div className="text-[10px] text-rose-500/60 uppercase font-bold tracking-widest mt-1">Expired</div>
        </div>
      </div>

      {/* Certificate List */}
      <div className="space-y-3">
        {MOCK_CERTS.map(cert => (
          <div key={cert.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <FileText size={14} className="text-violet-400 flex-shrink-0" />
                  <h4 className="text-sm font-medium text-zinc-100">{cert.name}</h4>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${statusBg(cert.status)} ${statusColor(cert.status)}`}>
                    {cert.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-500 mt-1">
                  <span>{cert.issuingAuthority}</span>
                  <span className="font-mono">{cert.certificateNumber}</span>
                  <span className="uppercase tracking-wider font-bold">{cert.category.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-600 mt-1">
                  <span className="flex items-center gap-1"><Calendar size={10} /> Issued: {cert.issueDate}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> Expires: {cert.expiryDate}</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {cert.responsiblePerson}</span>
                </div>
                {cert.notes && <p className="text-[10px] text-zinc-500 mt-2 italic">{cert.notes}</p>}
              </div>
              {cert.renewalCost && (
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-zinc-400">${cert.renewalCost.toLocaleString()}</div>
                  <div className="text-[9px] text-zinc-600">Renewal Cost</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Incidents Tab ────────────────────────────────────────────────────────
  const renderIncidents = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="text-zinc-500" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search incidents..." className="bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-600 w-full" />
        </div>
        <button className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-2">
          <Plus size={14} /> Report Incident
        </button>
      </div>

      <div className="space-y-3">
        {MOCK_INCIDENTS.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase())).map(inc => (
          <div key={inc.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Siren size={14} className={severityColor(inc.severity)} />
                  <h4 className="text-sm font-medium text-zinc-100">{inc.title}</h4>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${severityBg(inc.severity)} ${severityColor(inc.severity)}`}>{inc.severity.replace('_', ' ')}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${statusBg(inc.status)} ${statusColor(inc.status)}`}>{inc.status.replace('_', ' ')}</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">{inc.description}</p>

                {inc.injuredParty && (
                  <div className="mt-2 px-3 py-2 bg-zinc-950/40 border border-zinc-800/50 rounded-lg">
                    <div className="text-[10px] text-zinc-300 font-medium">Injured: {inc.injuredParty.name} ({inc.injuredParty.type})</div>
                    {inc.injuredParty.injuryDescription && <div className="text-[10px] text-zinc-500">{inc.injuredParty.injuryDescription}</div>}
                    {inc.injuredParty.treatmentGiven && <div className="text-[10px] text-zinc-500">Treatment: {inc.injuredParty.treatmentGiven}</div>}
                    {inc.injuredParty.hospitalised && <div className="text-[10px] text-rose-400 font-bold">HOSPITALISED</div>}
                  </div>
                )}

                <div className="flex items-center gap-4 text-[10px] text-zinc-600 mt-2">
                  <span className="flex items-center gap-1"><MapPin size={10} /> {inc.location}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(inc.reportedAt).toLocaleDateString()}</span>
                  <span>Reported by: {inc.reportedBy}</span>
                  {inc.reportableToAuthority && <span className="text-rose-400 font-bold flex items-center gap-1"><Bell size={10} /> REPORTABLE</span>}
                </div>

                {inc.immediateAction && (
                  <div className="text-[10px] text-zinc-500 mt-2">
                    <span className="font-bold text-zinc-400">Immediate Action: </span>{inc.immediateAction}
                  </div>
                )}
                {inc.rootCause && (
                  <div className="text-[10px] text-zinc-500 mt-1">
                    <span className="font-bold text-zinc-400">Root Cause: </span>{inc.rootCause}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── HACCP Tab ────────────────────────────────────────────────────────────
  const renderHACCP = () => {
    const nonCompliant = MOCK_HACCP.filter(h => !h.inCompliance);
    return (
      <div className="space-y-6">
        {/* Compliance Banner */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between ${haccpCompliance === 100 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
          <div className="flex items-center gap-3">
            <Thermometer size={20} className={haccpCompliance === 100 ? 'text-emerald-400' : 'text-amber-400'} />
            <div>
              <div className={`text-sm font-medium ${haccpCompliance === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                HACCP Compliance: {haccpCompliance}%
              </div>
              <div className="text-[10px] text-zinc-500">{MOCK_HACCP.length} checks logged today</div>
            </div>
          </div>
          {nonCompliant.length > 0 && (
            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-bold text-rose-400">
              {nonCompliant.length} Non-Compliant
            </span>
          )}
        </div>

        {/* HACCP Log */}
        <div className="space-y-2">
          {MOCK_HACCP.map(log => (
            <div key={log.id} className={`bg-zinc-900/40 border rounded-2xl p-4 transition ${log.inCompliance ? 'border-zinc-800 hover:border-zinc-700' : 'border-rose-500/20 hover:border-rose-500/30'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {log.inCompliance ? <CheckCircle2 size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-rose-400" />}
                    <span className="text-xs font-medium text-zinc-200 uppercase">{log.checkType.replace('_', ' ')}</span>
                    <span className="text-[10px] text-zinc-500">{log.location}</span>
                    <span className="text-[10px] text-zinc-600">{log.outlet}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-zinc-500 mt-1">
                    <span className="flex items-center gap-1"><Users size={10} /> {log.checkedBy}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(log.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {log.temperatureReading !== undefined && (
                      <span className={`font-mono font-bold ${log.inCompliance ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {log.temperatureReading}{log.temperatureUnit === 'C' ? '\u00B0C' : '\u00B0F'}
                        {log.minThreshold !== undefined && <span className="text-zinc-600 font-normal"> (range: {log.minThreshold}-{log.maxThreshold}{log.temperatureUnit === 'C' ? '\u00B0C' : '\u00B0F'})</span>}
                      </span>
                    )}
                  </div>
                  {log.notes && <div className="text-[10px] text-zinc-500 mt-1 italic">{log.notes}</div>}
                  {log.correctiveAction && (
                    <div className="text-[10px] text-amber-400 mt-1"><span className="font-bold">Corrective: </span>{log.correctiveAction}</div>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase border ${log.inCompliance ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                  {log.inCompliance ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Fire Safety Tab ──────────────────────────────────────────────────────
  const renderFireSafety = () => {
    const operational = MOCK_FIRE_EQUIPMENT.filter(e => e.status === 'operational').length;
    const needsService = MOCK_FIRE_EQUIPMENT.filter(e => e.status === 'needs_service').length;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-light text-emerald-400">{operational}</div>
            <div className="text-[10px] text-emerald-500/60 uppercase font-bold tracking-widest mt-1">Operational</div>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-light text-amber-400">{needsService}</div>
            <div className="text-[10px] text-amber-500/60 uppercase font-bold tracking-widest mt-1">Needs Service</div>
          </div>
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 text-center">
            <div className="text-2xl font-light text-zinc-300">{MOCK_FIRE_EQUIPMENT.length}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Total Equipment</div>
          </div>
        </div>

        <div className="space-y-2">
          {MOCK_FIRE_EQUIPMENT.map(eq => (
            <div key={eq.id} className={`bg-zinc-900/40 border rounded-2xl p-4 transition hover:border-zinc-700 ${eq.status === 'needs_service' ? 'border-amber-500/20' : eq.status === 'out_of_service' ? 'border-rose-500/20' : 'border-zinc-800'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <Flame size={14} className={eq.status === 'operational' ? 'text-emerald-400' : eq.status === 'needs_service' ? 'text-amber-400' : 'text-rose-400'} />
                    <span className="text-xs font-medium text-zinc-200 uppercase">{eq.type.replace('_', ' ')}</span>
                    {eq.serialNumber && <span className="text-[10px] text-zinc-600 font-mono">{eq.serialNumber}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-zinc-500 mt-1">
                    <span className="flex items-center gap-1"><MapPin size={10} /> {eq.location}</span>
                    <span>Floor: {eq.floor} / Zone: {eq.zone}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> Next: {eq.nextInspection}</span>
                  </div>
                  {eq.notes && <div className="text-[10px] text-amber-400/70 mt-1 italic">{eq.notes}</div>}
                </div>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase border ${statusBg(eq.status)} ${statusColor(eq.status)}`}>
                  {eq.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Training Tab ─────────────────────────────────────────────────────────
  const renderTraining = () => {
    const validCount = MOCK_TRAINING.filter(t => t.status === 'valid').length;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-light text-emerald-400">{validCount}</div>
            <div className="text-[10px] text-emerald-500/60 uppercase font-bold tracking-widest mt-1">Valid</div>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-light text-amber-400">{MOCK_TRAINING.filter(t => t.status === 'expiring_soon').length}</div>
            <div className="text-[10px] text-amber-500/60 uppercase font-bold tracking-widest mt-1">Expiring Soon</div>
          </div>
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-light text-rose-400">{expiredTraining}</div>
            <div className="text-[10px] text-rose-500/60 uppercase font-bold tracking-widest mt-1">Expired</div>
          </div>
        </div>

        <div className="space-y-2">
          {MOCK_TRAINING.map(tr => (
            <div key={tr.id} className={`bg-zinc-900/40 border rounded-2xl p-4 transition hover:border-zinc-700 ${tr.status === 'expired' ? 'border-rose-500/20' : tr.status === 'expiring_soon' ? 'border-amber-500/20' : 'border-zinc-800'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <HardHat size={14} className="text-violet-400" />
                    <span className="text-xs font-medium text-zinc-200">{tr.courseName}</span>
                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] font-bold text-zinc-400 uppercase">{tr.courseType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-zinc-500 mt-1">
                    <span className="flex items-center gap-1"><Users size={10} /> {tr.employeeName}</span>
                    <span>{tr.department}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> Completed: {tr.completedDate}</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> Expires: {tr.expiryDate}</span>
                    {tr.score !== undefined && <span>Score: {tr.score}%</span>}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase border ${statusBg(tr.status)} ${statusColor(tr.status)}`}>
                  {tr.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Risk Assessment Tab ──────────────────────────────────────────────────
  const renderRiskAssessment = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Risk Assessment Register</h3>
        <button className="px-4 py-2 bg-violet-600/80 hover:bg-violet-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-2">
          <Plus size={14} /> New Assessment
        </button>
      </div>

      {MOCK_RISK_ASSESSMENTS.map(ra => (
        <div key={ra.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* RA Header */}
          <div className="p-5 border-b border-zinc-800/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <ShieldAlert size={16} className="text-violet-400" />
                  <h4 className="text-sm font-medium text-zinc-100">{ra.title}</h4>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${riskBadge(ra.overallRisk)}`}>
                    {ra.overallRisk} risk
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${statusBg(ra.status)} ${statusColor(ra.status)}`}>
                    {ra.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-500 mt-1">
                  <span>{ra.area}</span>
                  <span>{ra.department}</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {ra.assessedBy}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} /> Review: {ra.reviewDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Hazards */}
          <div className="p-5 space-y-3">
            {ra.hazards.map(hazard => (
              <div key={hazard.id} className="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-200">{hazard.description}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${riskBadge(hazard.riskLevel)}`}>{hazard.riskLevel}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">L{hazard.likelihood} x I{hazard.impact} = {hazard.riskScore}</span>
                    <ChevronRight size={12} className="text-zinc-600" />
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${riskBadge(hazard.residualRisk)}`}>{hazard.residualRisk}</span>
                  </div>
                </div>
                <div className="flex gap-6 mt-2">
                  <div className="flex-1">
                    <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Existing Controls</div>
                    {hazard.existingControls.map((c, i) => (
                      <div key={i} className="text-[10px] text-zinc-400 flex items-center gap-1">
                        <CheckCircle2 size={9} className="text-emerald-500/50" /> {c}
                      </div>
                    ))}
                  </div>
                  {hazard.additionalControls.length > 0 && (
                    <div className="flex-1">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Additional Controls</div>
                      {hazard.additionalControls.map((c, i) => (
                        <div key={i} className="text-[10px] text-amber-400/70 flex items-center gap-1">
                          <Plus size={9} /> {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[10px] text-zinc-600 mt-2 pt-2 border-t border-zinc-800/30">
                  <span>Responsible: {hazard.responsiblePerson}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> Target: {hazard.targetDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Tab Content Router ───────────────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case 'compliance': return renderCompliance();
      case 'incidents': return renderIncidents();
      case 'haccp': return renderHACCP();
      case 'fire_safety': return renderFireSafety();
      case 'training': return renderTraining();
      case 'risk_assessment': return renderRiskAssessment();
      default: return renderCompliance();
    }
  };

  // ── Main Render ──────────────────────────────────────────────────────────
  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header glass-panel border border-orange-500/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-600/10 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-light text-white tracking-tight">Health & Safety</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Compliance & Protection</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab.id
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
          {openIncidents > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[10px] font-bold text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              {openIncidents} OPEN
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-[10px] font-bold text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ALL CLEAR
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <main className="module-body grid grid-cols-12 gap-8">
        {/* Left Main Content */}
        <div className="col-span-8 space-y-6 overflow-y-auto custom-scrollbar pr-4">
          {renderTabContent()}
        </div>

        {/* Right Sidebar - KPIs & Summary */}
        <div className="col-span-4 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <KpiCard icon={<AlertOctagon size={18} />} label="Open Incidents" value={`${openIncidents}`} sub="Requires attention" color={openIncidents > 0 ? 'text-rose-400' : 'text-emerald-400'} />
            <KpiCard icon={<Award size={18} />} label="Certificates Valid" value={`${validCerts}/${MOCK_CERTS.length}`} sub={expiringCerts > 0 ? `${expiringCerts} need renewal` : 'All current'} color={expiringCerts > 0 ? 'text-amber-400' : 'text-emerald-400'} />
            <KpiCard icon={<Thermometer size={18} />} label="HACCP Compliance" value={`${haccpCompliance}%`} sub="Today's checks" color={haccpCompliance === 100 ? 'text-emerald-400' : 'text-amber-400'} />
            <KpiCard icon={<HardHat size={18} />} label="Training Expired" value={`${expiredTraining}`} sub="Needs renewal" color={expiredTraining > 0 ? 'text-rose-400' : 'text-emerald-400'} />
          </div>

          {/* Recent Incident Activity */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={12} className="text-orange-400" /> Incident Timeline
            </h3>
            <div className="space-y-3">
              {MOCK_INCIDENTS.slice(0, 4).map(inc => (
                <div key={inc.id} className="text-[10px] text-zinc-400 flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${inc.status === 'resolved' || inc.status === 'closed' ? 'bg-emerald-500' : inc.status === 'action_required' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <div>
                    <span className="text-zinc-300 font-medium">{inc.title}</span>
                    <div className="text-zinc-600">{new Date(inc.reportedAt).toLocaleDateString()} - {inc.status.replace('_', ' ')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Metrics */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BarChart3 size={12} className="text-emerald-400" /> Safety Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Days Without Lost Time</span>
                <span className="text-emerald-400 font-medium">127</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">YTD Incidents</span>
                <span className="text-zinc-200 font-medium">8</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Near-Miss Reports</span>
                <span className="text-zinc-200 font-medium">14</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Fire Drills This Quarter</span>
                <span className="text-emerald-400 font-medium">2 / 2</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">Risk Assessments Active</span>
                <span className="text-zinc-200 font-medium">{MOCK_RISK_ASSESSMENTS.filter(r => r.status === 'active').length}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-500">High-Risk Areas</span>
                <span className={`font-medium ${highRisks > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{highRisks}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HealthSafetyDashboard;
