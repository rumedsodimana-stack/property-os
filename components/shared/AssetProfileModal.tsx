
import React from 'react';
import { Asset, MaintenanceTask } from '../../types';
import { usePms } from '../../services/kernel/persistence';
import { X, Activity, Calendar, MapPin, ShieldCheck, Wrench, Clock, Zap, Settings, AlertTriangle } from 'lucide-react';

interface AssetProfileModalProps {
    asset: Asset;
    onClose: () => void;
}

const AssetProfileModal: React.FC<AssetProfileModalProps> = ({ asset, onClose }) => {
    const { maintenanceTasks: PMS_TASKS } = usePms();
    const relatedTasks = PMS_TASKS.filter(t => t.assetId === asset.id);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-zinc-900 bg-zinc-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-500 border border-violet-500/30">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-100">{asset.name}</h2>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest mt-1">
                                <span>{asset.category}</span>
                                <span>•</span>
                                <span>{asset.location}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Health Score</div>
                            <div className="text-2xl font-light text-zinc-100 flex items-end gap-2">
                                {asset.healthScore}%
                                <span className={`text-xs px-2 py-0.5 rounded ${asset.healthScore > 80 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                    {asset.healthScore > 80 ? 'Good' : 'Review'}
                                </span>
                            </div>
                        </div>
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Next Service</div>
                            <div className="text-sm font-medium text-zinc-200">
                                {new Date(asset.nextServiceDate).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">
                                In {Math.ceil((asset.nextServiceDate - Date.now()) / (1000 * 60 * 60 * 24))} days
                            </div>
                        </div>
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Warranty</div>
                            <div className="text-sm font-medium text-zinc-200">
                                {asset.warrantyEnd > Date.now() ? 'Active' : 'Expired'}
                            </div>
                            <div className="text-[10px] text-zinc-500 mt-1">
                                {new Date(asset.warrantyEnd).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Details */}
                    <section>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Operational History
                        </h3>
                        <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl overflow-hidden text-sm">
                            {relatedTasks.length > 0 ? (
                                <div className="divide-y divide-zinc-900">
                                    {relatedTasks.map(task => (
                                        <div key={task.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/50 transition">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${task.type === 'Corrective' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {task.type === 'Corrective' ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <div className="text-zinc-200 font-medium">{task.description}</div>
                                                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                                                        <span>{task.id}</span>
                                                        <span>•</span>
                                                        <span>{task.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                                    {task.priority}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-zinc-500 italic">No maintenance history recorded for this asset.</div>
                            )}
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2">
                            <Wrench className="w-4 h-4" /> Schedule Maintenance
                        </button>
                        <button className="px-6 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl font-medium transition">
                            View Manual
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetProfileModal;
