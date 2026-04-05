
import React, { useState, useEffect, useMemo } from 'react';
import {
  Eye, Shield, Camera, Lock, AlertTriangle, Search, FileText,
  BarChart2, Activity, MapPin, Clock, ChevronRight, TrendingUp,
  Loader2, Filter, Download, Radio, Zap, ShieldAlert, UserX,
  PlusCircle, AlertOctagon, Package, Clipboard, CheckCircle,
  XCircle, MonitorPlay, DoorOpen, ScanLine, ArrowUpRight
} from 'lucide-react';
import type {
  SecurityIncident, Investigation, CCTVCamera, AccessLog,
  AssetRecord, DailyLPReport, IncidentSeverity, IncidentCategory,
  IncidentStatus, CameraStatus, AccessEventType, AssetAlertType
} from '../../../types/lossprevention';

// ============================================================================
// Loss Prevention Dashboard - Hotel Singularity OS
// Security Intelligence & Asset Protection Center
// ============================================================================

type Tab = 'Incidents' | 'Investigations' | 'CCTV' | 'Access' | 'Assets' | 'DailyReport';

// ── Mock Data Generators ────────────────────────────────────────────────────

const LOCATIONS = ['Lobby', 'Pool Deck', 'Parking Garage B1', 'Executive Floor 12', 'Back of House Corridor', 'Loading Dock', 'Guest Room 405', 'Restaurant Terrace', 'Spa Reception', 'Conference Hall A', 'Cash Office', 'Server Room'];
const FLOORS = ['B1', 'G', '1', '2', '3', '5', '8', '12', '15', 'Roof'];
const INVESTIGATORS = ['Chief Lopez', 'Officer Nakamura', 'Agent Rivera', 'Sgt. Williams', 'Officer Patel', 'Agent Fernandez'];

const generateIncidents = (): SecurityIncident[] => {
  const categories: IncidentCategory[] = ['Theft', 'Fraud', 'Vandalism', 'Trespassing', 'Safety Hazard', 'Employee Misconduct', 'Guest Dispute', 'Property Damage', 'Suspicious Activity', 'Access Violation'];
  const severities: IncidentSeverity[] = ['Low', 'Medium', 'High', 'Critical'];
  const statuses: IncidentStatus[] = ['Open', 'Under Investigation', 'Resolved', 'Escalated', 'Closed'];
  return Array.from({ length: 14 }, (_, i) => ({
    id: `INC-${String(i + 1).padStart(4, '0')}`,
    referenceNumber: `LP-2025-${String(i + 1001).padStart(5, '0')}`,
    title: [
      'Missing Guest Laptop from Room 405', 'Fraudulent Credit Card at Front Desk',
      'Graffiti Damage in Parking B1', 'Unauthorized Person in Staff Area',
      'Wet Floor Slip Hazard - Lobby', 'Unauthorized Overtime Logging',
      'Noise Complaint Escalation Suite 1202', 'Broken Window - Conference Hall',
      'Suspicious Package at Loading Dock', 'Tailgating at Server Room',
      'Minibar Inventory Shortage Floor 8', 'Counterfeit Bill at Restaurant',
      'Fire Door Propped Open - Kitchen', 'Guest Room Safe Tampering'
    ][i],
    description: `Incident reported and logged for investigation.`,
    category: categories[i % categories.length],
    severity: severities[i % severities.length],
    status: statuses[i % statuses.length],
    location: LOCATIONS[i % LOCATIONS.length],
    floor: FLOORS[i % FLOORS.length],
    reportedBy: ['Front Desk Agent', 'Security Officer', 'Housekeeping', 'Guest', 'Engineering', 'Management'][i % 6],
    reportedAt: Date.now() - (i * 2 + 1) * 86400000,
    assignedTo: `SEC-${String((i % 6) + 1).padStart(3, '0')}`,
    assignedToName: INVESTIGATORS[i % INVESTIGATORS.length],
    estimatedLoss: [2500, 1800, 500, 0, 0, 0, 0, 1200, 0, 0, 350, 100, 0, 800][i],
    actualLoss: [2500, 1800, 500, 0, 0, 0, 0, 1200, 0, 0, 200, 100, 0, 0][i],
    witnesses: i % 3 === 0 ? ['Guest A', 'Staff B'] : [],
    evidenceIds: [`EVD-${i + 1}`],
    relatedIncidentIds: [],
    resolution: i % 5 === 2 ? 'Item recovered. Guest compensated.' : '',
    resolvedAt: i % 5 === 2 ? Date.now() - i * 86400000 : null,
    createdAt: Date.now() - (i * 2 + 1) * 86400000,
    updatedAt: Date.now() - i * 86400000,
  }));
};

