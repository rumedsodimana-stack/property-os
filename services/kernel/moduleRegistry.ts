/**
 * Module Registry
 * 
 * Centralized registry of all modules and their brand dependencies.
 * Modules declare what brand aspects they care about and get notified of changes.
 */

import { BrandEventType, brandServiceBus, BrandEvent } from '../brand/brandServiceBus';

export interface ModuleConfig {
    id: string;
    name: string;
    description: string;
    subscribesTo: BrandEventType[];
    configPoints: string[]; // What configs this module uses
    adaptationCallback?: (event: BrandEvent) => void | Promise<void>;
    priority?: number;
}

export interface RegisteredModule {
    config: ModuleConfig;
    subscriptionId: string;
    registeredAt: string;
    lastUpdated?: string;
}

class ModuleRegistry {
    private modules: Map<string, RegisteredModule> = new Map();

    /**
     * Register a module
     */
    register(config: ModuleConfig): string {
        const existing = this.modules.get(config.id);
        if (existing) {
            console.log(`[Module Registry] Module already registered: ${config.name}`);
            return existing.subscriptionId;
        }

        console.log(`[Module Registry] Registering module: ${config.name}`);

        // Create subscription to brand events
        const subscriptionId = brandServiceBus.subscribe(
            config.id,
            config.subscribesTo,
            async (event: BrandEvent) => {
                console.log(`[Module Registry] ${config.name} received event:`, event.type);

                // Update last updated time
                const module = this.modules.get(config.id);
                if (module) {
                    module.lastUpdated = new Date().toISOString();
                }

                // Call module's adaptation callback
                if (config.adaptationCallback) {
                    await config.adaptationCallback(event);
                }
            },
            config.priority || 0
        );

        const registeredModule: RegisteredModule = {
            config,
            subscriptionId,
            registeredAt: new Date().toISOString()
        };

        this.modules.set(config.id, registeredModule);

        console.log(`[Module Registry] ${config.name} registered successfully`);
        return subscriptionId;
    }

    /**
     * Unregister a module
     */
    unregister(moduleId: string): void {
        const module = this.modules.get(moduleId);
        if (module) {
            brandServiceBus.unsubscribe(module.subscriptionId);
            this.modules.delete(moduleId);
            console.log(`[Module Registry] ${module.config.name} unregistered`);
        }
    }

    /**
     * Get registered module
     */
    getModule(moduleId: string): RegisteredModule | null {
        return this.modules.get(moduleId) || null;
    }

    /**
     * Get all registered modules
     */
    getAllModules(): RegisteredModule[] {
        return Array.from(this.modules.values());
    }

    /**
     * Get modules that care about specific config point
     */
    getModulesByConfigPoint(configPoint: string): RegisteredModule[] {
        return Array.from(this.modules.values()).filter(module =>
            module.config.configPoints.includes(configPoint)
        );
    }

    /**
     * Notify modules of brand change
     */
    async notifyModules(
        eventType: BrandEventType,
        data: any,
        affectedModules?: string[]
    ): Promise<void> {
        const event = brandServiceBus.createEvent(eventType, data, {
            source: 'module_registry',
            affectedModules
        });

        await brandServiceBus.publish(event);
    }

    /**
     * Get module count
     */
    getModuleCount(): number {
        return this.modules.size;
    }

    /**
     * Check if module is registered
     */
    isRegistered(moduleId: string): boolean {
        return this.modules.has(moduleId);
    }
}

// Export singleton
export const moduleRegistry = new ModuleRegistry();

// Export class for testing
export default ModuleRegistry;

