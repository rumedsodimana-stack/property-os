import React from 'react';
import { X, FileText, Calendar, User, Download, Eye, ExternalLink, Shield, Tag } from 'lucide-react';
import { BrandDocument } from '../../types';

interface BrandDocumentModalProps {
    document: BrandDocument;
    onClose: () => void;
}

const BrandDocumentModal: React.FC<BrandDocumentModalProps> = ({ document, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${document.category === 'asset' ? 'bg-blue-500/10 text-blue-400' :
                                document.category === 'guideline' ? 'bg-violet-500/10 text-violet-400' :
                                    document.category === 'sop' ? 'bg-emerald-500/10 text-emerald-400' :
                                        'bg-amber-500/10 text-amber-400'
                            }`}>
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{document.title}</h2>
                            <p className="text-sm text-zinc-500">{document.category.toUpperCase()} • Version {document.version}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Preview Area (Left/Top) */}
                    <div className="flex-1 bg-zinc-950/50 p-6 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-zinc-800 min-h-[300px]">
                        {document.fileType === 'image' ? (
                            <img
                                src={document.fileUrl}
                                alt={document.title}
                                className="max-w-full max-h-[500px] object-contain rounded-lg shadow-lg"
                            />
                        ) : (
                            <div className="text-center">
                                <FileText className="w-24 h-24 text-zinc-700 mx-auto mb-4" />
                                <p className="text-zinc-500">Preview not available for this file type</p>
                                <button className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 mx-auto">
                                    <Download className="w-4 h-4" />
                                    Download to View
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Metadata Area (Right/Bottom) */}
                    <div className="w-full lg:w-96 p-6 overflow-y-auto">
                        <div className="space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-zinc-300 text-sm leading-relaxed">
                                    {document.description}
                                </p>
                            </div>

                            {/* Details Grid */}
                            <div>
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Document Details</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> Uploaded
                                        </span>
                                        <span className="text-zinc-300">{new Date(document.uploadedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500 flex items-center gap-2">
                                            <User className="w-4 h-4" /> Uploaded By
                                        </span>
                                        <span className="text-zinc-300 capitalize">{document.uploadedBy.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500 flex items-center gap-2">
                                            <Shield className="w-4 h-4" /> Status
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${document.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                                document.status === 'pending_review' ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-zinc-800 text-zinc-400'
                                            }`}>
                                            {document.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            <div>
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {document.tags.map((tag, i) => (
                                        <span key={i} className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md text-xs flex items-center gap-1">
                                            <Tag className="w-3 h-3" />
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-6 border-t border-zinc-800 flex flex-col gap-3">
                                <button className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" />
                                    Download Original
                                </button>
                                <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2">
                                    <ExternalLink className="w-4 h-4" />
                                    Open in New Tab
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandDocumentModal;