const generateInvestigations = (): Investigation[] =>
  Array.from({ length: 6 }, (_, i) => ({
    id: `INV-${String(i + 1).padStart(3, '0')}`,
    caseNumber: `CASE-2025-${String(i + 50).padStart(4, '0')}`,
    incidentId: `INC-${String(i + 1).padStart(4, '0')}`,
    title: [
      'Guest Property Theft Ring Investigation',
      'Credit Card Fraud Pattern Analysis',
      'Recurring Vandalism - Parking Level',
      'Employee Misconduct - Overtime Fraud',
      'Guest Safe Tampering Series',
      'Inventory Shrinkage - F&B Department',
    ][i],
    description: `Active investigation into reported pattern of incidents.`,
    status: (['Initiated', 'Evidence Collection', 'Interviews', 'Analysis', 'Report Pending', 'Closed'] as const)[i],
    priority: (['Urgent', 'Elevated', 'Routine', 'Emergency', 'Elevated', 'Routine'] as const)[i],
    leadInvestigator: `SEC-${String(i + 1).padStart(3, '0')}`,
    leadInvestigatorName: INVESTIGATORS[i],
    teamMembers: [INVESTIGATORS[(i + 1) % 6], INVESTIGATORS[(i + 2) % 6]],
    startedAt: Date.now() - (i + 5) * 86400000,
    targetCloseDate: Date.now() + (14 - i * 2) * 86400000,
    closedAt: i === 5 ? Date.now() - 2 * 86400000 : null,
    findings: i === 5 ? 'Shrinkage attributed to improper portioning. Staff retrained.' : '',
    recommendations: i === 5 ? 'Implement portion control audits twice weekly.' : '',
    evidenceCollected: [
      { id: `EVD-${i}-1`, type: 'CCTV Footage', description: 'Camera footage of incident area', collectedBy: INVESTIGATORS[i], collectedAt: Date.now() - (i + 3) * 86400000, storageLocation: 'Evidence Locker A', chainOfCustody: [INVESTIGATORS[i]] },
    ],
    interviewsConducted: i >= 2 ? [
      { id: `INT-${i}-1`, intervieweeId: 'EMP-200', intervieweeName: 'Staff Witness', interviewerName: INVESTIGATORS[i], conductedAt: Date.now() - (i + 1) * 86400000, summary: 'Witness confirmed timeline of events.', isWitness: true },
    ] : [],
    totalLossAmount: [2500, 1800, 500, 0, 800, 350][i],
    recoveredAmount: [2500, 0, 0, 0, 0, 350][i],
  }));

