/**
 * Local Storage Database Service
 * Mimics Firebase/Firestore interface using localStorage for testing
 */

export interface Collection {
    name: string;
    documents: Map<string, any>;
}

export class LocalDatabase {
    private collections: Map<string, Collection> = new Map();
    private storageKey = 'hotel_singularity_db';

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Get collection reference
     */
    collection(name: string) {
        if (!this.collections.has(name)) {
            this.collections.set(name, {
                name,
                documents: new Map()
            });
        }

        const collection = this.collections.get(name)!;

        return {
            // Add document
            doc: (id?: string) => {
                const docId = id || this.generateId();
                return {
                    set: async (data: any) => {
                        collection.documents.set(docId, { ...data, id: docId });
                        this.saveToStorage();
                        return { id: docId };
                    },
                    get: async () => {
                        const data = collection.documents.get(docId);
                        return {
                            exists: !!data,
                            id: docId,
                            data: () => data,
                            ref: { id: docId }
                        };
                    },
                    update: async (updates: any) => {
                        const existing = collection.documents.get(docId);
                        if (existing) {
                            collection.documents.set(docId, { ...existing, ...updates });
                            this.saveToStorage();
                        }
                    },
                    delete: async () => {
                        collection.documents.delete(docId);
                        this.saveToStorage();
                    }
                };
            },

            // Add document without ID
            add: async (data: any) => {
                const id = this.generateId();
                collection.documents.set(id, { ...data, id });
                this.saveToStorage();
                return { id };
            },

            // Query documents
            where: (field: string, operator: string, value: any) => {
                return {
                    get: async () => {
                        const docs = Array.from(collection.documents.values())
                            .filter(doc => {
                                const fieldValue = this.getNestedValue(doc, field);
                                switch (operator) {
                                    case '==': return fieldValue === value;
                                    case '!=': return fieldValue !== value;
                                    case '<': return fieldValue < value;
                                    case '<=': return fieldValue <= value;
                                    case '>': return fieldValue > value;
                                    case '>=': return fieldValue >= value;
                                    case 'in': return Array.isArray(value) && value.includes(fieldValue);
                                    default: return false;
                                }
                            });

                        return {
                            docs: docs.map(doc => ({
                                id: doc.id,
                                data: () => doc,
                                ref: { id: doc.id }
                            })),
                            empty: docs.length === 0,
                            size: docs.length
                        };
                    },
                    where: (nextField: string, nextOp: string, nextValue: any) => {
                        // Chain multiple where clauses
                        return this.collection(name).where(field, operator, value);
                    }
                };
            },

            // Get all documents
            get: async () => {
                const docs = Array.from(collection.documents.values());
                return {
                    docs: docs.map(doc => ({
                        id: doc.id,
                        data: () => doc,
                        ref: { id: doc.id }
                    })),
                    empty: docs.length === 0,
                    size: docs.length
                };
            },

            // Order by
            orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => {
                return {
                    limit: (count: number) => {
                        return {
                            get: async () => {
                                const docs = Array.from(collection.documents.values())
                                    .sort((a, b) => {
                                        const aVal = this.getNestedValue(a, field);
                                        const bVal = this.getNestedValue(b, field);
                                        if (direction === 'asc') {
                                            return aVal > bVal ? 1 : -1;
                                        } else {
                                            return aVal < bVal ? 1 : -1;
                                        }
                                    })
                                    .slice(0, count);

                                return {
                                    docs: docs.map(doc => ({
                                        id: doc.id,
                                        data: () => doc,
                                        ref: { id: doc.id }
                                    })),
                                    empty: docs.length === 0,
                                    size: docs.length
                                };
                            }
                        };
                    },
                    get: async () => {
                        const docs = Array.from(collection.documents.values())
                            .sort((a, b) => {
                                const aVal = this.getNestedValue(a, field);
                                const bVal = this.getNestedValue(b, field);
                                if (direction === 'asc') {
                                    return aVal > bVal ? 1 : -1;
                                } else {
                                    return aVal < bVal ? 1 : -1;
                                }
                            });

                        return {
                            docs: docs.map(doc => ({
                                id: doc.id,
                                data: () => doc,
                                ref: { id: doc.id }
                            })),
                            empty: docs.length === 0,
                            size: docs.length
                        };
                    }
                };
            }
        };
    }

    /**
     * Batch operations
     */
    batch() {
        const operations: Array<() => Promise<void>> = [];

        return {
            set: (ref: any, data: any) => {
                operations.push(async () => {
                    await ref.set(data);
                });
            },
            update: (ref: any, updates: any) => {
                operations.push(async () => {
                    await ref.update(updates);
                });
            },
            delete: (ref: any) => {
                operations.push(async () => {
                    await ref.delete();
                });
            },
            commit: async () => {
                for (const op of operations) {
                    await op();
                }
            }
        };
    }

    /**
     * Clear all data
     */
    clear() {
        this.collections.clear();
        localStorage.removeItem(this.storageKey);
    }

    /**
     * Get all data (for debugging)
     */
    getAllData() {
        const data: any = {};
        this.collections.forEach((collection, name) => {
            data[name] = Array.from(collection.documents.values());
        });
        return data;
    }

    /**
     * Save to localStorage
     */
    private saveToStorage() {
        const data: any = {};
        this.collections.forEach((collection, name) => {
            data[name] = Array.from(collection.documents.entries());
        });
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    /**
     * Load from localStorage
     */
    private loadFromStorage() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                Object.keys(data).forEach(collectionName => {
                    const docs = new Map<string, any>(data[collectionName]);
                    this.collections.set(collectionName, {
                        name: collectionName,
                        documents: docs
                    });
                });
            } catch (e) {
                console.error('Failed to load from storage:', e);
            }
        }
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    /**
     * Get nested value from object
     */
    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
}

// Create singleton instance
export const localDB = new LocalDatabase();
