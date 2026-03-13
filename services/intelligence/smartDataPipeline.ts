/**
 * Smart Data Pipeline — Layer 3 of AI-Native Architecture
 *
 * Every data event in the system passes through this pipeline.
 * Events are asynchronously routed to AI processors without blocking operations.
 */

export type PipelineEventType =
  | 'reservation'
  | 'checkin'
  | 'checkout'
  | 'task'
  | 'pos_order'
  | 'payment'
  | 'maintenance'
  | 'guest_request'
  | 'inventory_alert'
  | 'inventory_movement'
  | 'staff_action'
  | 'revenue_event';

export interface PipelineEvent {
  id: string;
  type: PipelineEventType;
  payload: Record<string, any>;
  module: string;
  timestamp: number;
}

export type InsightType = 'anomaly' | 'opportunity' | 'risk' | 'trend' | 'recommendation';

export interface PipelineInsight {
  id: string;
  eventId: string;
  agentId: 'wal' | 'don' | 'ali' | 'fred';
  type: InsightType;
  title: string;
  body: string;
  module: string;
  confidence: number; // 0–100
  createdAt: number;
  /** Optional targeting for item-level surfaces (e.g., Master Inventory rows) */
  itemId?: string;
  tags?: string[];
}

export interface PipelineStats {
  eventsProcessed: number;
  insightsGenerated: number;
  activeSubscribers: number;
  lastEventAt: number | null;
  eventsByType: Record<string, number>;
}

type InsightSubscriber = (insight: PipelineInsight) => void;