const generateCameras = (): CCTVCamera[] => {
  const cameraTypes: CCTVCamera['type'][] = ['PTZ', 'Fixed', 'Dome', 'Bullet', 'Thermal'];
  const cameraStatuses: CameraStatus[] = ['Online', 'Online', 'Online', 'Recording', 'Motion Detected', 'Online', 'Offline', 'Online', 'Maintenance', 'Online', 'Online', 'Recording'];
  const zones = ['Public', 'Staff Only', 'Restricted', 'Public', 'Executive', 'Staff Only', 'Public', 'Public', 'Restricted', 'Staff Only', 'Restricted', 'Public'];
  return Array.from({ length: 12 }, (_, i) => ({
    id: `CAM-${String(i + 1).padStart(3, '0')}`,
    cameraId: `CCTV-${String(i + 101).padStart(4, '0')}`,
    name: [
      'Lobby Main Entrance', 'Pool Deck West', 'Parking B1 Entry', 'Executive Elevator',
      'Back of House East', 'Loading Dock Gate', 'Guest Corridor 4F', 'Restaurant Entrance',
      'Spa Hallway', 'Conference Pre-function', 'Cash Office', 'Rooftop Access'
    ][i],
    location: LOCATIONS[i],
    floor: FLOORS[i],
    zone: zones[i],
    type: cameraTypes[i % cameraTypes.length],
    status: cameraStatuses[i],
    resolution: ['4K', '1080p', '4K', '1080p', '720p', '4K', '1080p', '4K', '1080p', '4K', '4K', '1080p'][i],
    isRecording: cameraStatuses[i] !== 'Offline' && cameraStatuses[i] !== 'Maintenance',
    lastMotionDetected: cameraStatuses[i] === 'Motion Detected' ? Date.now() - Math.floor(Math.random() * 300000) : Date.now() - Math.floor(Math.random() * 3600000),
    storageRetentionDays: 30,
    ipAddress: `10.0.${Math.floor(i / 4) + 1}.${100 + i}`,
    installedAt: Date.now() - 365 * 86400000,
    lastMaintenanceAt: Date.now() - (30 + i * 5) * 86400000,
  }));
};

const generateAccessLogs = (): AccessLog[] => {
  const eventTypes: AccessEventType[] = ['Entry', 'Exit', 'Entry', 'Exit', 'Denied', 'Entry', 'Tailgating', 'Entry', 'Exit', 'Forced Entry', 'Entry', 'Propped Open'];
  const personTypes: AccessLog['personType'][] = ['Employee', 'Employee', 'Guest', 'Employee', 'Visitor', 'Employee', 'Employee', 'Contractor', 'Guest', 'Employee', 'Employee', 'Employee'];
  const accessZones: AccessLog['zone'][] = ['Staff Only', 'Public', 'Public', 'Restricted', 'Executive', 'Cash Office', 'Server Room', 'Loading Dock', 'Public', 'Restricted', 'Staff Only', 'Staff Only'];
  const names = ['Maria Santos', 'Guest 4051', 'James Chen', 'Unknown', 'Visitor V-102', 'Roberto Silva', 'Unknown Badge', 'Contractor C-45', 'Guest 1202', 'David Park', 'Kim Nguyen', 'Night Shift Staff'];
  return Array.from({ length: 12 }, (_, i) => ({
    id: `ACC-${String(i + 1).padStart(4, '0')}`,
    timestamp: Date.now() - i * 1800000,
    eventType: eventTypes[i],
    personId: `PER-${i + 100}`,
    personName: names[i],
    personType: personTypes[i],
    accessPoint: LOCATIONS[i],
    zone: accessZones[i],
    floor: FLOORS[i],
    cardNumber: `CARD-${String(i + 5000).padStart(6, '0')}`,
    granted: eventTypes[i] !== 'Denied' && eventTypes[i] !== 'Forced Entry',
    reason: eventTypes[i] === 'Denied' ? 'Insufficient clearance' : eventTypes[i] === 'Forced Entry' ? 'Door forced without credential' : '',
    flagged: ['Denied', 'Tailgating', 'Forced Entry', 'Propped Open'].includes(eventTypes[i]),
  }));
};

