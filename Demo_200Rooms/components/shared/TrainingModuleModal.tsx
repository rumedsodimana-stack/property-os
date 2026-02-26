
import React, { useState } from 'react';
import { TrainingModule } from '../../types';
import { X, GraduationCap, Clock, Users, BookOpen, Brain, PlayCircle, FileText, CheckCircle2, AlertCircle, BarChart, Settings, Plus } from 'lucide-react';

interface TrainingModuleModalProps {
    module: TrainingModule;
    onClose: () => void;
}

const TrainingModuleModal: React.FC<TrainingModuleModalProps> = ({ module, onClose }) => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'Content' | 'Analytics' | 'Settings'>('Overview');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-start">
                    <div className="flex gap-6">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold ${module.completionRate > 80 ? 'bg-teal-500/10 text-teal-500' : 'bg-violet-500/10 text-violet-500'
                            }`}>
                            {module.aiGeneratedContent ? <Brain className="w-10 h-10" /> : <BookOpen className="w-10 h-10" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-light text-white mb-1">{module.title}</h2>
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {module.category}</span>
                                <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                <span className="flex items-center gap-1 font-mono">{module.id}</span>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                                    {module.duration} MIN
                                </span>
                                {module.aiGeneratedContent && (
                                    <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider border border-violet-500/30">
                                        AI GENERATED
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800 px-6">
                    {['Overview', 'Content', 'Analytics', 'Settings'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 shadow-[0_0_10px_#8b5cf6]"></div>}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.03),transparent)]">
                    {activeTab === 'Overview' && (
                        <div className="grid grid-cols-3 gap-8 animate-fadeIn">
                            <div className="col-span-2 space-y-8">
                                <div className="grid grid-cols-3 gap-4">
                                    <StatCard icon={<Clock className="w-4 h-4 text-zinc-500" />} label="Time Required" value={`${module.duration}m`} />
                                    <StatCard icon={<Users className="w-4 h-4 text-zinc-500" />} label="Assigned To" value={`${module.assignedToRoles.length} Roles`} />
                                    <StatCard icon={<CheckCircle2 className="w-4 h-4 text-zinc-500" />} label="Completion" value={`${module.completionRate}%`} />
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Module Description</h3>
                                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 text-zinc-300 leading-relaxed">
                                        This module is part of the Singularity property standard training library. It covers key performance indicators,
                                        guest interaction protocols, and specific operational workflows for {module.assignedToRoles.join(', ')} roles.
                                        AI has enhanced this content with real-world scenarios derived from property-specific guest feedback.
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Curriculum Outline</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl group hover:border-zinc-700 transition cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 group-hover:bg-violet-500 group-hover:text-white transition">1</div>
                                                <div className="text-sm font-medium text-zinc-200">Introduction & Core Objectives</div>
                                            </div>
                                            <PlayCircle className="w-5 h-5 text-zinc-600 group-hover:text-violet-400 transition" />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">2</div>
                                                <div className="text-sm font-medium text-zinc-200">Standard Operating Procedures (SOPs)</div>
                                            </div>
                                            <FileText className="w-5 h-5 text-zinc-600" />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-zinc-900/20 border border-zinc-800/50 rounded-2xl group hover:border-zinc-700 transition cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 group-hover:bg-violet-500 group-hover:text-white transition">3</div>
                                                <div className="text-sm font-medium text-zinc-200">Knowledge Assessment (AI Generated)</div>
                                            </div>
                                            <Brain className="w-5 h-5 text-zinc-600 group-hover:text-violet-400 transition" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
                                    <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <BarChart className="w-4 h-4 text-violet-500" /> Stats Snapshot
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-500">Total Enrolled</span>
                                            <span className="text-zinc-200 font-mono">154</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-500">Avg. Test Score</span>
                                            <span className="text-teal-400 font-bold">88.4%</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-zinc-500">Avg. Completion Time</span>
                                            <span className="text-zinc-200 font-mono">18m 42s</span>
                                        </div>
                                    </div>
                                    <button className="w-full mt-6 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl text-xs font-bold transition shadow-lg">
                                        Assign to More Staff
                                    </button>
                                </div>

                                <div className="p-6 bg-violet-900/10 border border-violet-500/20 rounded-3xl">
                                    <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3" /> Compliance Alert
                                    </h3>
                                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                                        This module covers mandatory regulations. 12 staff members are currently past their due date for completion.
                                    </p>
                                    <button className="w-full py-2 bg-transparent hover:bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-xl text-[10px] font-bold transition">
                                        Send Reminders
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'Overview' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
                            <Settings className="w-12 h-12 text-zinc-800 mb-4 animate-spin-slow" />
                            <h3 className="text-zinc-400 font-medium">{activeTab} Interface Synchronizing</h3>
                            <p className="text-zinc-600 text-sm max-w-xs mt-2">Connecting to the Singularity Learning Cloud...</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition border border-zinc-800">
                        Close Preview
                    </button>
                    <button className="px-8 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        <Plus className="w-4 h-4" /> Edit Module
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value }: any) => (
    <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center text-center">
        <div className="mb-2">{icon}</div>
        <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter mb-1">{label}</div>
        <div className="text-lg font-light text-zinc-100">{value}</div>
    </div>
);

export default TrainingModuleModal;