// Static seed insights per module so panels are never empty on first load
const SEED_INSIGHTS: PipelineInsight[] = [
  {
    id: 'seed_fd_1',
    eventId: 'seed',
    agentId: 'ali',
    type: 'recommendation',
    title: 'Pre-assign VIP arrivals',
    body: 'Assign rooms for VIP arrivals 2 hours before check-in to ensure amenities are ready.',
    module: 'front_desk',
    confidence: 88,
    createdAt: Date.now() - 300_000,
  },
  {
    id: 'seed_fd_2',
    eventId: 'seed',
    agentId: 'ali',
    type: 'trend',
    title: 'Arrivals peak in 2 hours',
    body: 'Historical patterns show 60% of daily arrivals occur between 14:00–16:00. Ensure front desk coverage.',
    module: 'front_desk',
    confidence: 91,
    createdAt: Date.now() - 600_000,
  },
  {
    id: 'seed_hk_1',
    eventId: 'seed',
    agentId: 'wal',
    type: 'opportunity',
    title: 'Batch checkout rooms for faster turnaround',
    body: 'Assigning checkout rooms by floor reduces travel time by ~22%. Group today\'s departures by floor.',
    module: 'housekeeping',
    confidence: 82,
    createdAt: Date.now() - 420_000,
  },
  {
    id: 'seed_hk_2',
    eventId: 'seed',
    agentId: 'wal',
    type: 'risk',
    title: 'High-priority maintenance overlap',
    body: 'Two maintenance tasks on floor 4 coincide with arrivals. Consider rescheduling to minimize disruption.',
    module: 'housekeeping',
    confidence: 77,
    createdAt: Date.now() - 900_000,
  },
  {
    id: 'seed_pos_1',
    eventId: 'seed',
    agentId: 'don',
    type: 'opportunity',
    title: 'Upsell dessert during dinner peak',
    body: 'Dessert attach rate drops 40% after 20:00. Training staff on dessert recommendations could increase check averages.',
    module: 'pos',
    confidence: 79,
    createdAt: Date.now() - 500_000,
  },
  {
    id: 'seed_pos_2',
    eventId: 'seed',
    agentId: 'don',
    type: 'trend',
    title: 'Demand spike for Room Service tonight',
    body: 'Based on in-house count and day-of-week patterns, room service volume is expected to be 30% above average.',
    module: 'pos',
    confidence: 84,
    createdAt: Date.now() - 720_000,
  },
  {
    id: 'seed_fin_1',
    eventId: 'seed',
    agentId: 'don',
    type: 'anomaly',
    title: 'Cash variance detected on Outlet 2',
    body: 'Cashier drop for Outlet 2 shows a $47 variance vs. POS total. Recommend reconciliation before night audit.',
    module: 'finance',
    confidence: 93,
    createdAt: Date.now() - 200_000,
  },
  {
    id: 'seed_fin_2',
    eventId: 'seed',
    agentId: 'don',
    type: 'trend',
    title: 'RevPAR trending 8% above last week',
    body: 'Current RevPAR is $142, up from $131 same day last week. ADR improvement is driving the gain.',
    module: 'finance',
    confidence: 96,
    createdAt: Date.now() - 1_200_000,
  },
  {
    id: 'seed_fin_inv_1',
    eventId: 'seed',
    agentId: 'don',
    type: 'anomaly',
    title: 'Low stock: House Blend Coffee',
    body: 'House Blend Coffee is below reorder point in Outlet 1. Create a transfer or PO to avoid 7am stockout.',
    module: 'finance',
    confidence: 90,
    createdAt: Date.now() - 400_000,
    itemId: 'seed_inv_house_blend',
    tags: ['inventory', 'low_stock']
  },
  {
    id: 'seed_fin_inv_2',
    eventId: 'seed',
    agentId: 'don',
    type: 'trend',
    title: 'Fast mover: Room Amenity Kit',
    body: 'Amenity Kits consumed 32% faster than last week. Increase par by 15% for the weekend.',
    module: 'finance',
    confidence: 87,
    createdAt: Date.now() - 600_000,
    itemId: 'seed_inv_amenity',
    tags: ['inventory', 'demand']
  },
  {
    id: 'seed_fin_inv_3',
    eventId: 'seed',
    agentId: 'don',
    type: 'recommendation',
    title: 'Transfer spare linens',
    body: 'HK Store 2 sits at 180% of par while HK Store 1 is under par. Transfer 25 units to balance stock.',
    module: 'finance',
    confidence: 82,
    createdAt: Date.now() - 800_000,
    itemId: 'seed_inv_linen',
    tags: ['inventory', 'transfer']
  },
  // ── Events ──────────────────────────────────────────────────────────────────
  {
    id: 'seed_evt_1',
    eventId: 'seed',
    agentId: 'ali',
    type: 'opportunity',
    title: 'Corporate event — upsell AV package',
    body: 'Upcoming corporate conference for 120 pax has no AV package booked. Adding premium AV could yield +$1,400.',
    module: 'events',
    confidence: 81,
    createdAt: Date.now() - 480_000,
  },
  {
    id: 'seed_evt_2',
    eventId: 'seed',
    agentId: 'ali',
    type: 'risk',
    title: 'BEO deadline in 48h — missing F&B details',
    body: 'Gala dinner BEO for Saturday is missing final F&B quantities. Notify coordinator to confirm menu now.',
    module: 'events',
    confidence: 89,
    createdAt: Date.now() - 900_000,
  },
  // ── Engineering ─────────────────────────────────────────────────────────────
  {
    id: 'seed_eng_1',
    eventId: 'seed',
    agentId: 'wal',
    type: 'risk',
    title: 'HVAC unit 4B due for PM service',
    body: 'Unit 4B on floor 4 has reached 2,800 operating hours. Schedule preventive maintenance before failure risk increases.',
    module: 'engineering',
    confidence: 85,
    createdAt: Date.now() - 700_000,
  },
  {
    id: 'seed_eng_2',
    eventId: 'seed',
    agentId: 'wal',
    type: 'opportunity',
    title: 'Energy savings — HVAC setback off-peak',
    body: 'Reducing HVAC setpoints by 2°F in unoccupied zones 23:00–06:00 could save ~$380/month in utilities.',
    module: 'engineering',
    confidence: 78,
    createdAt: Date.now() - 1_100_000,
  },
  // ── Security ─────────────────────────────────────────────────────────────────
  {
    id: 'seed_sec_1',
    eventId: 'seed',
    agentId: 'wal',
    type: 'anomaly',
    title: 'Unusual access attempt on Floor 7',
    body: 'Three failed key-card entries detected at 702 in the last 10 min. Guest may need a card reissue at front desk.',
    module: 'security',
    confidence: 90,
    createdAt: Date.now() - 250_000,
  },
  {
    id: 'seed_sec_2',
    eventId: 'seed',
    agentId: 'wal',
    type: 'recommendation',
    title: 'Patrol coverage gap detected',
    body: 'Security logs show Corridor B on Level 2 has not been covered in the last 3 hours. Assign a patrol round.',
    module: 'security',
    confidence: 83,
    createdAt: Date.now() - 800_000,
  },
  // ── IoT ─────────────────────────────────────────────────────────────────────
  {
    id: 'seed_iot_1',
    eventId: 'seed',
    agentId: 'wal',
    type: 'anomaly',
    title: 'Temperature variance in cold storage',
    body: 'Cold storage unit CS-2 is reading 6°C, 2 degrees above safe threshold. Inspect compressor before spoilage risk.',
    module: 'iot',
    confidence: 94,
    createdAt: Date.now() - 300_000,
  },
  {
    id: 'seed_iot_2',
    eventId: 'seed',
    agentId: 'wal',
    type: 'opportunity',
    title: 'Lighting schedule optimisation available',
    body: 'Pool area lighting stays on until 02:00 despite last guest departure at 22:30. Adjusting schedule could cut costs.',
    module: 'iot',
    confidence: 76,
    createdAt: Date.now() - 1_500_000,
  },
  // ── HR ───────────────────────────────────────────────────────────────────────
  {
    id: 'seed_hr_1',
    eventId: 'seed',
    agentId: 'fred',
    type: 'risk',
    title: 'Shift coverage gap next Saturday',
    body: '3 staff members have approved leave next Saturday — 12% below minimum staffing. Action required now.',
    module: 'hr',
    confidence: 88,
    createdAt: Date.now() - 600_000,
  },
  {
    id: 'seed_hr_2',
    eventId: 'seed',
    agentId: 'fred',
    type: 'trend',
    title: 'Overtime trending up this week',
    body: 'F&B team overtime hours are 23% above last week\'s baseline. Review scheduling to contain labour costs.',
    module: 'hr',
    confidence: 82,
    createdAt: Date.now() - 950_000,
  },
  // ── Procurement ─────────────────────────────────────────────────────────────
  {
    id: 'seed_proc_1',
    eventId: 'seed',
    agentId: 'don',
    type: 'anomaly',
    title: 'PO #3241 price variance flagged',
    body: 'Supplier invoice for PO #3241 (Produce) is 14% above agreed contract price. Review before approving payment.',
    module: 'procurement',
    confidence: 91,
    createdAt: Date.now() - 400_000,
  },
  {
    id: 'seed_proc_2',
    eventId: 'seed',
    agentId: 'don',
    type: 'recommendation',
    title: 'Consolidate linen orders for bulk discount',
    body: 'Three separate linen requests this week could be merged into one PO to unlock the 8% volume discount.',
    module: 'procurement',
    confidence: 80,
    createdAt: Date.now() - 1_300_000,
  },
  // ── Night Audit ──────────────────────────────────────────────────────────────
  {
    id: 'seed_na_1',
    eventId: 'seed',
    agentId: 'wal',
    type: 'risk',
    title: 'Open folio balance requires action',
    body: '2 guest folios remain open with unsettled balances over $300. Resolve before running night audit to avoid errors.',
    module: 'night_audit',
    confidence: 92,
    createdAt: Date.now() - 350_000,
  },
  {
    id: 'seed_na_2',
    eventId: 'seed',
    agentId: 'wal',
    type: 'trend',
    title: 'Occupancy post-audit projection: 87%',
    body: 'After tonight\'s audit, projected occupancy stands at 87% — above 30-day average of 79%. Strong RevPAR expected.',
    module: 'night_audit',
    confidence: 87,
    createdAt: Date.now() - 1_000_000,
  },
  // ── Group Management ─────────────────────────────────────────────────────────
  {
    id: 'seed_grp_1',
    eventId: 'seed',
    agentId: 'ali',
    type: 'opportunity',
    title: 'Group block pickup at 62% — upsell suites',
    body: 'Tech Conference block has 38% unsold rooms 10 days out. Suite upgrade packages could lift final revenue by $4,200.',
    module: 'groups',
    confidence: 79,
    createdAt: Date.now() - 650_000,
  },
  {
    id: 'seed_grp_2',
    eventId: 'seed',
    agentId: 'ali',
    type: 'risk',
    title: 'Attrition clause deadline approaching',
    body: 'Wedding block attrition clause deadline is in 5 days. Current pickup is 71% — below the 80% threshold.',
    module: 'groups',
    confidence: 86,
    createdAt: Date.now() - 1_400_000,
  },
  // ── Connect / Communication ──────────────────────────────────────────────────
  {
    id: 'seed_con_1',
    eventId: 'seed',
    agentId: 'wal',
    type: 'anomaly',
    title: '7 guest messages awaiting reply',
    body: 'WhatsApp and in-app messages from 7 guests have not received a response in over 30 minutes. Prioritize now.',
    module: 'connect',
    confidence: 93,
    createdAt: Date.now() - 320_000,
  },
  {
    id: 'seed_con_2',
    eventId: 'seed',
    agentId: 'wal',
    type: 'recommendation',
    title: 'Pre-arrival message campaign ready',
    body: '14 guests arriving tomorrow have not received a pre-arrival message. Trigger the welcome sequence now.',
    module: 'connect',
    confidence: 87,
    createdAt: Date.now() - 750_000,
  },
  // ── Brand Standards ──────────────────────────────────────────────────────────
  {
    id: 'seed_brd_1',
    eventId: 'seed',
    agentId: 'fred',
    type: 'risk',
    title: 'Brand compliance gap detected',
    body: '3 SOP documents have not been reviewed in over 180 days. Schedule a review to maintain certification readiness.',
    module: 'brand_standards',
    confidence: 85,
    createdAt: Date.now() - 500_000,
  },
  {
    id: 'seed_brd_2',
    eventId: 'seed',
    agentId: 'fred',
    type: 'opportunity',
    title: 'Staff training completion at 78%',
    body: '14 team members have outstanding brand induction modules. Completing these raises your brand score by ~6 points.',
    module: 'brand_standards',
    confidence: 80,
    createdAt: Date.now() - 1_100_000,
  },
];