const generateAssets = (): AssetRecord[] => {
  const categories: AssetRecord['category'][] = ['Electronics', 'Furniture', 'Linen', 'Minibar', 'Silverware', 'Art', 'Equipment', 'Cash'];
  const assetStatuses: AssetRecord['status'][] = ['In Place', 'In Place', 'Missing', 'In Place', 'Damaged', 'In Place', 'Under Review', 'In Place'];
  const alertTypes: (AssetAlertType | null)[] = [null, null, 'Missing', null, 'Damaged', null, 'Discrepancy', null];
  return Array.from({ length: 10 }, (_, i) => ({
    id: `AST-${String(i + 1).padStart(4, '0')}`,
    assetTag: `SNG-AST-${String(i + 10000).padStart(6, '0')}`,
    name: [
      'Samsung 65" TV - Lobby', 'Executive Desk - Suite 1201', 'Egyptian Cotton Set (King)',
      'Minibar Unit - Floor 8', 'Silver Service Set (12pc)', 'Original Painting - Corridor 3F',
      'Commercial Espresso Machine', 'Petty Cash Float - Reception', 'iPad Check-in Kiosk #2',
      'Banquet Chair Set (50pc)'
    ][i],
    category: categories[i % categories.length],
    location: LOCATIONS[i % LOCATIONS.length],
    floor: FLOORS[i % FLOORS.length],
    value: [3200, 8500, 450, 1200, 6800, 15000, 4500, 500, 1100, 7500][i],
    lastAuditDate: Date.now() - (i * 15 + 5) * 86400000,
    lastAuditedBy: INVESTIGATORS[i % INVESTIGATORS.length],
    alertType: alertTypes[i % alertTypes.length],
    alertNote: alertTypes[i % alertTypes.length] === 'Missing' ? 'Not found during scheduled audit' : alertTypes[i % alertTypes.length] === 'Damaged' ? 'Visible wear, needs replacement' : '',
    status: assetStatuses[i % assetStatuses.length],
    purchaseDate: Date.now() - (365 + i * 60) * 86400000,
    department: ['Front Office', 'Executive', 'Housekeeping', 'F&B Service', 'F&B Service', 'General', 'F&B Service', 'Finance', 'Front Office', 'Events'][i],
  }));
};

// ── Helper Components ───────────────────────────────────────────────────────

const severityBadge = (severity: IncidentSeverity) => {
  const map: Record<IncidentSeverity, string> = {
    'Low': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Medium': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'High': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'Critical': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  return map[severity];
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    'Open': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Under Investigation': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    'Resolved': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Escalated': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    'Closed': 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
    'Initiated': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Evidence Collection': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Interviews': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    'Analysis': 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    'Report Pending': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'Online': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Offline': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    'Maintenance': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Recording': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Motion Detected': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    'In Place': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Missing': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    'Damaged': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'Under Review': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    'Written Off': 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  };
  return map[status] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
};

const cameraStatusDot = (status: CameraStatus) => {
  const map: Record<CameraStatus, string> = {
    'Online': 'bg-emerald-500',
    'Offline': 'bg-rose-500',
    'Maintenance': 'bg-amber-500',
    'Recording': 'bg-blue-500 animate-pulse',
    'Motion Detected': 'bg-violet-500 animate-pulse',
  };
  return map[status] || 'bg-zinc-500';
};

