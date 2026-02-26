import { Reservation, Room, LedgerEntry, EmployeeProfile, Supplier, Invoice, Asset, YieldRule, PosOrder, MaintenanceTask, BrandDocument, User } from '../../types';

export type ReportCategory = 'FrontOffice' | 'Finance' | 'F&B' | 'Housekeeping' | 'HumanResources' | 'Maintenance' | 'BrandStandards' | 'System' | 'Executive';

export interface ReportColumn {
    key: string;
    label: string;
    type: 'string' | 'number' | 'date' | 'currency' | 'status';
    align?: 'left' | 'right' | 'center';
}

export interface ReportDefinition {
    id: string;
    title: string;
    description: string;
    category: ReportCategory;
    dataSource: 'reservations' | 'ledgerEntries' | 'rooms' | 'employees' | 'suppliers' | 'invoices' | 'assets' | 'posOrders' | 'maintenanceTasks' | 'brandDocuments' | 'all';
    columns: ReportColumn[];
    filterConfig: {
        showDateRange: boolean;
        showStatusFilter?: boolean;
        showTypeFilter?: boolean;
        defaultStatus?: string;
    };
    // Logic to transform raw data for the specific report
    // Passing full state as 3rd arg for complex "Opera-style" reports
    transform: (data: any[], dateRange: { start: string, end: string }, fullState?: any) => any[];
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
    // --- Front Office Reports ---
    {
        id: 'arrivals_report',
        title: 'Arrivals Report',
        description: 'Detailed list of all guests arriving within the specified date range.',
        category: 'FrontOffice',
        dataSource: 'reservations',
        columns: [
            { key: 'guestName', label: 'Guest Name', type: 'string' },
            { key: 'roomId', label: 'Room', type: 'string' },
            { key: 'roomType', label: 'Room Type', type: 'string' },
            { key: 'arrival', label: 'Arrival', type: 'date' },
            { key: 'departure', label: 'Departure', type: 'date' },
            { key: 'nights', label: 'Nights', type: 'number' },
            { key: 'pax', label: 'Pax', type: 'string' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'balance', label: 'Balance', type: 'currency', align: 'right' },
            { key: 'source', label: 'Source', type: 'string' }
        ],
        filterConfig: { showDateRange: true },
        transform: (data: Reservation[], dateRange) => {
            return data.filter(r => {
                const arr = new Date(r.checkIn).toISOString().split('T')[0];
                return arr >= dateRange.start && arr <= dateRange.end;
            }).map(r => ({
                ...r,
                guestName: r.guestId, // Simplified for now, would join with Guest name
                pax: `${r.adults}/${r.children}`,
                nights: Math.ceil((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60 * 24)),
                balance: r.rateApplied || 0,
                source: r.channel || 'Direct'
            }));
        }
    },
    {
        id: 'departures_report',
        title: 'Departures Report',
        description: 'Detailed list of all guests departing within the specified date range.',
        category: 'FrontOffice',
        dataSource: 'reservations',
        columns: [
            { key: 'guestName', label: 'Guest Name', type: 'string' },
            { key: 'roomId', label: 'Room', type: 'string' },
            { key: 'arrival', label: 'Arrival', type: 'date' },
            { key: 'departure', label: 'Departure', type: 'date' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'balance', label: 'Folio Balance', type: 'currency', align: 'right' }
        ],
        filterConfig: { showDateRange: true },
        transform: (data: Reservation[], dateRange) => {
            return data.filter(r => {
                const dep = new Date(r.checkOut).toISOString().split('T')[0];
                return dep >= dateRange.start && dep <= dateRange.end;
            }).map(r => ({
                ...r,
                guestName: r.guestId,
                balance: 0 // Placeholder for real balance calculation
            }));
        }
    },
    {
        id: 'in_house_report',
        title: 'In-House Guest List',
        description: 'Currently checked-in guests and resident list.',
        category: 'FrontOffice',
        dataSource: 'reservations',
        columns: [
            { key: 'roomId', label: 'Room', type: 'string' },
            { key: 'guestName', label: 'Guest Name', type: 'string' },
            { key: 'roomType', label: 'Room Type', type: 'string' },
            { key: 'arrival', label: 'Arrival', type: 'date' },
            { key: 'departure', label: 'Departure', type: 'date' },
            { key: 'source', label: 'Source', type: 'string' }
        ],
        filterConfig: { showDateRange: false },
        transform: (data: Reservation[]) => {
            return data.filter(r => r.status === 'Checked-In');
        }
    },

