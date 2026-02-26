/**
 * Brand Document Service
 * 
 * Manages the lifecycle of brand documents, providing a single source of truth
 * for the BrandStandards module. Replaces hardcoded mock data.
 */

import { BrandDocument } from '../../types';
import { brandServiceBus } from './brandServiceBus';
import { subscribeToItems, addItem, updateItem, deleteItem } from '../kernel/firestoreService';

class BrandDocumentService {
    private documents: BrandDocument[] = [];
    private unsubscribe: (() => void) | null = null;
    private initialized = false;

    constructor() {
        this.initialize();
    }

    private initialize() {
        if (this.initialized) return;

        // Subscribe to Firestore 'brand_documents' collection
        this.unsubscribe = subscribeToItems<BrandDocument>('brand_documents', (docs) => {
            this.documents = docs;
            console.log('[BrandDocumentService] Synced with Firestore:', docs.length, 'documents');

            // Notify subscribers that data changed (this keeps UI in sync)
            brandServiceBus.publish({
                id: `evt_${Date.now()}_sync`,
                type: 'all_changes',
                timestamp: new Date().toISOString(),
                source: 'brand_document_service',
                data: { action: 'sync', count: docs.length },
                priority: 'low'
            });
        });

        this.initialized = true;
    }

    /**
     * Get all brand documents
     */
    getDocuments(): BrandDocument[] {
        return [...this.documents];
    }

    /**
     * Get a specific document by ID
     */
    getDocumentById(id: string): BrandDocument | undefined {
        return this.documents.find(doc => doc.id === id);
    }

    /**
     * Add a new document (Persists to Firestore)
     */
    async addDocument(doc: BrandDocument): Promise<void> {
        // Optimistic update
        this.documents.unshift(doc);

        try {
            await addItem('brand_documents', doc);

            // Bus event for other services
            brandServiceBus.publish({
                id: `evt_${Date.now()}_doc_added`,
                type: 'document_uploaded',
                timestamp: new Date().toISOString(),
                source: 'brand_document_service',
                data: { documentId: doc.id, title: doc.title },
                priority: 'medium'
            });
            console.log('[BrandDocumentService] Document added to Firestore:', doc.title);
        } catch (error) {
            console.error('[BrandDocumentService] Failed to add document:', error);
            // Rollback on error would go here
        }
    }

    /**
     * Delete a document (Persists to Firestore)
     */
    async deleteDocument(id: string): Promise<boolean> {
        try {
            await deleteItem('brand_documents', id);

            brandServiceBus.publish({
                id: `evt_${Date.now()}_doc_deleted`,
                type: 'all_changes',
                timestamp: new Date().toISOString(),
                source: 'brand_document_service',
                data: { documentId: id, action: 'deleted' },
                priority: 'low'
            });
            console.log('[BrandDocumentService] Document deleted from Firestore:', id);
            return true;
        } catch (error) {
            console.error('[BrandDocumentService] Failed to delete document:', error);
            return false;
        }
    }

    /**
     * Update a document status (Persists to Firestore)
     */
    async updateDocumentStatus(id: string, status: BrandDocument['status']): Promise<boolean> {
        try {
            await updateItem('brand_documents', id, { status });
            return true;
        } catch (error) {
            console.error('[BrandDocumentService] Failed to update status:', error);
            return false;
        }
    }

    /**
     * Get document statistics
     */
    getStats() {
        const total = this.documents.length;
        const assets = this.documents.filter(d => d.category === 'asset').length;
        const sops = this.documents.filter(d => d.category === 'sop').length;
        const guidelines = this.documents.filter(d => d.category === 'guideline').length;
        const approved = this.documents.filter(d => d.status === 'approved').length;
        const pending = this.documents.filter(d => d.status === 'pending_review').length;

        return {
            total,
            byCategory: { assets, sops, guidelines },
            byStatus: { approved, pending }
        };
    }
}

// Export singleton instance
export const brandDocumentService = new BrandDocumentService();
export default BrandDocumentService;
