import React from 'react';
import { X, Check, AlertTriangle, FileCode, Palette, Type, Clock } from 'lucide-react';
import { BrandStandards } from '../../services/brand/brandStandardsParser';
import { FileChange } from '../../services/brand/codeGenerator';

interface BrandPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    standards: BrandStandards;
    changes: FileChange[];
    onApply: () => void;
    isApplying: boolean;
}

const BrandPreviewModal: React.FC<BrandPreviewModalProps> = ({
    isOpen,
    onClose,
    standards,
    changes,
    onApply,
    isApplying
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-600/10 rounded-lg">
                            <Palette className="w-6 h-6 text-violet-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Brand Standards Preview</h2>
                            <p className="text-sm text-zinc-400">Review changes before applying</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Brand Identity */}
                    {standards.identity.name && (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Brand Identity</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">Name:</span>
                                    <span className="text-sm font-medium text-white">{standards.identity.name}</span>
                                </div>
                                {standards.identity.tagline && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-400">Tagline:</span>
                                        <span className="text-sm font-medium text-white">{standards.identity.tagline}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Colors */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Palette className="w-4 h-4 text-violet-500" />
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Brand Colors</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(standards.colors).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-3 bg-zinc-900 rounded-lg p-3">
                                    <div
                                        className="w-10 h-10 rounded-lg border-2 border-zinc-700"
                                        style={{ backgroundColor: value }}
                                    />
                                    <div>
                                        <div className="text-xs text-zinc-500 uppercase">{key}</div>
                                        <div className="text-sm font-mono text-white">{value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Typography */}
                    {standards.typography.primaryFont && (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Type className="w-4 h-4 text-blue-500" />
                                <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Typography</h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-zinc-400">Primary Font:</span>
                                    <span className="text-sm font-medium text-white">{standards.typography.primaryFont}</span>
                                </div>
                                {standards.typography.secondaryFont && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-400">Secondary Font:</span>
                                        <span className="text-sm font-medium text-white">{standards.typography.secondaryFont}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Operating Hours */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Operating Hours</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900 rounded-lg p-3">
                                <div className="text-xs text-zinc-500 uppercase mb-1">Check-in</div>
                                <div className="text-lg font-semibold text-white">{standards.operatingHours.checkIn}</div>
                            </div>
                            <div className="bg-zinc-900 rounded-lg p-3">
                                <div className="text-xs text-zinc-500 uppercase mb-1">Check-out</div>
                                <div className="text-lg font-semibold text-white">{standards.operatingHours.checkOut}</div>
                            </div>
                        </div>
                    </div>

                    {/* Files to Modify */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <FileCode className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Files to Modify</h3>
                        </div>
                        <div className="space-y-2">
                            {changes.map((change, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-zinc-900 rounded-lg p-3">
                                    <div>
                                        <div className="text-sm font-mono text-white">{change.filePath}</div>
                                        <div className="text-xs text-zinc-500">{change.description}</div>
                                    </div>
                                    <div className="px-2 py-1 bg-violet-600/10 text-violet-400 text-xs font-semibold rounded uppercase">
                                        {change.type}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-semibold text-amber-500 mb-1">Important</h4>
                            <p className="text-sm text-zinc-400">
                                A backup will be created automatically. You can rollback anytime from the backup history.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-zinc-800 bg-zinc-950">
                    <div className="text-sm text-zinc-400">
                        {changes.length} file{changes.length !== 1 ? 's' : ''} will be modified
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isApplying}
                            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 text-white rounded-lg transition font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onApply}
                            disabled={isApplying}
                            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-900 disabled:text-violet-400 text-white rounded-lg transition font-medium flex items-center gap-2"
                        >
                            {isApplying ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Applying...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    Apply Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandPreviewModal;