    // --- Finance Reports ---
    {
        id: 'guest_ledger_report',
        title: 'Guest Ledger Summary',
        description: 'All outstanding balances on active guest folios.',
        category: 'Finance',
        dataSource: 'ledgerEntries',
        columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'description', label: 'Description', type: 'string' },
            { key: 'debit', label: 'Debit', type: 'currency', align: 'right' },
            { key: 'credit', label: 'Credit', type: 'currency', align: 'right' },
            { key: 'balance', label: 'Balance', type: 'currency', align: 'right' }
        ],
        filterConfig: { showDateRange: true },
        transform: (data: LedgerEntry[], dateRange) => {
            return data.filter(le => le.businessDate >= dateRange.start && le.businessDate <= dateRange.end);
        }
    },

    // --- Housekeeping Reports ---
    {
        id: 'room_status_report',
        title: 'Room Status & HK Report',
        description: 'Operational cleaning status of all rooms.',
        category: 'Housekeeping',
        dataSource: 'rooms',
        columns: [
            { key: 'id', label: 'Room #', type: 'string' },
            { key: 'type', label: 'Type', type: 'string' },
            { key: 'floor', label: 'Floor', type: 'string' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'lastCleaned', label: 'Last Cleaned', type: 'date' }
        ],
        filterConfig: { showDateRange: false },
        transform: (data: Room[]) => data
    },

    // --- F&B Reports ---
    {
        id: 'pos_revenue_report',
        title: 'POS Revenue Analysis',
        description: 'Detailed revenue breakdown per outlet and session.',
        category: 'F&B',
        dataSource: 'posOrders',
        columns: [
            { key: 'outletId', label: 'Outlet', type: 'string' },
            { key: 'orderType', label: 'Type', type: 'string' },
            { key: 'total', label: 'Total', type: 'currency', align: 'right' },
            { key: 'status', label: 'Status', type: 'status' }
        ],
        filterConfig: { showDateRange: true },
        transform: (data: PosOrder[], dateRange) => {
            return data.filter(o => {
                const d = new Date(o.timestamp).toISOString().split('T')[0];
                return d >= dateRange.start && d <= dateRange.end;
            });
        }
    },

    // --- HR Reports ---
    {
        id: 'employee_roster',
        title: 'Employee Roster',
        description: 'Complete list of active employees and department assignments.',
        category: 'HumanResources',
        dataSource: 'employees',
        columns: [
            { key: 'fullName', label: 'Name', type: 'string' },
            { key: 'role', label: 'Position', type: 'string' },
            { key: 'departmentName', label: 'Department', type: 'string' },
            { key: 'basicSalary', label: 'Salary/Rate', type: 'currency', align: 'right' },
            { key: 'hireDate', label: 'Joined', type: 'date' }
        ],
        filterConfig: { showDateRange: false },
        transform: (data: EmployeeProfile[]) => data
    },

    // --- Engineering Reports ---
    {
        id: 'asset_health_report',
        title: 'Asset Health & Warranty',
        description: 'Analysis of physical assets, health scores, and warranty status.',
        category: 'Maintenance',
        dataSource: 'assets',
        columns: [
            { key: 'name', label: 'Asset Name', type: 'string' },
            { key: 'category', label: 'Category', type: 'string' },
            { key: 'healthScore', label: 'Health %', type: 'number' },
            { key: 'location', label: 'Location', type: 'string' },
            { key: 'nextServiceDate', label: 'Next Service', type: 'date' }
        ],
        filterConfig: { showDateRange: false },
        transform: (data: Asset[]) => data
    },
    {
        id: 'maintenance_workload',
        title: 'Maintenance Workload',
        description: 'Tracking open and completed maintenance tasks by priority.',
        category: 'Maintenance',
        dataSource: 'maintenanceTasks',
        columns: [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'type', label: 'Type', type: 'string' },
            { key: 'description', label: 'Description', type: 'string' },
            { key: 'priority', label: 'Priority', type: 'status' },
            { key: 'status', label: 'Status', type: 'status' }
        ],
        filterConfig: { showDateRange: false },
        transform: (data: MaintenanceTask[]) => data
    },

    // --- Brand Standards Reports ---
    {
        id: 'compliance_audit',
        title: 'Compliance Audit',
        description: 'Status of brand documents and compliance across categories.',
        category: 'BrandStandards',
        dataSource: 'brandDocuments' as any,
        columns: [
            { key: 'title', label: 'Document', type: 'string' },
            { key: 'category', label: 'Category', type: 'string' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'version', label: 'Version', type: 'string' },
            { key: 'uploadedAt', label: 'Updated', type: 'date' }
        ],
        filterConfig: { showDateRange: false },
        transform: (data: BrandDocument[]) => data
    },

    // --- Executive & Strategy Reports ---
    {
        id: 'manager_flash_report',
        title: "Manager's Flash Report",
        description: 'Executive snapshot of Occupancy, ADR, RevPAR and Revenue performance.',
        category: 'Executive',
        dataSource: 'all',
        columns: [
            { key: 'metric', label: 'Performance Metric', type: 'string' },
            { key: 'daily', label: 'Today', type: 'currency', align: 'right' },
            { key: 'mtd', label: 'Month to Date', type: 'currency', align: 'right' },
            { key: 'ytd', label: 'Year to Date', type: 'currency', align: 'right' }
        ],
        filterConfig: { showDateRange: true },
        transform: (data: any[], dateRange, pms) => {
            if (!pms) return [];

            const reservations = pms.reservations as Reservation[];
            const ledger = pms.ledgerEntries as LedgerEntry[];
            const rooms = pms.rooms as Room[];
            const totalRooms = rooms.length || 1;

            const getStatsForRange = (start: string, end: string) => {
                const rangeReservations = reservations.filter(r =>
                    r.status === 'Checked In' && r.checkIn <= end && r.checkOut >= start
                );
                const rangeLedger = ledger.filter(l =>
                    l.businessDate >= start && l.businessDate <= end && l.moduleSource === 'PMS'
                );

                const roomRevenue = rangeLedger.reduce((sum, l) => sum + (l.credit - l.debit), 0);
                const occupiedRooms = rangeReservations.length;
                const occPercent = (occupiedRooms / totalRooms) * 100;
                const adr = occupiedRooms > 0 ? roomRevenue / occupiedRooms : 0;
                const revpar = roomRevenue / totalRooms;

                return { roomRevenue, occupiedRooms, occPercent, adr, revpar };
            };

            // Today
            const todayStats = getStatsForRange(dateRange.start, dateRange.end);

            // MTD (Mocked start of month for now)
            const monthStart = dateRange.end.substring(0, 7) + '-01';
            const mtdStats = getStatsForRange(monthStart, dateRange.end);

            // YTD (Mocked start of year)
            const yearStart = dateRange.end.substring(0, 4) + '-01-01';
            const ytdStats = getStatsForRange(yearStart, dateRange.end);

            return [
                { metric: 'Total Room Revenue', daily: todayStats.roomRevenue, mtd: mtdStats.roomRevenue, ytd: ytdStats.roomRevenue },
                { metric: 'Occupied Rooms', daily: todayStats.occupiedRooms, mtd: mtdStats.occupiedRooms, ytd: ytdStats.occupiedRooms },
                { metric: 'Occupancy %', daily: todayStats.occPercent, mtd: mtdStats.occPercent, ytd: mtdStats.occPercent },
                { metric: 'Average Daily Rate (ADR)', daily: todayStats.adr, mtd: mtdStats.adr, ytd: ytdStats.adr },
                { metric: 'RevPAR', daily: todayStats.revpar, mtd: mtdStats.revpar, ytd: ytdStats.revpar }
            ];
        }
    },
    {
        id: 'source_of_business',
        title: 'Source of Business Analytics',
        description: 'Analysis of revenue and room nights by booking source (OTA, Direct, Corporate).',
        category: 'Executive',
        dataSource: 'reservations',
        columns: [
            { key: 'source', label: 'Booking Source', type: 'string' },
            { key: 'roomNights', label: 'Room Nights', type: 'number' },
            { key: 'revenue', label: 'Revenue', type: 'currency', align: 'right' },
            { key: 'percentage', label: 'Share %', type: 'number', align: 'right' }
        ],
        filterConfig: { showDateRange: true },
        transform: (data: Reservation[], dateRange) => {
            const filtered = data.filter(r =>
                r.checkIn <= dateRange.end && r.checkOut >= dateRange.start
            );

            const stats: Record<string, { nights: number, rev: number }> = {};
            let totalRev = 0;

            filtered.forEach(r => {
                const source = r.channel || r.sourceCode || 'Walk-In';
                if (!stats[source]) stats[source] = { nights: 0, rev: 0 };

                // Simplified nights calculation for the report range
                stats[source].nights += 1;
                stats[source].rev += (r.rateApplied || 0);
                totalRev += (r.rateApplied || 0);
            });

            return Object.entries(stats).map(([source, s]) => ({
                source,
                roomNights: s.nights,
                revenue: s.rev,
                percentage: totalRev > 0 ? (s.rev / totalRev) * 100 : 0
            })).sort((a, b) => b.revenue - a.revenue);
        }
    },
    {
        id: 'daily_transaction_journal',
        title: 'Daily Transaction Journal',
        description: 'Audit trail of all financial postings for the selected business date.',
        category: 'Finance',
        dataSource: 'ledgerEntries',
        columns: [
            { key: 'id', label: 'Tx ID', type: 'string' },
            { key: 'accountCode', label: 'GL Code', type: 'string' },
            { key: 'description', label: 'Description', type: 'string' },
            { key: 'debit', label: 'Debit', type: 'currency', align: 'right' },
            { key: 'credit', label: 'Credit', type: 'currency', align: 'right' },
            { key: 'moduleSource', label: 'Source', type: 'string' }
        ],
        filterConfig: { showDateRange: true },
        transform: (data: LedgerEntry[], dateRange) => {
            return data.filter(l =>
                l.businessDate >= dateRange.start && l.businessDate <= dateRange.end
            ).sort((a, b) => b.date - a.date);
        }
    },
    {
        id: 'vip_arrivals',
        title: 'VIP & High-Tier Arrivals',
        description: 'Detailed list of upcoming VIP arrivals and loyalty members (Gold/Platinum/Diamond).',
        category: 'FrontOffice',
        dataSource: 'all',
        columns: [
            { key: 'guestName', label: 'Guest Name', type: 'string' },
            { key: 'arrival', label: 'Arrival', type: 'date' },
            { key: 'tier', label: 'Loyalty Tier', type: 'status' },
            { key: 'roomNumber', label: 'Room', type: 'string' },
            { key: 'notes', label: 'Preferences/Notes', type: 'string' }
        ],
        filterConfig: { showDateRange: true },
        transform: (data: any[], dateRange, pms) => {
            if (!pms) return [];
            const reservations = pms.reservations as Reservation[];
            const guests = pms.guests as User[];
            const rooms = pms.rooms as Room[];

            return reservations
                .filter(r => r.checkIn >= dateRange.start && r.checkIn <= dateRange.end)
                .map(r => {
                    const guest = guests.find(g => g.principal === r.guestId);
                    const room = rooms.find(rm => rm.id === r.roomId);
                    const tier = guest?.loyaltyTier || 'None';
                    // Filter for VIPs (Gold and above)
                    if (['Gold', 'Platinum', 'Diamond'].includes(tier as string) || (r as any).isVip) {
                        return {
                            guestName: guest?.fullName || 'Unknown',
                            arrival: r.checkIn,
                            tier: tier,
                            roomNumber: room?.number || 'GNR',
                            notes: (r as any).traces?.[0]?.text || 'No handle notes'
                        };
                    }
                    return null;
                })
                .filter(Boolean) as any[];
        }
    },
    {
        id: 'ar_aging_report',
        title: 'A/R Aging Summary',
        description: 'Analysis of outstanding corporate and guest ledger balances by age.',
        category: 'Finance',
        dataSource: 'all',
        columns: [
            { key: 'accountName', label: 'Account / Company', type: 'string' },
            { key: 'balance', label: 'Total Balance', type: 'currency', align: 'right' },
            { key: 'current', label: 'Current', type: 'currency', align: 'right' },
            { key: 'thirtyDays', label: '30 Days', type: 'currency', align: 'right' },
            { key: 'sixtyDaysPlus', label: '60+ Days', type: 'currency', align: 'right' }
        ],
        filterConfig: { showDateRange: false },
        transform: (data: any[], dateRange, pms) => {
            if (!pms) return [];
            const ledger = pms.ledgerEntries as LedgerEntry[];
            const now = Date.now();
            const dayInMs = 24 * 60 * 60 * 1000;

            // Group by reservationId or accountId (Simplified grouping for MVP)
            const aging: Record<string, { total: number, cur: number, thirty: number, sixty: number }> = {};

            ledger.filter(l => l.accountCode === 'AR' || l.accountCode === 'CityLedger').forEach(l => {
                const label = l.description.split(' - ')[0] || 'Unknown Account';
                if (!aging[label]) aging[label] = { total: 0, cur: 0, thirty: 0, sixty: 0 };

                const amount = l.debit - l.credit;
                const ageDays = (now - l.date) / dayInMs;

                aging[label].total += amount;
                if (ageDays < 30) aging[label].cur += amount;
                else if (ageDays < 60) aging[label].thirty += amount;
                else aging[label].sixty += amount;
            });

            return Object.entries(aging)
                .map(([name, s]) => ({
                    accountName: name,
                    balance: s.total,
                    current: s.cur,
                    thirtyDays: s.thirty,
                    sixtyDaysPlus: s.sixty
                }))
                .filter(a => Math.abs(a.balance) > 0.01);
        }
    },
    {
        id: 'status_discrepancy_report',
        title: 'Room Status Discrepancy',
        description: 'Audit comparing PMS occupancy vs Housekeeping reported status.',
        category: 'Housekeeping',
        dataSource: 'all',
        columns: [
            { key: 'roomNumber', label: 'Room', type: 'string' },
            { key: 'pmsStatus', label: 'PMS Status', type: 'status' },
            { key: 'hkStatus', label: 'HK Status', type: 'status' },
            { key: 'discrepancy', label: 'Discrepancy', type: 'string' }
        ],
        filterConfig: { showDateRange: false },
        transform: (data: any[], dateRange, pms) => {
            if (!pms) return [];
            const rooms = pms.rooms as Room[];
            const reservations = pms.reservations as Reservation[];
            const today = new Date().toISOString().split('T')[0];

            return rooms.map(room => {
                const isOccupiedPMS = reservations.some(r =>
                    r.roomId === room.id && r.status === 'Checked In'
                );
                const pmsStat = isOccupiedPMS ? 'Occupied' : 'Vacant';

                // Simulated HK status comparison (In production, this comes from a dedicated HK status field)
                const hkStat = room.status === 'Dirty/Departure' || room.status === 'Dirty/Stayover' ? 'Occupied' : 'Vacant';

                const hasDiscrepancy = pmsStat !== hkStat;

                return {
                    roomNumber: room.number,
                    pmsStatus: pmsStat,
                    hkStatus: hkStat,
                    discrepancy: hasDiscrepancy ? '⚠️ STATUS MISMATCH' : 'Match'
                };
            }).filter(r => r.discrepancy !== 'Match');
        }
    },
    {
        id: 'night_audit_package',
        title: 'Night Audit Summary Package',
        description: 'Complete end-of-day summary including receipts, house balance, and revenue totals.',
        category: 'System',
        dataSource: 'all',
        columns: [
            { key: 'section', label: 'Department / Section', type: 'string' },
            { key: 'debit', label: 'Daily Debit', type: 'currency', align: 'right' },
            { key: 'credit', label: 'Daily Credit', type: 'currency', align: 'right' },
            { key: 'net', label: 'Net Position', type: 'currency', align: 'right' }
        ],
        filterConfig: { showDateRange: true },
        transform: (data: any[], dateRange, pms) => {
            if (!pms) return [];
            const ledger = pms.ledgerEntries as LedgerEntry[];
            const filtered = ledger.filter(l => l.businessDate >= dateRange.start && l.businessDate <= dateRange.end);

            const departments = ['PMS', 'POS', 'Procurement', 'Payroll', 'Manual'];
            return departments.map(dept => {
                const deptEntries = filtered.filter(l => l.moduleSource === dept as any);
                const debit = deptEntries.reduce((s, e) => s + e.debit, 0);
                const credit = deptEntries.reduce((s, e) => s + e.credit, 0);
                return {
                    section: dept,
                    debit,
                    credit,
                    net: credit - debit
                };
            }).filter(d => d.debit > 0 || d.credit > 0);
        }
    },
    {
        id: 'history_forecast_matrix',
        title: '14-Day History & Forecast',
        description: 'Matrix view of Occupancy, ADR and RevPAR for the next 14 days vs. Same Day Last Week.',
        category: 'Executive',
        dataSource: 'all',
        columns: [
            { key: 'date', label: 'Business Date', type: 'date' },
            { key: 'occupancy', label: 'Occ %', type: 'number' },
            { key: 'adr', label: 'Forecast ADR', type: 'currency', align: 'right' },
            { key: 'revenue', label: 'Est. Revenue', type: 'currency', align: 'right' },
            { key: 'lyCompare', label: 'vs LW %', type: 'status' }
        ],
        filterConfig: { showDateRange: false },
        transform: (data: any[], dateRange, pms) => {
            if (!pms) return [];
            const reservations = pms.reservations as Reservation[];
            const rooms = pms.rooms as Room[];
            const totalRooms = rooms.length || 1;

            const results = [];
            const start = new Date();

            for (let i = 0; i < 14; i++) {
                const target = new Date(start);
                target.setDate(start.getDate() + i);
                const dateStr = target.toISOString().split('T')[0];

                const dayReservations = reservations.filter(r =>
                    r.checkIn <= dateStr && r.checkOut > dateStr && r.status !== 'Cancelled'
                );

                const occ = (dayReservations.length / totalRooms) * 100;
                const rev = dayReservations.reduce((s, r) => s + (r.rateApplied || 0), 0);
                const adr = dayReservations.length > 0 ? rev / dayReservations.length : 0;

                results.push({
                    date: dateStr,
                    occupancy: parseFloat(occ.toFixed(1)),
                    adr,
                    revenue: rev,
                    lyCompare: occ > 70 ? 'High Demand' : occ > 40 ? 'Moderate' : 'Low Demand'
                });
            }
            return results;
        }
    },
    {
        id: 'house_status_dashboard',
        title: 'House Status Dashboard',
        description: 'Real-time operational pulse: Expected Arrivals, Departures, OOO and Availability.',
        category: 'FrontOffice',
        dataSource: 'all',
        columns: [
            { key: 'metric', label: 'Operational Metric', type: 'string' },
            { key: 'value', label: 'Count / Value', type: 'number', align: 'right' },
            { key: 'status', label: 'Status', type: 'status' }
        ],
        filterConfig: { showDateRange: false },
        transform: (data: any[], dateRange, pms) => {
            if (!pms) return [];
            const res = pms.reservations as Reservation[];
            const rms = pms.rooms as Room[];
            const today = new Date().toISOString().split('T')[0];

            const arrivals = res.filter(r => r.checkIn === today && r.status === 'Confirmed').length;
            const remains = res.filter(r => r.checkIn === today && r.status === 'Confirmed').length;
            const departures = res.filter(r => r.checkOut === today && r.status === 'Checked In').length;
            const ooo = rms.filter(r => r.status === 'Out of Order').length;
            const oos = rms.filter(r => r.status === 'Out of Service').length;
            const available = rms.length - res.filter(r => r.checkIn <= today && r.checkOut > today && r.status === 'Checked In').length - ooo;

            return [
                { metric: 'Expected Arrivals', value: arrivals, status: 'Active' },
                { metric: 'Remaining Arrivals', value: remains, status: 'Pending' },
                { metric: 'Expected Departures', value: departures, status: 'Active' },
                { metric: 'Rooms Out of Order (OOO)', value: ooo, status: 'Warning' },
                { metric: 'Rooms Out of Service (OOS)', value: oos, status: 'Info' },
                { metric: 'Total Rooms Available to Sell', value: available, status: 'Success' }
            ];
        }
    },
    {
        id: 'high_balance_report',
        title: 'High Balance Audit',
        description: 'Loss prevention: Guests exceeding authorized credit limits.',
        category: 'Finance',
        dataSource: 'all',
        columns: [
            { key: 'guestName', label: 'Guest Name', type: 'string' },
            { key: 'room', label: 'Room', type: 'string' },
            { key: 'balance', label: 'Current Balance', type: 'currency', align: 'right' },
            { key: 'limit', label: 'Credit Limit', type: 'currency', align: 'right' },
            { key: 'variance', label: 'Over Limit', type: 'currency', align: 'right' }
        ],
        filterConfig: { showDateRange: false },
        transform: (data: any[], dateRange, pms) => {
            if (!pms) return [];
            const reservations = pms.reservations as Reservation[];
            const ledger = pms.ledgerEntries as LedgerEntry[];
            const rooms = pms.rooms as Room[];

            return reservations
                .filter(r => r.status === 'Checked In')
                .map(r => {
                    const guestLedger = ledger.filter(l => l.reservationId === r.id);
                    const balance = guestLedger.reduce((s, l) => s + (l.debit - l.credit), 0);
                    const limit = (r as any).creditLimit || 5000;
                    const variance = balance - limit;
                    const room = rooms.find(rm => rm.id === r.roomId)?.number || 'N/A';

                    if (variance > 0) {
                        return {
                            guestName: r.guestId,
                            room,
                            balance,
                            limit,
                            variance
                        };
                    }
                    return null;
                })
                .filter(Boolean) as any[];
        }
    }
];
