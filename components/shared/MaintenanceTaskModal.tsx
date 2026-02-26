
import React from 'react';
import { MaintenanceTask, Asset, EmployeeProfile } from '../../types';
import { usePms } from '../../services/kernel/persistence';
import { X, Wrench, Clock, User, Info, AlertTriangle, CheckCircle, ArrowRight, Activity, Calendar } from 'lucide-react';

interface MaintenanceTaskModalProps {
    task: MaintenanceTask;
    onClose: () => void;
}

const MaintenanceTaskModal: React.FC<MaintenanceTaskModalProps> = ({ task, onClose }) => {
    const { assets: PMS_ASSETS, employees: PMS_EMPLOYEES } = usePms();
    const asset = PMS_ASSETS.find(a => a.id === task.assetId);
    const technician = task.technicianId ? PMS_EMPLOYEES.find(e => e.principal === task.technicianId) : null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 border-b border-zinc-900 bg-zinc-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${task.priority === 'High' ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' :
                            task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                                'bg-blue-500/10 text-blue-500 border-blue-500/30'
                            }`}>
                            <Wrench className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-100">Maintenance Task</h2>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest mt-1">
                                <span>{task.id}</span>
                                <span>•</span>
                                <span className={task.priority === 'High' ? 'text-rose-500' : ''}>{task.priority} Priority</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <section>
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Info className="w-3 h-3" /> Description
                        </h3>
                        <p className="text-zinc-200 leading-relaxed bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
                            {task.description}
                        </p>
                    </section>

                    <div className="grid grid-cols-2 gap-4">
                        <section>
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Status</h3>
                            <div className="flex items-center gap-2 text-zinc-200 font-medium">
                                <div className={`w-2 h-2 rounded-full ${task.status === 'In Progress' ? 'bg-amber-500 animate-pulse' : task.status === 'Completed' ? 'bg-emerald-500' : 'bg-zinc-600'}`}></div>
                                {task.status}
                            </div>
                        </section>
                        <section>
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Task Type</h3>
                            <div className="text-zinc-200 font-medium">{task.type}</div>
                        </section>
                    </div>

                    {asset && (
                        <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Linked Asset</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-zinc-100">{asset.name}</div>
                                    <div className="text-xs text-zinc-500">{asset.location}</div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-zinc-700" />
                            </div>
                        </section>
                    )}

                    {technician ? (
                        <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Assigned Technician</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-bold">
                                    {technician.fullName[0]}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-zinc-100">{technician.fullName}</div>
                                    <div className="text-xs text-zinc-500">{technician.role}</div>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <section className="bg-zinc-900/40 border border-zinc-800 border-dashed rounded-2xl p-4 text-center">
                            <div className="text-xs text-zinc-500 mb-2">Unassigned Task</div>
                            <button className="text-[10px] uppercase font-bold text-violet-400 hover:text-violet-300 transition tracking-wider">
                                Claim Task
                            </button>
                        </section>
                    )}

                    <div className="flex gap-4 pt-2">
                        {task.status !== 'Completed' ? (
                            <button className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Resolve Task
                            </button>
                        ) : (
                            <button className="flex-1 py-3 bg-zinc-800 text-zinc-500 rounded-xl font-bold cursor-not-allowed">
                                Task Resolved
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceTaskModal;
