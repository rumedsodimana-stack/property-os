import React, { useState, useEffect } from 'react';
import {
    Activity, CheckCircle, Clock, AlertTriangle, XCircle,
    ChevronRight, FileText, Palette, Settings, Shield,
    Eye, Check, X, Code, RotateCcw
} from 'lucide-react';
import { BrandDocument } from '../../types';
import { SystemAdaptation, brandStandardsAI } from '../../services/brand/brandStandardsAIService';
import { autonomousBrandOrchestrator } from '../../services/brand/autonomousBrandOrchestrator';
import { brandServiceBus } from '../../services/brand/brandServiceBus';

interface BrandChangeLogProps {
    documents: BrandDocument[];
}

const BrandChangeLog: React.FC<BrandChangeLogProps> = ({ documents }) => {
    const [adaptations, setAdaptations] = useState<SystemAdaptation[]>([]);
    const [selectedAdaptation, setSelectedAdaptation] = useState<SystemAdaptation | null>(null);
    const [loading, setLoading] = useState(false);

    const getRiskColor = (risk: string) => {
        switch (risk) {
            case 'low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'critical': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
            default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'css': return <Palette size={16} />;
            case 'config': return <Settings size={16} />;
            case 'workflow': return <Activity size={16} />;
            case 'permission': return <Shield size={16} />;
            default: return <FileText size={16} />;
        }
    };

    // Load real adaptations from orchestrator
    useEffect(() => {
        loadAdaptations();

        // Subscribe to updates
        const subscriptionId = brandServiceBus.subscribe(
            'BrandChangeLog',
            ['adaptation_deployed', 'all_changes'],
            () => {
                loadAdaptations();
            }
        );

        return () => {
            brandServiceBus.unsubscribe(subscriptionId);
        };
    }, []);

    const loadAdaptations = () => {
        setLoading(true);
        const pending = autonomousBrandOrchestrator.getPendingAdaptations();
        setAdaptations(pending);
        setLoading(false);
    };

    const loadRecentAdaptations = async () => {
        // Deprecated in favor of loadAdaptations
        loadAdaptations();
    };

    const handleApprove = async (adaptation: SystemAdaptation) => {
        console.log('Approving adaptation:', adaptation.id);
        const success = await autonomousBrandOrchestrator.approveAdaptation(adaptation.id);
        if (success) {
            setSelectedAdaptation(null);
            loadAdaptations(); // Refresh list
        }
    };

    const handleReject = async (adaptation: SystemAdaptation) => {
        console.log('Rejecting adaptation:', adaptation.id);
        const success = await autonomousBrandOrchestrator.rejectAdaptation(adaptation.id);
        if (success) {
            setSelectedAdaptation(null);
            loadAdaptations(); // Refresh list
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-zinc-500">Loading adaptations...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950 p-6 gap-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                    <Activity className="text-violet-500" size={28} />
                    System Adaptation Log
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                    AI-detected changes and proposed system adaptations
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Pending</div>
                    <div className="text-2xl font-bold text-zinc-100">{adaptations.length}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Low Risk</div>
                    <div className="text-2xl font-bold text-emerald-500">
                        {adaptations.filter(a => a.risk === 'low').length}
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">Medium Risk</div>
                    <div className="text-2xl font-bold text-amber-500">
                        {adaptations.filter(a => a.risk === 'medium').length}
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="text-zinc-500 text-xs uppercase font-bold mb-1">High Risk</div>
                    <div className="text-2xl font-bold text-orange-500">
                        {adaptations.filter(a => a.risk === 'high').length}
                    </div>
                </div>
            </div>

            {/* Adaptations List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {adaptations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <CheckCircle size={48} className="text-zinc-700 mb-4" />
                        <p className="text-zinc-500 text-lg font-medium">All caught up!</p>
                        <p className="text-zinc-600 text-sm mt-2">
                            No pending system adaptations
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {adaptations.map(adaptation => {
                            const doc = documents.find(d => d.id === adaptation.documentId);
                            return (
                                <div
                                    key={adaptation.id}
                                    onClick={() => setSelectedAdaptation(adaptation)}
                                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-violet-500/50 
                                             hover:bg-zinc-800/50 transition cursor-pointer"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-zinc-800 rounded-lg">
                                            {getTypeIcon(adaptation.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${getRiskColor(adaptation.risk)}`}>
                                                    {adaptation.risk} risk
                                                </span>
                                                <span className="text-xs text-zinc-600 uppercase font-bold">
                                                    {adaptation.type}
                                                </span>
                                                <span className="text-xs text-zinc-700">•</span>
                                                <span className="text-xs text-zinc-600">
                                                    {adaptation.confidence * 100}% confidence
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-zinc-100 mb-1">
                                                {adaptation.proposedChange}
                                            </h3>
                                            <p className="text-xs text-zinc-500 mb-2">
                                                Source: {doc?.title || 'Unknown document'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="text-zinc-600">Affects:</span>
                                                {adaptation.affectedModules.map(module => (
                                                    <span key={module} className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">
                                                        {module}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <ChevronRight size={20} className="text-zinc-600" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Adaptation Detail Modal */}
            {selectedAdaptation && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-100">
                                        Adaptation Review
                                    </h2>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        Review and approve proposed system changes
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedAdaptation(null)}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition"
                                >
                                    <X size={20} className="text-zinc-500" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Change Info */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded border ${getRiskColor(selectedAdaptation.risk)}`}>
                                        {selectedAdaptation.risk} risk
                                    </span>
                                    <span className="text-xs text-zinc-600 uppercase font-bold">
                                        {selectedAdaptation.type} change
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-zinc-100 mb-2">
                                    {selectedAdaptation.proposedChange}
                                </h3>
                                <p className="text-sm text-zinc-500">
                                    Confidence: {(selectedAdaptation.confidence * 100).toFixed(0)}%
                                </p>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                                    <div className="text-xs text-zinc-600 uppercase font-bold mb-2">Target File</div>
                                    <div className="text-sm text-zinc-300 font-mono">
                                        {selectedAdaptation.targetFile}
                                    </div>
                                </div>
                                <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                                    <div className="text-xs text-zinc-600 uppercase font-bold mb-2">Affected Modules</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAdaptation.affectedModules.map(module => (
                                            <span key={module} className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400">
                                                {module}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Code Change Preview */}
                            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Code size={16} className="text-zinc-500" />
                                    <div className="text-xs text-zinc-600 uppercase font-bold">Proposed Change</div>
                                </div>
                                <div className="bg-zinc-950 rounded p-3 font-mono text-xs">
                                    <div className="text-rose-500">- {selectedAdaptation.currentValue}</div>
                                    <div className="text-emerald-500">+ {selectedAdaptation.newValue}</div>
                                </div>
                            </div>

                            {/* Rollback Plan */}
                            <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <RotateCcw size={16} className="text-zinc-500" />
                                    <div className="text-xs text-zinc-600 uppercase font-bold">Rollback Plan</div>
                                </div>
                                <p className="text-sm text-zinc-400">
                                    {selectedAdaptation.rollbackPlan}
                                </p>
                            </div>

                            {/* Warning for high risk */}
                            {(selectedAdaptation.risk === 'high' || selectedAdaptation.risk === 'critical') && (
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 flex items-start gap-3">
                                    <AlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-bold text-orange-500 mb-1">High Risk Change</div>
                                        <p className="text-xs text-orange-400">
                                            This modification affects core system workflows. Please review carefully before approving.
                                            Test in a staging environment if possible.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 px-6 py-4">
                            <div className="flex items-center justify-between gap-4">
                                <button
                                    onClick={() => setSelectedAdaptation(null)}
                                    className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition"
                                >
                                    Cancel
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleReject(selectedAdaptation)}
                                        className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 
                                                 text-zinc-200 rounded-lg transition"
                                    >
                                        <X size={18} />
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedAdaptation)}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 
                                                 text-white rounded-lg transition font-medium"
                                    >
                                        <Check size={18} />
                                        Approve & Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BrandChangeLog;
