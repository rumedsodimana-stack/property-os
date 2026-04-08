/**
 * Sales & Marketing Dashboard
 * Pipeline management, corporate accounts, campaigns, revenue targets,
 * competitor analysis, collateral library, and reporting.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  TrendingUp, Plus, Search, Filter, Edit3, Trash2, Save, X,
  DollarSign, Users, Target, BarChart3, Globe, FileText, Upload,
  Download, Eye, Mail, Share2, Megaphone, Building2, Trophy,
  ArrowRight, ArrowUpRight, ArrowDownRight, ChevronRight, Grip,
  Star, Phone, Calendar, Clock, Tag, Briefcase, PieChart,
  Percent, ExternalLink, Image, Video, FileBarChart
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, FunnelChart, Funnel, LabelList,
  AreaChart, Area, Legend
} from 'recharts';
import type {
  SalesLead, CorporateAccount, MarketingCampaign, RevenueTarget,
  CompetitorProperty, MarketingCollateral,
  LeadStage, CampaignStatus, CampaignChannel, RevenueSegment, AccountTier
} from '../../../types/sales';

// ─── Tab Definition ──────────────────────────────────────────────────────────
type SalesTab = 'pipeline' | 'accounts' | 'campaigns' | 'revenue' | 'competitors' | 'collateral' | 'reports';

const TABS: { id: SalesTab; label: string; icon: React.ReactNode }[] = [
  { id: 'pipeline',    label: 'Pipeline',          icon: <Target size={15} /> },
  { id: 'accounts',    label: 'Accounts',          icon: <Building2 size={15} /> },
  { id: 'campaigns',   label: 'Campaigns',         icon: <Megaphone size={15} /> },
  { id: 'revenue',     label: 'Revenue Targets',   icon: <DollarSign size={15} /> },
  { id: 'competitors', label: 'Competitor Analysis',icon: <Trophy size={15} /> },
  { id: 'collateral',  label: 'Collateral',        icon: <FileText size={15} /> },
  { id: 'reports',     label: 'Reports',           icon: <BarChart3 size={15} /> },
];

// ─── Stage Config ────────────────────────────────────────────────────────────
const STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: 'lead',        label: 'Lead',         color: 'bg-zinc-500' },
  { id: 'qualified',   label: 'Qualified',    color: 'bg-blue-500' },
  { id: 'proposal',    label: 'Proposal',     color: 'bg-violet-500' },
  { id: 'negotiation', label: 'Negotiation',  color: 'bg-amber-500' },
  { id: 'won',         label: 'Won',          color: 'bg-emerald-500' },
  { id: 'lost',        label: 'Lost',         color: 'bg-rose-500' },
];

const KANBAN_STAGES = STAGES.filter(s => !['won', 'lost'].includes(s.id));

const SEGMENT_COLORS: Record<string, string> = {
  transient: '#8b5cf6', corporate: '#3b82f6', group: '#10b981',
  leisure: '#f59e0b', government: '#6366f1', wholesale: '#ec4899', ota: '#14b8a6',
};

// ─── Seed Data ───────────────────────────────────────────────────────────────
const SEED_LEADS: SalesLead[] = [
  { id: 'L001', companyName: 'Apex Technologies', contactName: 'Sarah Chen', contactEmail: 'schen@apex.com', contactPhone: '+1-555-0101', stage: 'negotiation', source: 'referral', estimatedValue: 84000, estimatedRoomNights: 420, probability: 75, assignedTo: 'Michael Ross', nextFollowUp: '2026-04-05', tags: ['enterprise', 'tech'], createdAt: '2026-02-15', updatedAt: '2026-03-28', notes: 'Annual conference — 3-night pattern, prefer executive floor.' },
  { id: 'L002', companyName: 'Meridian Consulting', contactName: 'James Walker', contactEmail: 'jwalker@meridian.com', stage: 'qualified', source: 'trade_show', estimatedValue: 36000, estimatedRoomNights: 180, probability: 50, assignedTo: 'Lisa Park', nextFollowUp: '2026-04-03', createdAt: '2026-03-01', updatedAt: '2026-03-25' },
  { id: 'L003', companyName: 'GlobalBank Inc.', contactName: 'David Liu', contactEmail: 'dliu@globalbank.com', contactPhone: '+1-555-0303', stage: 'proposal', source: 'cold_call', estimatedValue: 120000, estimatedRoomNights: 600, probability: 60, assignedTo: 'Michael Ross', nextFollowUp: '2026-04-07', tags: ['finance', 'enterprise'], createdAt: '2026-01-20', updatedAt: '2026-03-30' },
  { id: 'L004', companyName: 'Stellar Events Co.', contactName: 'Maria Santos', contactEmail: 'msantos@stellar.events', stage: 'lead', source: 'website', estimatedValue: 15000, estimatedRoomNights: 75, probability: 20, assignedTo: 'Lisa Park', createdAt: '2026-03-28', updatedAt: '2026-03-28' },
  { id: 'L005', companyName: 'Northern Airways', contactName: 'Erik Larsen', contactEmail: 'elarsen@northernair.com', stage: 'won', source: 'rfi', estimatedValue: 200000, estimatedRoomNights: 1000, probability: 100, assignedTo: 'Michael Ross', createdAt: '2025-11-01', updatedAt: '2026-03-15', closedAt: '2026-03-15' },
  { id: 'L006', companyName: 'PharmaCore Ltd.', contactName: 'Anna Reeves', contactEmail: 'areeves@pharmacore.com', stage: 'lost', source: 'referral', estimatedValue: 54000, estimatedRoomNights: 270, probability: 0, assignedTo: 'Lisa Park', createdAt: '2026-01-10', updatedAt: '2026-03-20', closedAt: '2026-03-20', lostReason: 'Chose competitor with better F&B package.' },
  { id: 'L007', companyName: 'Vertex Solutions', contactName: 'Tom Hayes', contactEmail: 'thayes@vertex.io', stage: 'lead', source: 'social_media', estimatedValue: 22000, estimatedRoomNights: 110, probability: 15, assignedTo: 'Michael Ross', createdAt: '2026-03-30', updatedAt: '2026-03-30' },
  { id: 'L008', companyName: 'Atlas Media Group', contactName: 'Rachel Kim', contactEmail: 'rkim@atlasmedia.com', stage: 'qualified', source: 'walk_in', estimatedValue: 48000, estimatedRoomNights: 240, probability: 40, assignedTo: 'Lisa Park', nextFollowUp: '2026-04-04', createdAt: '2026-03-10', updatedAt: '2026-03-27' },
];

const SEED_ACCOUNTS: CorporateAccount[] = [
  { id: 'A001', companyName: 'Northern Airways', tier: 'platinum', contactName: 'Erik Larsen', contactEmail: 'elarsen@northernair.com', contactPhone: '+1-555-0201', negotiatedRate: 189, rateCode: 'CORP-NA', contractStart: '2026-01-01', contractEnd: '2026-12-31', roomNightsTarget: 1200, roomNightsActual: 342, revenueTarget: 226800, revenueActual: 64638, lastBookingDate: '2026-03-28', accountManager: 'Michael Ross', active: true },
  { id: 'A002', companyName: 'Apex Technologies', tier: 'gold', contactName: 'Sarah Chen', contactEmail: 'schen@apex.com', negotiatedRate: 175, rateCode: 'CORP-AT', contractStart: '2026-01-01', contractEnd: '2026-12-31', roomNightsTarget: 800, roomNightsActual: 198, revenueTarget: 140000, revenueActual: 34650, accountManager: 'Michael Ross', active: true },
  { id: 'A003', companyName: 'Meridian Consulting', tier: 'silver', contactName: 'James Walker', contactEmail: 'jwalker@meridian.com', negotiatedRate: 159, rateCode: 'CORP-MC', contractStart: '2026-04-01', contractEnd: '2027-03-31', roomNightsTarget: 500, roomNightsActual: 0, revenueTarget: 79500, revenueActual: 0, accountManager: 'Lisa Park', active: true },
  { id: 'A004', companyName: 'GlobalBank Inc.', tier: 'gold', contactName: 'David Liu', contactEmail: 'dliu@globalbank.com', negotiatedRate: 199, rateCode: 'CORP-GB', contractStart: '2025-07-01', contractEnd: '2026-06-30', roomNightsTarget: 600, roomNightsActual: 485, revenueTarget: 119400, revenueActual: 96515, lastBookingDate: '2026-03-25', accountManager: 'Michael Ross', active: true },
];

const SEED_CAMPAIGNS: MarketingCampaign[] = [
  { id: 'C001', name: 'Spring Getaway Package', channel: 'email', status: 'active', startDate: '2026-03-15', endDate: '2026-04-30', budget: 5000, spend: 2100, impressions: 45000, clicks: 3200, conversions: 128, revenue: 38400, targetSegment: 'leisure', createdBy: 'Lisa Park', createdAt: '2026-03-10', updatedAt: '2026-03-30' },
  { id: 'C002', name: 'Corporate Rate Promo Q2', channel: 'digital', status: 'scheduled', startDate: '2026-04-01', endDate: '2026-06-30', budget: 12000, spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, targetSegment: 'corporate', createdBy: 'Michael Ross', createdAt: '2026-03-25', updatedAt: '2026-03-25' },
  { id: 'C003', name: 'Instagram Influencer Series', channel: 'social', status: 'active', startDate: '2026-03-01', endDate: '2026-05-31', budget: 8000, spend: 4500, impressions: 120000, clicks: 8400, conversions: 210, revenue: 52500, targetSegment: 'leisure', createdBy: 'Lisa Park', createdAt: '2026-02-20', updatedAt: '2026-03-29' },
  { id: 'C004', name: 'Google Ads — Meetings & Events', channel: 'digital', status: 'active', startDate: '2026-01-15', endDate: '2026-12-31', budget: 24000, spend: 6800, impressions: 200000, clicks: 14000, conversions: 85, revenue: 127500, targetSegment: 'group', createdBy: 'Michael Ross', createdAt: '2026-01-10', updatedAt: '2026-03-30' },
  { id: 'C005', name: 'Holiday Season Email Blast', channel: 'email', status: 'completed', startDate: '2025-11-15', endDate: '2025-12-31', budget: 3000, spend: 2800, impressions: 32000, clicks: 2560, conversions: 192, revenue: 48000, targetSegment: 'transient', createdBy: 'Lisa Park', createdAt: '2025-11-01', updatedAt: '2026-01-05' },
];

const SEED_TARGETS: RevenueTarget[] = [
  { id: 'T001', month: '2026-01', segment: 'corporate', targetRevenue: 85000, actualRevenue: 78200, targetRoomNights: 450, actualRoomNights: 412, targetADR: 189, actualADR: 190, forecastRevenue: 78200 },
  { id: 'T002', month: '2026-02', segment: 'corporate', targetRevenue: 80000, actualRevenue: 82400, targetRoomNights: 420, actualRoomNights: 435, targetADR: 190, actualADR: 189, forecastRevenue: 82400 },
  { id: 'T003', month: '2026-03', segment: 'corporate', targetRevenue: 90000, actualRevenue: 87500, targetRoomNights: 475, actualRoomNights: 460, targetADR: 189, actualADR: 190, forecastRevenue: 89000 },
  { id: 'T004', month: '2026-04', segment: 'corporate', targetRevenue: 95000, actualRevenue: 24500, targetRoomNights: 500, actualRoomNights: 128, targetADR: 190, actualADR: 191, forecastRevenue: 92000 },
  { id: 'T005', month: '2026-01', segment: 'transient', targetRevenue: 120000, actualRevenue: 115000, targetRoomNights: 600, actualRoomNights: 575, targetADR: 200, actualADR: 200, forecastRevenue: 115000 },
  { id: 'T006', month: '2026-02', segment: 'transient', targetRevenue: 110000, actualRevenue: 118000, targetRoomNights: 550, actualRoomNights: 590, targetADR: 200, actualADR: 200, forecastRevenue: 118000 },
  { id: 'T007', month: '2026-03', segment: 'transient', targetRevenue: 130000, actualRevenue: 127000, targetRoomNights: 650, actualRoomNights: 635, targetADR: 200, actualADR: 200, forecastRevenue: 128500 },
  { id: 'T008', month: '2026-04', segment: 'transient', targetRevenue: 140000, actualRevenue: 36000, targetRoomNights: 700, actualRoomNights: 180, targetADR: 200, actualADR: 200, forecastRevenue: 135000 },
  { id: 'T009', month: '2026-01', segment: 'group', targetRevenue: 60000, actualRevenue: 55000, targetRoomNights: 300, actualRoomNights: 275, targetADR: 200, actualADR: 200, forecastRevenue: 55000 },
  { id: 'T010', month: '2026-02', segment: 'group', targetRevenue: 55000, actualRevenue: 62000, targetRoomNights: 275, actualRoomNights: 310, targetADR: 200, actualADR: 200, forecastRevenue: 62000 },
  { id: 'T011', month: '2026-03', segment: 'group', targetRevenue: 70000, actualRevenue: 68000, targetRoomNights: 350, actualRoomNights: 340, targetADR: 200, actualADR: 200, forecastRevenue: 69000 },
  { id: 'T012', month: '2026-04', segment: 'group', targetRevenue: 75000, actualRevenue: 18000, targetRoomNights: 375, actualRoomNights: 90, targetADR: 200, actualADR: 200, forecastRevenue: 72000 },
];

const SEED_COMPETITORS: CompetitorProperty[] = [
  { id: 'CP01', name: 'Grand Riviera Hotel', starRating: 5, roomCount: 320, avgRate: 245, occupancy: 78, revpar: 191, strengths: ['Rooftop bar', 'Spa complex', 'Convention center'], weaknesses: ['Aging rooms', 'Limited parking'], lastUpdated: '2026-03-25' },
  { id: 'CP02', name: 'Harborview Suites', starRating: 4, roomCount: 180, avgRate: 199, occupancy: 82, revpar: 163, strengths: ['All-suite layout', 'Waterfront location'], weaknesses: ['No on-site restaurant', 'Small meeting space'], lastUpdated: '2026-03-20' },
  { id: 'CP03', name: 'Metro City Hotel', starRating: 4, roomCount: 250, avgRate: 179, occupancy: 85, revpar: 152, strengths: ['Central location', 'Modern design', 'Strong OTA presence'], weaknesses: ['No pool', 'Budget positioning'], lastUpdated: '2026-03-22' },
  { id: 'CP04', name: 'The Pinnacle Resort', starRating: 5, roomCount: 400, avgRate: 289, occupancy: 71, revpar: 205, strengths: ['Luxury brand', 'Golf course', '3 restaurants'], weaknesses: ['Remote location', 'High price point'], lastUpdated: '2026-03-18' },
];

const SEED_COLLATERAL: MarketingCollateral[] = [
  { id: 'MC01', name: 'Corporate Rate Sheet 2026', type: 'rate_sheet', fileUrl: '#', fileSize: 245000, uploadedBy: 'Michael Ross', uploadedAt: '2026-01-05', tags: ['corporate', 'rates'], version: 3 },
  { id: 'MC02', name: 'Wedding Brochure', type: 'brochure', fileUrl: '#', fileSize: 4200000, uploadedBy: 'Lisa Park', uploadedAt: '2026-02-14', tags: ['events', 'weddings'], version: 2 },
  { id: 'MC03', name: 'Property Overview Deck', type: 'presentation', fileUrl: '#', fileSize: 8500000, uploadedBy: 'Michael Ross', uploadedAt: '2026-03-01', tags: ['sales', 'overview'], version: 5 },
  { id: 'MC04', name: 'Meetings & Events Flyer', type: 'flyer', fileUrl: '#', fileSize: 1800000, uploadedBy: 'Lisa Park', uploadedAt: '2026-03-15', tags: ['events', 'groups'], version: 1 },
  { id: 'MC05', name: 'Aerial Drone Video', type: 'video', fileUrl: '#', fileSize: 120000000, uploadedBy: 'Michael Ross', uploadedAt: '2026-02-20', tags: ['video', 'exterior'], version: 1 },
  { id: 'MC06', name: 'Pool & Spa Photo Set', type: 'photo', fileUrl: '#', fileSize: 32000000, uploadedBy: 'Lisa Park', uploadedAt: '2026-01-28', tags: ['photos', 'amenities'], version: 1 },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;
const fmtSize = (bytes: number) => bytes > 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${(bytes / 1_000).toFixed(0)} KB`;

const tierColors: Record<AccountTier, string> = {
  platinum: 'text-zinc-100 bg-zinc-500/20 border-zinc-400/30',
  gold:     'text-amber-400 bg-amber-500/20 border-amber-500/30',
  silver:   'text-zinc-300 bg-zinc-600/20 border-zinc-500/30',
  bronze:   'text-orange-400 bg-orange-500/20 border-orange-500/30',
};

const statusBadge = (status: CampaignStatus) => {
  const map: Record<CampaignStatus, string> = {
    draft:     'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    active:    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    paused:    'bg-amber-500/20 text-amber-400 border-amber-500/30',
    completed: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  };
  return map[status];
};

const collateralIcon = (type: MarketingCollateral['type']) => {
  const icons: Record<string, React.ReactNode> = {
    brochure: <FileText size={16} />, flyer: <FileText size={16} />,
    rate_sheet: <FileBarChart size={16} />, presentation: <FileBarChart size={16} />,
    photo: <Image size={16} />, video: <Video size={16} />, template: <FileText size={16} />,
  };
  return icons[type] || <FileText size={16} />;
};

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const SalesMarketingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SalesTab>('pipeline');
  const [leads, setLeads] = useState<SalesLead[]>(SEED_LEADS);
  const [accounts] = useState<CorporateAccount[]>(SEED_ACCOUNTS);
  const [campaigns] = useState<MarketingCampaign[]>(SEED_CAMPAIGNS);
  const [targets] = useState<RevenueTarget[]>(SEED_TARGETS);
  const [competitors] = useState<CompetitorProperty[]>(SEED_COMPETITORS);
  const [collateral] = useState<MarketingCollateral[]>(SEED_COLLATERAL);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  // ── Pipeline KPIs ────────────────────────────────────────────────────────
  const pipelineValue = useMemo(() =>
    leads.filter(l => !['won', 'lost'].includes(l.stage))
      .reduce((s, l) => s + l.estimatedValue * (l.probability / 100), 0), [leads]);
  const wonValue = useMemo(() =>
    leads.filter(l => l.stage === 'won').reduce((s, l) => s + l.estimatedValue, 0), [leads]);
  const activeLeadCount = useMemo(() =>
    leads.filter(l => !['won', 'lost'].includes(l.stage)).length, [leads]);

  // ── Drag-and-Drop Handlers ───────────────────────────────────────────────
  const handleDragStart = (leadId: string) => setDraggedLead(leadId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (targetStage: LeadStage) => {
    if (!draggedLead) return;
    setLeads(prev => prev.map(l =>
      l.id === draggedLead ? { ...l, stage: targetStage, updatedAt: new Date().toISOString().slice(0, 10) } : l
    ));
    setDraggedLead(null);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PIPELINE TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderPipeline = () => {
    const filtered = leads.filter(l =>
      l.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.contactName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Weighted Pipeline</div>
            <div className="text-2xl font-light text-white">{fmt(pipelineValue)}</div>
          </div>
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Won Revenue YTD</div>
            <div className="text-2xl font-light text-emerald-400">{fmt(wonValue)}</div>
          </div>
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Leads</div>
            <div className="text-2xl font-light text-white">{activeLeadCount}</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search leads..."
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-violet-500/40 transition"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all">
            <Plus size={14} /> New Lead
          </button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[400px]">
          {KANBAN_STAGES.map(stage => {
            const stageLeads = filtered.filter(l => l.stage === stage.id);
            const stageTotal = stageLeads.reduce((s, l) => s + l.estimatedValue, 0);
            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
                className="bg-zinc-900/30 border border-white/5 rounded-2xl p-4 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">{stage.label}</span>
                    <span className="text-[10px] text-zinc-500 font-semibold">{stageLeads.length}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold">{fmt(stageTotal)}</span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar max-h-[500px]">
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      className={`bg-zinc-950/60 border border-zinc-800 hover:border-violet-500/30 rounded-xl p-4 cursor-grab active:cursor-grabbing transition-all hover:-translate-y-0.5 group ${draggedLead === lead.id ? 'opacity-50 scale-95' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-bold text-zinc-200 leading-tight">{lead.companyName}</h4>
                        <Grip size={12} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium mb-3">{lead.contactName}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-violet-400">{fmt(lead.estimatedValue)}</span>
                        <div className="flex items-center gap-1 text-[9px] text-zinc-500">
                          <Percent size={10} />
                          <span>{lead.probability}%</span>
                        </div>
                      </div>
                      {lead.nextFollowUp && (
                        <div className="flex items-center gap-1 mt-2 text-[9px] text-amber-500/80">
                          <Calendar size={10} />
                          <span>Follow-up: {lead.nextFollowUp}</span>
                        </div>
                      )}
                      {lead.tags && lead.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {lead.tags.map(t => (
                            <span key={t} className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[8px] text-zinc-400 font-semibold uppercase">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="flex-1 flex items-center justify-center text-zinc-600 text-[10px] font-semibold uppercase tracking-wider py-12">
                      Drop leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Won / Lost Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-5">
            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-3">Won Deals</div>
            {leads.filter(l => l.stage === 'won').map(l => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-emerald-500/10 last:border-0">
                <span className="text-xs text-zinc-200 font-semibold">{l.companyName}</span>
                <span className="text-xs text-emerald-400 font-bold">{fmt(l.estimatedValue)}</span>
              </div>
            ))}
          </div>
          <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5">
            <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-3">Lost Deals</div>
            {leads.filter(l => l.stage === 'lost').map(l => (
              <div key={l.id} className="flex flex-col py-2 border-b border-rose-500/10 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-200 font-semibold">{l.companyName}</span>
                  <span className="text-xs text-rose-400 font-bold">{fmt(l.estimatedValue)}</span>
                </div>
                {l.lostReason && <span className="text-[10px] text-zinc-500 mt-1">{l.lostReason}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCOUNTS TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderAccounts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
          {accounts.length} Corporate Accounts
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all">
          <Plus size={14} /> New Account
        </button>
      </div>

      <div className="space-y-4">
        {accounts.map(acc => {
          const rnPct = pct(acc.roomNightsActual, acc.roomNightsTarget);
          const revPct = pct(acc.revenueActual, acc.revenueTarget);
          return (
            <div key={acc.id} className="bg-zinc-900/40 border border-white/5 hover:border-violet-500/20 rounded-2xl p-6 transition-all group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                    <Building2 size={20} className="text-violet-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">{acc.companyName}</h3>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${tierColors[acc.tier]}`}>
                        {acc.tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1"><Users size={10} /> {acc.contactName}</span>
                      <span className="flex items-center gap-1"><Mail size={10} /> {acc.contactEmail}</span>
                      <span className="flex items-center gap-1"><Tag size={10} /> {acc.rateCode} &mdash; {fmt(acc.negotiatedRate)}/night</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <Calendar size={12} />
                  <span>{acc.contractStart} &rarr; {acc.contractEnd}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Room Nights */}
                <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Room Nights YTD</span>
                    <span className="text-xs font-bold text-zinc-300">{acc.roomNightsActual} / {acc.roomNightsTarget}</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${rnPct >= 75 ? 'bg-emerald-500' : rnPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(rnPct, 100)}%` }}
                    />
                  </div>
                  <div className="text-right mt-1 text-[10px] font-bold text-zinc-500">{rnPct}%</div>
                </div>

                {/* Revenue */}
                <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Revenue YTD</span>
                    <span className="text-xs font-bold text-zinc-300">{fmt(acc.revenueActual)} / {fmt(acc.revenueTarget)}</span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${revPct >= 75 ? 'bg-emerald-500' : revPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(revPct, 100)}%` }}
                    />
                  </div>
                  <div className="text-right mt-1 text-[10px] font-bold text-zinc-500">{revPct}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // CAMPAIGNS TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderCampaigns = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
          {campaigns.length} Campaigns
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all">
          <Plus size={14} /> Create Campaign
        </button>
      </div>

      {/* Campaign KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(() => {
          const active = campaigns.filter(c => c.status === 'active');
          const totalSpend = active.reduce((s, c) => s + c.spend, 0);
          const totalRevenue = active.reduce((s, c) => s + c.revenue, 0);
          const totalConversions = active.reduce((s, c) => s + c.conversions, 0);
          const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend * 100) : 0;
          return (
            <>
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Spend</div>
                <div className="text-xl font-light text-white">{fmt(totalSpend)}</div>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Revenue Generated</div>
                <div className="text-xl font-light text-emerald-400">{fmt(totalRevenue)}</div>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Conversions</div>
                <div className="text-xl font-light text-white">{totalConversions}</div>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4">
                <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Overall ROI</div>
                <div className={`text-xl font-light ${roi > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{roi.toFixed(0)}%</div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {campaigns.map(c => {
          const roi = c.spend > 0 ? ((c.revenue - c.spend) / c.spend * 100) : 0;
          const ctr = c.impressions > 0 ? (c.clicks / c.impressions * 100) : 0;
          const convRate = c.clicks > 0 ? (c.conversions / c.clicks * 100) : 0;
          const budgetPct = pct(c.spend, c.budget);
          return (
            <div key={c.id} className="bg-zinc-900/40 border border-white/5 hover:border-violet-500/20 rounded-2xl p-5 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusBadge(c.status)}`}>
                      {c.status}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-semibold capitalize">{c.channel}</span>
                    <span className="text-[10px] text-zinc-600">{c.startDate} &rarr; {c.endDate}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 hover:bg-zinc-800 rounded-lg transition"><Edit3 size={13} className="text-zinc-500" /></button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-4">
                <div>
                  <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Impressions</div>
                  <div className="text-sm font-semibold text-zinc-300">{c.impressions.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">CTR</div>
                  <div className="text-sm font-semibold text-zinc-300">{ctr.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Conv Rate</div>
                  <div className="text-sm font-semibold text-zinc-300">{convRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">ROI</div>
                  <div className={`text-sm font-semibold ${roi > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{roi.toFixed(0)}%</div>
                </div>
              </div>

              {/* Budget Bar */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Budget</span>
                <span className="text-[10px] text-zinc-400 font-semibold">{fmt(c.spend)} / {fmt(c.budget)}</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${budgetPct > 90 ? 'bg-rose-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-violet-500'}`} style={{ width: `${Math.min(budgetPct, 100)}%` }} />
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-zinc-500">Revenue: <span className="text-emerald-400 font-bold">{fmt(c.revenue)}</span></span>
                <span className="text-[10px] text-zinc-500">Segment: <span className="text-zinc-300 font-semibold capitalize">{c.targetSegment}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // REVENUE TARGETS TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderRevenue = () => {
    const segments = [...new Set(targets.map(t => t.segment))];
    const months = [...new Set(targets.map(t => t.month))].sort();

    // Build monthly totals for the chart
    const chartData = months.map(m => {
      const monthTargets = targets.filter(t => t.month === m);
      const totalTarget = monthTargets.reduce((s, t) => s + t.targetRevenue, 0);
      const totalActual = monthTargets.reduce((s, t) => s + t.actualRevenue, 0);
      const totalForecast = monthTargets.reduce((s, t) => s + t.forecastRevenue, 0);
      return {
        month: new Date(m + '-01').toLocaleDateString(undefined, { month: 'short' }),
        target: totalTarget,
        actual: totalActual,
        forecast: totalForecast,
      };
    });

    return (
      <div className="space-y-6">
        {/* Revenue Chart */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-zinc-200 mb-1">Monthly Revenue: Target vs Actual</h3>
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-6">All segments combined</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#52525b" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#52525b" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '1rem', fontSize: '11px' }}
                  formatter={(value: number) => fmt(value)}
                />
                <Bar dataKey="target" fill="#3f3f46" radius={[6, 6, 0, 0]} name="Target" />
                <Bar dataKey="actual" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Actual" />
                <Bar dataKey="forecast" fill="#6366f1" radius={[6, 6, 0, 0]} opacity={0.5} name="Forecast" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-Segment Breakdown */}
        {segments.map(seg => {
          const segTargets = targets.filter(t => t.segment === seg);
          const totalTarget = segTargets.reduce((s, t) => s + t.targetRevenue, 0);
          const totalActual = segTargets.reduce((s, t) => s + t.actualRevenue, 0);
          const overall = pct(totalActual, totalTarget);
          return (
            <div key={seg} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[seg as string] || '#8b5cf6' }} />
                  <span className="text-sm font-bold text-zinc-200 capitalize">{seg}</span>
                </div>
                <div className="text-xs text-zinc-400 font-semibold">{fmt(totalActual)} / {fmt(totalTarget)} <span className={overall >= 80 ? 'text-emerald-400' : 'text-amber-400'}>({overall}%)</span></div>
              </div>
              <div className="space-y-3">
                {segTargets.map(t => {
                  const p = pct(t.actualRevenue, t.targetRevenue);
                  const monthLabel = new Date(t.month + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                  return (
                    <div key={t.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-400 font-semibold">{monthLabel}</span>
                        <span className="text-[10px] text-zinc-500">{fmt(t.actualRevenue)} / {fmt(t.targetRevenue)}</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(p, 100)}%`, backgroundColor: SEGMENT_COLORS[seg as string] || '#8b5cf6' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPETITOR ANALYSIS TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderCompetitors = () => (
    <div className="space-y-6">
      {/* Rate Comparison Table */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-zinc-200">Competitive Rate Comparison</h3>
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">Last 30 days average</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[9px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                <th className="text-left px-6 py-3">Property</th>
                <th className="text-center px-4 py-3">Stars</th>
                <th className="text-center px-4 py-3">Rooms</th>
                <th className="text-center px-4 py-3">Avg Rate</th>
                <th className="text-center px-4 py-3">Occupancy</th>
                <th className="text-center px-4 py-3">RevPAR</th>
              </tr>
            </thead>
            <tbody>
              {/* Our property row */}
              <tr className="border-b border-zinc-800 bg-violet-500/5">
                <td className="px-6 py-3 font-bold text-violet-400">Our Property</td>
                <td className="text-center px-4 py-3">
                  <div className="flex items-center justify-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}</div>
                </td>
                <td className="text-center px-4 py-3 text-zinc-300">200</td>
                <td className="text-center px-4 py-3 text-zinc-300 font-semibold">$210</td>
                <td className="text-center px-4 py-3 text-zinc-300">80%</td>
                <td className="text-center px-4 py-3 text-zinc-300 font-semibold">$168</td>
              </tr>
              {competitors.map(c => (
                <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition">
                  <td className="px-6 py-3 font-semibold text-zinc-300">{c.name}</td>
                  <td className="text-center px-4 py-3">
                    <div className="flex items-center justify-center gap-0.5">
                      {Array.from({ length: c.starRating }).map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                    </div>
                  </td>
                  <td className="text-center px-4 py-3 text-zinc-400">{c.roomCount}</td>
                  <td className="text-center px-4 py-3 text-zinc-300 font-semibold">{fmt(c.avgRate)}</td>
                  <td className="text-center px-4 py-3 text-zinc-400">{c.occupancy}%</td>
                  <td className="text-center px-4 py-3 text-zinc-300 font-semibold">{fmt(c.revpar)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Competitor Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {competitors.map(c => (
          <div key={c.id} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 hover:border-violet-500/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">{c.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: c.starRating }).map((_, i) => <Star key={i} size={10} className="text-amber-400 fill-amber-400" />)}
                  <span className="text-[10px] text-zinc-500 ml-2">{c.roomCount} rooms</span>
                </div>
              </div>
              <span className="text-[9px] text-zinc-500 font-semibold">Updated {c.lastUpdated}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Avg Rate</div>
                <div className="text-sm font-bold text-zinc-200 mt-1">{fmt(c.avgRate)}</div>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Occupancy</div>
                <div className="text-sm font-bold text-zinc-200 mt-1">{c.occupancy}%</div>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-3 text-center">
                <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">RevPAR</div>
                <div className="text-sm font-bold text-zinc-200 mt-1">{fmt(c.revpar)}</div>
              </div>
            </div>
            {c.strengths && c.strengths.length > 0 && (
              <div className="mb-3">
                <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Strengths</div>
                <div className="flex flex-wrap gap-1">
                  {c.strengths.map(s => <span key={s} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] text-emerald-400 font-semibold">{s}</span>)}
                </div>
              </div>
            )}
            {c.weaknesses && c.weaknesses.length > 0 && (
              <div>
                <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Weaknesses</div>
                <div className="flex flex-wrap gap-1">
                  {c.weaknesses.map(w => <span key={w} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] text-rose-400 font-semibold">{w}</span>)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // COLLATERAL TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderCollateral = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
          {collateral.length} Materials
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all">
          <Upload size={14} /> Upload
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collateral.map(item => (
          <div key={item.id} className="bg-zinc-900/40 border border-white/5 hover:border-violet-500/20 rounded-2xl p-5 transition-all group">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 text-violet-400">
                {collateralIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-zinc-200 truncate">{item.name}</h4>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                  <span className="capitalize">{item.type.replace('_', ' ')}</span>
                  <span>&middot;</span>
                  <span>{fmtSize(item.fileSize)}</span>
                  <span>&middot;</span>
                  <span>v{item.version}</span>
                </div>
              </div>
            </div>

            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {item.tags.map(t => (
                  <span key={t} className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[8px] text-zinc-400 font-semibold uppercase">{t}</span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <span className="text-[10px] text-zinc-600">{item.uploadedBy} &middot; {item.uploadedAt}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 hover:bg-zinc-800 rounded-lg transition" title="Preview"><Eye size={13} className="text-zinc-400" /></button>
                <button className="p-1.5 hover:bg-zinc-800 rounded-lg transition" title="Download"><Download size={13} className="text-zinc-400" /></button>
                <button className="p-1.5 hover:bg-zinc-800 rounded-lg transition" title="Share"><Share2 size={13} className="text-zinc-400" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // REPORTS TAB
  // ═══════════════════════════════════════════════════════════════════════════
  const renderReports = () => {
    // Conversion funnel
    const total = leads.length;
    const qualified = leads.filter(l => ['qualified', 'proposal', 'negotiation', 'won'].includes(l.stage)).length;
    const proposals = leads.filter(l => ['proposal', 'negotiation', 'won'].includes(l.stage)).length;
    const negotiations = leads.filter(l => ['negotiation', 'won'].includes(l.stage)).length;
    const won = leads.filter(l => l.stage === 'won').length;
    const funnelData = [
      { name: 'Leads', value: total, fill: '#71717a' },
      { name: 'Qualified', value: qualified, fill: '#3b82f6' },
      { name: 'Proposal', value: proposals, fill: '#8b5cf6' },
      { name: 'Negotiation', value: negotiations, fill: '#f59e0b' },
      { name: 'Won', value: won, fill: '#10b981' },
    ];

    // Revenue by source
    const sourceData = leads.filter(l => l.stage === 'won').reduce<Record<string, number>>((acc, l) => {
      acc[l.source] = (acc[l.source] || 0) + l.estimatedValue;
      return acc;
    }, {});
    const sourceChartData = Object.entries(sourceData).map(([source, value]) => ({
      name: source.replace('_', ' '),
      value,
    }));

    // Segment mix pie
    const segmentData = targets.reduce<Record<string, number>>((acc, t) => {
      acc[t.segment] = (acc[t.segment] || 0) + t.actualRevenue;
      return acc;
    }, {});
    const segmentChartData = Object.entries(segmentData).map(([seg, value]) => ({
      name: seg,
      value,
    }));

    const PIE_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];

    return (
      <div className="space-y-6">
        {/* Conversion Funnel */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-zinc-200 mb-1">Sales Conversion Funnel</h3>
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-6">All-time pipeline progression</p>
          <div className="space-y-3">
            {funnelData.map((stage, idx) => {
              const widthPct = total > 0 ? Math.max((stage.value / total) * 100, 8) : 8;
              return (
                <div key={stage.name} className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-zinc-400 w-24 text-right">{stage.name}</span>
                  <div className="flex-1 relative">
                    <div
                      className="h-9 rounded-xl flex items-center px-4 transition-all duration-700"
                      style={{ width: `${widthPct}%`, backgroundColor: stage.fill }}
                    >
                      <span className="text-[11px] font-bold text-white">{stage.value}</span>
                    </div>
                  </div>
                  {idx > 0 && (
                    <span className="text-[10px] text-zinc-500 font-semibold w-12 text-right">
                      {pct(stage.value, funnelData[idx - 1].value)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Source */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-200 mb-1">Revenue by Source</h3>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-6">Won deals only</p>
            {sourceChartData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" stroke="#52525b" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" stroke="#52525b" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '1rem', fontSize: '11px' }}
                      formatter={(value: number) => fmt(value)}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-600 text-xs">No won deals to display</div>
            )}
          </div>

          {/* Segment Mix Pie */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-zinc-200 mb-1">Revenue Segment Mix</h3>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-6">Year-to-date actuals</p>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={segmentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {segmentChartData.map((_, i) => (
                      <Cell key={i} fill={SEGMENT_COLORS[segmentChartData[i].name] || PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '1rem', fontSize: '11px' }}
                    formatter={(value: number) => fmt(value)}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {segmentChartData.map((seg, i) => (
                <div key={seg.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[seg.name] || PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest capitalize">{seg.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Campaign Performance Summary */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-zinc-200 mb-1">Campaign Performance Summary</h3>
          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-4">All campaigns</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[9px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
                  <th className="text-left px-4 py-2">Campaign</th>
                  <th className="text-center px-3 py-2">Channel</th>
                  <th className="text-center px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Spend</th>
                  <th className="text-right px-3 py-2">Revenue</th>
                  <th className="text-right px-3 py-2">ROI</th>
                  <th className="text-right px-3 py-2">Conv.</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => {
                  const roi = c.spend > 0 ? ((c.revenue - c.spend) / c.spend * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition">
                      <td className="px-4 py-2.5 font-semibold text-zinc-300">{c.name}</td>
                      <td className="text-center px-3 py-2.5 text-zinc-400 capitalize">{c.channel}</td>
                      <td className="text-center px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusBadge(c.status)}`}>{c.status}</span>
                      </td>
                      <td className="text-right px-3 py-2.5 text-zinc-300">{fmt(c.spend)}</td>
                      <td className="text-right px-3 py-2.5 text-emerald-400 font-semibold">{fmt(c.revenue)}</td>
                      <td className={`text-right px-3 py-2.5 font-semibold ${roi > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{roi.toFixed(0)}%</td>
                      <td className="text-right px-3 py-2.5 text-zinc-300">{c.conversions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB ROUTER
  // ═══════════════════════════════════════════════════════════════════════════
  const renderTab = () => {
    switch (activeTab) {
      case 'pipeline':    return renderPipeline();
      case 'accounts':    return renderAccounts();
      case 'campaigns':   return renderCampaigns();
      case 'revenue':     return renderRevenue();
      case 'competitors': return renderCompetitors();
      case 'collateral':  return renderCollateral();
      case 'reports':     return renderReports();
      default:            return renderPipeline();
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="module-container bg-transparent flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="module-header glass-panel flex items-center justify-between flex-nowrap">
        <div className="flex items-center gap-4">
          <div
            className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20"
            style={{ backgroundColor: 'var(--system-accent-alpha)', borderColor: 'var(--system-accent-alpha)', color: 'var(--system-accent)' }}
          >
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight leading-none">Sales & Marketing</h2>
            <div className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">
              Pipeline &middot; Accounts &middot; Campaigns &middot; Revenue
            </div>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto custom-scrollbar border-b border-white/5 bg-zinc-900/20">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <main className="module-body space-y-8">
        {renderTab()}
      </main>
    </div>
  );
};

export default SalesMarketingDashboard;
