import React, { useState } from 'react';
import {
  Command,
  UsersRound,
  ConciergeBell,
  Wallet,
  Settings,
  Sparkles,
  Wine,
  Menu,
  Zap,
  BedDouble,
  Truck,
  MessageSquare,
  Terminal as TerminalIcon,
  Wrench,
  Calendar,
  Activity,
  Brain,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Shield,
  BookOpen,
  ChevronDown,
} from 'lucide-react';

// ─── Sub-components ────────────────────────────────────────────────────────

const NavItem = ({
  icon,
  label,
  active = false,
  expanded = true,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  expanded?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    data-active={active ? 'true' : undefined}
    className={`os-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
      active
        ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400'
        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
    }`}
  >
    <div className={`relative z-10 transition-all duration-300 ${active ? 'scale-105 text-violet-400' : 'group-hover:scale-105'}`}>
      {icon}
    </div>
    {expanded && (
      <span className={`text-[11px] font-semibold tracking-wide whitespace-nowrap transition-colors ${active ? 'text-violet-300' : ''}`}>
        {label}
      </span>
    )}
    {active && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_6px_#a78bfa]" />}
  </button>
);

const NavSection = ({
  label,
  icon,
  children,
  expanded,
  onToggle,
  sidebarExpanded,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  sidebarExpanded: boolean;
}) => {
  if (!sidebarExpanded) return <div className="py-2 border-b border-white/5 last:border-0">{children}</div>;

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
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

// ─── Types ─────────────────────────────────────────────────────────────────

export interface OperatorLayoutProps {
  /** Currently active module id (e.g. 'dashboard', 'front_desk') */
  activeModule: string;
  /** Callback when user selects a different module */
  onModuleChange: (moduleId: string) => void;
  /** Display name of the signed-in user */
  displayName: string;
  /** Role string for the signed-in user */
  activeRole: string;
  /** Sign-out handler */
  onLogout: () => void;
  /** The content rendered in the main area (the active module component) */
  children: React.ReactNode;
}

// ─── Icon map ──────────────────────────────────────────────────────────────

const MODULE_ICON: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={18} />,
  connect: <MessageSquare size={18} />,
  front_desk: <ConciergeBell size={18} />,
  housekeeping: <BedDouble size={18} />,
  pos: <Wine size={18} />,
  events: <Calendar size={18} />,
  group_management: <UsersRound size={18} />,
  night_audit: <Activity size={18} />,
  ai_command_center: <Brain size={18} />,
  suggestions: <Sparkles size={18} />,
  finance: <Wallet size={18} />,
  hr: <UsersRound size={18} />,
  procurement: <Truck size={18} />,
  engineering: <Wrench size={18} />,
  security: <Shield size={18} />,
  iot: <Zap size={18} />,
  brand_standards: <BookOpen size={18} />,
  terminal: <TerminalIcon size={18} />,
  configuration: <Settings size={18} />,
};

// ─── Layout component ──────────────────────────────────────────────────────

const OperatorLayout: React.FC<OperatorLayoutProps> = ({
  activeModule,
  onModuleChange,
  displayName,
  activeRole,
  onLogout,
  children,
}) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(window.innerWidth > 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    core: true,
    operations: true,
    intelligence: true,
    back_office: false,
    infrastructure: false,
    brand: true,
    system: false,
  });

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const nav = (moduleId: string) => {
    onModuleChange(moduleId);
    setMobileMenuOpen(false);
  };

  const isManager = ['GM', 'Manager', 'GENERAL_MANAGER', 'DIRECTOR_OPS'].includes(activeRole);
  const isFinance = [...['GM', 'Manager', 'Finance', 'GENERAL_MANAGER', 'DIRECTOR_OPS', 'FINANCE_MANAGER']].includes(activeRole);
  const isInfra = ['GM', 'Supervisor', 'GENERAL_MANAGER', 'CHIEF_ENGINEER', 'SECURITY_MANAGER'].includes(activeRole);
  const isGM = ['GM', 'Manager', 'GENERAL_MANAGER'].includes(activeRole);

  return (
    <div className="w-full min-h-screen h-dvh bg-zinc-950 flex text-zinc-200 font-sans selection:bg-violet-500/30 relative overflow-hidden">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`
          os-app-sidebar fixed inset-y-0 left-0 z-[110] lg:relative lg:flex lg:flex-col
          ${sidebarExpanded ? 'lg:w-[var(--sidebar-width)]' : 'lg:w-20'} w-[var(--sidebar-width)]
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          h-full bg-zinc-950/80 backdrop-blur-2xl border-r border-white/5 transition-all duration-500 ease-out flex flex-col
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-teal-900/30">
              T
            </div>
            {sidebarExpanded && (
              <div className="flex flex-col">
                <span className="font-semibold text-base text-zinc-100 tracking-tight leading-tight">TravelBook Hotel OS</span>
                <span className="text-[9px] font-bold text-teal-400 tracking-widest uppercase">TravelBook Partner ✦</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className="p-2 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-lg transition-all"
          >
            <Menu size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {/* Core */}
          <NavSection label="Core" expanded={expandedSections.core} onToggle={() => toggleSection('core')} sidebarExpanded={sidebarExpanded}>
            <NavItem icon={MODULE_ICON.dashboard} label="Dashboard" expanded={sidebarExpanded} active={activeModule === 'dashboard'} onClick={() => nav('dashboard')} />
            <NavItem icon={MODULE_ICON.connect} label="Connect" expanded={sidebarExpanded} active={activeModule === 'connect'} onClick={() => nav('connect')} />
          </NavSection>

          {/* Operations */}
          <NavSection label="Operations" expanded={expandedSections.operations} onToggle={() => toggleSection('operations')} sidebarExpanded={sidebarExpanded}>
            <NavItem icon={MODULE_ICON.front_desk} label="Front Desk" expanded={sidebarExpanded} active={activeModule === 'front_desk'} onClick={() => nav('front_desk')} />
            <NavItem icon={MODULE_ICON.housekeeping} label="Housekeeping" expanded={sidebarExpanded} active={activeModule === 'housekeeping'} onClick={() => nav('housekeeping')} />
            <NavItem icon={MODULE_ICON.pos} label="F&B / POS" expanded={sidebarExpanded} active={activeModule === 'pos'} onClick={() => nav('pos')} />
            <NavItem icon={MODULE_ICON.events} label="Events" expanded={sidebarExpanded} active={activeModule === 'events'} onClick={() => nav('events')} />
            {isManager && (
              <>
                <NavItem icon={MODULE_ICON.group_management} label="Group Management" expanded={sidebarExpanded} active={activeModule === 'group_management'} onClick={() => nav('group_management')} />
                <NavItem icon={MODULE_ICON.night_audit} label="Night Audit" expanded={sidebarExpanded} active={activeModule === 'night_audit'} onClick={() => nav('night_audit')} />
              </>
            )}
          </NavSection>

          {/* Intelligence */}
          <NavSection label="Intelligence" expanded={expandedSections.intelligence} onToggle={() => toggleSection('intelligence')} sidebarExpanded={sidebarExpanded}>
            <NavItem icon={MODULE_ICON.ai_command_center} label="AI Command Center" expanded={sidebarExpanded} active={activeModule === 'ai_command_center'} onClick={() => nav('ai_command_center')} />
            <NavItem icon={MODULE_ICON.suggestions} label="Autonomic Core" expanded={sidebarExpanded} active={activeModule === 'suggestions'} onClick={() => nav('suggestions')} />
          </NavSection>

          {/* Back Office */}
          {isFinance && (
            <NavSection label="Back Office" expanded={expandedSections.back_office} onToggle={() => toggleSection('back_office')} sidebarExpanded={sidebarExpanded}>
              <NavItem icon={MODULE_ICON.finance} label="Finance" expanded={sidebarExpanded} active={activeModule === 'finance'} onClick={() => nav('finance')} />
              <NavItem icon={MODULE_ICON.hr} label="Human Capital" expanded={sidebarExpanded} active={activeModule === 'hr'} onClick={() => nav('hr')} />
              <NavItem icon={MODULE_ICON.procurement} label="Procurement" expanded={sidebarExpanded} active={activeModule === 'procurement'} onClick={() => nav('procurement')} />
            </NavSection>
          )}

          {/* Infrastructure */}
          {isInfra && (
            <NavSection label="Infrastructure" expanded={expandedSections.infrastructure} onToggle={() => toggleSection('infrastructure')} sidebarExpanded={sidebarExpanded}>
              <NavItem icon={MODULE_ICON.engineering} label="Engineering" expanded={sidebarExpanded} active={activeModule === 'engineering'} onClick={() => nav('engineering')} />
              <NavItem icon={MODULE_ICON.security} label="Security" expanded={sidebarExpanded} active={activeModule === 'security'} onClick={() => nav('security')} />
              <NavItem icon={MODULE_ICON.iot} label="IOT Control" expanded={sidebarExpanded} active={activeModule === 'iot'} onClick={() => nav('iot')} />
            </NavSection>
          )}

          {/* Brand */}
          <NavSection label="Brand" expanded={expandedSections.brand} onToggle={() => toggleSection('brand')} sidebarExpanded={sidebarExpanded}>
            <NavItem icon={MODULE_ICON.brand_standards} label="Brand Standards" expanded={sidebarExpanded} active={activeModule === 'brand_standards'} onClick={() => nav('brand_standards')} />
          </NavSection>

          {/* System */}
          <NavSection label="System" expanded={expandedSections.system} onToggle={() => toggleSection('system')} sidebarExpanded={sidebarExpanded}>
            <NavItem icon={MODULE_ICON.terminal} label="Terminal" expanded={sidebarExpanded} active={activeModule === 'terminal'} onClick={() => nav('terminal')} />
            {isGM && (
              <NavItem icon={MODULE_ICON.configuration} label="Configuration" expanded={sidebarExpanded} active={activeModule === 'configuration'} onClick={() => nav('configuration')} />
            )}
          </NavSection>
        </nav>

        {/* User profile & sign out */}
        <div className="flex-shrink-0 border-t border-white/5 p-3">
          {sidebarExpanded ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                  <UserIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-200 truncate">{displayName}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{activeRole}</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-all group"
              >
                <LogOut size={16} className="group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button className="w-full p-3 flex justify-center rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-violet-400">
                <UserIcon size={16} />
              </button>
              <button
                onClick={onLogout}
                className="w-full p-3 flex justify-center rounded-xl text-zinc-600 hover:text-rose-400 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 transition-all"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────────────── */}
      <main className="flex-1 w-full min-w-0 flex flex-col h-full relative">
        {/* Mobile menu trigger */}
        <button
          className="lg:hidden absolute top-4 left-4 z-[90] p-3 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl text-violet-400"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={20} />
        </button>

        <div className="flex-1 w-full min-w-0 relative overflow-auto pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default OperatorLayout;
