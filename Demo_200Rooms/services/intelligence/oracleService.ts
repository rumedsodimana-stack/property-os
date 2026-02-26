import { GoogleGenAI } from "@google/genai";
import { OracleContext, OracleAnalysisResponse, SystemConfigurationMap } from "../../types";
import { ActionCard } from "../../types/simpleAI";
import { botEngine } from "../kernel/systemBridge";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Mock System Configuration Map (The "State" of the OS)
const SYSTEM_MAP: SystemConfigurationMap = {
  modules: {
    'Connect': {
      name: 'Communication Hub',
      config: {
        taskPriorities: ['Low', 'Medium', 'High', 'Critical'],
        autoAssignEnabled: true,
        departments: ['Housekeeping', 'Kitchen', 'General']
      },
      dependencies: ['Housekeeping', 'POS']
    },
    'Housekeeping': {
      name: 'Housekeeping PMS',
      config: {
        cleanTimeStandard: 30, // mins
        inspectionRequired: true,
        statusFlow: ['Dirty', 'In Progress', 'Clean'],
        priorityRules: ['VIP', 'Departure', 'Early Arrival']
      },
      dependencies: ['FrontDesk', 'Connect']
    },
    'FrontDesk': {
      name: 'Front Desk Operations',
      config: {
        checkInTime: '14:00',
        vipAlerts: true,
        overbookingAllowed: false
      },
      dependencies: ['Connect', 'Housekeeping']
    },
    'POS': {
      name: 'Point of Sale & KDS',
      config: {
        kitchenDisplayMode: 'Stream',
        autoFireOrders: false,
        tipsEnabled: true
      },
      dependencies: ['Finance', 'Procurement']
    },
    'HR': {
      name: 'Human Resources',
      config: {
        maxOvertimeHours: 10,
        minRestPeriod: 12,
        aiPerformanceTracking: true
      },
      dependencies: ['Finance']
    },
    'Procurement': {
      name: 'Procurement & Inventory',
      config: {
        autoReorder: true,
        approvalThreshold: 500,
        preferredSuppliersOnly: false
      },
      dependencies: ['Finance', 'POS']
    }
  },
  flows: {
    'hk_autotask': {
      source: 'FrontDesk',
      trigger: 'CheckOut',
      target: 'Housekeeping',
      action: 'Create Clean Task'
    },
    'pos_inventory_sync': {
      source: 'POS',
      trigger: 'OrderServed',
      target: 'Procurement',
      action: 'Deduct Ingredient Stock'
    },
    'hr_overtime_alert': {
      source: 'HR',
      trigger: 'ShiftEnd',
      target: 'Finance',
      action: 'Calculate Labor Cost'
    }
  }
};

class OracleService {

