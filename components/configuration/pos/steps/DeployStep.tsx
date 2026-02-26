import React from 'react';
import { Store, LayoutGrid, Users, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { OnboardingOutlet } from './CostCenterStep';
import { OnboardingSection } from './SpaceConfigStep';

interface DeployStepProps {
    outlets: OnboardingOutlet[];
    sections: OnboardingSection[];
}

const SPACE_ELIGIBLE = ['Restaurant', 'Bar', 'PoolBar'];

const DeployStep: React.FC<DeployStepProps> = ({ outlets, sections }) => {
    const totalTables = sections.reduce((acc, s) => acc + s.tableCount, 0);
    const totalCovers = sections.reduce((acc, s) => acc + s.tableCount * s.seatsPerTable, 0) +
        outlets.filter(o => !SPACE_ELIGIBLE.includes(o.type)).reduce((acc, o) => acc + o.seatingCapacity, 0);
    const dineInOutlets = outlets.filter(o => SPACE_ELIGIBLE.includes(o.type));
    const serviceOutlets = outlets.filter(o => !SPACE_ELIGIBLE.includes(o.type));

    const hasIssues = outlets.length === 0;
    const warnings: string[] = [];
    dineInOutlets.forEach(o => {
        const hasSections = sections.some(s => s.outletId === o.id);
        if (!hasSections) warnings.push(`"${o.name}" has no sections or tables configured.`);
    });

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-light text-white mb-1">Ready to Activate</h3>
                <p className="text-sm text-zinc-500">Review your F&B configuration below. Clicking "Activate F&B Module" will write all outlets and tables to the system and unlock the POS Dashboard.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Store size={16} className="text-violet-400" />
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Cost Centers</span>
                    </div>
                    <div className="text-4xl font-light text-white">{outlets.length}</div>
                    <div className="text-xs text-zinc-600 mt-1">{dineInOutlets.length} dine-in · {serviceOutlets.length} service</div>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <LayoutGrid size={16} className="text-emerald-400" />
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total Tables</span>
                    </div>
                    <div className="text-4xl font-light text-white">{totalTables}</div>
                    <div className="text-xs text-zinc-600 mt-1">{sections.length} section{sections.length !== 1 ? 's' : ''} across {dineInOutlets.length} outlet{dineInOutlets.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Users size={16} className="text-amber-400" />
                        <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total Covers</span>
                    </div>
                    <div className="text-4xl font-light text-white">{totalCovers}</div>
                    <div className="text-xs text-zinc-600 mt-1">Seating capacity across property</div>
                </div>
            </div>

            {/* Outlet Breakdown */}
            <div className="space-y-3">
                <h4 className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Outlet Breakdown</h4>
                {outlets.map(outlet => {
                    const outletSections = sections.filter(s => s.outletId === outlet.id);
                    const outletTables = outletSections.reduce((acc, s) => acc + s.tableCount, 0);
                    const outletCovers = outletSections.reduce((acc, s) => acc + s.tableCount * s.seatsPerTable, 0);
                    const hasSections = outletSections.length > 0;
                    const needsSections = SPACE_ELIGIBLE.includes(outlet.type);

                    return (
                        <div key={outlet.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
                            <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: outlet.color }} />
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-semibold text-white text-sm">{outlet.name}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ backgroundColor: `${outlet.color}20`, color: outlet.color }}>
                                        {outlet.type}
                                    </span>
                                    {outlet.kdsEnabled && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">KDS</span>}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-zinc-500">
                                    <span>{outlet.operatingHours?.open} – {outlet.operatingHours?.close}</span>
                                    <span>Tax {outlet.taxRate}%</span>
                                    {outlet.gratuityRate > 0 && <span>Gratuity {outlet.gratuityRate}%</span>}
                                    {needsSections && hasSections && <span className="text-emerald-400">{outletTables} tables · {outletCovers} covers</span>}
                                    {needsSections && !hasSections && <span className="text-amber-400">⚠ No tables configured</span>}
                                    {!needsSections && <span className="text-zinc-600">No table layout required</span>}
                                </div>
                            </div>
                            {(hasSections || !needsSections) ? (
                                <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
                            ) : (
                                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                        <AlertTriangle size={14} /> Warnings
                    </div>
                    {warnings.map((w, i) => (
                        <p key={i} className="text-xs text-amber-300/80">{w}</p>
                    ))}
                    <p className="text-xs text-zinc-500 mt-1">You can still deploy — tables can be added later from POS Settings.</p>
                </div>
            )}

            {/* Deploy Info */}
            {!hasIssues && (
                <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <Zap size={18} className="text-violet-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-violet-300 mb-1">Ready for Commissioning</p>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Clicking "Activate F&B Module" will write <strong className="text-white">{outlets.length} outlet{outlets.length !== 1 ? 's' : ''}</strong> and <strong className="text-white">{totalTables} tables</strong> to the system. The POS Dashboard will unlock immediately and all outlets will be available for order taking.
                            </p>
                            <p className="text-xs text-zinc-600 mt-2">This operation can be re-run from POS Settings at any time to add or modify outlets.</p>
                        </div>
                    </div>
                </div>
            )}

            {hasIssues && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-xs text-red-400">
                    At least one cost center must be defined before deploying.
                </div>
            )}
        </div>
    );
};

export default DeployStep;
