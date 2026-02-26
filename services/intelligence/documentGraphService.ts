/**
 * Document Graph Service
 * 
 * Core service managing the visual document graph.
 * Implements Ted Nelson's concepts: transclusion, bidirectional links, version management.
 */

export type DocumentType =
    | 'brand_asset'
    | 'certificate'
    | 'agreement'
    | 'sop'
    | 'sos'
    | 'audit'
    | 'hr_document'
    | 'financial'
    | 'training'
    | 'custom';

export type ConnectionType =
    | 'transclude'    // Live reference (Ted Nelson's key concept)
    | 'reference'     // Simple mention
    | 'dependency'    // Requires other doc
    | 'version'       // Links to previous version
    | 'supersedes';   // Replaces older doc

export interface DocumentNode {
    id: string;
    type: DocumentType;
    title: string;
    description: string;
    fileUrl?: string;
    content?: string;
    metadata: {
        size: number;
        format: string;
        uploadedBy: string;
        uploadedAt: string;
        updatedAt: string;
        version: number;
        tags: string[];
        department: string;
        properties: string[];
    };
    position: { x: number; y: number };
}

export interface DocumentConnection {
    id: string;
    sourceId: string;
    targetId: string;
    type: ConnectionType;
    strength: number; // 0-1
    metadata?: {
        reason: string;
        createdAt: string;
        createdBy: string;
    };
}

export interface DocumentGraph {
    documents: Map<string, DocumentNode>;
    connections: Map<string, DocumentConnection>;
    layout: 'force' | 'hierarchical' | 'circular';
}

class DocumentGraphService {
    private graph: DocumentGraph = {
        documents: new Map(),
        connections: new Map(),
        layout: 'force'
    };

    /**
     * Add document to graph
     */
    addDocument(doc: Omit<DocumentNode, 'id'>): DocumentNode {
        const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newDoc: DocumentNode = { ...doc, id };

        this.graph.documents.set(id, newDoc);
        console.log(`[DocumentGraph] Added: ${newDoc.title}`);

        return newDoc;
    }

    /**
     * Update document
     */
    updateDocument(id: string, updates: Partial<DocumentNode>): DocumentNode | null {
        const doc = this.graph.documents.get(id);
        if (!doc) return null;

        const updated = {
            ...doc,
            ...updates,
            metadata: {
                ...doc.metadata,
                ...updates.metadata,
                updatedAt: new Date().toISOString()
            }
        };

        this.graph.documents.set(id, updated);
        console.log(`[DocumentGraph] Updated: ${updated.title}`);

        return updated;
    }

    /**
     * Delete document (with impact check)
     */
    deleteDocument(id: string): { success: boolean; impactedDocs: string[] } {
        const doc = this.graph.documents.get(id);
        if (!doc) return { success: false, impactedDocs: [] };

        // Find all connections
        const impactedDocs: string[] = [];
        for (const [connId, conn] of this.graph.connections) {
            if (conn.sourceId === id || conn.targetId === id) {
                impactedDocs.push(conn.sourceId === id ? conn.targetId : conn.sourceId);
                this.graph.connections.delete(connId);
            }
        }

        this.graph.documents.delete(id);
        console.log(`[DocumentGraph] Deleted: ${doc.title}, Impacted: ${impactedDocs.length} docs`);

        return { success: true, impactedDocs };
    }

    /**
     * Create connection between documents
     */
    addConnection(conn: Omit<DocumentConnection, 'id'>): DocumentConnection {
        const id = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConn: DocumentConnection = { ...conn, id };

        this.graph.connections.set(id, newConn);
        console.log(`[DocumentGraph] Connected: ${conn.sourceId} -> ${conn.targetId} (${conn.type})`);

        return newConn;
    }

    /**
     * Get bidirectional connections (Ted Nelson principle)
     */
    getConnections(docId: string): { outgoing: DocumentConnection[]; incoming: DocumentConnection[] } {
        const outgoing: DocumentConnection[] = [];
        const incoming: DocumentConnection[] = [];

        for (const conn of this.graph.connections.values()) {
            if (conn.sourceId === docId) outgoing.push(conn);
            if (conn.targetId === docId) incoming.push(conn);
        }

        return { outgoing, incoming };
    }

    /**
     * Get all documents
     */
    getAllDocuments(): DocumentNode[] {
        return Array.from(this.graph.documents.values());
    }

    /**
     * Get all connections
     */
    getAllConnections(): DocumentConnection[] {
        return Array.from(this.graph.connections.values());
    }

    /**
     * Search documents
     */
    searchDocuments(query: string): DocumentNode[] {
        const lowerQuery = query.toLowerCase();
        return this.getAllDocuments().filter(doc =>
            doc.title.toLowerCase().includes(lowerQuery) ||
            doc.description.toLowerCase().includes(lowerQuery) ||
            doc.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Filter by type
     */
    filterByType(type: DocumentType): DocumentNode[] {
        return this.getAllDocuments().filter(doc => doc.type === type);
    }

    /**
     * Get orphan documents (no connections)
     */
    getOrphans(): DocumentNode[] {
        const connectedIds = new Set<string>();
        for (const conn of this.graph.connections.values()) {
            connectedIds.add(conn.sourceId);
            connectedIds.add(conn.targetId);
        }

        return this.getAllDocuments().filter(doc => !connectedIds.has(doc.id));
    }

    /**
     * Get most connected documents
     */
    getMostConnected(limit: number = 10): Array<{ doc: DocumentNode; connectionCount: number }> {
        const counts = new Map<string, number>();

        for (const conn of this.graph.connections.values()) {
            counts.set(conn.sourceId, (counts.get(conn.sourceId) || 0) + 1);
            counts.set(conn.targetId, (counts.get(conn.targetId) || 0) + 1);
        }

        return Array.from(counts.entries())
            .map(([id, count]) => ({
                doc: this.graph.documents.get(id)!,
                connectionCount: count
            }))
            .sort((a, b) => b.connectionCount - a.connectionCount)
            .slice(0, limit);
    }

    /**
     * Export graph data
     */
    exportGraph(): { nodes: DocumentNode[]; edges: DocumentConnection[] } {
        return {
            nodes: this.getAllDocuments(),
            edges: this.getAllConnections()
        };
    }

    /**
     * Import graph data
     */
    importGraph(data: { nodes: DocumentNode[]; edges: DocumentConnection[] }): void {
        this.graph.documents.clear();
        this.graph.connections.clear();

        data.nodes.forEach(node => this.graph.documents.set(node.id, node));
        data.edges.forEach(edge => this.graph.connections.set(edge.id, edge));

        console.log(`[DocumentGraph] Imported: ${data.nodes.length} docs, ${data.edges.length} connections`);
    }
}

// Export singleton
export const documentGraphService = new DocumentGraphService();

// Export class for testing
export default DocumentGraphService;