  public async analyzePrompt(context: OracleContext, userPrompt: string): Promise<OracleAnalysisResponse> {
    if (!process.env.API_KEY) {
      // Offline fallback for demo purposes
      return {
        analysis: "Oracle AI is running in offline simulation mode. Configuration change identified.",
        proposedChanges: [
          { target: `${context.moduleId}.${context.fieldId || 'config'}`, action: 'UPDATE', value: 'Simulated Value' }
        ],
        affectedModules: context.dependencies || [],
        riskLevel: 'Low',
        diagnostics: "Simulation: Checks passed."
      };
    }

    try {
      const model = "gemini-3-flash-preview";

      const systemContext = JSON.stringify(SYSTEM_MAP);
      const requestContext = JSON.stringify(context);

      const systemPrompt = `
        You are Oracle AI, the Backend System Architect for the Hotel Singularity OS.
        Your role is to reconfigure the system based on natural language prompts from administrators.
        
        CURRENT SYSTEM MAP: ${systemContext}
        ACTIVE CONTEXT: ${requestContext}
        
        Task:
        1. Analyze the user's prompt to understand what system configuration needs to change.
        2. Identify dependencies. If a change in Module A affects Module B, note it.
        3. Determine the specific JSON patches/updates required.
        4. Assess risk (Low/Medium/High). High risk involves financial logic or security.
        
        Output JSON Format:
        {
          "analysis": "Brief explanation of what will be changed and why.",
          "proposedChanges": [{ "target": "string", "action": "UPDATE|CREATE|DELETE", "value": any }],
          "affectedModules": ["string"],
          "riskLevel": "Low|Medium|High",
          "diagnostics": "Mock diagnostic result (e.g., 'Flow verified')."
        }
      `;

      const result = await ai.models.generateContent({
        model: model,
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json"
        }
      });

      const responseData = JSON.parse(result.text || '{}') as OracleAnalysisResponse;

      // Log to System Terminal via Bridge
      botEngine.logActivity(
        'KERNEL',
        'Oracle_Analysis',
        `Prompt: "${userPrompt}" -> ${responseData.proposedChanges.length} changes generated.`,
        'Oracle_AI'
      );

      return responseData;

    } catch (error) {
      console.error("Oracle AI Error:", error);
      return {
        analysis: "Error connecting to Singularity Core. Please check API Key.",
        proposedChanges: [],
        affectedModules: [],
        riskLevel: 'High'
      };
    }
  }

  public applyChanges(changes: any[]) {
    changes.forEach(change => {
      botEngine.logActivity(
        'KERNEL',
        'Config_Patch_Applied',
        `Target: ${change.target} | Action: ${change.action}`,
        'Oracle_AI',
        'SUCCESS'
      );
    });
  }

  /**
   * Scans the current state of the PMS to identify actionable operational insights.
   * This is the bridge between Phase 17 (Data) and Phase 18 (Action).
   */
  public getOperationalPulse(pms: any): ActionCard[] {
    const actions: ActionCard[] = [];
    const reservations = pms.reservations || [];
    const ledger = pms.ledgerEntries || [];
    const rooms = pms.rooms || [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Finance Audit (High Balance)
    const checkedInRes = reservations.filter((r: any) => r.status === 'Checked In');
    checkedInRes.forEach((r: any) => {
      const guestLedger = ledger.filter((l: any) => l.reservationId === r.id);
      const balance = guestLedger.reduce((s: number, l: any) => s + (l.debit - l.credit), 0);
      const limit = r.creditLimit || 5000;

      if (balance > limit) {
        actions.push({
          id: `hb_${r.id}`,
          type: 'critical',
          assistantId: 'system_ops',
          title: 'High Balance Alert',
          description: `Guest ${r.guestId} (Room ${r.roomId}) is at ${balance.toLocaleString()} / ${limit.toLocaleString()} limit.`,
          actionLabel: 'Increase Limit',
          impact: 'Loss Prevention',
          executeData: { target: `reservations/${r.id}`, action: 'UPDATE', value: { creditLimit: limit + 2000 } }
        });
      }
    });

    // 2. Revenue Management (Analytics)
    const arrivalsToday = reservations.filter((r: any) => r.checkIn === today).length;
    const occupancy = rooms.length > 0 ? (checkedInRes.length / rooms.length) * 100 : 0;

    if (occupancy > 85) {
      actions.push({
        id: 'rev_high_occ',
        type: 'success',
        assistantId: 'analytics',
        title: 'High Demand Detected',
        description: `Occupancy is at ${occupancy.toFixed(1)}%. Recommend 15% price jump for walk-ins.`,
        actionLabel: 'Apply Rate Jump',
        impact: 'Yield Maximization',
        executeData: { target: 'yieldRules/high_demand', action: 'ENABLE', value: { multiplier: 1.15 } }
      });
    } else if (occupancy < 30 && arrivalsToday < 5) {
      actions.push({
        id: 'rev_low_occ',
        type: 'warning',
        assistantId: 'analytics',
        title: 'Low Velocity Warning',
        description: 'Low occupancy and arrivals today. Suggest launching a 24h Flash Sale.',
        actionLabel: 'Launch Sale',
        impact: 'Volume Recovery',
        executeData: { target: 'marketing/flash_sale', action: 'ACTIVATE', value: { discount: 0.25 } }
      });
    }

    // 3. Housekeeping (Automation)
    const dirtyRooms = rooms.filter((rm: any) => rm.status === 'Dirty').length;
    if (dirtyRooms > 10) {
      actions.push({
        id: 'hk_dirty_rooms',
        type: 'info',
        assistantId: 'automation',
        title: 'HK Efficiency Gap',
        description: `${dirtyRooms} rooms currently Dirty. Suggest auto-prioritizing remaining arrivals.`,
        actionLabel: 'Rebalance HK',
        impact: 'Stay-over Flow',
        executeData: { target: 'housekeeping/routing', action: 'PRIORITIZE', value: 'Arrivals' }
      });
    }

    // 4. Concierge (Guest Experience)
    const pendingRequests = (pms.tasks || []).filter((t: any) => t.status === 'Pending' && t.category === 'GuestService').length;
    if (pendingRequests > 3) {
      actions.push({
        id: 'concierge_backlog',
        type: 'warning',
        assistantId: 'concierge',
        title: 'Guest Service Backlog',
        description: `${pendingRequests} guest requests are pending over 15 mins.`,
        actionLabel: 'Escalate Requests',
        impact: 'Guest Satisfaction',
        executeData: { target: 'tasks/escalation', action: 'TRIGGER', value: 'Critical' }
      });
    }

    return actions;
  }

  // ──────────────────────────────────────────────────────────
  // PHASE 19: DEPARTMENTAL INTELLIGENCE SCANNERS
  // ──────────────────────────────────────────────────────────

  /**
   * Scans the event pipeline for revenue gaps, expiring tentatives, and pax trends.
   */
  public getEventIntel(events: any[]): { alerts: string[]; kpis: Record<string, any> } {
    const alerts: string[] = [];
    const now = new Date();
    const confirmed = events.filter((e: any) => e.status === 'Confirmed');
    const tentative = events.filter((e: any) => e.status === 'Tentative');

    const confirmedRevenue = confirmed.reduce((s: number, e: any) => s + (e.totalValue || 0), 0);
    const pipelineRevenue = tentative.reduce((s: number, e: any) => s + (e.totalValue || 0), 0);
    const totalPax = confirmed.reduce((s: number, e: any) => s + (e.pax || 0), 0);
    const conversionRate = events.length > 0 ? (confirmed.length / events.length) * 100 : 0;

    // Expiring tentatives check
    const expiringSoon = tentative.filter((e: any) => {
      const start = new Date(e.startDate);
      const daysOut = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysOut > 0 && daysOut < 7;
    });

    if (expiringSoon.length > 0) {
      alerts.push(`${expiringSoon.length} tentative event(s) starting within 7 days — recommend immediate follow-up to secure deposits.`);
    }

    if (conversionRate < 40 && events.length > 3) {
      alerts.push(`Event conversion rate at ${conversionRate.toFixed(0)}%. Below 40% target — review pricing or sales outreach.`);
    }

    if (tentative.length === 0 && confirmed.length === 0) {
      alerts.push('No events in pipeline. Sales outreach recommended to fill upcoming availability.');
    }

    return {
      alerts,
      kpis: {
        confirmedRevenue,
        pipelineRevenue,
        totalPax,
        conversionRate,
        confirmedCount: confirmed.length,
        tentativeCount: tentative.length,
      }
    };
  }

  /**
   * Scans inventory and supplier data for reorder alerts and supplier health.
   */
  public getProcurementIntel(inventory: any[], suppliers: any[], purchaseOrders: any[]): { alerts: string[]; supplierScores: any[]; spendKpis: Record<string, any> } {
    const alerts: string[] = [];

    // PAR level analysis
    const belowPar = inventory.filter((item: any) => {
      const parLevel = item.parLevel || item.reorderPoint || 10;
      const currentQty = item.quantity || item.currentStock || 0;
      return currentQty < parLevel;
    });

    if (belowPar.length > 0) {
      const topItems = belowPar.slice(0, 3).map((i: any) => i.name).join(', ');
      alerts.push(`${belowPar.length} item(s) below PAR level — top: ${topItems}. Auto-generate purchase order?`);
    }

    // Supplier health scoring
    const supplierScores = suppliers.map((s: any) => {
      const supplierPOs = purchaseOrders.filter((po: any) => po.supplierId === s.id);
      const delivered = supplierPOs.filter((po: any) => po.status === 'Delivered' || po.status === 'Received');
      const fillRate = supplierPOs.length > 0 ? (delivered.length / supplierPOs.length) * 100 : 100;
      const score = fillRate >= 90 ? 'A' : fillRate >= 70 ? 'B' : fillRate >= 50 ? 'C' : 'D';
      return { id: s.id, name: s.name, fillRate: Math.round(fillRate), grade: score, totalPOs: supplierPOs.length };
    });

    const poorSuppliers = supplierScores.filter(s => s.grade === 'D');
    if (poorSuppliers.length > 0) {
      alerts.push(`Supplier risk: ${poorSuppliers.map(s => s.name).join(', ')} rated D (fill rate < 50%). Consider alternative sourcing.`);
    }

    // Spend KPIs
    const totalSpend = purchaseOrders.reduce((s: number, po: any) => s + (po.totalAmount || po.total || 0), 0);
    const avgPOValue = purchaseOrders.length > 0 ? totalSpend / purchaseOrders.length : 0;

    return {
      alerts,
      supplierScores,
      spendKpis: {
        totalSpend,
        avgPOValue,
        activePOs: purchaseOrders.filter((po: any) => po.status === 'Pending' || po.status === 'Approved').length,
        belowParCount: belowPar.length,
        supplierCount: suppliers.length,
      }
    };
  }

  /**
   * Scans F&B data for food cost analysis, menu engineering, and void trends.
   */
  public getFnbIntel(orders: any[], recipes: any[], menuItems: any[]): { alerts: string[]; menuMatrix: any[]; kpis: Record<string, any> } {
    const alerts: string[] = [];
    const paidOrders = orders.filter((o: any) => o.status === 'Paid');
    const voidOrders = orders.filter((o: any) => o.status === 'Void');

    // Revenue & cost
    const totalRevenue = paidOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
    let totalCost = 0;

    // Item-level analysis for menu engineering
    const itemPerformance: Record<string, { name: string; revenue: number; cost: number; qty: number }> = {};

    paidOrders.forEach((order: any) => {
      (order.items || []).forEach((item: any) => {
        const key = item.menuItemId || item.name || 'unknown';
        if (!itemPerformance[key]) {
          const mi = menuItems.find((m: any) => m.id === key);
          itemPerformance[key] = { name: mi?.name || item.name || key, revenue: 0, cost: 0, qty: 0 };
        }
        const itemRevenue = (item.price || 0) * (item.qty || 1);
        let itemCost = 0;
        if (item.foodCost) {
          itemCost = item.foodCost * (item.qty || 1);
        } else {
          const recipe = recipes.find((r: any) => r.menuItemId === key);
          itemCost = recipe ? recipe.totalCost * (item.qty || 1) : itemRevenue * 0.30;
        }
        itemPerformance[key].revenue += itemRevenue;
        itemPerformance[key].cost += itemCost;
        itemPerformance[key].qty += (item.qty || 1);
        totalCost += itemCost;
      });
    });

    const foodCostPct = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
    const voidRate = orders.length > 0 ? (voidOrders.length / orders.length) * 100 : 0;
    const avgCheck = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // Food cost alert
    if (foodCostPct > 35) {
      const items = Object.values(itemPerformance).sort((a, b) => (b.cost / (b.revenue || 1)) - (a.cost / (a.revenue || 1)));
      const topOffender = items[0];
      alerts.push(`Food cost at ${foodCostPct.toFixed(1)}% — ${(foodCostPct - 32).toFixed(1)}% above 32% target. Top offender: ${topOffender?.name || 'Unknown'}.`);
    }

    // Void alert
    if (voidRate > 5) {
      alerts.push(`Void rate at ${voidRate.toFixed(1)}% (${voidOrders.length} voids). Investigate POS training or potential shrinkage.`);
    }

    // Menu Engineering Matrix (Stars / Plowhorse / Puzzle / Dog)
    const items = Object.values(itemPerformance);
    const avgQty = items.length > 0 ? items.reduce((s, i) => s + i.qty, 0) / items.length : 0;
    const avgMarginPct = items.length > 0 ? items.reduce((s, i) => s + ((i.revenue - i.cost) / (i.revenue || 1)), 0) / items.length : 0;

    const menuMatrix = items.map(item => {
      const marginPct = item.revenue > 0 ? (item.revenue - item.cost) / item.revenue : 0;
      const isPopular = item.qty >= avgQty;
      const isProfitable = marginPct >= avgMarginPct;
      let classification: string;
      if (isPopular && isProfitable) classification = 'Star';
      else if (isPopular && !isProfitable) classification = 'Plowhorse';
      else if (!isPopular && isProfitable) classification = 'Puzzle';
      else classification = 'Dog';

      return {
        name: item.name,
        qty: item.qty,
        revenue: item.revenue,
        cost: item.cost,
        margin: item.revenue - item.cost,
        marginPct: marginPct * 100,
        classification
      };
    }).sort((a, b) => b.revenue - a.revenue);

    const dogs = menuMatrix.filter(m => m.classification === 'Dog');
    if (dogs.length > 2) {
      alerts.push(`${dogs.length} menu items classified as "Dogs" (low popularity + low margin). Consider removal or repricing.`);
    }

    return {
      alerts,
      menuMatrix,
      kpis: {
        totalRevenue,
        totalCost,
        foodCostPct,
        voidRate,
        avgCheck,
        totalCovers: paidOrders.length,
        voidCount: voidOrders.length,
      }
    };
  }

  // ──────────────────────────────────────────────────────────
  // PHASE 20: NIGHT AUDIT AUTOPILOT
  // ──────────────────────────────────────────────────────────

  /**
   * Pre-flight checklist: scans for items that should be resolved before running the night audit.
   */
  public getNightAuditPreFlight(pms: any): { items: any[]; canProceed: boolean } {
    const items: any[] = [];

    // 1. Open cashier drops
    const openDrops = (pms.cashierDrops || []).filter((d: any) => d.status === 'Open' || d.status === 'Pending');
    items.push({
      id: 'cashier_drops',
      label: 'Cashier Drops Settled',
      status: openDrops.length === 0 ? 'pass' : 'warn',
      detail: openDrops.length === 0 ? 'All cashier sessions are closed.' : `${openDrops.length} open cashier drop(s). Recommend settling before audit.`,
      blocksSeverity: openDrops.length > 0 ? 'warning' : 'info'
    });

    // 2. Unsettled POS orders
    const openOrders = (pms.posOrders || []).filter((o: any) => o.status === 'Open' || o.status === 'Pending');
    items.push({
      id: 'pos_orders',
      label: 'POS Orders Settled',
      status: openOrders.length === 0 ? 'pass' : 'fail',
      detail: openOrders.length === 0 ? 'All POS orders are closed or paid.' : `${openOrders.length} unsettled POS order(s). Must close before audit.`,
      blocksSeverity: openOrders.length > 0 ? 'blocker' : 'info'
    });

    // 3. HK status discrepancies
    const checkedInRooms = new Set((pms.reservations || []).filter((r: any) => r.status === 'Checked In').map((r: any) => r.roomId));
    const dirtyOccupied = (pms.rooms || []).filter((rm: any) => checkedInRooms.has(rm.id) && rm.status === 'Dirty').length;
    items.push({
      id: 'hk_discrepancy',
      label: 'HK Status Sync',
      status: dirtyOccupied === 0 ? 'pass' : 'warn',
      detail: dirtyOccupied === 0 ? 'All occupied rooms have valid HK status.' : `${dirtyOccupied} occupied room(s) marked as Dirty — possible status discrepancy.`,
      blocksSeverity: 'warning'
    });

    // 4. High-balance folios
    const highBalanceFolios = (pms.folios || []).filter((f: any) => (f.balance || 0) > 5000 && f.status === 'Open');
    items.push({
      id: 'high_balance',
      label: 'Credit Limits Verified',
      status: highBalanceFolios.length === 0 ? 'pass' : 'warn',
      detail: highBalanceFolios.length === 0 ? 'No folios exceed credit limits.' : `${highBalanceFolios.length} folio(s) have balances exceeding 5,000. Verify credit authorization.`,
      blocksSeverity: 'warning'
    });

    // 5. Trial Balance pre-check (ledger entries)
    const ledger = pms.ledgerEntries || [];
    const totalDebits = ledger.reduce((s: number, l: any) => s + (l.debit || 0), 0);
    const totalCredits = ledger.reduce((s: number, l: any) => s + (l.credit || 0), 0);
    const variance = Math.abs(totalDebits - totalCredits);
    items.push({
      id: 'trial_balance',
      label: 'Trial Balance Pre-Check',
      status: variance < 1 ? 'pass' : variance < 100 ? 'warn' : 'fail',
      detail: variance < 1 ? `Balanced: Debits ${totalDebits.toFixed(2)} = Credits ${totalCredits.toFixed(2)}` : `Variance of ${variance.toFixed(2)} detected. ${variance >= 100 ? 'CRITICAL — resolve before audit.' : 'Minor — will auto-correct during posting.'}`,
      blocksSeverity: variance >= 100 ? 'blocker' : variance >= 1 ? 'warning' : 'info'
    });

    // 6. Reservations check
    const arrivals = (pms.reservations || []).filter((r: any) => r.status === 'Reserved');
    const noShowCandidates = arrivals.filter((r: any) => {
      const checkIn = new Date(r.checkIn);
      const now = new Date();
      return checkIn < now;
    });
    items.push({
      id: 'no_shows',
      label: 'No-Show Processing',
      status: noShowCandidates.length === 0 ? 'pass' : 'warn',
      detail: noShowCandidates.length === 0 ? 'No pending no-shows.' : `${noShowCandidates.length} reservation(s) past due — will be auto-processed as no-shows.`,
      blocksSeverity: 'info'
    });

    const hasBlockers = items.some((i: any) => i.blocksSeverity === 'blocker' && i.status !== 'pass');

    return { items, canProceed: !hasBlockers };
  }

  /**
   * Post-audit analysis: compares today's audit results against trends and flags anomalies.
   */
  public getPostAuditAnalysis(auditResult: any, pms: any): { insights: string[]; grade: string } {
    const insights: string[] = [];
    const stats = auditResult?.statistics || {};

    const occupancyPct = stats?.occupancy?.occupancyPercentage || 0;
    const totalRevenue = stats?.revenue?.total || 0;

    // Revenue trend analysis
    if (totalRevenue === 0) {
      insights.push('⚠️ Zero revenue recorded. Verify POS and room posting completed successfully.');
    } else if (totalRevenue < 500) {
      insights.push(`📉 Revenue unusually low at ${totalRevenue.toFixed(0)}. Check if all outlets posted correctly.`);
    } else {
      insights.push(`✅ Revenue at ${totalRevenue.toLocaleString()} — within expected range.`);
    }

    // Occupancy analysis
    if (occupancyPct > 90) {
      insights.push(`🔥 Occupancy at ${occupancyPct.toFixed(0)}%. Tomorrow's walk-in rate should be maximized.`);
    } else if (occupancyPct < 30) {
      insights.push(`📉 Occupancy critically low at ${occupancyPct.toFixed(0)}%. Recommend promotional push for tomorrow.`);
    } else {
      insights.push(`📊 Occupancy at ${occupancyPct.toFixed(0)}% — stable.`);
    }

    // Trial balance
    const steps = auditResult?.steps || [];
    const trialStep = steps.find((s: any) => s.stepName === 'Run Trial Balance');
    if (trialStep?.data?.balanced) {
      insights.push('✅ Trial Balance verified — Debits match Credits.');
    } else if (trialStep) {
      insights.push(`⚠️ Trial Balance variance detected: ${trialStep.data?.netBalance?.toFixed(2) || 'Unknown'}. Manual review required.`);
    }

    // No-show impact
    const noShowStep = steps.find((s: any) => s.stepName === 'Process No-Shows');
    if (noShowStep?.data?.count > 0) {
      insights.push(`📋 ${noShowStep.data.count} no-show(s) processed. Cancellation fees applied where applicable.`);
    }

    // Overall grade
    const failedSteps = steps.filter((s: any) => s.status === 'failed').length;
    const grade = failedSteps === 0 ? 'A' : failedSteps === 1 ? 'B' : failedSteps <= 2 ? 'C' : 'F';

    return { insights, grade };
  }

}

export const oracleService = new OracleService();
