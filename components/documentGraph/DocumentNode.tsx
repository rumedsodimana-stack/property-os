import React, { useState } from 'react';
import { DocumentNode as DocNode } from '../../services/intelligence/documentGraphService';
import { documentTypeConfig } from '../../services/intelligence/documentGraphConfig';

interface DocumentNodeProps {
    document: DocNode;
    selected?: boolean;
    onSelect: () => void;
}

const DocumentNode: React.FC<DocumentNodeProps> = ({ document, selected, onSelect }) => {
    const [isHovered, setIsHovered] = useState(false);
    const config = documentTypeConfig[document.type];
    const Icon = config.icon;

    // Format file size
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Format date
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return `${Math.floor(diffDays / 30)}mo ago`;
    };

    const nodeScale = isHovered ? 1.1 : selected ? 1.05 : 1;

    return (
        <div
            className="absolute cursor-pointer transition-transform duration-200 ease-out"
            style={{
                left: document.position.x,
                top: document.position.y,
                transform: `translate(-50%, -50%) scale(${nodeScale})`,
            }}
            onClick={onSelect}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Node Container */}
            <div
                className={`relative w-48 p-4 rounded-xl border-2 transition-all duration-200 ${selected
                    ? 'border-violet-500 shadow-lg shadow-violet-500/50'
                    : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                style={{
                    background: `linear-gradient(135deg, rgba(24, 24, 27, 0.95), rgba(39, 39, 42, 0.95))`,
                    backdropFilter: 'blur(10px)'
                }}
            >
                {/* Animated Glow */}
                {selected && (
                    <div
                        className="absolute inset-0 rounded-xl opacity-20 animate-pulse"
                        style={{
                            background: `radial-gradient(circle at center, ${config.color}, transparent)`,
                        }}
                    />
                )}

                {/* Icon & Title */}
                <div className="relative flex items-start gap-3 mb-2">
                    <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${config.color}20` }}
                    >
                        <Icon
                            className="w-5 h-5"
                            style={{ color: config.color }}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-zinc-100 truncate">
                            {document.title}
                        </h4>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            {config.label}
                        </p>
                    </div>
                </div>

                {/* Metadata */}
                <div className="relative space-y-1">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Version {document.metadata.version}</span>
                        <span className="text-zinc-500">{formatSize(document.metadata.size)}</span>
                    </div>
                    <div className="text-xs text-zinc-500">
                        Updated {formatDate(document.metadata.updatedAt)}
                    </div>
                </div>

                {/* Tags (if hovered or selected) */}
                {(isHovered || selected) && document.metadata.tags.length > 0 && (
                    <div className="relative mt-2 flex flex-wrap gap-1">
                        {document.metadata.tags.slice(0, 3).map(tag => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-400"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Connection Indicators (visual dots on edges) */}
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            </div>

            {/* Tooltip (on hover) */}
            {isHovered && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 pointer-events-none">
                    <p className="text-xs text-zinc-300 mb-2">
                        {document.description}
                    </p>
                    <div className="text-xs text-zinc-500 space-y-1">
                        <div>Department: {document.metadata.department}</div>
                        <div>Properties: {document.metadata.properties.join(', ')}</div>
                        <div>Uploaded by: {document.metadata.uploadedBy}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentNode;