class SmartDataPipeline {
  private insights: PipelineInsight[] = [...SEED_INSIGHTS];
  private subscribers: Set<InsightSubscriber> = new Set();
  private stats: PipelineStats = {
    eventsProcessed: 0,
    insightsGenerated: SEED_INSIGHTS.length,
    activeSubscribers: 0,
    lastEventAt: null,
    eventsByType: {},
  };
  private processingQueue: PipelineEvent[] = [];
  private isProcessing = false;

  /** Emit a data event into the pipeline (non-blocking). */
  emit(event: Omit<PipelineEvent, 'id'>): void {
    const fullEvent: PipelineEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    };
    this.processingQueue.push(fullEvent);
    this.stats.eventsProcessed++;
    this.stats.lastEventAt = Date.now();
    this.stats.eventsByType[event.type] = (this.stats.eventsByType[event.type] || 0) + 1;

    // Process asynchronously — never blocks the calling operation
    if (!this.isProcessing) {
      this.isProcessing = true;
      setTimeout(() => this.drainQueue(), 0);
    }
  }

  /** Subscribe to new insights. Returns an unsubscribe function. */
  subscribe(cb: InsightSubscriber): () => void {
    this.subscribers.add(cb);
    this.stats.activeSubscribers = this.subscribers.size;
    return () => {
      this.subscribers.delete(cb);
      this.stats.activeSubscribers = this.subscribers.size;
    };
  }

  /** Get recent insights, optionally filtered by module. */
  getRecentInsights(module?: string, limit = 5): PipelineInsight[] {
    const filtered = module
      ? this.insights.filter(i => i.module === module)
      : this.insights;
    return filtered
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /** Get all insights for the Architecture Dashboard feed. */
  getAllInsights(limit = 20): PipelineInsight[] {
    return this.insights
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  getStats(): PipelineStats {
    return { ...this.stats };
  }

  // ── Private ────────────────────────────────────────────────────────────

  private async drainQueue(): Promise<void> {
    while (this.processingQueue.length > 0) {
      const event = this.processingQueue.shift()!;
      await this.processEvent(event);
    }
    this.isProcessing = false;
  }

  private async processEvent(event: PipelineEvent): Promise<void> {
    const insight = this.generateInsight(event);
    if (!insight) return;

    // Keep max 100 insights in memory
    this.insights.unshift(insight);
    if (this.insights.length > 100) this.insights.pop();
    this.stats.insightsGenerated++;

    // Notify all subscribers
    this.subscribers.forEach(cb => {
      try { cb(insight); } catch { /* swallow subscriber errors */ }
    });
  }

  /** Rule-based insight generation — fast, no API call required. */
  private generateInsight(event: PipelineEvent): PipelineInsight | null {
    const id = `ins_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const base = { id, eventId: event.id, module: event.module, createdAt: Date.now() };

    switch (event.type) {
      case 'reservation':
        return {
          ...base,
          agentId: 'ali',
          type: 'recommendation',
          title: 'New reservation received',
          body: `Reservation for ${event.payload.guestName || 'guest'} added. Pre-assign a room now to streamline check-in.`,
          confidence: 85,
        };
      case 'checkin':
        return {
          ...base,
          agentId: 'ali',
          type: 'opportunity',
          title: 'Guest checked in — upsell opportunity',
          body: 'Consider suggesting a room upgrade or spa package at check-in for incremental revenue.',
          confidence: 72,
        };
      case 'checkout':
        return {
          ...base,
          agentId: 'wal',
          type: 'recommendation',
          title: 'Room released for housekeeping',
          body: 'Checkout complete. Room added to priority cleaning queue.',
          confidence: 95,
        };
      case 'task':
        return {
          ...base,
          agentId: 'wal',
          type: event.payload.priority === 'high' ? 'risk' : 'trend',
          title: `New ${event.payload.priority || 'standard'}-priority task`,
          body: event.payload.description || 'A new operational task has been created and routed.',
          confidence: 80,
        };
      case 'pos_order':
        return {
          ...base,
          agentId: 'don',
          type: 'trend',
          title: 'POS order processed',
          body: `Order of $${event.payload.total?.toFixed(2) || '0.00'} recorded. Running total updated.`,
          confidence: 99,
        };
      case 'payment':
        return {
          ...base,
          agentId: 'don',
          type: 'opportunity',
          title: 'Payment captured',
          body: `Payment of $${event.payload.amount?.toFixed(2) || '0.00'} captured successfully.`,
          confidence: 98,
        };
      case 'maintenance':
        return {
          ...base,
          agentId: 'wal',
          type: 'risk',
          title: 'Maintenance event logged',
          body: event.payload.description || 'Engineering task created. Check for room impact.',
          confidence: 88,
        };
      case 'inventory_alert':
        return {
          ...base,
          agentId: 'don',
          type: 'anomaly',
          title: 'Inventory below par level',
          body: `${event.payload.itemName || 'An item'} has dropped below reorder point. Raise a PO.`,
          confidence: 91,
          itemId: event.payload.itemId,
          tags: ['inventory', 'low_stock']
        };
      case 'inventory_movement': {
        const movement = (event.payload.movement || '').toLowerCase();
        const totalStock = Number(event.payload.totalStock ?? 0);
        const reorderPoint = Number(event.payload.reorderPoint ?? 0);
        const belowPar = totalStock <= reorderPoint;
        const negative = totalStock < 0;
        const movementTitle = movement === 'consume' ? 'consumed' : movement === 'receive' ? 'received' : 'adjusted';

        let type: InsightType = 'trend';
        if (negative) type = 'anomaly';
        else if (belowPar) type = 'risk';

        return {
          ...base,
          agentId: 'don',
          type,
          title: `${event.payload.itemName || 'Item'} ${movementTitle}`,
          body: `Resulting stock ${totalStock}${event.payload.unit ? ` ${event.payload.unit}` : ''} at ${event.payload.locationName || event.payload.locationId || 'location'}${belowPar ? ' (at/below reorder)' : ''}.`,
          confidence: 91,
          itemId: event.payload.itemId,
          tags: ['inventory', movement, belowPar ? 'low_stock' : '']
        };
      }
      default:
        return null;
    }
  }
}

export const pipeline = new SmartDataPipeline();
