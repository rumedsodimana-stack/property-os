
import React, { useState, useEffect, useMemo } from 'react';
import { User, Property, ReservationStatus } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePms } from '../services/kernel/persistence';
import { Command, UsersRound, ConciergeBell, Wallet, Settings, Sparkles, Wine, Menu, Zap, BedDouble, Truck, MessageSquare, Terminal as TerminalIcon, Wrench, Calendar, Activity, Brain, LayoutDashboard, LogOut, User as UserIcon, Shield, BookOpen, ChevronDown, TrendingUp, DollarSign, BarChart3, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FrontDesk from './pms/FrontDesk';
import Housekeeping from './pms/Housekeeping';
import POSDashboard from './pos/POSDashboard';
import FinanceDashboard from './finance/FinanceDashboard';
import HRDashboard from './hr/HRDashboard';
import ProcurementDashboard from './procurement/ProcurementDashboard';
import CommunicationHub from './communication/CommunicationHub';
import TerminalView from './terminal/TerminalView';
import SuggestionBox from './suggestions/SuggestionBox';
import EngineeringHub from './modules/EngineeringHub';
import SecurityConsole from './modules/SecurityConsole';
import EventManagement from './modules/EventManagement';
import IOTControlCenter from './modules/IOTControlCenter';
import BrandStandards from './modules/BrandStandards';
import AICommandCenter from './modules/AICommandCenter';
import NightAudit from './modules/NightAudit';
import GroupManagement from './modules/GroupManagement';
import SalesMarketingDashboard from './departments/sales/SalesMarketingDashboard';
import { botEngine } from '../services/kernel/systemBridge';
import ConfigurationHub from './configuration/ConfigurationHub';
import YieldDashboard from './revenue/YieldDashboard';
import RateCalendar from './revenue/RateCalendar';
import DemandAnalysis from './revenue/DemandAnalysis';

import { registerCoreModules } from '../services/kernel/moduleRegistry';
import { predictiveEngine } from '../services/intelligence/predictiveEngine';
import { NeuralSidepanel } from './shared/NeuralSidepanel';
import { AppEnvironmentProvider, useAppEnvironment } from '../context/AppEnvironmentContext';
import { systemBus } from '../services/kernel/systemBridge';

interface OpsAppProps {
  user: User;
  property: Property;
}

// mockData removed — live data computed in renderDashboard via usePms()

const NavItem = ({ icon, label, active = false, expanded = true, onClick }: { icon: React.ReactNode, label: string, active?: boolean, expanded?: boolean, onClick?: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${active
      ? 'bg-sky-500/10 border border-sky-500/20 text-sky-400'
      : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
      }`}
  >
    <div className={`relative z-10 transition-all duration-300 ${active ? 'scale-105 text-sky-400' : 'group-hover:scale-105'}`}>{icon}</div>
    {expanded && <span className={`text-[11px] font-semibold tracking-wide whitespace-nowrap transition-colors ${active ? 'text-sky-300' : ''}`}>{label}</span>}
    {active && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]"></div>}
  </button>
);

const NavSection = ({ label, icon, children, expanded, onToggle, sidebarExpanded }: {
  label: string,
  icon?: React.ReactNode,
  children: React.ReactNode,
  expanded: boolean,
  onToggle: () => void,
  sidebarExpanded: boolean
}) => {
  if (!sidebarExpanded) return <div className="py-2 border-b border-white/5 last:border-0">{children}</div>;

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-black text-zinc-500 uppercase tracking-[0.15em] hover:text-zinc-300 transition-colors group"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="opacity-50 group-hover:opacity-100 transition-opacity">{icon}</span>}
          <span>{label}</span>
        </div>
        <ChevronDown size={12} className={`transition-transform duration-300 ${expanded ? '' : '-rotate-90'}`} />
      </button>
      {expanded && <div className="space-y-1">{children}</div>}
    </div>
  );
};

const StatCard = ({ title, value, trend, positive, inverse, icon }: { title: string, value: string, trend: string, positive: boolean, inverse?: boolean, icon: React.ReactNode }) => (
  <div className="stat-card">
    <div className="flex justify-between items-start mb-5">
      <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-white/5 group-hover:scale-105 transition-transform duration-300">{icon}</div>
      <div className={`flex items-center text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-lg uppercase ${(positive && !inverse) || (!positive && inverse) ? 'badge-success' : 'badge-danger'
        }`}>
        {trend}
      </div>
    </div>
    <div className="text-3xl font-light text-white tracking-tight mb-1">{value}</div>
    <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.15em]">{title}</div>
  </div>
);

// SystemCanvas removed - was causing resolution/display issues
const SystemCanvas: React.FC = () => null;


const OpsAppContent: React.FC<OpsAppProps> = ({ user, property }) => {
  const { currentUser, logout } = useAuth();
  const {
    rooms,
    reservations,
    posOrders,
    maintenanceTasks,
    employees,
    purchaseOrders,
    inventory,
    outlets,
    shifts,
  } = usePms();
  const { activeModule, setActiveModule, setPageContext } = useAppEnvironment();

  // Prefer live session role over the legacy User prop role
  const activeRole = currentUser?.role || (user.role as string);
  const displayName = currentUser?.fullName || user.fullName;
  const [sidebarExpanded, setSidebarExpanded] = useState(window.innerWidth > 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [neuralPanelExpanded, setNeuralPanelExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    core: true,
    operations: true,
    intelligence: true,
    revenue: true,
    back_office: false,
    infrastructure: false,
    brand: true,
    system: false
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    botEngine.start();

    // Initialize Brand Standards autonomous system
    registerCoreModules(); // Register Front Desk, Housekeeping, POS, UI Theme
    predictiveEngine.generatePredictions(); // Generate seasonal/compliance predictions

    const handleNavigate = (module: string) => {
      console.log(`[AI Triggered Navigation] Opening: ${module}`);
      setActiveModule(module.toLowerCase());
      setNeuralPanelExpanded(false); // Close AI panel on navigate
    };
    systemBus.on('navigate', handleNavigate);

    return () => {
      botEngine.stop();
      systemBus.off('navigate', handleNavigate);
    };
  }, [setActiveModule]);

  const moduleCatalog = useMemo(() => ([
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'front_desk', label: 'Front Desk' },
    { id: 'housekeeping', label: 'Housekeeping' },
    { id: 'pos', label: 'F&B / POS' },
    { id: 'events', label: 'Events' },
    { id: 'finance', label: 'Finance' },
    { id: 'hr', label: 'Human Capital' },
    { id: 'procurement', label: 'Procurement' },
    { id: 'engineering', label: 'Engineering' },
    { id: 'security', label: 'Security' },
    { id: 'iot', label: 'IOT Control' },
    { id: 'connect', label: 'Connect' },
    { id: 'night_audit', label: 'Night Audit' },
    { id: 'group_management', label: 'Group Management' },
    { id: 'brand_standards', label: 'Brand Standards' },
    { id: 'ai_command_center', label: 'AI Command Center' },
    { id: 'yield_dashboard', label: 'Yield Management' },
    { id: 'rate_calendar', label: 'Rate Calendar' },
    { id: 'demand_analysis', label: 'Demand Analysis' },
    { id: 'sales_marketing', label: 'Sales & Marketing' },
    { id: 'configuration', label: 'Configuration' },
    { id: 'terminal', label: 'Terminal' },
  ]), []);

  const filteredModules = useMemo(
    () => moduleCatalog.filter(m => m.label.toLowerCase().includes(commandQuery.toLowerCase())),
    [moduleCatalog, commandQuery]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(prev => !prev);
      }
      if (e.key === 'Escape') setCommandOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const renderDashboard = () => {
    const inHouse = reservations.filter(r => r.status === ReservationStatus.CHECKED_IN).length;
    const occupancy = rooms.length ? Math.round((inHouse / rooms.length) * 100) : 0;
    const lowStock = inventory.filter(i => i.totalStock <= i.reorderPoint).length;
    const openPOs = purchaseOrders.filter(po => po.status !== 'Received').length;
    const activeShifts = shifts.filter(s => !s.clockOut).length;
    const revenueToday = posOrders
      .filter(o => o.timestamp >= new Date().setHours(0, 0, 0, 0))
      .reduce((sum, o) => sum + (o.total ?? 0), 0);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayRevenue = posOrders
      .filter(o => o.timestamp >= todayStart.getTime())
      .reduce((s, o) => s + (o.total ?? 0), 0);
    const adr = inHouse > 0 ? todayRevenue / inHouse : 0;
    const revpar = rooms.length > 0 ? todayRevenue / rooms.length : 0;
    const openAlerts = maintenanceTasks.filter(t => t.status !== 'Completed').length;

    // ── 7-day velocity chart ─────────────────────────────────────────────
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const dayInHouse = reservations.filter(r =>
        r.status === ReservationStatus.CHECKED_IN &&
        new Date(r.checkIn) <= dayEnd && new Date(r.checkOut) >= dayStart
      ).length;
      const dayOccupancy = rooms.length ? Math.round((dayInHouse / rooms.length) * 100) : 0;
      const dayRevenue = posOrders
        .filter(o => o.timestamp >= dayStart.getTime() && o.timestamp <= dayEnd.getTime())
        .reduce((s, o) => s + (o.total ?? 0), 0);
      const dayRevpar = rooms.length ? Math.round(dayRevenue / rooms.length) : 0;
      return {
        name: d.toLocaleDateString(undefined, { weekday: 'short' }),
        occupancy: dayOccupancy,
        revPar: dayRevpar,
      };
    });

    const operationalAlerts = [
      lowStock > 0 ? `${lowStock} inventory items need replenishment` : 'Inventory levels are healthy',
      openPOs > 0 ? `${openPOs} purchase orders awaiting closure` : 'No pending purchase orders',
      maintenanceTasks.filter(t => t.status !== 'Completed').length > 0
        ? `${maintenanceTasks.filter(t => t.status !== 'Completed').length} maintenance tasks open`
        : 'No pending maintenance tasks',
    ];

    useEffect(() => {
      setPageContext(`Viewing Dashboard. Property: ${property.name}. Occupancy: ${occupancy}%. ADR: $${adr.toFixed(0)}. RevPAR: $${revpar.toFixed(0)}. Employees on shift: ${activeShifts}. Alerts: ${operationalAlerts.join('. ')}`);
    }, [occupancy, adr, revpar, activeShifts, property.name]);

    return (
      <div className="module-container bg-transparent flex flex-col h-full">
        <header className="module-header flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20">
              <LayoutDashboard className="w-6 h-6 text-violet-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-light text-white tracking-tight leading-none">Morning Briefing</h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Network Nominal</span>
                </div>
                <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider truncate">Property: {property.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setCommandOpen(true)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2 text-[11px] text-zinc-400 font-semibold hover:text-zinc-100 transition"
            >
              <Command className="w-3.5 h-3.5" />
              Quick Command
              <span className="text-[10px] text-zinc-600">Ctrl/Cmd+K</span>
            </button>
            <button
              onClick={() => setActiveModule('ai_command_center')}
              className="px-3 py-2 bg-sky-600 rounded-xl text-[11px] font-bold text-white hover:bg-sky-500 transition"
            >
              AI Command Center
            </button>
          </div>
        </header>

        <main className="module-body space-y-8">
          <div className="module-grid">
            <StatCard title="Occupancy" value={`${occupancy}%`} trend={`${rooms.length} rooms`} positive={occupancy > 50} icon={<UsersRound className="w-6 h-6 text-emerald-500" />} />
            <StatCard title="ADR" value={`$${adr.toFixed(0)}`} trend="Today" positive={adr > 100} icon={<Wallet className="w-6 h-6 text-violet-500" />} />
            <StatCard title="RevPAR" value={`$${revpar.toFixed(0)}`} trend="Today" positive={revpar > 50} icon={<Sparkles className="w-6 h-6 text-amber-500" />} />
            <StatCard title="Open Alerts" value={`${openAlerts}`} trend={openAlerts === 0 ? 'All Clear' : 'Pending'} positive={false} inverse icon={<Activity className="w-6 h-6 text-rose-500" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 relative group">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-10">
                <div>
                  <h3 className="text-2xl font-light text-white tracking-tight leading-none mb-2">Revenue Velocity</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Real-time RevPAR vs Occupancy</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">RevPAR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Occupancy</span>
                  </div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#52525b" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#52525b" tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '1rem', fontSize: '11px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Line type="monotone" dataKey="revPar" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="occupancy" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} strokeDasharray="6 6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 flex flex-col relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-500 border border-violet-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-200 leading-none">Operations Pulse</h3>
                  <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest mt-1 block">Live Data</span>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Employees</p>
                    <p className="text-xl font-light text-zinc-100 mt-1">{employees.length}</p>
                  </div>
                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Active Shifts</p>
                    <p className="text-xl font-light text-zinc-100 mt-1">{activeShifts}</p>
                  </div>
                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">Outlets</p>
                    <p className="text-xl font-light text-zinc-100 mt-1">{outlets.length}</p>
                  </div>
                  <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3">
                    <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">POS Today</p>
                    <p className="text-xl font-light text-zinc-100 mt-1">${revenueToday.toFixed(0)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {operationalAlerts.map((alert, index) => (
                    <div key={index} className="text-xs text-zinc-400 bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2">
                      {alert}
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setActiveModule('procurement')} className="btn-secondary !text-[11px]">Open Procurement</button>
                    <button onClick={() => setActiveModule('front_desk')} className="btn-secondary !text-[11px]">Open Front Desk</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="module-footer flex items-center justify-between border-t border-zinc-800 bg-zinc-900/50 px-6 py-3 mt-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global Ops Online</span>
            </div>
            <div className="h-4 w-px bg-zinc-800"></div>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">System Status: Nominal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-right">User: {displayName}</span>
          </div>
        </footer>
      </div>
    );
  };


  const renderContent = () => {
    switch (activeModule) {
      case 'front_desk': return <FrontDesk />;
      case 'housekeeping': return <Housekeeping />;
      case 'pos': return <POSDashboard />;
      case 'finance': return <FinanceDashboard />;
      case 'hr': return <HRDashboard />;
      case 'procurement': return <ProcurementDashboard />;
      case 'connect': return <CommunicationHub />;
      case 'terminal': return <TerminalView />;
      case 'suggestions': return <SuggestionBox />;
      case 'engineering': return <EngineeringHub />;
      case 'security': return <SecurityConsole />;
      case 'events': return <EventManagement />;
      case 'iot': return <IOTControlCenter />;
      case 'brand_standards': return <BrandStandards />;
      case 'ai_command_center': return <AICommandCenter />;
      case 'night_audit': return <NightAudit />;
      case 'group_management': return <GroupManagement />;
      case 'sales_marketing': return <SalesMarketingDashboard />;
      case 'configuration': return <ConfigurationHub />;
      case 'yield_dashboard': return <YieldDashboard />;
      case 'rate_calendar': return <RateCalendar />;
      case 'demand_analysis': return <DemandAnalysis />;
      default: return renderDashboard();
    }
  };

  return (
    <div className="w-full min-h-screen h-dvh bg-zinc-950 flex text-zinc-200 font-sans selection:bg-violet-500/30 relative overflow-hidden">
      {commandOpen && (
        <div className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm p-4 md:p-8" onClick={() => setCommandOpen(false)}>
          <div className="max-w-xl mx-auto mt-8 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
              <Command className="w-4 h-4 text-zinc-500" />
              <input
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Jump to module..."
                className="w-full bg-transparent outline-none text-sm text-zinc-200 placeholder:text-zinc-600"
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
              {filteredModules.length === 0 && (
                <div className="px-3 py-6 text-center text-xs text-zinc-500">No matching module</div>
              )}
              {filteredModules.map((module) => (
                <button
                  key={module.id}
                  onClick={() => {
                    setActiveModule(module.id);
                    setMobileMenuOpen(false);
                    setCommandOpen(false);
                    setCommandQuery('');
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 text-sm text-zinc-200 transition"
                >
                  {module.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[110] lg:relative lg:flex lg:flex-col
        ${sidebarExpanded ? 'lg:w-[var(--sidebar-width)]' : 'lg:w-20'} w-[var(--sidebar-width)]
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        h-full bg-zinc-950/80 backdrop-blur-2xl border-r border-white/5 transition-all duration-500 ease-out flex flex-col
      `}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-900/30">
              <Building2 size={18} />
            </div>
            {sidebarExpanded && (
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-[11px] text-sky-400 tracking-widest uppercase">TravelBook</span>
                <span className="font-semibold text-xs text-zinc-300 tracking-tight">Hotels OS</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="p-2 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Core */}
          <NavSection label="Core" expanded={expandedSections.core} onToggle={() => toggleSection('core')} sidebarExpanded={sidebarExpanded}>
            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" expanded={sidebarExpanded} active={activeModule === 'dashboard'} onClick={() => { setActiveModule('dashboard'); setMobileMenuOpen(false); }} />
            <NavItem icon={<MessageSquare size={18} />} label="Connect" expanded={sidebarExpanded} active={activeModule === 'connect'} onClick={() => { setActiveModule('connect'); setMobileMenuOpen(false); }} />
          </NavSection>

          {/* Operations */}
          <NavSection label="Operations" expanded={expandedSections.operations} onToggle={() => toggleSection('operations')} sidebarExpanded={sidebarExpanded}>
            <NavItem icon={<ConciergeBell size={18} />} label="Front Desk" expanded={sidebarExpanded} active={activeModule === 'front_desk'} onClick={() => { setActiveModule('front_desk'); setMobileMenuOpen(false); }} />
            <NavItem icon={<BedDouble size={18} />} label="Housekeeping" expanded={sidebarExpanded} active={activeModule === 'housekeeping'} onClick={() => { setActiveModule('housekeeping'); setMobileMenuOpen(false); }} />
            <NavItem icon={<Wine size={18} />} label="F&B / POS" expanded={sidebarExpanded} active={activeModule === 'pos'} onClick={() => { setActiveModule('pos'); setMobileMenuOpen(false); }} />
            <NavItem icon={<Calendar size={18} />} label="Events" expanded={sidebarExpanded} active={activeModule === 'events'} onClick={() => { setActiveModule('events'); setMobileMenuOpen(false); }} />

            {(['GM', 'Manager', 'GENERAL_MANAGER', 'DIRECTOR_OPS'].includes(activeRole)) && (
              <>
                <NavItem icon={<UsersRound size={18} />} label="Group Management" expanded={sidebarExpanded} active={activeModule === 'group_management'} onClick={() => { setActiveModule('group_management'); setMobileMenuOpen(false); }} />
                <NavItem icon={<Activity size={18} />} label="Night Audit" expanded={sidebarExpanded} active={activeModule === 'night_audit'} onClick={() => { setActiveModule('night_audit'); setMobileMenuOpen(false); }} />
              </>
            )}
          </NavSection>

          {/* Artificial Intelligence */}
          <NavSection label="Intelligence" expanded={expandedSections.intelligence} onToggle={() => toggleSection('intelligence')} sidebarExpanded={sidebarExpanded}>
            <NavItem icon={<Brain size={18} />} label="AI Command Center" expanded={sidebarExpanded} active={activeModule === 'ai_command_center'} onClick={() => { setActiveModule('ai_command_center'); setMobileMenuOpen(false); }} />
            <NavItem icon={<Sparkles size={18} />} label="Autonomic Core" expanded={sidebarExpanded} active={activeModule === 'suggestions'} onClick={() => { setActiveModule('suggestions'); setMobileMenuOpen(false); }} />
          </NavSection>

          {/* Revenue Management */}
          {(['GM', 'Manager', 'Finance', 'GENERAL_MANAGER', 'DIRECTOR_OPS', 'FINANCE_MANAGER', 'REVENUE_MANAGER'].includes(activeRole)) && (
            <NavSection label="Revenue" expanded={expandedSections.revenue} onToggle={() => toggleSection('revenue')} sidebarExpanded={sidebarExpanded}>
              <NavItem icon={<TrendingUp size={18} />} label="Yield Management" expanded={sidebarExpanded} active={activeModule === 'yield_dashboard'} onClick={() => { setActiveModule('yield_dashboard'); setMobileMenuOpen(false); }} />
              <NavItem icon={<DollarSign size={18} />} label="Rate Calendar" expanded={sidebarExpanded} active={activeModule === 'rate_calendar'} onClick={() => { setActiveModule('rate_calendar'); setMobileMenuOpen(false); }} />
              <NavItem icon={<BarChart3 size={18} />} label="Demand Analysis" expanded={sidebarExpanded} active={activeModule === 'demand_analysis'} onClick={() => { setActiveModule('demand_analysis'); setMobileMenuOpen(false); }} />
            </NavSection>
          )}

          {/* Back Office */}
          {(['GM', 'Manager', 'Finance', 'GENERAL_MANAGER', 'DIRECTOR_OPS', 'FINANCE_MANAGER'].includes(activeRole)) && (
            <NavSection label="Back Office" expanded={expandedSections.back_office} onToggle={() => toggleSection('back_office')} sidebarExpanded={sidebarExpanded}>
              <NavItem icon={<Wallet size={18} />} label="Finance" expanded={sidebarExpanded} active={activeModule === 'finance'} onClick={() => { setActiveModule('finance'); setMobileMenuOpen(false); }} />
              <NavItem icon={<UsersRound size={18} />} label="Human Capital" expanded={sidebarExpanded} active={activeModule === 'hr'} onClick={() => { setActiveModule('hr'); setMobileMenuOpen(false); }} />
              <NavItem icon={<Truck size={18} />} label="Procurement" expanded={sidebarExpanded} active={activeModule === 'procurement'} onClick={() => { setActiveModule('procurement'); setMobileMenuOpen(false); }} />
              <NavItem icon={<TrendingUp size={18} />} label="Sales & Marketing" expanded={sidebarExpanded} active={activeModule === 'sales_marketing'} onClick={() => { setActiveModule('sales_marketing'); setMobileMenuOpen(false); }} />
            </NavSection>
          )}

          {/* Infrastructure */}
          {(['GM', 'Supervisor', 'GENERAL_MANAGER', 'CHIEF_ENGINEER', 'SECURITY_MANAGER'].includes(activeRole)) && (
            <NavSection label="Infrastructure" expanded={expandedSections.infrastructure} onToggle={() => toggleSection('infrastructure')} sidebarExpanded={sidebarExpanded}>
              <NavItem icon={<Wrench size={18} />} label="Engineering" expanded={sidebarExpanded} active={activeModule === 'engineering'} onClick={() => { setActiveModule('engineering'); setMobileMenuOpen(false); }} />
              <NavItem icon={<Shield size={18} />} label="Security" expanded={sidebarExpanded} active={activeModule === 'security'} onClick={() => { setActiveModule('security'); setMobileMenuOpen(false); }} />
              <NavItem icon={<Zap size={18} />} label="IOT Control" expanded={sidebarExpanded} active={activeModule === 'iot'} onClick={() => { setActiveModule('iot'); setMobileMenuOpen(false); }} />
            </NavSection>
          )}

          {/* Brand & Quality */}
          <NavSection label="Brand" expanded={expandedSections.brand} onToggle={() => toggleSection('brand')} sidebarExpanded={sidebarExpanded}>
            <NavItem icon={<BookOpen size={18} />} label="Brand Standards" expanded={sidebarExpanded} active={activeModule === 'brand_standards'} onClick={() => { setActiveModule('brand_standards'); setMobileMenuOpen(false); }} />
          </NavSection>

          {/* System Control */}
          <NavSection label="System" expanded={expandedSections.system} onToggle={() => toggleSection('system')} sidebarExpanded={sidebarExpanded}>
            <NavItem icon={<TerminalIcon size={18} />} label="Terminal" expanded={sidebarExpanded} active={activeModule === 'terminal'} onClick={() => { setActiveModule('terminal'); setMobileMenuOpen(false); }} />

            {(['GM', 'Manager', 'GENERAL_MANAGER'].includes(activeRole)) && (
              <NavItem icon={<Settings size={18} />} label="Configuration" expanded={sidebarExpanded} active={activeModule === 'configuration'} onClick={() => { setActiveModule('configuration'); setMobileMenuOpen(false); }} />
            )}
          </NavSection>
        </nav>

        {/* User Profile & Sign Out */}
        <div className="flex-shrink-0 border-t border-white/5 p-3">
          {sidebarExpanded ? (
            <div className="space-y-2">
              {/* User Profile */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <UserIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200 truncate">{displayName}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{activeRole}</div>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-all group"
              >
                <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button className="w-full p-3 flex justify-center rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-sky-400">
                <UserIcon size={16} />
              </button>
              <button
                onClick={logout}
                className="w-full p-3 flex justify-center rounded-xl text-zinc-600 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-all"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 w-full min-w-0 flex flex-col h-full relative">
        {/* The System Canvas - Global Diagnostic */}
        <SystemCanvas />

        {/* Floating Mobile Trigger */}
        <button
          className="lg:hidden absolute top-4 left-4 z-[90] p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-sky-400"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={20} />
        </button>

        <div className="flex-1 w-full min-w-0 relative overflow-auto pt-14 lg:pt-0">
          {renderContent()}
        </div>
      </main>
      <NeuralSidepanel expanded={neuralPanelExpanded} setExpanded={setNeuralPanelExpanded} />
    </div>
  );
};

const OpsApp: React.FC<OpsAppProps> = (props) => (
  <AppEnvironmentProvider>
    <OpsAppContent {...props} />
  </AppEnvironmentProvider>
);

export default OpsApp;
