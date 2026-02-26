import React, { useState, useEffect } from 'react';
import { Plus, Network, TrendingUp } from 'lucide-react';
import DocumentGraphCanvas from '../documentGraph/DocumentGraphCanvas';
import DocumentUploadModal from '../documentGraph/DocumentUploadModal';
import { documentGraphService } from '../../services/intelligence/documentGraphService';
import { seedDocumentGraph } from '../../services/intelligence/documentGraphSeedData';

const DocumentKnowledgeGraph: React.FC = () => {
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [stats, setStats] = useState({
        totalDocs: 0,
        totalConnections: 0,
        orphans: 0
    });
    const [initialized, setInitialized] = useState(false);

    // Initialize with seed data on first load
    useEffect(() => {
        if (!initialized && documentGraphService.getAllDocuments().length === 0) {
            seedDocumentGraph();
            setInitialized(true);
        }
        updateStats();
    }, [initialized]);

    const updateStats = () => {
        setStats({
            totalDocs: documentGraphService.getAllDocuments().length,
            totalConnections: documentGraphService.getAllConnections().length,
            orphans: documentGraphService.getOrphans().length
        });
    };

    const handleUploadSuccess = () => {
        updateStats();
    };

    return (
        <div className="h-full flex flex-col bg-zinc-950">
            {/* Header */}
            <div className="border-b border-zinc-800 bg-gradient-to-r from-zinc-900 to-zinc-900/50">
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
                                <Network className="w-7 h-7 text-violet-500" />
                                Document Knowledge Graph
                            </h1>
                            <p className="text-zinc-400 mt-1">
                                Visual network of all organizational documents
                            </p>
                        </div>
                        <button
                            onClick={() => setUploadModalOpen(true)}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Document
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                            <div className="text-zinc-400 text-sm">Total Documents</div>
                            <div className="text-2xl font-semibold text-zinc-100 mt-1">
                                {stats.totalDocs}
                            </div>
                        </div>
                        <div className="px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                            <div className="text-zinc-400 text-sm">Connections</div>
                            <div className="text-2xl font-semibold text-zinc-100 mt-1">
                                {stats.totalConnections}
                            </div>
                        </div>
                        <div className="px-4 py-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                            <div className="text-zinc-400 text-sm">Orphan Documents</div>
                            <div className="text-2xl font-semibold text-amber-500 mt-1">
                                {stats.orphans}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Graph Canvas */}
            <div className="flex-1 overflow-hidden">
                <DocumentGraphCanvas />
            </div>

            {/* Upload Modal */}
            <DocumentUploadModal
                isOpen={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onSuccess={handleUploadSuccess}
            />
        </div>
    );
};

export default DocumentKnowledgeGraph;
