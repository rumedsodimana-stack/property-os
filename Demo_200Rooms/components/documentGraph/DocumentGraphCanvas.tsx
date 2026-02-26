import React, { useState, useEffect, useRef } from 'react';
import { Search, ZoomIn, ZoomOut, RotateCcw, Download, Filter } from 'lucide-react';
import { documentGraphService, DocumentNode, DocumentConnection } from '../../services/intelligence/documentGraphService';
import { documentTypeConfig } from '../../services/intelligence/documentGraphConfig';
import DocumentNodeComponent from './DocumentNode';
import ConnectionLine from './ConnectionLine';

interface Position {
    x: number;
    y: number;
}

const DocumentGraphCanvas: React.FC = () => {
    const [documents, setDocuments] = useState<DocumentNode[]>([]);
    const [connections, setConnections] = useState<DocumentConnection[]>([]);
    const [selectedNode, setSelectedNode] = useState<string>();
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

    // Load graph data
    useEffect(() => {
        loadGraph();
    }, []);

    const loadGraph = () => {
        setDocuments(documentGraphService.getAllDocuments());
        setConnections(documentGraphService.getAllConnections());
    };

    // Handle search
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim()) {
            const results = documentGraphService.searchDocuments(query);
            setDocuments(results);
        } else {
            loadGraph();
        }
    };

    // Handle filter
    const handleFilter = (type: string | null) => {
        setFilterType(type);
        if (type) {
            const filtered = documentGraphService.filterByType(type as any);
            setDocuments(filtered);
        } else {
            loadGraph();
        }
    };

    // Handle zoom
    const handleZoom = (delta: number) => {
        setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
    };

    // Reset view
    const handleReset = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setSearchQuery('');
        setFilterType(null);
        loadGraph();
    };

    // Export graph
    const handleExport = () => {
        const data = documentGraphService.exportGraph();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document-graph.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    // Canvas pan
    const handleMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setDragging(false);
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
            {/* Top Controls */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                {/* Search */}
                <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                    />
                </div>

                {/* Type Filters */}
                <div className="flex items-center gap-2 ml-4">
                    <Filter className="w-4 h-4 text-zinc-500" />
                    <select
                        value={filterType || ''}
                        onChange={(e) => handleFilter(e.target.value || null)}
                        className="px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-violet-500"
                    >
                        <option value="">All Types</option>
                        {Object.entries(documentTypeConfig).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 ml-4">
                    <button
                        onClick={() => handleZoom(0.1)}
                        className="p-2 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4 text-zinc-300" />
                    </button>
                    <button
                        onClick={() => handleZoom(-0.1)}
                        className="p-2 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4 text-zinc-300" />
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-2 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition"
                        title="Reset View"
                    >
                        <RotateCcw className="w-4 h-4 text-zinc-300" />
                    </button>
                    <button
                        onClick={handleExport}
                        className="p-2 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition"
                        title="Export Graph"
                    >
                        <Download className="w-4 h-4 text-zinc-300" />
                    </button>
                </div>
            </div>

            {/* Graph Canvas */}
            <div
                ref={canvasRef}
                className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center',
                        transition: dragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                >
                    {/* Connection Lines (render first, behind nodes) */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {connections.map(conn => {
                            const sourceDoc = documents.find(d => d.id === conn.sourceId);
                            const targetDoc = documents.find(d => d.id === conn.targetId);
                            if (!sourceDoc || !targetDoc) return null;

                            return (
                                <ConnectionLine
                                    key={conn.id}
                                    from={sourceDoc.position}
                                    to={targetDoc.position}
                                    type={conn.type}
                                    strength={conn.strength}
                                />
                            );
                        })}
                    </svg>

                    {/* Document Nodes */}
                    {documents.map(doc => (
                        <DocumentNodeComponent
                            key={doc.id}
                            document={doc}
                            selected={selectedNode === doc.id}
                            onSelect={() => setSelectedNode(doc.id)}
                        />
                    ))}

                    {/* Empty State */}
                    {documents.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-4xl mb-4">📄</div>
                                <h3 className="text-xl font-semibold text-zinc-300 mb-2">
                                    No Documents Yet
                                </h3>
                                <p className="text-zinc-500">
                                    Upload your first document to start building the knowledge graph
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Stats */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-800 bg-zinc-900/50">
                <div className="text-xs text-zinc-500">
                    {documents.length} documents • {connections.length} connections
                </div>
                <div className="text-xs text-zinc-500">
                    Zoom: {Math.round(zoom * 100)}%
                </div>
            </div>
        </div>
    );
};

export default DocumentGraphCanvas;
