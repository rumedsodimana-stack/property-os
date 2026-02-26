import React, { useState, useMemo } from 'react';
import { CURRENT_PROPERTY } from '../../services/kernel/config';
import { usePms } from '../../services/kernel/persistence';
import { addItem } from '../../services/kernel/firestoreService';
import { parseBeoText } from '../../services/operations/beoCopilotService';
import { Calendar, Users, MapPin, DollarSign, FileText, CheckCircle, Clock, Plus, Filter, MoreHorizontal, Wine, Briefcase, Music, Search, Activity, X, Sparkles, LayoutTemplate, Trash2, Calculator, ChevronLeft, ChevronRight, List } from 'lucide-react';
import OracleWidget from '../shared/OracleWidget';
import Inspectable from '../shared/Inspectable';
import { useInspector } from '../../context/InspectorContext';
import { BanquetEvent, BEOAgendaItem, BEOFoodItem } from '../../types';

import { workflowEngine } from '../../services/kernel/workflowEngine';
import { ReportEngine } from '../shared/ReportEngine';
import { oracleService } from '../../services/intelligence/oracleService';

import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday, isSameDay, parseISO } from 'date-fns';

const EventManagement: React.FC = () => {
  const { inspect } = useInspector();
  const { events: EVENTS } = usePms();
  const [activeTab, setActiveTab] = useState<'List' | 'Calendar' | 'Contracts' | 'Reports'>('List');
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  // Dual-Mode State
  const [builderMode, setBuilderMode] = useState<'Selection' | 'Autopilot' | 'Manual'>('Selection');
  const [autopilotText, setAutopilotText] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // Expanded Event State
  const [newEvent, setNewEvent] = useState<Partial<BanquetEvent>>({
    name: '', clientName: '', type: 'Conference', startDate: '', endDate: '',
    pax: 50, venueId: 'ven_conf_a', totalValue: 0,
    setupStyle: 'Classroom', agenda: [], foodAndBeverage: []
  });
  const [submitting, setSubmitting] = useState(false);

  // F&B Functions
  const { menuItems: MENU_ITEMS, recipes: RECIPES } = usePms();

  // Oracle AI Intelligence
  const eventIntel = useMemo(() => oracleService.getEventIntel(EVENTS), [EVENTS]);

  const addFoodItem = () => {
    setNewEvent(prev => ({
      ...prev,
      foodAndBeverage: [...(prev.foodAndBeverage || []), {
        recipeId: MENU_ITEMS[0]?.id || '',
        quantity: prev.pax || 50,
        serveTime: '12:00',
        specialRequests: ''
      }]
    }));
  };

  const updateFoodItem = (index: number, field: keyof BEOFoodItem, value: any) => {
    setNewEvent(prev => {
      const newFB = [...(prev.foodAndBeverage || [])];
      newFB[index] = { ...newFB[index], [field]: value };
      return { ...prev, foodAndBeverage: newFB };
    });
  };

  const removeFoodItem = (index: number) => {
    setNewEvent(prev => ({
      ...prev,
      foodAndBeverage: (prev.foodAndBeverage || []).filter((_, i) => i !== index)
    }));
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.clientName || !newEvent.startDate) return;
    setSubmitting(true);

    // 1. Create the Event as highly tentative / pending approval
    const eventId = `evt_${Date.now()}`;
    const payload = {
      ...newEvent,
      id: eventId,
      status: 'Tentative',
      pax: Number(newEvent.pax),
      totalValue: Number(newEvent.totalValue),
    };
    await addItem('events', payload as any);

    // 2. Submit the Event for OS Workflow Approval
    try {
      await workflowEngine.submit(
        'banquetEvent',
        eventId,
        `BEO Approval: ${newEvent.name} (${CURRENT_PROPERTY.currency} ${newEvent.totalValue})`,
        'create_event' // Must map to a permission setting
      );
      alert("Event drafted and submitted for GM/Finance approval.");
    } catch (e: any) {
      console.error("Workflow submission failed", e);
      alert("Event saved as Tentative, but workflow approval could not be requested: " + e.message);
    }

    // Reset state
    setShowNewEventModal(false);
    setBuilderMode('Selection');
    setAutopilotText('');
    setNewEvent({ name: '', clientName: '', type: 'Conference', startDate: '', endDate: '', pax: 50, venueId: 'ven_conf_a', totalValue: 0, setupStyle: 'Classroom', agenda: [], foodAndBeverage: [] });
    setSubmitting(false);
  };

  const handleAutopilot = async () => {
    if (!autopilotText.trim()) return;
    setIsCopilotThinking(true);
    try {
      const parsedEvent = await parseBeoText(autopilotText);
      setNewEvent(prev => ({
        ...prev,
        ...parsedEvent
      }));
      setBuilderMode('Manual'); // Switch to manual to review the AI generated output
    } catch (e) {
      console.error(e);
      alert("Failed to parse event details.");
    }
    setIsCopilotThinking(false);
  };

  const addAgendaItem = () => {
    setNewEvent(prev => ({
      ...prev,
      agenda: [...(prev.agenda || []), {
        id: `ag_temp_${Date.now()}`,
        timeStart: '09:00',
        timeEnd: '10:00',
        title: 'New Session',
        departmentResponsibility: 'Banquet',
        isCompleted: false
      }]
    }));
  };

  const updateAgendaItem = (index: number, field: keyof BEOAgendaItem, value: any) => {
    setNewEvent(prev => {
      const newAgenda = [...(prev.agenda || [])];
      newAgenda[index] = { ...newAgenda[index], [field]: value };
      return { ...prev, agenda: newAgenda };
    });
  };

  const removeAgendaItem = (index: number) => {
    setNewEvent(prev => ({
      ...prev,
      agenda: (prev.agenda || []).filter((_, i) => i !== index)
    }));
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'Wedding': return <Music className="w-5 h-5 text-rose-400" />;
      case 'Conference': return <Briefcase className="w-5 h-5 text-cyan-400" />;
      default: return <Wine className="w-5 h-5 text-violet-400" />;
    }
  };

  return (
    <div className="module-container">
      {/* Event Command Header */}
      <div className="module-header glass-panel">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-violet-600/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-light text-white tracking-tight">Catering & Events</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Banqueting & Sales</p>
          </div>
        </div>

        {/* Action Switcher */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
          {[
            { id: 'List', label: 'BEO List', icon: List },
            { id: 'Calendar', label: 'Calendar', icon: Calendar },
            { id: 'Contracts', label: 'Vault', icon: FileText },
            { id: 'Reports', label: 'BI', icon: Calculator },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === item.id
                ? 'bg-zinc-800 text-white shadow-lg shadow-black/40'
                : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              <item.icon size={12} />
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewEventModal(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-violet-900/40 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New BEO
          </button>
        </div>
      </div>

      <main className="module-body flex flex-col gap-8">
        {/* AI-Enhanced KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 shrink-0">
          <EventKPI label="Confirmed Revenue" value={`${(eventIntel.kpis.confirmedRevenue / 1000).toFixed(1)}k`} sub="BHD" color="text-emerald-400" />
          <EventKPI label="Pipeline Value" value={`${(eventIntel.kpis.pipelineRevenue / 1000).toFixed(1)}k`} sub="BHD" color="text-violet-400" />
          <EventKPI label="Conversion" value={`${eventIntel.kpis.conversionRate.toFixed(0)}%`} sub="Rate" color="text-cyan-400" />
          <EventKPI label="Confirmed" value={eventIntel.kpis.confirmedCount.toString()} sub="Events" color="text-teal-400" />
          <EventKPI label="Tentative" value={eventIntel.kpis.tentativeCount.toString()} sub="Pending" color="text-amber-400" />
          <EventKPI label="Total Pax" value={eventIntel.kpis.totalPax.toString()} sub="Guests" color="text-zinc-400" />
        </div>

        {/* Oracle Pulse Bar */}
        {eventIntel.alerts.length > 0 && (
          <div className="bg-gradient-to-r from-violet-600/10 via-zinc-900 to-zinc-900 border border-violet-500/20 rounded-2xl p-5 flex items-start gap-4 animate-fadeIn">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-900/30 shrink-0">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Oracle Pulse — Events</h4>
                <span className="text-[8px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded font-bold">LIVE</span>
              </div>
              <div className="space-y-1.5">
                {eventIntel.alerts.map((alert, i) => (
                  <p key={i} className="text-xs text-zinc-300 leading-relaxed">⚡ {alert}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'List' && (
          <div className="module-grid-dense flex-1 overflow-y-auto custom-scrollbar pr-2">
            {EVENTS.map(event => (
              <Inspectable key={event.id} type="event" id={event.id}>
                <div
                  onClick={() => inspect('event', event.id)}
                  className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 hover:border-violet-500/50 transition relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition text-zinc-600">
                    <MoreHorizontal className="w-5 h-5" />
                  </div>

                  <div className="flex gap-6 mb-8">
                    <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center">
                      {getEventTypeIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-light text-zinc-100">{event.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${event.status === 'Definite' ? 'bg-teal-500/10 text-teal-500 border border-teal-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">{event.clientName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8">
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <Calendar className="w-4 h-4 text-zinc-600" />
                      {new Date(event.startDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <Clock className="w-4 h-4 text-zinc-600" />
                      {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <MapPin className="w-4 h-4 text-zinc-600" />
                      {event.venueId === 'ven_ballroom' ? 'Grand Ballroom' : 'Conference Room A'}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <MapPin className="w-4 h-4 text-zinc-600" />
                      {event.venueId}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <Users className="w-4 h-4 text-zinc-600" />
                      {event.pax} Attendees
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-600 font-bold uppercase">Event Value</span>
                      <span className="text-lg font-mono text-zinc-100">
                        {event.totalValue.toLocaleString()} <span className="text-xs text-zinc-500">{CURRENT_PROPERTY.currency}</span>
                      </span>
                    </div>
                    <button className="flex items-center gap-2 text-xs bg-zinc-950 hover:bg-zinc-800 px-4 py-2 rounded-xl border border-zinc-800 transition text-zinc-300 font-bold">
                      <FileText className="w-4 h-4" /> BEO
                    </button>
                  </div>
                </div>
              </Inspectable>
            ))}

            {/* Add New Event - Wired */}
            <div
              onClick={() => setShowNewEventModal(true)}
              className="bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center hover:border-violet-500/50 transition cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Plus className="w-6 h-6 text-zinc-600 group-hover:text-violet-500" />
              </div>
              <span className="text-sm font-bold text-zinc-600 group-hover:text-zinc-400">Create New Booking</span>
            </div>
          </div>
        )}

        {/* --- CALENDAR VIEW --- */}
        {activeTab === 'Calendar' && (
          <div className="flex-1 flex flex-col bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden animate-in fade-in duration-500 shadow-2xl shadow-black/50">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-zinc-900/40">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-2xl font-light text-white tracking-tight min-w-[180px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </h3>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="ml-4 px-3 py-1.5 text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition duration-200">
                  Today
                </button>
              </div>
              <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500" /> Definite</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> Tentative</div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/20">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 border-b border-white/5 bg-zinc-900/40 backdrop-blur-md">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="py-3 text-center text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto custom-scrollbar">
                {(() => {
                  const monthStart = startOfMonth(currentDate);
                  const monthEnd = endOfMonth(monthStart);
                  const startDate = startOfWeek(monthStart);
                  const endDate = endOfWeek(monthEnd);
                  const dateFormat = "d";
                  const days = eachDayOfInterval({ start: startDate, end: endDate });

                  return days.map((day, idx) => {
                    const isSameMon = isSameMonth(day, monthStart);
                    const isTodayDate = isToday(day);

                    // Filter events for this day
                    const dayEvents = EVENTS.filter(e => e.startDate && isSameDay(parseISO(e.startDate), day));

                    return (
                      <div
                        key={idx}
                        className={`min-h-[120px] p-2 border-r border-b border-white/5 relative group transition-colors duration-300 ${!isSameMon ? 'bg-zinc-950/80 text-zinc-700' : 'hover:bg-zinc-900/30'} ${isTodayDate ? 'bg-[var(--system-accent-alpha)]/10' : ''}`}
                      >
                        {/* Date Number Indicator */}
                        <div className="flex justify-between items-start mb-2">
                          <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${isTodayDate ? 'bg-[var(--system-accent)] text-white shadow-[0_0_15px_var(--system-accent-alpha)]' : !isSameMon ? 'text-zinc-700' : 'text-zinc-400'}`}>
                            {format(day, dateFormat)}
                          </span>
                          <button onClick={() => { setNewEvent(p => ({ ...p, startDate: format(day, 'yyyy-MM-dd') })); setShowNewEventModal(true); setBuilderMode('Selection'); }} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-[var(--system-accent)] transition">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Events List for Day */}
                        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[85px] custom-scrollbar pr-1">
                          {dayEvents.map(evt => (
                            <Inspectable key={evt.id} type="event" id={evt.id}>
                              <div
                                onClick={(e) => { e.stopPropagation(); inspect('event', evt.id); }}
                                className={`text-[10px] truncate px-2 py-1.5 rounded-lg border font-medium cursor-pointer transition-all hover:brightness-125
                                ${evt.status === 'Definite'
                                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/20 hover:border-teal-500/40'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500/40'}`}
                              >
                                {evt.name}
                              </div>
                            </Inspectable>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* --- CONTRACTS VIEW --- */}
        {activeTab === 'Contracts' && (
          <div className="flex-1 flex gap-6 min-h-0 animate-in fade-in duration-500">
            {/* Left Pane: Contract List */}
            <div className="w-1/3 flex flex-col gap-4">
              <div className="bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col h-full shadow-2xl shadow-black/50">
                <h3 className="text-xl font-light text-white mb-6">Pending & Signed</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
                  {EVENTS.filter(e => e.status === 'Tentative' || e.status === 'Definite').map(evt => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedContractId(evt.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group
                        ${selectedContractId === evt.id
                          ? 'bg-[var(--system-accent-alpha)]/20 border-[var(--system-accent)] shadow-[0_0_20px_var(--system-accent-alpha)]'
                          : 'bg-zinc-900/40 border-white/5 hover:border-white/20 hover:bg-zinc-900/60'}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-bold text-white group-hover:text-[var(--system-accent)] transition-colors">{evt.name}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${evt.status === 'Definite' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                          {evt.status}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        {evt.startDate} • {evt.pax} Pax
                      </div>
                    </div>
                  ))}
                  {EVENTS.filter(e => e.status === 'Tentative' || e.status === 'Definite').length === 0 && (
                    <div className="text-center text-sm text-zinc-600 mt-10">No active contracts found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Pane: Document Viewer */}
            <div className="flex-1 bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 overflow-y-auto custom-scrollbar shadow-2xl shadow-black/50 flex flex-col relative">
              {selectedContractId ? (() => {
                const contract = EVENTS.find(e => e.id === selectedContractId);
                if (!contract) return null;

                const isSigned = contract.status === 'Definite';

                return (
                  <div className="animate-in fade-in max-w-2xl mx-auto w-full pt-8 pb-12 relative flex flex-col h-full">
                    {/* Security Watermark */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] overflow-hidden">
                      <div className="text-9xl font-black uppercase tracking-tighter rotate-[-45deg] whitespace-nowrap text-white">Singularity OS Vault</div>
                    </div>

                    <div className="flex justify-between items-end mb-10 border-b border-zinc-800 pb-8 relative z-10">
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <LayoutTemplate className="w-8 h-8 text-[var(--system-accent)]" />
                          <h2 className="text-3xl font-light text-white tracking-tight">Banquet Event Order</h2>
                        </div>
                        <p className="text-zinc-500 text-sm font-mono">{contract.id.toUpperCase()}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-light text-white mb-1">{contract.name}</div>
                        <div className="text-zinc-500 text-sm">{contract.clientName || 'Internal Client'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-12 relative z-10 text-sm">
                      <div className="flex flex-col gap-6">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Date & Time</div>
                          <div className="text-zinc-300 font-medium">{contract.startDate} — {contract.endDate || contract.startDate}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Guaranteed Pax</div>
                          <div className="text-zinc-300 font-medium flex items-center gap-2">
                            <Users className="w-4 h-4 text-zinc-500" />
                            {contract.pax} Attendees
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-6">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Setup Style</div>
                          <div className="text-zinc-300 font-medium flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-zinc-500" />
                            {contract.setupStyle || 'Standard configuration'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">Projected F&B Revenue</div>
                          <div className="text-emerald-400 font-bold flex items-center gap-1.5 text-base">
                            <DollarSign className="w-4 h-4" />
                            {contract.projectedRevenue?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-12 relative z-10">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-3 border-b border-zinc-800 pb-2">Requirements Summary</div>
                      <div className="bg-zinc-900/30 p-5 rounded-2xl border border-white/5 text-sm text-zinc-400 leading-relaxed font-serif italic">
                        "The client requests a fully prepared {contract.setupStyle} setup for {contract.pax} guests beginning at 0800 hours. A dedicated coffee station is required outside the primary venue doors. All dietary restrictions (if specified) must be addressed by the culinary team prior to execution..."
                      </div>
                    </div>

                    {/* Signature Block */}
                    <div className="mt-auto border-t border-zinc-800 pt-8 relative z-10">
                      {!isSigned ? (
                        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
                          <span className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" /> Awaiting Signature
                          </span>
                          <p className="text-zinc-500 text-sm text-center max-w-xs mb-8">
                            By signing this digital BEO, you commit the property resources required to execute this event as detailed above.
                          </p>
                          <button
                            onClick={() => {
                              const el = document.getElementById('signature-btn');
                              if (el) {
                                el.innerHTML = '<span class="animate-pulse">Authorizing...</span>';
                                setTimeout(() => {
                                  alert(`Contract ${contract.id.toUpperCase()} Digitally Signed! In production, this shifts the event back to Definite status.`);
                                  el.innerHTML = '<div class="flex items-center gap-2"><CheckCircle class="w-4 h-4" /> Signed</div>';
                                }, 1500);
                              }
                            }}
                            id="signature-btn"
                            className="px-8 py-3 bg-[var(--system-accent)] hover:bg-[var(--system-accent)]/80 text-white rounded-xl font-bold tracking-wide shadow-[0_0_20px_var(--system-accent-alpha)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border-0"
                          >
                            Digitally Sign & Approve
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-8 border border-teal-500/20 rounded-3xl bg-teal-500/5 relative overflow-hidden">
                          <div className="absolute -right-10 -top-10 text-teal-500/10">
                            <CheckCircle className="w-40 h-40" />
                          </div>
                          <span className="text-teal-400 text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
                            <CheckCircle className="w-5 h-5" /> Contract Executed
                          </span>
                          <p className="text-zinc-500 text-xs font-mono relative z-10">
                            Timestamp: {new Date().toISOString()}
                          </p>
                          <div className="mt-6 font-signature text-4xl text-white/50 relative z-10 opacity-70">
                            Signed electronically on behalf of Singularity OS
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <FileText className="w-16 h-16 text-zinc-800 mb-6" />
                  <h3 className="text-lg font-light text-zinc-400">No Contract Selected</h3>
                  <p className="text-sm text-zinc-600 mt-2 max-w-xs leading-relaxed italic">
                    Select a tentative or definite event from the left pane to review its digital Banquet Event Order.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- REPORTS VIEW --- */}
        {activeTab === 'Reports' && (
          <div className="flex-1 flex flex-col gap-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar pr-4">

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-light text-white tracking-tight">Banqueting Executive Summary</h3>
                <p className="text-zinc-500 text-sm mt-1">Real-time pipeline and conversion metrics for Catering & Events.</p>
              </div>
              <button className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-violet-500 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-300 transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" /> Export PDF
              </button>
            </div>

            {/* Top KPI Row */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-zinc-950/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex flex-col">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-emerald-500" /> Pipeline (Definite)
                </span>
                <span className="text-3xl font-light text-white tracking-tighter">
                  {CURRENT_PROPERTY.currency} {EVENTS.filter(e => e.status === 'Definite').reduce((acc, curr) => acc + (curr.projectedRevenue || 0), 0).toLocaleString()}
                </span>
                <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <Activity className="w-3 h-3" /> +12% vs last month
                </div>
              </div>

              <div className="bg-zinc-950/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex flex-col">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-amber-500" /> Pipeline (Tentative)
                </span>
                <span className="text-3xl font-light text-white tracking-tighter">
                  {CURRENT_PROPERTY.currency} {EVENTS.filter(e => e.status === 'Tentative').reduce((acc, curr) => acc + (curr.projectedRevenue || 0), 0).toLocaleString()}
                </span>
                <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-zinc-500 font-medium">
                  Current projected pipeline
                </div>
              </div>

              <div className="bg-zinc-950/40 backdrop-blur-xl border border-[var(--system-accent)]/20 p-6 rounded-3xl flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-[var(--system-accent)]/5 group-hover:bg-[var(--system-accent)]/10 transition-colors" />
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[var(--system-accent)] mb-4 flex items-center gap-2 relative z-10">
                  <Users className="w-3 h-3" /> Total Pax Expected
                </span>
                <span className="text-3xl font-light text-white tracking-tighter relative z-10">
                  {EVENTS.reduce((acc, curr) => acc + (curr.pax || 0), 0).toLocaleString()}
                </span>
                <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-[var(--system-accent)] font-medium relative z-10">
                  Across {EVENTS.length} Events
                </div>
              </div>

              <div className="bg-zinc-950/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex flex-col">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-sky-500" /> Conversion Rate
                </span>
                <span className="text-3xl font-light text-white tracking-tighter">
                  68<span className="text-lg text-zinc-500">%</span>
                </span>
                <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <Activity className="w-3 h-3" /> +4.2% trajectory
                </div>
              </div>
            </div>

            {/* Middle Section: Breakdown */}
            <div className="grid grid-cols-2 gap-6">
              {/* Event Typology Breakdowns */}
              <div className="bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
                <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 border-b border-zinc-800 pb-4 mb-6">Revenue By Segment</h4>
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-white mb-2">
                      <span className="flex items-center gap-2"><Briefcase className="w-3 h-3 text-violet-500" /> Corporate / Conference</span>
                      <span>65%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: '65%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-white mb-2">
                      <span className="flex items-center gap-2"><Wine className="w-3 h-3 text-pink-500" /> Weddings & Social</span>
                      <span>25%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full" style={{ width: '25%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-white mb-2">
                      <span className="flex items-center gap-2"><Music className="w-3 h-3 text-amber-500" /> Internal / Promo</span>
                      <span>10%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '10%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Highlights */}
              <div className="bg-zinc-950/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col">
                <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 border-b border-zinc-800 pb-4 mb-4">Urgent Actions</h4>

                <div className="flex-1 flex flex-col gap-3">
                  {EVENTS.filter(e => e.status === 'Tentative').slice(0, 3).map(evt => (
                    <div key={evt.id} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex justify-between items-center group cursor-pointer hover:bg-amber-500/10 transition">
                      <div>
                        <div className="text-sm font-bold text-amber-500 group-hover:text-amber-400">{evt.name}</div>
                        <div className="text-[10px] text-amber-500/70 uppercase tracking-wider">{evt.clientName || 'Pending Setup'}</div>
                      </div>
                      <button className="text-xs font-bold bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-500/30 transition border-0">Review BEO</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Standard Footer */}
      <footer className="module-footer">
        <div className="flex items-center gap-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
          <Activity className="w-3 h-3 text-emerald-500" /> BEOs Updated
          <div className="h-4 w-[1px] bg-zinc-800" />
          <span>User: Sales_Manager_Bahrain</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[9px] text-zinc-500 uppercase font-medium">Singularity Grand • Events Core</div>
        </div>
      </footer>

      {/* New Dual-Mode BEO Builder Modal */}
      {showNewEventModal && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
          <div className={`bg-zinc-950 border border-zinc-800 rounded-3xl w-full ${builderMode === 'Selection' ? 'max-w-2xl' : builderMode === 'Autopilot' ? 'max-w-3xl' : 'max-w-7xl'} shadow-2xl overflow-hidden transition-all duration-500 max-h-[90vh] flex flex-col`}>

            {/* Header */}
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <LayoutTemplate className="w-5 h-5 text-violet-500" />
                <h3 className="text-lg font-light text-white">
                  {builderMode === 'Selection' ? 'Create New BEO' : builderMode === 'Autopilot' ? 'AI Autopilot' : 'BEO Builder'}
                </h3>
              </div>
              <button onClick={() => { setShowNewEventModal(false); setBuilderMode('Selection'); setAutopilotText(''); }} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

              {/* STATE 1: SELECTION */}
              {builderMode === 'Selection' && (
                <div className="grid grid-cols-2 gap-6">
                  <div onClick={() => setBuilderMode('Autopilot')} className="group p-8 rounded-2xl border-2 border-dashed border-violet-500/30 hover:border-violet-500 bg-violet-500/5 hover:bg-violet-500/10 cursor-pointer transition-all flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-light text-white mb-2">AI Autopilot</h4>
                    <p className="text-sm text-zinc-400">Paste an email, notes, or transcript. The OS will autonomously build the BEO, timeline, and menus.</p>
                  </div>

                  <div onClick={() => setBuilderMode('Manual')} className="group p-8 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-zinc-900/50 hover:bg-zinc-800 cursor-pointer transition-all flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <LayoutTemplate className="w-8 h-8" />
                    </div>
                    <h4 className="text-xl font-light text-white mb-2">Blank Slate</h4>
                    <p className="text-sm text-zinc-400">Manually construct the event details, agenda, and requirements step-by-step.</p>
                  </div>
                </div>
              )}

              {/* STATE 2: AUTOPILOT INPUT */}
              {builderMode === 'Autopilot' && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-zinc-400">Paste the client communication or raw event notes below. Our AI will extract the pax, dates, schedule, and setup requirements automatically.</p>
                  <textarea
                    value={autopilotText}
                    onChange={(e) => setAutopilotText(e.target.value)}
                    placeholder="e.g., 'Hey Sarah, confirmed for Oct 12th. We have 50 people for a medical conference. We'll need coffee at 9am, lunch at 12pm, and a projector for the whole day...'"
                    className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 outline-none focus:border-violet-500 resize-none font-mono"
                  />
                  {isCopilotThinking && (
                    <div className="flex items-center gap-3 text-violet-400 text-sm font-medium p-4 bg-violet-500/10 rounded-xl border border-violet-500/20 mt-4 animate-pulse">
                      <Sparkles className="w-5 h-5 animate-spin" />
                      Singularity OS is building the BEO...
                    </div>
                  )}
                </div>
              )}

              {/* STATE 3: MANUAL BUILDER (Or AI Review) */}
              {builderMode === 'Manual' && (
                <div className="grid grid-cols-12 gap-8 h-full">
                  {/* Left Column: Core Details */}
                  <div className="col-span-4 flex flex-col gap-5 pr-8 border-r border-zinc-800/50">
                    <div className="mb-2">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Event Profile</h4>
                      {newEvent.isAIGenerated && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase rounded border border-violet-500/30">
                          <Sparkles className="w-3 h-3" /> AI Generated
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Event Name</label>
                      <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500" value={newEvent.name || ''} onChange={e => setNewEvent(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Client Name</label>
                      <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500" value={newEvent.clientName || ''} onChange={e => setNewEvent(p => ({ ...p, clientName: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Type</label>
                        <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500" value={newEvent.type || 'Meeting'} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value as any }))}>
                          {['Wedding', 'Conference', 'Gala', 'Meeting'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Setup Style</label>
                        <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500" value={newEvent.setupStyle || 'Classroom'} onChange={e => setNewEvent(p => ({ ...p, setupStyle: e.target.value as any }))}>
                          {['Classroom', 'Theater', 'Banquet', 'U-Shape', 'Custom'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Start Date</label>
                        <input type="date" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500" value={newEvent.startDate || ''} onChange={e => setNewEvent(p => ({ ...p, startDate: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">End Date</label>
                        <input type="date" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500" value={newEvent.endDate || ''} onChange={e => setNewEvent(p => ({ ...p, endDate: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Pax (Guests)</label>
                        <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500" value={newEvent.pax || 0} onChange={e => setNewEvent(p => ({ ...p, pax: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Venue</label>
                        <select className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500" value={newEvent.venueId || 'ven_ballroom'} onChange={e => setNewEvent(p => ({ ...p, venueId: e.target.value }))}>
                          <option value="ven_ballroom">Grand Ballroom</option>
                          <option value="ven_conf_a">Conference Room A</option>
                          <option value="ven_garden">Garden Terrace</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 uppercase font-bold block mb-1">Estimated Event Value ({CURRENT_PROPERTY.currency})</label>
                      <input type="number" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-500" value={newEvent.totalValue || 0} onChange={e => setNewEvent(p => ({ ...p, totalValue: Number(e.target.value) }))} />
                    </div>

                    {/* Dynamic Cost Calculation Block */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mt-2">
                      <h5 className="text-[10px] uppercase font-bold text-zinc-500 mb-3 flex items-center gap-2">
                        <Calculator className="w-3.5 h-3.5" /> F&B Margin Analysis
                      </h5>

                      {(() => {
                        const fbCost = (newEvent.foodAndBeverage || []).reduce((acc, item) => {
                          const recipe = MENU_ITEMS.find(m => m.id === item.recipeId);
                          return acc + ((recipe?.price || 0) * (item.quantity || 0));
                        }, 0);
                        const eventValue = newEvent.totalValue || 0;
                        const marginInBhd = eventValue - fbCost;
                        const marginPercent = eventValue > 0 ? (marginInBhd / eventValue) * 100 : 0;

                        return (
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-zinc-400">Est F&B Cost</span>
                              <span className="text-xs font-mono text-zinc-300">{CURRENT_PROPERTY.currency} {fbCost.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-zinc-400">Quoted Value</span>
                              <span className="text-xs font-mono text-zinc-300">{CURRENT_PROPERTY.currency} {eventValue.toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-zinc-800 my-1" />
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-zinc-300">Projected Margin</span>
                              <span className={`text-sm font-mono font-bold ${marginPercent >= 60 ? 'text-emerald-400' : marginPercent > 30 ? 'text-amber-400' : 'text-rose-400'}`}>
                                {marginPercent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Right Column: The Agenda Timeline Builder */}
                  <div className="col-span-8 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Event Agenda & Execution Timeline</h4>
                      <button onClick={addAgendaItem} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 text-xs font-bold text-zinc-300 transition">
                        <Plus className="w-3.5 h-3.5" /> Add Block
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
                      {newEvent.agenda?.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-sm">
                          No agenda items defined. Add blocks for setup, meals, and meetings.
                        </div>
                      ) : (
                        newEvent.agenda?.map((item, index) => (
                          <div key={item.id} className="group flex gap-4 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition">
                            {/* Times */}
                            <div className="flex flex-col gap-2 w-24 shrink-0">
                              <input type="time" className="bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1 text-xs text-zinc-300 outline-none focus:border-violet-500" value={item.timeStart} onChange={e => updateAgendaItem(index, 'timeStart', e.target.value)} />
                              <input type="time" className="bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1 text-xs text-zinc-300 outline-none focus:border-violet-500" value={item.timeEnd} onChange={e => updateAgendaItem(index, 'timeEnd', e.target.value)} />
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col gap-2">
                              <input className="w-full bg-transparent border-b border-zinc-800 focus:border-violet-500 px-1 py-1 text-sm font-medium text-white outline-none placeholder:text-zinc-600" placeholder="Session Title (e.g. Coffee Break)" value={item.title} onChange={e => updateAgendaItem(index, 'title', e.target.value)} />
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] uppercase text-zinc-500 font-bold">Dept:</span>
                                <select className="bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400 outline-none focus:border-violet-500" value={item.departmentResponsibility} onChange={e => updateAgendaItem(index, 'departmentResponsibility', e.target.value)}>
                                  <option value="Banquet">Banquet</option>
                                  <option value="Kitchen">Kitchen</option>
                                  <option value="AV">A/V & Tech</option>
                                  <option value="FrontDesk">Front Desk</option>
                                  <option value="All">All Departments</option>
                                </select>
                              </div>
                            </div>

                            {/* Actions */}
                            <button onClick={() => removeAgendaItem(index)} className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 rounded-lg transition self-start">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Divider between Agenda and F&B */}
                    <div className="h-px bg-zinc-800 my-6 shrink-0" />

                    <div className="flex justify-between items-center mb-6 shrink-0">
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Food & Beverage Requirements</h4>
                      <button onClick={addFoodItem} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 text-xs font-bold text-zinc-300 transition">
                        <Plus className="w-3.5 h-3.5" /> Add Menu Item
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
                      {newEvent.foodAndBeverage?.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-sm">
                          No F&B items selected. Add items to include them in the BEO and generate kitchen prep lists.
                        </div>
                      ) : (
                        newEvent.foodAndBeverage?.map((item, index) => {
                          const menuItem = MENU_ITEMS.find(m => m.id === item.recipeId);
                          return (
                            <div key={`fb_${index}`} className="group flex gap-4 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition relative">

                              <div className="flex flex-col gap-2 w-24 shrink-0">
                                <label className="text-[9px] uppercase font-bold text-zinc-500">Serve Time</label>
                                <input type="time" className="bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1 text-xs text-zinc-300 outline-none focus:border-violet-500" value={item.serveTime} onChange={e => updateFoodItem(index, 'serveTime', e.target.value)} />
                              </div>

                              <div className="flex-1 flex flex-col gap-3">
                                <div>
                                  <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Menu Item (Recipe)</label>
                                  <select className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-300 outline-none focus:border-violet-500" value={item.recipeId} onChange={e => updateFoodItem(index, 'recipeId', e.target.value)}>
                                    <option value="" disabled>Select Item...</option>
                                    {MENU_ITEMS.map(mi => (
                                      <option key={mi.id} value={mi.id}>{mi.name} - {CURRENT_PROPERTY.currency} {mi.price} / pax</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex gap-4">
                                  <div className="flex-1">
                                    <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Quantity/Pax</label>
                                    <input type="number" className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1.5 text-sm text-zinc-300 outline-none focus:border-violet-500" value={item.quantity} onChange={e => updateFoodItem(index, 'quantity', Number(e.target.value))} />
                                  </div>
                                  <div className="flex-[2]">
                                    <label className="text-[9px] uppercase font-bold text-zinc-500 block mb-1">Special Req / Dietaries</label>
                                    <input type="text" className="w-full bg-zinc-950 border-b border-zinc-800 px-1 py-1.5 text-sm font-medium text-white outline-none placeholder:text-zinc-600 focus:border-violet-500 transition" placeholder="e.g. 5 Veg, 2 GF" value={item.specialRequests || ''} onChange={e => updateFoodItem(index, 'specialRequests', e.target.value)} />
                                  </div>
                                </div>
                              </div>

                              <div className="absolute top-4 right-4 text-right">
                                <div className="text-[10px] uppercase font-bold text-zinc-500">Subtotal</div>
                                <div className="text-sm font-mono text-zinc-300">
                                  {CURRENT_PROPERTY.currency} {((menuItem?.price || 0) * (item.quantity || 0)).toLocaleString()}
                                </div>
                              </div>

                              <button onClick={() => removeFoodItem(index)} className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-zinc-600 hover:text-red-400 rounded-lg transition">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 shrink-0 bg-zinc-950">
              {builderMode === 'Autopilot' ? (
                <>
                  <button onClick={() => setBuilderMode('Selection')} className="px-4 py-2 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl text-sm transition font-bold tracking-wide">Back</button>
                  <button onClick={handleAutopilot} disabled={isCopilotThinking || !autopilotText.trim()} className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center gap-2">
                    {isCopilotThinking ? 'Processing...' : <><Sparkles className="w-4 h-4" /> Generate Setup</>}
                  </button>
                </>
              ) : builderMode === 'Manual' ? (
                <>
                  <button onClick={() => setBuilderMode('Selection')} className="px-4 py-2 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl text-sm transition font-bold tracking-wide">Back to Modes</button>
                  <button onClick={handleCreateEvent} disabled={submitting} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center gap-2">
                    {submitting ? 'Saving...' : <><CheckCircle className="w-4 h-4" /> Approve & Save BEO</>}
                  </button>
                </>
              ) : null}
            </div>

          </div>
        </div>
      )
      }
    </div>
  );
};

const EventKPI = ({ label, value, sub, color }: any) => (
  <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{label}</span>
    <div className={`text-2xl font-light tracking-tighter ${color}`}>
      {value} <span className="text-xs text-zinc-600 font-normal">{sub}</span>
    </div>
  </div>
);

export default EventManagement;
