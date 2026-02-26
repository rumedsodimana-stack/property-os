
import React, { useState } from 'react';
import { Candidate } from '../../types';
import { X, Briefcase, Calendar, Star, FileText, Mail, Phone, MapPin, User, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface CandidateProfileModalProps {
    candidate: Candidate;
    onClose: () => void;
}

const CandidateProfileModal: React.FC<CandidateProfileModalProps> = ({ candidate, onClose }) => {
    const [activeTab, setActiveTab] = useState<'Profile' | 'Experience' | 'Assessment' | 'Interview'>('Profile');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-start">
                    <div className="flex gap-6">
                        <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center text-3xl font-bold text-zinc-500">
                            {candidate.name[0]}
                        </div>
                        <div>
                            <h2 className="text-2xl font-light text-white mb-1">{candidate.name}</h2>
                            <div className="flex items-center gap-3 text-sm text-zinc-400">
                                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {candidate.roleApplied}</span>
                                <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                <span className="flex items-center gap-1 font-mono">{candidate.id}</span>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${candidate.stage === 'Hired' ? 'bg-teal-500/10 text-teal-400' :
                                        candidate.stage === 'Offer' ? 'bg-violet-500/10 text-violet-400' :
                                            'bg-zinc-800 text-zinc-400'
                                    }`}>
                                    {candidate.stage}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                                    {candidate.matchScore}% AI Match
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition text-zinc-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800 px-6">
                    {['Profile', 'Experience', 'Assessment', 'Interview'].map((tab) => (
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
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {activeTab === 'Profile' && (
                        <div className="grid grid-cols-3 gap-8 animate-fadeIn">
                            <div className="col-span-2 space-y-8">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Professional Summary</h3>
                                    <p className="text-zinc-300 leading-relaxed bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 italic">
                                        {candidate.notes || "No candidate summary provided."}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-2xl">
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Contact Information</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-zinc-300"><Mail className="w-3.5 h-3.5 text-zinc-500" /> candidate@example.com</div>
                                            <div className="flex items-center gap-2 text-sm text-zinc-300"><Phone className="w-3.5 h-3.5 text-zinc-500" /> +973 3xxx xxxx</div>
                                            <div className="flex items-center gap-2 text-sm text-zinc-300"><MapPin className="w-3.5 h-3.5 text-zinc-500" /> Manama, Bahrain</div>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-2xl">
                                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-2">Application Details</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-500 italic">Applied Date</span>
                                                <span className="text-zinc-300 font-mono">{new Date(candidate.appliedDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-500 italic">Source</span>
                                                <span className="text-zinc-300">LinkedIn Early Careers</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-violet-500/5 border border-violet-500/10 p-6 rounded-3xl">
                                    <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Star className="w-4 h-4" /> AI Insights
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-400">Skills Match</span>
                                            <span className="text-teal-400 font-bold">92%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-400">Culture Fit</span>
                                            <span className="text-violet-400 font-bold">88%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-zinc-400">Retention Prob.</span>
                                            <span className="text-amber-400 font-bold">High</span>
                                        </div>
                                        <button className="w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition mt-2">
                                            View Match Report
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab !== 'Profile' && (
                        <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
                            <Clock className="w-12 h-12 text-zinc-800 mb-4" />
                            <h3 className="text-zinc-400 font-medium">Detailed {activeTab} Data Coming Soon</h3>
                            <p className="text-zinc-600 text-sm max-w-xs mt-2">This feature is currently being provisioned as part of the Enterprise HR upgrade.</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex justify-between items-center">
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition border border-zinc-800">
                            <FileText className="w-4 h-4" /> Resume.pdf
                        </button>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl text-xs font-bold transition flex items-center gap-2"
                        >
                            <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button className="px-8 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl text-xs font-bold transition flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Invite to Interview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateProfileModal;
