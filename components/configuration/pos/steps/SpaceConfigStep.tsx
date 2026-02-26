import React, { useState } from 'react';
import { Plus, Trash2, LayoutGrid, Users, Hash } from 'lucide-react';
import { OnboardingOutlet } from './CostCenterStep';

export interface OnboardingSection {
    id: string;
    outletId: string;
    name: string;
    tableCount: number;
    startNumber: number;
    seatsPerTable: number;
}

interface SpaceConfigStepProps {
    outlets: OnboardingOutlet[];
    sections: OnboardingSection[];
    onUpdate: (sections: OnboardingSection[]) => void;
}

const SPACE_ELIGIBLE = ['Restaurant', 'Bar', 'PoolBar'];

const SpaceConfigStep: React.FC<SpaceConfigStepProps> = ({ outlets, sections, onUpdate }) => {
    const eligibleOutlets = outlets.filter(o => SPACE_ELIGIBLE.includes(o.type));

    const [adding, setAdding] = useState<string | null>(null); // outletId being added to
    const [newSection, setNewSection] = useState({ name: '', tableCount: 10, startNumber: 1, seatsPerTable: 4 });

    const handleAdd = (outletId: string) => {
        if (!newSection.name.trim()) return;
        const section: OnboardingSection = {
            id: `sec_${Date.now()}`,
            outletId,
            name: newSection.name,
            tableCount: newSection.tableCount,
            startNumber: newSection.startNumber,
            seatsPerTable: newSection.seatsPerTable,
        };
        onUpdate([...sections, section]);
        setNewSection({ name: '', tableCount: 10, startNumber: 1, seatsPerTable: 4 });
        setAdding(null);
    };

    const handleRemove = (id: string) => {
        onUpdate(sections.filter(s => s.id !== id));
    };

    const getSectionsForOutlet = (outletId: string) => sections.filter(s => s.outletId === outletId);

    const getTotalTables = (outletId: string) =>
        getSectionsForOutlet(outletId).reduce((acc, s) => acc + s.tableCount, 0);

    if (eligibleOutlets.length === 0) {
        return (
            <div className="text-center py-16 text-zinc-500">
                <LayoutGrid size={40} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">No dine-in outlets configured.</p>
                <p className="text-xs mt-1 text-zinc-600">Space configuration only applies to Restaurant, Bar, and Pool Bar outlets.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-light text-white mb-1">Space Configuration</h3>
                <p className="text-sm text-zinc-500">Define sections and auto-generate tables for each dine-in outlet. Room Service and Retail outlets are skipped.</p>
            </div>

            {eligibleOutlets.map(outlet => {
                const outletSections = getSectionsForOutlet(outlet.id);
                const totalTables = getTotalTables(outlet.id);
                const isAddingHere = adding === outlet.id;

                return (
                    <div key={outlet.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
                        {/* Outlet Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800" style={{ borderLeftColor: outlet.color, borderLeftWidth: 3 }}>
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: outlet.color }} />
                                <div>
                                    <span className="font-semibold text-white">{outlet.name}</span>
                                    <span className="text-xs text-zinc-500 ml-3">{outlet.type}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                <span>{outletSections.length} section{outletSections.length !== 1 ? 's' : ''}</span>
                                <span className="font-bold text-white">{totalTables} tables</span>
                            </div>
                        </div>

                        {/* Sections */}
                        <div className="p-4 space-y-3">
                            {outletSections.map(section => {
                                // Preview table numbers
                                const lastTable = section.startNumber + section.tableCount - 1;
                                return (
                                    <div key={section.id} className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-4 flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-medium text-white text-sm">{section.name}</span>
                                                <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full font-bold">
                                                    Tables {section.startNumber}–{lastTable}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1"><LayoutGrid size={10} /> {section.tableCount} tables</span>
                                                <span className="flex items-center gap-1"><Users size={10} /> {section.seatsPerTable} seats each</span>
                                                <span className="flex items-center gap-1"><Hash size={10} /> Starts at #{section.startNumber}</span>
                                            </div>
                                        </div>
                                        {/* Mini table preview */}
                                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                                            {Array.from({ length: Math.min(section.tableCount, 8) }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center text-white"
                                                    style={{ backgroundColor: `${outlet.color}30`, border: `1px solid ${outlet.color}50` }}
                                                >
                                                    {section.startNumber + i}
                                                </div>
                                            ))}
                                            {section.tableCount > 8 && (
                                                <div className="w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center bg-zinc-800 text-zinc-500">
                                                    +{section.tableCount - 8}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => handleRemove(section.id)} className="p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}

                            {/* Add Section Form */}
                            {isAddingHere ? (
                                <div className="bg-zinc-900/60 border border-violet-500/30 rounded-xl p-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1.5 block">Section Name *</label>
                                            <input
                                                type="text"
                                                value={newSection.name}
                                                onChange={e => setNewSection(p => ({ ...p, name: e.target.value }))}
                                                placeholder="e.g. Main Floor, Terrace..."
                                                autoFocus
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500/50 outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1.5 block">Table Count</label>
                                            <input
                                                type="number"
                                                min={1} max={100}
                                                value={newSection.tableCount}
                                                onChange={e => setNewSection(p => ({ ...p, tableCount: parseInt(e.target.value) || 1 }))}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500/50 outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1.5 block">Start Number</label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={newSection.startNumber}
                                                onChange={e => setNewSection(p => ({ ...p, startNumber: parseInt(e.target.value) || 1 }))}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500/50 outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1.5 block">Seats / Table</label>
                                            <input
                                                type="number"
                                                min={1} max={20}
                                                value={newSection.seatsPerTable}
                                                onChange={e => setNewSection(p => ({ ...p, seatsPerTable: parseInt(e.target.value) || 1 }))}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:border-violet-500/50 outline-none transition"
                                            />
                                        </div>
                                    </div>
                                    {newSection.name && (
                                        <div className="text-xs text-zinc-500 bg-zinc-950/50 rounded-lg px-3 py-2">
                                            Will generate <span className="text-white font-bold">{newSection.tableCount} tables</span> numbered <span className="text-white font-bold">{newSection.startNumber}–{newSection.startNumber + newSection.tableCount - 1}</span>, each with <span className="text-white font-bold">{newSection.seatsPerTable} seats</span>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button onClick={() => { setAdding(null); setNewSection({ name: '', tableCount: 10, startNumber: 1, seatsPerTable: 4 }); }} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition">Cancel</button>
                                        <button onClick={() => handleAdd(outlet.id)} disabled={!newSection.name.trim()} className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition">Add Section</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { setAdding(outlet.id); setNewSection({ name: '', tableCount: 10, startNumber: (outletSections[outletSections.length - 1]?.startNumber ?? 0) + (outletSections[outletSections.length - 1]?.tableCount ?? 0) || 1, seatsPerTable: 4 }); }}
                                    className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-zinc-800 hover:border-violet-500/40 hover:bg-violet-500/5 rounded-xl text-zinc-600 hover:text-violet-400 transition-all text-xs font-bold uppercase tracking-wider"
                                >
                                    <Plus size={14} /> Add Section
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SpaceConfigStep;
