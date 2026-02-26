import React, { useState, useCallback, useMemo } from 'react';
import {
    Calendar, Plus, AlertTriangle, CheckCircle, Brain, Users,
    ChevronLeft, ChevronRight, Download, Save, X, Info, Clock
} from 'lucide-react';
import { StaffMember } from '../../types';

interface RosterBuilderProps { staff: StaffMember[] }

// ─── Shift Patterns ─────────────────────────────────────────────────────────
interface ShiftDef {
    id: string;
    label: string;
    start: string;
    end: string;
    hours: number;
    color: string;
    tag: string;
}

const SHIFT_DEFS: ShiftDef[] = [
    { id: 'morning', label: 'Morning', start: '07:00', end: '15:00', hours: 8, color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', tag: 'M' },
    { id: 'afternoon', label: 'Afternoon', start: '15:00', end: '23:00', hours: 8, color: 'bg-violet-500/20 text-violet-300 border-violet-500/30', tag: 'A' },
    { id: 'night', label: 'Night', start: '23:00', end: '07:00', hours: 8, color: 'bg-sky-500/20 text-sky-300 border-sky-500/30', tag: 'N' },
    { id: 'split', label: 'Split', start: '09:00', end: '18:00', hours: 8, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', tag: 'S' },
    { id: 'off', label: 'OFF', start: '—', end: '—', hours: 0, color: 'bg-zinc-900/50 text-zinc-600 border-zinc-800/50', tag: 'O' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MIN_STAFF_PER_SHIFT = 1;
const MAX_CONSECUTIVE_DAYS = 6;

type RosterGrid = Record<string, Record<number, string>>; // staffId → dayIdx → shiftId

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getWeekLabel(offset: number): string {
    const base = new Date();
    base.setDate(base.getDate() - base.getDay() + 1 + offset * 7);
    const end = new Date(base);
    end.setDate(base.getDate() + 6);
    return `${base.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function detectConflicts(grid: RosterGrid, staffId: string): Set<number> {
    const conflicts = new Set<number>();
    // Check consecutive working days > MAX_CONSECUTIVE_DAYS
    let streak = 0;
    let streakStart = 0;
    for (let d = 0; d < 7; d++) {
        const shift = grid[staffId]?.[d] ?? 'morning';
        if (shift !== 'off') {
            if (streak === 0) streakStart = d;
            streak++;
            if (streak > MAX_CONSECUTIVE_DAYS) {
                for (let i = streakStart; i <= d; i++) conflicts.add(i);
            }
        } else {
            streak = 0;
        }
    }
    // Check back-to-back night → morning (< 11h rest)
    for (let d = 0; d < 6; d++) {
        const today = grid[staffId]?.[d] ?? 'morning';
        const tomorrow = grid[staffId]?.[d + 1] ?? 'morning';
        if (today === 'night' && tomorrow === 'morning') {
            conflicts.add(d);
            conflicts.add(d + 1);
        }
    }
    return conflicts;
}

function buildDefaultRoster(staff: StaffMember[]): RosterGrid {
    const grid: RosterGrid = {};
    const shiftCycle = ['morning', 'afternoon', 'night', 'morning', 'afternoon', 'off', 'off'];
    staff.forEach((s, si) => {
        grid[s.id] = {};
        DAYS.forEach((_, di) => {
            grid[s.id][di] = shiftCycle[(si + di) % shiftCycle.length];
        });
    });
    return grid;
}

function aiSuggestRoster(staff: StaffMember[]): RosterGrid {
    const grid: RosterGrid = {};
    const shifts = ['morning', 'afternoon', 'night'];
    staff.forEach((s, si) => {
        grid[s.id] = {};
        let consecutive = 0;
        for (let d = 0; d < 7; d++) {
            if (consecutive >= 5) {
                grid[s.id][d] = 'off';
                consecutive = 0;
            } else {
                // distribute shifts so each day gets coverage across all shifts
                grid[s.id][d] = shifts[(si * 3 + d) % shifts.length];
                consecutive++;
            }
        }
    });
    return grid;
}

// ─── Component ───────────────────────────────────────────────────────────────
const RosterBuilder: React.FC<RosterBuilderProps> = ({ staff }) => {
    const activeStaff = staff.slice(0, 15);
    const [roster, setRoster] = useState<RosterGrid>(() => buildDefaultRoster(activeStaff));
    const [weekOffset, setWeekOffset] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [pinnedShift, setPinnedShift] = useState<string>('morning');
    const [saved, setSaved] = useState(false);
    const [aiRunning, setAiRunning] = useState(false);

    // Conflict map: staffId → Set of conflict day indices
    const conflictMap = useMemo(() => {
        const map: Record<string, Set<number>> = {};
        activeStaff.forEach(s => { map[s.id] = detectConflicts(roster, s.id); });
        return map;
    }, [roster, activeStaff]);

    const totalConflicts = useMemo(() =>
        Object.values(conflictMap).reduce((sum, s: any) => sum + s.size, 0), [conflictMap]);

    // Coverage per day
    const coverageByDay = useMemo(() => DAYS.map((_, di) => {
        const counts: Record<string, number> = {};
        SHIFT_DEFS.forEach(sh => { counts[sh.id] = 0; });
        activeStaff.forEach(s => {
            const sid = roster[s.id]?.[di] ?? 'morning';
            counts[sid] = (counts[sid] ?? 0) + 1;
        });
        const working = activeStaff.length - (counts['off'] ?? 0);
        const pct = activeStaff.length ? Math.round((working / activeStaff.length) * 100) : 0;
        return { counts, pct };
    }), [roster, activeStaff]);

    const assignShift = useCallback((staffId: string, dayIdx: number) => {
        if (!editMode) return;
        setSaved(false);
        setRoster(prev => ({
            ...prev,
            [staffId]: { ...prev[staffId], [dayIdx]: pinnedShift }
        }));
    }, [editMode, pinnedShift]);

    const handleAISuggest = async () => {
        setAiRunning(true);
        await new Promise(r => setTimeout(r, 1200));
        setRoster(aiSuggestRoster(activeStaff));
        setAiRunning(false);
        setSaved(false);
    };

    const handleSave = () => {
        setSaved(true);
        // In production: persist to rosterService / Firestore
    };

    const exportCSV = () => {
        const header = ['Staff', ...DAYS].join(',');
        const rows = activeStaff.map(s => {
            const cells = DAYS.map((_, di) => {
                const def = SHIFT_DEFS.find(sh => sh.id === (roster[s.id]?.[di] ?? 'morning'));
                return def ? `${def.label} (${def.start}-${def.end})` : '';
            });
            return [s.fullName, ...cells].join(',');
        });
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `roster_${getWeekLabel(weekOffset).replace(/\s/g, '_')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const shiftDef = (id: string) => SHIFT_DEFS.find(s => s.id === id) ?? SHIFT_DEFS[0];

    return (
        <div className="flex flex-col h-full gap-4 animate-fadeIn">

            {/* ── Toolbar ── */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Week Navigator */}
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                    <button onClick={() => setWeekOffset(p => p - 1)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-zinc-400 px-2 font-mono">{getWeekLabel(weekOffset)}</span>
                    <button onClick={() => setWeekOffset(p => p + 1)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Edit Toggle */}
                <button
                    onClick={() => setEditMode(p => !p)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition ${editMode
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'
                        }`}
                >
                    {editMode ? '✎ Edit ON' : '✎ Edit Mode'}
                </button>

                {/* AI Suggest */}
                <button
                    onClick={handleAISuggest}
                    disabled={aiRunning}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider transition hover:bg-violet-500/20 disabled:opacity-50"
                >
                    <Brain className={`w-3.5 h-3.5 ${aiRunning ? 'animate-spin' : ''}`} />
                    {aiRunning ? 'Optimising...' : 'AI Suggest Roster'}
                </button>

                {/* Save */}
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition ${saved
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                >
                    {saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    {saved ? 'Saved' : 'Save Roster'}
                </button>

                {/* Export */}
                <button
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-bold uppercase tracking-wider transition"
                >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                </button>

                <div className="ml-auto flex items-center gap-2 text-[10px] text-zinc-600">
                    <Users className="w-3.5 h-3.5" /> {activeStaff.length} staff
                    {totalConflicts > 0 && (
                        <span className="flex items-center gap-1 text-rose-400 ml-3">
                            <AlertTriangle className="w-3.5 h-3.5" /> {totalConflicts} conflicts
                        </span>
                    )}
                </div>
            </div>

            {/* ── Shift Pattern Pins (only in edit mode) ── */}
            {editMode && (
                <div className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                    <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-wider">Assign Pattern:</span>
                    {SHIFT_DEFS.map(sh => (
                        <button
                            key={sh.id}
                            onClick={() => setPinnedShift(sh.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition ${sh.color} ${pinnedShift === sh.id ? 'ring-2 ring-violet-400 scale-105' : 'opacity-60 hover:opacity-100'}`}
                        >
                            <Clock className="w-3 h-3" /> {sh.label}
                            {sh.start !== '—' && <span className="text-[8px] opacity-70">({sh.start}–{sh.end})</span>}
                        </button>
                    ))}
                    <span className="text-[9px] text-zinc-600 ml-2">← select pattern then click any cell</span>
                </div>
            )}

            {/* ── Roster Grid ── */}
            <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-auto">
                <table className="w-full text-xs border-collapse min-w-[900px]">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-zinc-600 text-[9px] uppercase font-bold tracking-wider bg-zinc-950/60 sticky left-0 z-10 min-w-[160px] border-r border-zinc-800/50">
                                Staff Member
                            </th>
                            {DAYS.map((d, di) => {
                                const cov = coverageByDay[di];
                                const covColor = cov.pct >= 70 ? 'text-emerald-400' : cov.pct >= 40 ? 'text-amber-400' : 'text-rose-400';
                                const barColor = cov.pct >= 70 ? 'bg-emerald-500' : cov.pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
                                return (
                                    <th key={d} className="px-2 py-3 text-center text-zinc-500 text-[9px] uppercase font-bold tracking-wider bg-zinc-950/60 min-w-[110px]">
                                        <div>{d}</div>
                                        <div className={`mt-1 text-[8px] font-bold ${covColor}`}>{cov.pct}% coverage</div>
                                        <div className="mt-1 mx-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${cov.pct}%` }} />
                                        </div>
                                        <div className="flex justify-center gap-1 mt-1 text-[7px] font-normal text-zinc-600">
                                            <span className="text-amber-600/70">M:{cov.counts['morning'] ?? 0}</span>
                                            <span className="text-violet-600/70">A:{cov.counts['afternoon'] ?? 0}</span>
                                            <span className="text-sky-600/70">N:{cov.counts['night'] ?? 0}</span>
                                        </div>
                                    </th>
                                );
                            })}
                            <th className="px-3 py-3 text-center text-zinc-600 text-[9px] uppercase font-bold tracking-wider bg-zinc-950/60 min-w-[70px]">Hrs/wk</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/30">
                        {activeStaff.map(s => {
                            const conflicts = conflictMap[s.id] ?? new Set();
                            const weekHours = DAYS.reduce((sum, _, di) => {
                                const sid = roster[s.id]?.[di] ?? 'morning';
                                return sum + (shiftDef(sid)?.hours ?? 0);
                            }, 0);
                            return (
                                <tr key={s.id} className="hover:bg-zinc-800/10 transition group">
                                    <td className="px-4 py-3 sticky left-0 bg-zinc-900/80 group-hover:bg-zinc-800/80 transition font-medium text-zinc-200 text-xs border-r border-zinc-800/50">
                                        <div>{s.fullName}</div>
                                        <div className="text-[9px] text-zinc-600">{s.departmentName}</div>
                                    </td>
                                    {DAYS.map((_, di) => {
                                        const sid = roster[s.id]?.[di] ?? 'morning';
                                        const def = shiftDef(sid);
                                        const isConflict = conflicts.has(di);
                                        return (
                                            <td key={di} className="px-2 py-2 text-center">
                                                <div
                                                    onClick={() => assignShift(s.id, di)}
                                                    title={isConflict ? `⚠ Conflict: rest violation or >6 consecutive days` : `${def.label} ${def.start}–${def.end}`}
                                                    className={`mx-auto px-2 py-2 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all select-none
                                                        ${def.color}
                                                        ${editMode ? 'cursor-pointer hover:scale-110 hover:shadow-lg hover:shadow-violet-900/20' : ''}
                                                        ${isConflict ? 'ring-2 ring-rose-500/70 !border-rose-500/50' : ''}
                                                    `}
                                                >
                                                    <div>{def.tag}</div>
                                                    {def.start !== '—' && (
                                                        <div className="text-[7px] opacity-70 font-normal">{def.start}</div>
                                                    )}
                                                    {isConflict && <AlertTriangle className="w-2.5 h-2.5 text-rose-400 mx-auto mt-0.5" />}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="px-3 py-3 text-center font-mono text-xs text-zinc-400">
                                        <span className={weekHours > 48 ? 'text-rose-400 font-bold' : weekHours >= 40 ? 'text-emerald-400' : 'text-zinc-500'}>
                                            {weekHours}h
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ── Status Bar ── */}
            <div className="flex flex-wrap gap-3">
                {/* Legend */}
                <div className="flex items-center gap-2">
                    {SHIFT_DEFS.map(sh => (
                        <span key={sh.id} className={`px-2.5 py-1 rounded-full border text-[8px] font-bold uppercase tracking-wider ${sh.color}`}>
                            {sh.tag} {sh.label}
                        </span>
                    ))}
                </div>
                <div className="ml-auto flex items-center gap-3">
                    {totalConflicts > 0 ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/5 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            {totalConflicts} conflict{totalConflicts > 1 ? 's' : ''} detected — check highlighted cells
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Roster valid — no conflicts
                        </div>
                    )}
                    {saved && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/5 border border-violet-500/20 rounded-xl text-xs text-violet-400">
                            <CheckCircle className="w-3.5 h-3.5" /> Roster saved
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RosterBuilder;