// Pre-register core modules
export const registerCoreModules = () => {
    // Front Desk Module
    moduleRegistry.register({
        id: 'front_desk',
        name: 'Front Desk',
        description: 'Guest check-in/out and reservations',
        subscribesTo: ['time_updated', 'policy_updated', 'workflow_updated'],
        configPoints: ['checkInTime', 'checkOutTime', 'depositRequired', 'idVerification'],
        adaptationCallback: async (event) => {
            console.log('[Front Desk] Adapting to brand change:', event.type);

            if (event.type === 'time_updated' && event.data.checkInTime) {
                console.log(`[Front Desk] Check-in time updated to ${event.data.checkInTime}`);
                // In real implementation, this would update component state or config
            }

            if (event.type === 'policy_updated' && event.data.depositRequired !== undefined) {
                console.log(`[Front Desk] Deposit requirement updated to ${event.data.depositRequired}`);
            }
        },
        priority: 10 // High priority
    });

    // Housekeeping Module
    moduleRegistry.register({
        id: 'housekeeping',
        name: 'Housekeeping',
        description: 'Room cleaning and maintenance',
        subscribesTo: ['time_updated', 'policy_updated', 'workflow_updated'],
        configPoints: ['cleaningTime', 'inspectionRequired', 'cleaningChecklist'],
        adaptationCallback: async (event) => {
            console.log('[Housekeeping] Adapting to brand change:', event.type);

            if (event.type === 'time_updated' && event.data.cleaningTime) {
                console.log(`[Housekeeping] Cleaning duration updated to ${event.data.cleaningTime} minutes`);
            }
        },
        priority: 8
    });

    // POS Module
    moduleRegistry.register({
        id: 'pos',
        name: 'Point of Sale',
        description: 'Restaurant and bar operations',
        subscribesTo: ['policy_updated', 'workflow_updated'],
        configPoints: ['serviceCharge', 'taxRate', 'discountRules'],
        adaptationCallback: async (event) => {
            console.log('[POS] Adapting to brand change:', event.type);
        },
        priority: 7
    });

    // UI Theme Module
    moduleRegistry.register({
        id: 'ui_theme',
        name: 'UI Theme',
        description: 'Global UI colors and styling',
        subscribesTo: ['color_updated'],
        configPoints: ['primaryColor', 'accentColor', 'errorColor', 'fontFamily'],
        adaptationCallback: async (event) => {
            console.log('[UI Theme] Adapting to brand change:', event.type);

            if (event.type === 'color_updated') {
                console.log('[UI Theme] Updating CSS variables:', event.data);

                // In real implementation, this would update CSS custom properties
                // document.documentElement.style.setProperty('--color-primary', event.data.primary);
            }
        },
        priority: 5 // Lower priority (visual changes)
    });

    // Guest Services Module
    moduleRegistry.register({
        id: 'guest_services',
        name: 'Guest Services',
        description: 'Concierge and guest experience',
        subscribesTo: ['policy_updated', 'workflow_updated', 'time_updated'],
        configPoints: ['amenities', 'serviceHours', 'guestPolicies', 'vipProtocol'],
        adaptationCallback: async (event) => {
            console.log('[Guest Services] Adapting to brand change:', event.type);

            if (event.type === 'policy_updated' && event.data.vipServices) {
                console.log(`[Guest Services] VIP protocol updated`);
            }

            if (event.type === 'time_updated' && event.data.conciergeHours) {
                console.log(`[Guest Services] Service hours updated`);
            }
        },
        priority: 9 // High priority (guest-facing)
    });

    // Concierge Module
    moduleRegistry.register({
        id: 'concierge',
        name: 'Concierge',
        description: 'Guest requests and recommendations',
        subscribesTo: ['policy_updated', 'workflow_updated'],
        configPoints: ['recommendationEngine', 'localPartners', 'serviceStandards'],
        adaptationCallback: async (event) => {
            console.log('[Concierge] Adapting to brand change:', event.type);

            if (event.type === 'policy_updated') {
                console.log('[Concierge] Updating service standards and protocols');
            }
        },
        priority: 8
    });

    // Spa & Wellness Module
    moduleRegistry.register({
        id: 'spa',
        name: 'Spa & Wellness',
        description: 'Spa treatments and wellness services',
        subscribesTo: ['color_updated', 'policy_updated', 'time_updated'],
        configPoints: ['treatmentMenu', 'spaHours', 'membershipRules', 'spaTheme'],
        adaptationCallback: async (event) => {
            console.log('[Spa] Adapting to brand change:', event.type);

            if (event.type === 'color_updated') {
                console.log('[Spa] Updating spa ambiance colors');
            }

            if (event.type === 'time_updated' && event.data.spaHours) {
                console.log(`[Spa] Operating hours updated`);
            }
        },
        priority: 6
    });

    // Events & Banquets Module
    moduleRegistry.register({
        id: 'events',
        name: 'Events & Banquets',
        description: 'Event planning and management',
        subscribesTo: ['policy_updated', 'workflow_updated', 'color_updated'],
        configPoints: ['eventSpaces', 'cateringMenu', 'setupProtocol', 'eventTheme'],
        adaptationCallback: async (event) => {
            console.log('[Events] Adapting to brand change:', event.type);

            if (event.type === 'color_updated') {
                console.log('[Events] Updating event theme colors');
            }

            if (event.type === 'policy_updated' && event.data.eventPolicies) {
                console.log('[Events] Event policies updated');
            }
        },
        priority: 7
    });

    console.log(`[Module Registry] Registered ${moduleRegistry.getModuleCount()} core modules`);
};
