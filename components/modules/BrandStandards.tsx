import React, { useState, useMemo, useEffect } from 'react';
import {
    BookOpen, Upload, Filter, Grid, List, Search, FileText,
    Image, FileVideo, Award, ScrollText, FileCheck, Briefcase,
    Calendar, User, Download, Eye, Clock, CheckCircle, AlertCircle,
    XCircle, Archive, BarChart3, Settings
} from 'lucide-react';
import { BrandDocument, BrandChange } from '../../types';
import BrandUploadModal from './BrandUploadModal';
import BrandDashboard from './BrandDashboard';
import BrandDocumentModal from './BrandDocumentModal';
import AIConfiguration from './AIConfiguration';
import { intelligentAnalyzer } from '../../services/brand/intelligentAnalyzer';
import { deploymentOrchestrator } from '../../services/brand/deploymentOrchestrator';
import { brandServiceBus } from '../../services/brand/brandServiceBus';
import { SystemAdaptation } from '../../services/brand/brandStandardsAIService';
import { brandDocumentService } from '../../services/brand/brandDocumentService';
import UniversalReportCenter from '../shared/UniversalReportCenter';

const BrandStandards: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'documents' | 'ai-settings' | 'reports'>('dashboard');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDocument, setSelectedDocument] = useState<BrandDocument | null>(null);
    const [showUpload, setShowUpload] = useState(false);

    const [documents, setDocuments] = useState<BrandDocument[]>([]);

    useEffect(() => {
        loadDocuments();

        // Subscribe to updates
        const subscriptionId = brandServiceBus.subscribe(
            'BrandStandards',
            ['document_uploaded', 'all_changes'],
            () => loadDocuments()
        );

        return () => {
            brandServiceBus.unsubscribe(subscriptionId);
        };
    }, []);

    const loadDocuments = () => {
        setDocuments(brandDocumentService.getDocuments());
    };

    const categories = [
        { id: 'all', label: 'All Documents', icon: BookOpen, count: documents.length },
        { id: 'asset', label: 'Brand Assets', icon: Image, count: documents.filter(d => d.category === 'asset').length },
        { id: 'guideline', label: 'Guidelines', icon: ScrollText, count: documents.filter(d => d.category === 'guideline').length },
        { id: 'sop', label: 'SOPs', icon: FileCheck, count: documents.filter(d => d.category === 'sop').length },
        { id: 'license', label: 'Licenses', icon: Award, count: documents.filter(d => d.category === 'license').length },
        { id: 'job_description', label: 'Job Descriptions', icon: Briefcase, count: documents.filter(d => d.category === 'job_description').length },
        { id: 'agreement', label: 'Agreements', icon: FileText, count: documents.filter(d => d.category === 'agreement').length }
    ];

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategory, searchQuery, documents]);

    const getFileIcon = (fileType: string) => {
        switch (fileType) {
            case 'pdf': return <FileText size={24} className="text-rose-500" />;
            case 'image': return <Image size={24} className="text-violet-500" />;
            case 'video': return <FileVideo size={24} className="text-amber-500" />;
            default: return <FileText size={24} className="text-zinc-500" />;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle size={14} className="text-emerald-500" />;
            case 'pending_review': return <AlertCircle size={14} className="text-amber-500" />;
            case 'draft': return <Clock size={14} className="text-zinc-500" />;
            case 'archived': return <Archive size={14} className="text-zinc-600" />;
            default: return null;
        }
    };

    const renderGridView = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocuments.map(doc => (
                <div
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc)}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-violet-500/50 
                             hover:bg-zinc-800/50 transition cursor-pointer group"
                >
                    <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-zinc-700 transition">
                            {getFileIcon(doc.fileType)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(doc.status)}
                                <span className="text-xs text-zinc-500 uppercase font-bold">v{doc.version}</span>
                            </div>
                            <h3 className="text-sm font-bold text-zinc-100 truncate group-hover:text-violet-400 transition">
                                {doc.title}
                            </h3>
                        </div>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-3">{doc.description}</p>
                    <div className="flex items-center justify-between text-xs text-zinc-600">
                        <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-1">
                            {doc.tags?.slice(0, 2).map(tag => (
                                <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px]">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderListView = () => (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                        <th className="px-6 py-3">Document</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Version</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Updated</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                    {filteredDocuments.map(doc => (
                        <tr
                            key={doc.id}
                            className="hover:bg-zinc-800/30 transition group cursor-pointer"
                            onClick={() => setSelectedDocument(doc)}
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    {getFileIcon(doc.fileType)}
                                    <div>
                                        <div className="font-medium text-zinc-200 group-hover:text-violet-400 transition">
                                            {doc.title}
                                        </div>
                                        <div className="text-xs text-zinc-500 line-clamp-1">{doc.description}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-xs text-zinc-400 capitalize">{doc.category.replace('_', ' ')}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-mono text-xs text-zinc-300">v{doc.version}</span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(doc.status)}
                                    <span className="text-xs text-zinc-400 capitalize">
                                        {doc.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-xs text-zinc-500">
                                    {new Date(doc.uploadedAt).toLocaleDateString()}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDocument(doc);
                                    }}
                                    className="p-2 hover:bg-zinc-700 rounded text-zinc-500 hover:text-violet-400 transition"
                                >
                                    <Eye size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="module-container">
            <div className="module-header glass-panel">
                <div className="module-header-v2-branding justify-between">
                    <div className="flex items-center gap-4">
                        <div className="module-header-v2-icon">
                            <BookOpen className="w-6 h-6 text-violet-400" />
                        </div>
                        <div>
                            <h1 className="module-header-v2-title">Brand Standards</h1>
                            <p className="module-header-v2-subtitle">Hotel Singularity · Autonomous Quality Engine</p>
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        {/* Search Bar (Condensed for V2 Header) */}
                        <div className="relative group">
                            <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 shadow-xl transition-all focus-within:border-violet-500/50">
                                <Search className="w-3.5 h-3.5 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Scan standards..."
                                    className="w-32 bg-transparent border-none outline-none ml-2 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:w-48 transition-all duration-300"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowUpload(true)}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-violet-900/40 flex items-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Upload
                        </button>
                    </div>
                </div>

                {/* Standardized V2 Tab Bar */}
                <div className="module-tabs-v2">
                    {[
                        { id: 'dashboard', label: 'System Dashboard', icon: BarChart3 },
                        { id: 'documents', label: 'Document Library', icon: BookOpen },
                        { id: 'ai-settings', label: 'AI Settings', icon: Settings },
                        { id: 'reports', label: 'Audit Reports', icon: BarChart3 },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`module-tab-v2 ${activeTab === item.id ? 'active' : ''}`}
                        >
                            <item.icon className="w-3.5 h-3.5" />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="module-body z-0 flex flex-col gap-6">

                {/* Dashboard View */}
                {activeTab === 'dashboard' && (
                    <BrandDashboard />
                )}

                {/* AI Settings View */}
                {activeTab === 'ai-settings' && (
                    <AIConfiguration />
                )}

                {/* Documents View */}
                {activeTab === 'documents' && (
                    <div className="flex flex-col flex-1 gap-4">
                        {/* Category Filter */}
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {categories.map(cat => {
                                const Icon = cat.icon;
                                const isActive = selectedCategory === cat.id;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition
                                     ${isActive
                                                ? 'bg-violet-600 text-white'
                                                : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        <span className="text-sm font-medium">{cat.label}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${isActive ? 'bg-violet-700' : 'bg-zinc-800'}`}>
                                            {cat.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search and View Toggle */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search documents..."
                                    className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg 
                                 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500"
                                />
                            </div>
                            <div className="flex gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <Grid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    <List size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Documents View */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredDocuments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <BookOpen size={48} className="text-zinc-700 mb-4" />
                                    <p className="text-zinc-500 text-lg font-medium">No documents found</p>
                                    <p className="text-zinc-600 text-sm mt-2">
                                        {searchQuery ? 'Try a different search term' : 'Upload your first document to get started'}
                                    </p>
                                </div>
                            ) : (
                                viewMode === 'grid' ? renderGridView() : renderListView()
                            )}
                        </div>

                        {/* Document Modal */}
                        {selectedDocument && (
                            <BrandDocumentModal
                                document={selectedDocument}
                                onClose={() => setSelectedDocument(null)}
                            />
                        )}

                        {/* Upload Modal */}
                        {showUpload && (
                            <BrandUploadModal
                                onClose={() => setShowUpload(false)}
                                onSuccess={() => {
                                    console.log('[Brand Standards] Upload successful - refreshing...');
                                    // In production, refresh document list here
                                }}
                            />
                        )}
                    </div>
                )}

                {/* Reports View */}
                {activeTab === 'reports' && (
                    <div className="flex-1 bg-zinc-900/20 rounded-2xl overflow-hidden border border-zinc-800 flex flex-col">
                        <UniversalReportCenter defaultCategory="BrandStandards" />
                    </div>
                )}
            </main>
        </div >
    );
};

export default BrandStandards;
