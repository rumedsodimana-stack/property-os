/**
 * Brand Service Bus
 * 
 * Pub/Sub event system that broadcasts brand standard changes
 * to all subscribed modules for real-time adaptation.
 */

export type BrandEventType =
    | 'color_updated'
    | 'time_updated'
    | 'policy_updated'
    | 'workflow_updated'
    | 'permission_updated'
    | 'document_uploaded'
    | 'adaptation_deployed'
    | 'all_changes';

export interface BrandEvent {
    id: string;
    type: BrandEventType;
    timestamp: string;
    source: string;
    data: any;
    priority: 'low' | 'medium' | 'high' | 'critical';
    affectedModules?: string[];
}

export type BrandEventHandler = (event: BrandEvent) => void | Promise<void>;

export interface Subscription {
    id: string;
    module: string;
    eventTypes: BrandEventType[];
    handler: BrandEventHandler;
    priority: number; // Higher = executed first
}

class BrandServiceBus {
    private subscriptions: Map<string, Subscription[]> = new Map();
    private eventHistory: BrandEvent[] = [];
    private readonly MAX_HISTORY = 100;

    /**
     * Subscribe to brand events
     */
    subscribe(
        module: string,
        eventTypes: BrandEventType[],
        handler: BrandEventHandler,
        priority: number = 0
    ): string {
        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const subscription: Subscription = {
            id: subscriptionId,
            module,
            eventTypes,
            handler,
            priority
        };

        // Add to subscriptions for each event type
        eventTypes.forEach(eventType => {
            if (!this.subscriptions.has(eventType)) {
                this.subscriptions.set(eventType, []);
            }

            const subs = this.subscriptions.get(eventType)!;
            subs.push(subscription);

            // Sort by priority (highest first)
            subs.sort((a, b) => b.priority - a.priority);
        });

        // Also subscribe to 'all_changes'
        if (!this.subscriptions.has('all_changes')) {
            this.subscriptions.set('all_changes', []);
        }
        this.subscriptions.get('all_changes')!.push(subscription);

        console.log(`[Brand Service Bus] ${module} subscribed to:`, eventTypes);
        return subscriptionId;
    }

    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId: string): void {
        for (const [eventType, subs] of this.subscriptions.entries()) {
            const index = subs.findIndex(s => s.id === subscriptionId);
            if (index !== -1) {
                const sub = subs[index];
                subs.splice(index, 1);
                console.log(`[Brand Service Bus] ${sub.module} unsubscribed from ${eventType}`);
            }
        }
    }

    /**
     * Publish event to subscribers
     */
    async publish(event: BrandEvent): Promise<void> {
        console.log(`[Brand Service Bus] Publishing ${event.type} event:`, event.data);

        // Add to history
        this.eventHistory.unshift(event);
        if (this.eventHistory.length > this.MAX_HISTORY) {
            this.eventHistory.pop();
        }

        // Get subscribers for this event type
        const subscribers = this.subscriptions.get(event.type) || [];

        // Filter by affected modules if specified
        const filteredSubscribers = event.affectedModules
            ? subscribers.filter(sub => event.affectedModules!.includes(sub.module))
            : subscribers;

        console.log(`[Brand Service Bus] Notifying ${filteredSubscribers.length} subscribers`);

        // Execute handlers in priority order
        for (const subscription of filteredSubscribers) {
            try {
                await subscription.handler(event);
            } catch (error: any) {
                console.error(
                    `[Brand Service Bus] Handler error in ${subscription.module}:`,
                    error.message
                );
            }
        }
    }

    /**
     * Publish multiple events
     */
    async publishBatch(events: BrandEvent[]): Promise<void> {
        for (const event of events) {
            await this.publish(event);
        }
    }

    /**
     * Get event history
     */
    getEventHistory(limit: number = 20): BrandEvent[] {
        return this.eventHistory.slice(0, limit);
    }

    /**
     * Get active subscriptions
     */
    getSubscriptions(module?: string): Subscription[] {
        const allSubs: Subscription[] = [];

        for (const subs of this.subscriptions.values()) {
            allSubs.push(...subs);
        }

        // Remove duplicates (same subscription can be in multiple event type arrays)
        const uniqueSubs = Array.from(
            new Map(allSubs.map(sub => [sub.id, sub])).values()
        );

        return module
            ? uniqueSubs.filter(sub => sub.module === module)
            : uniqueSubs;
    }

    /**
     * Clear all subscriptions (for testing)
     */
    clearAll(): void {
        this.subscriptions.clear();
        this.eventHistory = [];
        console.log('[Brand Service Bus] All subscriptions cleared');
    }

    /**
     * Get subscription count
     */
    getSubscriptionCount(): number {
        return this.getSubscriptions().length;
    }

    /**
     * Helper: Create event
     */
    createEvent(
        type: BrandEventType,
        data: any,
        options: {
            source?: string;
            priority?: 'low' | 'medium' | 'high' | 'critical';
            affectedModules?: string[];
        } = {}
    ): BrandEvent {
        return {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            timestamp: new Date().toISOString(),
            source: options.source || 'brand_standards',
            data,
            priority: options.priority || 'medium',
            affectedModules: options.affectedModules
        };
    }
}

// Export singleton
export const brandServiceBus = new BrandServiceBus();

// Export class for testing
export default BrandServiceBus;