const KPICard = ({ label, value, icon, color, bg }: { label: string; value: string | number; icon: React.ReactNode; color: string; bg: string }) => (
  <div className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
    <div className={`p-2 rounded-lg bg-zinc-900/50 ${color}`}>{icon}</div>
    <div>
      <div className={`text-xl font-light ${color}`}>{value}</div>
      <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider leading-tight">{label}</div>
    </div>
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

const LossPreventionDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('Incidents');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('All');

  const incidents = useMemo(() => generateIncidents(), []);
  const investigations = useMemo(() => generateInvestigations(), []);
  const cameras = useMemo(() => generateCameras(), []);
  const accessLogs = useMemo(() => generateAccessLogs(), []);
  const assets = useMemo(() => generateAssets(), []);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // ── KPI Calculations ───────────────────────────────────────────────────
  const openIncidents = incidents.filter(i => i.status === 'Open' || i.status === 'Escalated').length;
  const activeInvestigations = investigations.filter(i => i.status !== 'Closed').length;
  const camerasOnline = cameras.filter(c => c.status !== 'Offline' && c.status !== 'Maintenance').length;
  const flaggedAccess = accessLogs.filter(a => a.flagged).length;
  const totalEstimatedLoss = incidents.reduce((s, i) => s + i.estimatedLoss, 0);
  const assetAlerts = assets.filter(a => a.alertType !== null).length;

  // ── Tabs Config ────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'Incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'Investigations', label: 'Cases', icon: Search },
    { id: 'CCTV', label: 'CCTV', icon: Camera },
    { id: 'Access', label: 'Access', icon: DoorOpen },
    { id: 'Assets', label: 'Assets', icon: Package },
    { id: 'DailyReport', label: 'Daily Report', icon: Clipboard },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <span className="ml-3 text-zinc-400">Loading Loss Prevention...</span>
      </div>
    );
  }

  // ── Tab Renderers ─────────────────────────────────────────────────────

  const renderIncidents = () => {
    const severities = ['All', 'Critical', 'High', 'Medium', 'Low'];
    const filtered = incidents.filter(inc =>
      (severityFilter === 'All' || inc.severity === severityFilter) &&
      (inc.title.toLowerCase().includes(searchQuery.toLowerCase()) || inc.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 border border-zinc-800 rounded-xl flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-zinc-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search incidents..." className="bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-600 w-full" />
          </div>
          <div className="flex gap-1.5">
            {severities.map(sev => (
              <button key={sev} onClick={() => setSeverityFilter(sev)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${severityFilter === sev ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}>
                {sev}
              </button>
            ))}
          </div>
          <button className="px-3 py-1.5 bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition flex items-center gap-1.5">
            <PlusCircle size={12} /> Log Incident
          </button>
        </div>

        <div className="space-y-3">
          {filtered.map(inc => {
            const dateStr = new Date(inc.reportedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return (
              <div key={inc.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-zinc-500">{inc.referenceNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${severityBadge(inc.severity)}`}>{inc.severity}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${statusBadge(inc.status)}`}>{inc.status}</span>
                    </div>
                    <h4 className="text-sm font-medium text-zinc-100">{inc.title}</h4>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-zinc-500 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {inc.location} (Floor {inc.floor})</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {dateStr}</span>
                      <span>Reported by: {inc.reportedBy}</span>
                      <span>Assigned: {inc.assignedToName}</span>
                    </div>
                  </div>
                  {inc.estimatedLoss > 0 && (
                    <div className="text-right ml-4">
                      <div className="text-sm font-medium text-rose-400">${inc.estimatedLoss.toLocaleString()}</div>
                      <div className="text-[9px] text-zinc-500 uppercase font-bold">Est. Loss</div>
                    </div>
                  )}
                </div>
                {inc.resolution && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/50">
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle size={10} /> {inc.resolution}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && <div className="text-center py-12 text-zinc-500 text-sm">No incidents match your criteria</div>}
      </div>
    );
  };

  const renderInvestigations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Active Investigations</h3>
        <span className="text-[10px] text-zinc-500">{investigations.length} Total Cases</span>
      </div>
      <div className="space-y-4">
        {investigations.map(inv => {
          const daysOpen = Math.floor((Date.now() - inv.startedAt) / 86400000);
          const recoveryRate = inv.totalLossAmount > 0 ? Math.round((inv.recoveredAmount / inv.totalLossAmount) * 100) : 0;
          const priorityColor: Record<string, string> = {
            'Emergency': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
            'Urgent': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
            'Elevated': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
            'Routine': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          };
          return (
            <div key={inv.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-zinc-500">{inv.caseNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${priorityColor[inv.priority]}`}>{inv.priority}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${statusBadge(inv.status)}`}>{inv.status}</span>
                  </div>
                  <h4 className="text-sm font-medium text-zinc-100">{inv.title}</h4>
                </div>
                <div className="text-right ml-4">
                  <div className="text-[10px] text-zinc-500">{daysOpen} days open</div>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-3">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">Lead</div>
                  <div className="text-xs text-zinc-200 mt-1">{inv.leadInvestigatorName}</div>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-3">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">Evidence</div>
                  <div className="text-xs text-zinc-200 mt-1">{inv.evidenceCollected.length} items</div>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-3">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">Interviews</div>
                  <div className="text-xs text-zinc-200 mt-1">{inv.interviewsConducted.length} conducted</div>
                </div>
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-3">
                  <div className="text-[9px] text-zinc-500 uppercase font-bold">Recovery</div>
                  <div className={`text-xs mt-1 ${recoveryRate === 100 ? 'text-emerald-400' : recoveryRate > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                    {inv.totalLossAmount > 0 ? `$${inv.recoveredAmount.toLocaleString()} (${recoveryRate}%)` : 'No loss'}
                  </div>
                </div>
              </div>
              {inv.findings && (
                <div className="mt-3 pt-3 border-t border-zinc-800/50 space-y-1">
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1"><CheckCircle size={10} /> Findings: {inv.findings}</div>
                  <div className="text-[10px] text-blue-400 flex items-center gap-1"><ArrowUpRight size={10} /> Recommendation: {inv.recommendations}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCCTV = () => {
    const onlineCount = cameras.filter(c => c.status !== 'Offline' && c.status !== 'Maintenance').length;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">CCTV Network Status</h3>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-emerald-400 font-bold">{onlineCount}/{cameras.length} Online</span>
            <button className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-zinc-700 hover:bg-zinc-700 transition flex items-center gap-1.5">
              <MonitorPlay size={12} /> Live View
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {cameras.map(cam => (
            <div key={cam.id} className={`bg-zinc-900/40 border rounded-2xl p-4 hover:border-zinc-700 transition ${cam.status === 'Offline' ? 'border-rose-500/20 opacity-75' : cam.status === 'Motion Detected' ? 'border-violet-500/20' : 'border-zinc-800'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${cameraStatusDot(cam.status)}`} />
                  <Camera className={`w-4 h-4 ${cam.status === 'Offline' ? 'text-rose-400' : 'text-zinc-400'}`} />
                  <h4 className="text-sm font-medium text-zinc-100">{cam.name}</h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${statusBadge(cam.status)}`}>{cam.status}</span>
              </div>
              <div className="space-y-1.5 text-[10px] text-zinc-500">
                <div className="flex justify-between"><span>Location</span><span className="text-zinc-300">{cam.location}</span></div>
                <div className="flex justify-between"><span>Floor / Zone</span><span className="text-zinc-300">{cam.floor} / {cam.zone}</span></div>
                <div className="flex justify-between"><span>Type / Resolution</span><span className="text-zinc-300">{cam.type} / {cam.resolution}</span></div>
                <div className="flex justify-between"><span>IP</span><span className="font-mono text-zinc-400">{cam.ipAddress}</span></div>
                {cam.lastMotionDetected && (
                  <div className="flex justify-between"><span>Last Motion</span><span className="text-zinc-400">{new Date(cam.lastMotionDetected).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span></div>
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-zinc-800/50 flex items-center justify-between">
                <span className={`text-[9px] uppercase font-bold tracking-wider ${cam.isRecording ? 'text-rose-400 flex items-center gap-1' : 'text-zinc-600'}`}>
                  {cam.isRecording ? <><Radio size={8} className="animate-pulse" /> REC</> : 'NOT RECORDING'}
                </span>
                <span className="text-[9px] text-zinc-600">Retention: {cam.storageRetentionDays}d</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAccess = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Access Control Log</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-rose-400 font-bold">{flaggedAccess} Flagged Events</span>
          <button className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-zinc-700 hover:bg-zinc-700 transition flex items-center gap-1.5">
            <Download size={12} /> Export Log
          </button>
        </div>
      </div>
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Time</th>
              <th className="text-left px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Event</th>
              <th className="text-left px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Person</th>
              <th className="text-left px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Access Point</th>
              <th className="text-left px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Zone</th>
              <th className="text-center px-4 py-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody>
            {accessLogs.map(log => (
              <tr key={log.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/20 transition ${log.flagged ? 'bg-rose-500/5' : ''}`}>
                <td className="px-4 py-3 text-[11px] text-zinc-400 font-mono">{new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                    log.eventType === 'Entry' || log.eventType === 'Exit' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    log.eventType === 'Denied' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                    'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>{log.eventType}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-zinc-200">{log.personName}</div>
                  <div className="text-[10px] text-zinc-500">{log.personType}</div>
                </td>
                <td className="px-4 py-3 text-[11px] text-zinc-400">{log.accessPoint}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-bold uppercase ${
                    log.zone === 'Restricted' || log.zone === 'Server Room' || log.zone === 'Cash Office' ? 'text-rose-400' :
                    log.zone === 'Staff Only' ? 'text-amber-400' : 'text-zinc-400'
                  }`}>{log.zone}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {log.flagged ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-400"><AlertOctagon size={10} /> FLAGGED</span>
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-500/60 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Asset Protection Inventory</h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">Total Value: <strong className="text-zinc-300">${assets.reduce((s, a) => s + a.value, 0).toLocaleString()}</strong></span>
          <button className="px-3 py-1.5 bg-teal-500/10 text-teal-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-teal-500/20 hover:bg-teal-500/20 transition flex items-center gap-1.5">
            <ScanLine size={12} /> Start Audit
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {assets.map(asset => (
          <div key={asset.id} className={`bg-zinc-900/40 border rounded-2xl p-4 hover:border-zinc-700 transition ${asset.alertType ? 'border-amber-500/20' : 'border-zinc-800'}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-zinc-500">{asset.assetTag}</span>
                  {asset.alertType && (
                    <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase tracking-wider rounded border border-amber-500/20">{asset.alertType}</span>
                  )}
                </div>
                <h4 className="text-sm font-medium text-zinc-100">{asset.name}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${statusBadge(asset.status)}`}>{asset.status}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] text-zinc-500">
              <div><span className="block text-zinc-600">Category</span><span className="text-zinc-300">{asset.category}</span></div>
              <div><span className="block text-zinc-600">Location</span><span className="text-zinc-300">{asset.location}</span></div>
              <div><span className="block text-zinc-600">Value</span><span className="text-zinc-300">${asset.value.toLocaleString()}</span></div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/50 text-[10px] text-zinc-500">
              <span>Last Audit: {new Date(asset.lastAuditDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              <span>{asset.department}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDailyReport = () => {
    const report: DailyLPReport = {
      date: Date.now(),
      shiftsCompleted: 3,
      incidentsReported: incidents.filter(i => i.reportedAt > Date.now() - 86400000).length,
      investigationsActive: activeInvestigations,
      camerasOnline,
      camerasOffline: cameras.length - camerasOnline,
      accessDenials: accessLogs.filter(a => a.eventType === 'Denied').length,
      flaggedEvents: flaggedAccess,
      assetAlertsOpen: assetAlerts,
      estimatedLossToday: 350,
      recoveredToday: 200,
      patrolsCompleted: 8,
      notes: 'All security zones patrolled per schedule. One guest reported missing item from pool area -- investigation initiated. CCTV in parking B1 scheduled for maintenance at 0600 tomorrow.',
    };

    const reportItems = [
      { label: 'Shifts Completed', value: report.shiftsCompleted, icon: <Activity className="w-4 h-4" />, color: 'text-blue-400' },
      { label: 'Patrols Completed', value: report.patrolsCompleted, icon: <MapPin className="w-4 h-4" />, color: 'text-teal-400' },
      { label: 'Incidents Today', value: report.incidentsReported, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-400' },
      { label: 'Active Cases', value: report.investigationsActive, icon: <Search className="w-4 h-4" />, color: 'text-violet-400' },
      { label: 'Cameras Online', value: `${report.camerasOnline}/${report.camerasOnline + report.camerasOffline}`, icon: <Camera className="w-4 h-4" />, color: 'text-emerald-400' },
      { label: 'Access Denials', value: report.accessDenials, icon: <XCircle className="w-4 h-4" />, color: 'text-rose-400' },
      { label: 'Flagged Events', value: report.flaggedEvents, icon: <AlertOctagon className="w-4 h-4" />, color: 'text-orange-400' },
      { label: 'Asset Alerts', value: report.assetAlertsOpen, icon: <Package className="w-4 h-4" />, color: 'text-amber-400' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Daily Loss Prevention Report</h3>
            <p className="text-[10px] text-zinc-500 mt-1">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <button className="px-3 py-1.5 bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-zinc-700 hover:bg-zinc-700 transition flex items-center gap-1.5">
            <Download size={12} /> Export PDF
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {reportItems.map(item => (
            <div key={item.label} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-zinc-950/60 ${item.color}`}>{item.icon}</div>
              <div>
                <div className={`text-xl font-light ${item.color}`}>{item.value}</div>
                <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">{item.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <h4 className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-3">Loss Summary (24h)</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Estimated Loss</span>
                <span className="text-lg font-light text-rose-400">${report.estimatedLossToday.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Recovered</span>
                <span className="text-lg font-light text-emerald-400">${report.recoveredToday.toLocaleString()}</span>
              </div>
              <div className="h-px bg-zinc-800" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-300 font-medium">Net Loss</span>
                <span className="text-lg font-light text-amber-400">${(report.estimatedLossToday - report.recoveredToday).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
            <h4 className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-3">Cumulative Loss (MTD)</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Total Estimated</span>
                <span className="text-lg font-light text-rose-400">${totalEstimatedLoss.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Total Recovered</span>
                <span className="text-lg font-light text-emerald-400">${incidents.reduce((s, i) => s + (i.actualLoss < i.estimatedLoss ? i.estimatedLoss - i.actualLoss : 0), 0).toLocaleString()}</span>
              </div>
              <div className="h-px bg-zinc-800" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-300 font-medium">Recovery Rate</span>
                <span className="text-lg font-light text-teal-400">{totalEstimatedLoss > 0 ? Math.round((incidents.reduce((s, i) => s + i.actualLoss, 0) / totalEstimatedLoss) * 100) : 0}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Shift Notes */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5">
          <h4 className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-3">Shift Notes</h4>
          <p className="text-sm text-zinc-300 leading-relaxed">{report.notes}</p>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Incidents': return renderIncidents();
      case 'Investigations': return renderInvestigations();
      case 'CCTV': return renderCCTV();
      case 'Access': return renderAccess();
      case 'Assets': return renderAssets();
      case 'DailyReport': return renderDailyReport();
      default: return null;
    }
  };

  return (
    <div className="module-container">
      {/* Header */}
      <div className="module-header glass-panel border border-rose-500/20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-rose-600/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-light text-white tracking-tight">Loss Prevention</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Asset Protection & Intelligence</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setSeverityFilter('All'); }}
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[10px] font-bold text-rose-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {openIncidents} OPEN INCIDENTS
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 px-1">
        <KPICard label="Open Incidents" value={openIncidents} icon={<AlertTriangle className="w-4 h-4" />} color="text-rose-400" bg="bg-rose-500/5 border-rose-500/20" />
        <KPICard label="Active Cases" value={activeInvestigations} icon={<Search className="w-4 h-4" />} color="text-violet-400" bg="bg-violet-500/5 border-violet-500/20" />
        <KPICard label="CCTV Online" value={`${camerasOnline}/${cameras.length}`} icon={<Camera className="w-4 h-4" />} color="text-emerald-400" bg="bg-emerald-500/5 border-emerald-500/20" />
        <KPICard label="Flagged Access" value={flaggedAccess} icon={<ShieldAlert className="w-4 h-4" />} color="text-amber-400" bg="bg-amber-500/5 border-amber-500/20" />
        <KPICard label="Est. Loss (MTD)" value={`$${(totalEstimatedLoss / 1000).toFixed(1)}k`} icon={<TrendingUp className="w-4 h-4" />} color="text-orange-400" bg="bg-orange-500/5 border-orange-500/20" />
        <KPICard label="Asset Alerts" value={assetAlerts} icon={<Package className="w-4 h-4" />} color="text-teal-400" bg="bg-teal-500/5 border-teal-500/20" />
      </div>

      {/* Tab Content */}
      <main className="module-body overflow-y-auto custom-scrollbar">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default LossPreventionDashboard;
