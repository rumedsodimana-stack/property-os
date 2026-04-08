import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RoomStatus, ReservationStatus, User, Reservation, LoyaltyTier, Room, YieldRule, Folio } from '../../types';
import { ROOM_TYPES, CURRENT_PROPERTY } from '../../services/kernel/config';
import {
    Grid, List, LogIn, LogOut, MoreVertical, X, User as UserIcon, Gift,
    Thermometer, Lock, Fan, Sun, Activity, ShieldCheck, Wrench, BarChart2,
    BedDouble, Hash, FileBarChart, Search, Calendar, Download, Printer, Filter,
    Users, Briefcase, ArrowRight, ChevronRight, Receipt, TrendingUp, Zap, Map, BookUser, ConciergeBell, Brain, Plus, Trash2, Power, Globe,
    RefreshCw, Link, History, Brain as OracleIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ReportEngine, ReportDimension, ReportMetric } from '../shared/ReportEngine';
import UniversalReportCenter from '../shared/UniversalReportCenter';
import { biQueryService } from '../../services/intelligence/biQueryService';
import { revenueEngine } from '../../services/intelligence/revenueEngine';
import { forecastingService, ForecastSummary } from '../../services/intelligence/forecastingService';
import GuestProfileModal from '../shared/GuestProfileModal';
import RoomProfileModal from '../shared/RoomProfileModal';
import ReservationProfileModal from '../shared/ReservationProfileModal';
import RoomAllocationModal from '../shared/RoomAllocationModal';
import ReservationEditorModal from '../shared/ReservationEditorModal';
import BusinessBlocks from './BusinessBlocks';
import RoomPlan from './RoomPlan';
import ArrivalsList from './ArrivalsList';
import DeparturesList from './DeparturesList';
import { botEngine } from '../../services/kernel/systemBridge';
import OracleWidget from '../shared/OracleWidget';
import Inspectable from '../shared/Inspectable';
import { useInspector } from '../../context/InspectorContext';
import { usePms } from '../../services/kernel/persistence';
import { addItem, updateItem, queryItems } from '../../services/kernel/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { where, limit, query } from 'firebase/firestore';

// Yield Rules interface moved to types.ts

const FrontDesk: React.FC = () => {
    const [view, setView] = useState<'grid' | 'floorplan' | 'list' | 'guests' | 'reports' | 'roomplan' | 'arrivals' | 'departures' | 'blocks' | 'livebi'>('grid');
    const { rooms, reservations, guests, loading, yieldRules: storeYieldRules } = usePms();
    const { inspect } = useInspector();
    const { currentUser, hasPermission } = useAuth();

    // Revenue Management State
    const [showYield, setShowYield] = useState(false);
    const [yieldRules, setYieldRules] = useState<YieldRule[]>([]);
    useEffect(() => {
        const unsubscribeYield = revenueEngine.subscribe(setYieldRules);
        return () => {
            unsubscribeYield();
        };
    }, []);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<{ guests: User[], reservations: Reservation[], rooms: Room[] }>({ guests: [], reservations: [], rooms: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Report State
    const [reportConfig, setReportConfig] = useState({ type: 'Arrivals', range: 'Today', format: 'PDF' });
    const [generatedReport, setGeneratedReport] = useState<any[] | null>(null);

    // Room Allocation State
    const [allocationModal, setAllocationModal] = useState<{ isOpen: boolean; reservation: Reservation | null }>({
        isOpen: false,
        reservation: null
    });

    // Reservation Editor State
    const [editorModal, setEditorModal] = useState<{ isOpen: boolean; reservation?: Reservation }>({
        isOpen: false
    });

    const [saveError, setSaveError] = useState<string | null>(null);

    const canCreateReservation = hasPermission('create_reservation');
    const canCheckInOut = hasPermission('check_in_guest') || hasPermission('check_out_guest');

    // ────────────────────────────────────────────────────────────
    // BI ENGINE CONFIGURATION
    // ────────────────────────────────────────────────────────────
    const propertyDimensions: ReportDimension[] = [
        { key: 'status', label: 'Reservation Status' },
        { key: 'roomTypeId', label: 'Room Category' },
        { key: 'source', label: 'Booking Source' },
        { key: 'marketSegment', label: 'Market Segment' }
    ];

    const propertyMetrics: ReportMetric[] = [
        { key: 'totalAmount', label: 'Accommodation Rev.', aggregation: 'sum', format: (v) => `${CURRENT_PROPERTY.currency} ${v.toLocaleString()}` },
        { key: 'guestCount', label: 'Total Guests', aggregation: 'sum' },
        { key: 'id', label: 'Bookings', aggregation: 'count' }
    ];

    const [biQuery, setBiQuery] = useState('');
    const [isBiLoading, setIsBiLoading] = useState(false);
    const [biConfig, setBiConfig] = useState<{ dim: string, met: string, chart: any, isPredictive?: boolean }>({
        dim: 'status',
        met: 'totalAmount',
        chart: 'Bar'
    });
    const [forecastSummary, setForecastSummary] = useState<ForecastSummary | null>(null);

    const handleBIQuery = async () => {
        if (!biQuery.trim()) return;
        setIsBiLoading(true);
        try {
            const res = await biQueryService.translateQuery(biQuery, propertyDimensions, propertyMetrics);

            if (res.isPredictive) {
                const forecast = forecastingService.getOperationalForecast(30);
                setForecastSummary(forecast);
                // For forecasting, we typically dimension by date
                setBiConfig({
                    dim: 'date',
                    met: res.metric === 'id' ? 'projectedOccupancy' : 'projectedADR',
                    chart: 'Line',
                    isPredictive: true
                });
            } else {
                setForecastSummary(null);
                setBiConfig({ dim: res.dimension, met: res.metric, chart: res.chartType, isPredictive: false });
            }

            botEngine.logActivity('PMS', 'BI_Query', `Oracle processed: ${biQuery}${res.isPredictive ? ' [PREDICTIVE]' : ''}`, 'AI.Oracle');
        } catch (e) {
            console.error('BI Query Failed:', e);
        } finally {
            setIsBiLoading(false);
        }
    };

    const [selectedFloor, setSelectedFloor] = useState<string | 'all'>('all');

    // Smart Grouping: Default to first floor instead of "all"
    useEffect(() => {
        if (selectedFloor === 'all' && rooms.length > 0) {
            const firstFloor = Array.from(new Set(rooms.map(r => r.floor))).sort()[0];
            if (firstFloor) setSelectedFloor(firstFloor);
        }
    }, [rooms, selectedFloor]);

    // --- SEARCH LOGIC ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchTimeout = useRef<any>(null);

    const handleSearchChange = async (val: string) => {
        setSearchTerm(val);
        if (val.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            setSearchResults({ guests: [], reservations: [], rooms: [] });
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        // Immediate Room Search (Local)
        const roomMatches: any[] = [];
        const term = val.toLowerCase();
        rooms.forEach(r => {
            if (r.number.includes(term)) roomMatches.push({ type: 'Room', label: `Room ${r.number}`, sub: r.status, id: r.id, data: r });
        });
        setSuggestions(roomMatches);
        setShowSuggestions(true);

        // Debounced Server Search for Guests/Reservations
        searchTimeout.current = setTimeout(async () => {
            try {
                // For a 500-room property, we query Firestore for fuzzy matches (prefix search)
                const guestResults = await queryItems<User>('guests',
                    where('fullName', '>=', val),
                    where('fullName', '<=', val + '\uf8ff'),
                    limit(20)
                );

                const resResults = await queryItems<Reservation>('reservations',
                    where('id', '>=', val.toLowerCase()),
                    where('id', '<=', val.toLowerCase() + '\uf8ff'),
                    limit(20)
                );

                setSearchResults({ guests: guestResults, reservations: resResults, rooms: roomMatches.map(r => r.data) });

                const serverMatches = [
                    ...guestResults.map(g => ({ type: 'Guest', label: g.fullName, sub: g.role, id: g.principal, data: g })),
                    ...resResults.map(r => ({ type: 'Reservation', label: `Res #${r.id.split('_')[1]}`, sub: `Room ${rooms.find(rom => rom.id === r.roomId)?.number || '?'}`, id: r.id, data: r }))
                ];

                setSuggestions((prev) => [...roomMatches, ...serverMatches].slice(0, 8));
            } catch (error) {
                console.error("Search Error:", error);
            }
        }, 300);
    };

    const handleSuggestionClick = (item: any) => {
        setSearchTerm('');
        setShowSuggestions(false);

        if (item.type === 'Room') {
            handleRoomClick(item.data);
        } else if (item.type === 'Guest') {
            handleGuestClick(item.data.principal || item.data.id);
        } else if (item.type === 'Reservation') {
            handleReservationClick(item.data);
        }
    };

    const handleGenerateReport = () => {
        const data = reservations.filter(r => {
            if (reportConfig.type === 'Arrivals') return r.status === ReservationStatus.CONFIRMED;
            if (reportConfig.type === 'Departures') return r.status === ReservationStatus.CHECKED_IN;
            return true; // Occupancy
        }).map(r => ({
            col1: r.id.split('_')[1],
            col2: guests.find(g => g.principal === r.guestId)?.fullName || 'Unknown',
            col3: rooms.find(rm => rm.id === r.roomId)?.number || 'Unassigned',
            col4: new Date(r.checkIn).toLocaleDateString(),
            col5: r.status
        }));
        setGeneratedReport(data);
        botEngine.logActivity('PMS', 'Report_Gen', `Generated ${reportConfig.type}`, 'FrontDesk_Mgr');
    };

    // --- STATS CALCULATION (Memoized) ---
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0]; // Dynamic date
        const arrivalsCount = reservations.filter(r => r.status === ReservationStatus.CONFIRMED && new Date(r.checkIn).toDateString() === new Date(today).toDateString()).length;
        const departuresCount = reservations.filter(r => r.status === ReservationStatus.CHECKED_IN && new Date(r.checkOut).toDateString() === new Date(today).toDateString()).length;
        const inHouseCount = reservations.filter(r => r.status === ReservationStatus.CHECKED_IN).length;
        const occupancy = rooms.length ? Math.round((inHouseCount / rooms.length) * 100) : 0;

        // Calculate floors for filtering
        const floorSet = new Set<string>();
        rooms.forEach(r => floorSet.add(r.floor));
        const floors = Array.from(floorSet).sort();

        return { arrivalsCount, departuresCount, inHouseCount, occupancy, floors };
    }, [reservations, rooms]); // Only re-calc when reservations or room count changes

    const createEntityId = (prefix: string) => {
        if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
            return `${prefix}_${globalThis.crypto.randomUUID().slice(0, 12)}`;
        }
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    };

    const overlapsStay = (aStart: string, aEnd: string, bStart: string, bEnd: string) => {
        const aStartTs = new Date(aStart).getTime();
        const aEndTs = new Date(aEnd).getTime();
        const bStartTs = new Date(bStart).getTime();
        const bEndTs = new Date(bEnd).getTime();
        return aStartTs < bEndTs && bStartTs < aEndTs;
    };

    const hasRoomTypeAvailability = (roomTypeId: string, checkIn: string, checkOut: string, reservationId?: string) => {
        const physicalRooms = rooms.filter(r => r.typeId === roomTypeId && !r.isVirtual);
        if (physicalRooms.length === 0) return false;

        const booked = reservations.filter(r => {
            if (reservationId && r.id === reservationId) return false;
            if (r.roomTypeId !== roomTypeId) return false;
            if (r.status === ReservationStatus.CANCELLED || r.status === ReservationStatus.CHECKED_OUT) return false;
            return overlapsStay(checkIn, checkOut, r.checkIn, r.checkOut);
        });

        return booked.length < physicalRooms.length;
    };

    // --- HANDLERS ---
    const handleGuestClick = (guestId: string) => {
        inspect('guest', guestId);
        botEngine.logActivity('PMS', 'Guest_Profile_View', `Guest ID: ${guestId}`, 'FrontDesk_Agent');
    };

    const handleRoomClick = (room: Room) => {
        inspect('room', room.id);
        botEngine.logActivity('PMS', 'Room_View', `Room: ${room.number}`, 'FrontDesk_Agent');
    };

    const handleReservationClick = (res: Reservation) => {
        inspect('reservation', res.id);
        botEngine.logActivity('PMS', 'Res_View', `Res ID: ${res.id}`, 'FrontDesk_Agent');
    };


    const handleAllocateClick = (e: React.MouseEvent, res: Reservation) => {
        e.stopPropagation();
        setAllocationModal({ isOpen: true, reservation: res });
    };

    const handleRoomAssigned = async (roomId: string) => {
        if (!allocationModal.reservation) return;
        if (!canCheckInOut) {
            setSaveError('You do not have permission to assign rooms.');
            return;
        }

        try {
            setSaveError(null);
            await updateItem('reservations', allocationModal.reservation.id, { roomId: roomId });
            botEngine.logActivity('PMS', 'Room_Allocation', `Assigned Room ${roomId} to Res: ${allocationModal.reservation.id}`, currentUser?.fullName || 'FrontDesk_Agent');
        } catch (error) {
            console.error("Failed to assign room:", error);
            botEngine.logActivity('PMS', 'Room_Allocation_Error', `Failed to assign room ${roomId}`, 'System');
            setSaveError('Failed to assign room. Please retry.');
        }
    };

    const handleSaveReservation = async (reservationData: Partial<Reservation>) => {
        if (!canCreateReservation) {
            setSaveError('You do not have permission to create or edit reservations.');
            return;
        }

        if (!reservationData.guestId || !reservationData.roomTypeId || !reservationData.checkIn || !reservationData.checkOut) {
            setSaveError('Guest, dates, and room type are required.');
            return;
        }

        if (new Date(reservationData.checkOut).getTime() <= new Date(reservationData.checkIn).getTime()) {
            setSaveError('Check-out must be later than check-in.');
            return;
        }

        if (!hasRoomTypeAvailability(reservationData.roomTypeId, reservationData.checkIn, reservationData.checkOut, reservationData.id)) {
            setSaveError('No inventory available for selected room type and dates.');
            return;
        }

        try {
            setSaveError(null);
            if (reservationData.id) {
                // Edit existing
                await updateItem('reservations', reservationData.id, reservationData);
                botEngine.logActivity('PMS', 'Res_Update', `Updated reservation ${reservationData.id}`, currentUser?.fullName || 'FrontDesk_Agent');
            } else {
                const reservationId = createEntityId('res');
                const folioId = createEntityId('fol');
                const businessDate = new Date().toISOString().split('T')[0];
                const newFolio: Folio = {
                    id: folioId,
                    reservationId,
                    charges: [],
                    balance: 0,
                    status: 'Open'
                };

                const newRes: Reservation = {
                    id: reservationId,
                    guestId: reservationData.guestId,
                    propertyId: 'H1',
                    roomId: reservationData.roomId,
                    roomTypeId: reservationData.roomTypeId,
                    checkIn: reservationData.checkIn,
                    checkOut: reservationData.checkOut,
                    adults: Math.max(1, reservationData.adults || 1),
                    children: Math.max(0, reservationData.children || 0),
                    status: reservationData.status || ReservationStatus.CONFIRMED,
                    folioId,
                    rateApplied: reservationData.rateApplied || (ROOM_TYPES.find(r => r.id === reservationData.roomTypeId)?.baseRate || 0),
                    noShowProbability: reservationData.noShowProbability || 0.05,
                    paymentMethod: reservationData.paymentMethod || 'Credit Card',
                    accompanyingGuests: reservationData.accompanyingGuests || [],
                    channel: reservationData.channel || 'Direct',
                    guaranteeType: reservationData.guaranteeType as any || 'CC',
                    history: [{
                        date: `${businessDate}T00:00:00.000Z`,
                        action: 'Reservation Created',
                        user: currentUser?.fullName || 'FrontDesk_Agent',
                        details: `Created via Front Desk UI`
                    }]
                };

                await updateItem('folios', folioId, newFolio);
                await updateItem('reservations', newRes.id, newRes);
                botEngine.logActivity('PMS', 'Res_Create', `Created new reservation ${newRes.id}`, currentUser?.fullName || 'FrontDesk_Agent');
            }
        } catch (error) {
            console.error("Failed to save reservation:", error);
            botEngine.logActivity('PMS', 'Res_Save_Error', `Failed to save reservation`, 'System');
            setSaveError('Failed to save reservation. Please retry.');
        }
    };

    const getStatusColor = (status: RoomStatus | ReservationStatus | string) => {
        if (Object.values(RoomStatus).includes(status as RoomStatus)) {
            switch (status) {
                case RoomStatus.CLEAN_READY: return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
                case RoomStatus.OCCUPIED: return 'bg-violet-500/10 border-violet-500/30 text-violet-500';
                case RoomStatus.DIRTY_DEPARTURE: return 'bg-rose-500/10 border-rose-500/30 text-rose-500';
                case RoomStatus.DIRTY_STAYOVER: return 'bg-amber-500/10 border-amber-500/30 text-amber-500';
                case RoomStatus.MAINTENANCE: return 'bg-zinc-800 border-zinc-700 text-zinc-500';
                case RoomStatus.MINIBAR_PENDING: return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400';
                default: return 'bg-zinc-900 border-zinc-800 text-zinc-500';
            }
        } else {
            switch (status) {
                case ReservationStatus.CHECKED_IN: return 'bg-violet-500/10 text-violet-400';
                case ReservationStatus.CONFIRMED: return 'bg-teal-500/10 text-teal-400';
                case ReservationStatus.CHECKED_OUT: return 'bg-zinc-800 text-zinc-500';
                case ReservationStatus.CANCELLED: return 'bg-rose-500/10 text-rose-500';
                default: return 'bg-zinc-800 text-zinc-500';
            }
        }
    };

    // Memoize Filtered Reservations
    const filteredReservations = useMemo(() => {
        if (!searchTerm) return reservations;

        // Use server results + local fuzzy room matches
        const searchGuestIds = new Set(searchResults.guests.map(g => g.principal));
        const searchResIds = new Set(searchResults.reservations.map(r => r.id));
        const searchRoomIds = new Set(searchResults.rooms.map(r => r.id));

        return reservations.filter(r =>
            searchResIds.has(r.id) || searchGuestIds.has(r.guestId) || (r.roomId && searchRoomIds.has(r.roomId))
        );
    }, [reservations, searchTerm, searchResults]);

    // Enrich reservations for reporting (Mapping raw keys to BI-friendly keys)
    const enrichedReservations = useMemo(() => {
        return reservations.map(r => ({
            ...r,
            source: r.channel || 'Direct',
            marketSegment: r.marketSegment || 'Transient',
            guestCount: (r.adults || 0) + (r.children || 0),
            totalAmount: r.rateApplied || 0
        }));
    }, [reservations]);

    // Memoize Filtered Rooms
    const filteredRooms = useMemo(() => {
        const floorFiltered = selectedFloor === 'all' ? rooms : rooms.filter(r => r.floor === selectedFloor);
        if (!searchTerm) return floorFiltered;

        const searchRoomIds = new Set(searchResults.rooms.map(r => r.id));

        // Find rooms associated with the matching reservations or guests
        const activeResForSearch = reservations.filter(r =>
            r.status === ReservationStatus.CHECKED_IN &&
            searchResults.guests.some(g => g.principal === r.guestId)
        );
        const resRoomIds = new Set(activeResForSearch.map(r => r.roomId));

        return floorFiltered.filter(r => searchRoomIds.has(r.id) || resRoomIds.has(r.id));
    }, [rooms, reservations, selectedFloor, searchTerm, searchResults]);

    const renderFloorPlan = () => {
        const floors: { [key: string]: Room[] } = {};
        filteredRooms.forEach(r => {
            if (!floors[r.floor]) floors[r.floor] = [];
            floors[r.floor].push(r);
        });

        return (
            <div className="p-8 space-y-12">
                {Object.entries(floors).sort().map(([floor, floorRooms]) => (
                    <div key={floor}>
                        <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-zinc-700"></span>
                            Floor {floor}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            {floorRooms.map(room => {
                                const res = reservations.find(r => r.roomId === room.id && (r.status === ReservationStatus.CHECKED_IN || r.status === ReservationStatus.CONFIRMED));
                                const roomType = ROOM_TYPES.find(t => t.id === room.typeId);
                                return (
                                    <div
                                        key={room.id}
                                        onClick={() => handleRoomClick(room)}
                                        className={`h-24 rounded-lg flex flex-col justify-center items-center border cursor-pointer hover:scale-105 transition-transform ${getStatusColor(room.status)} bg-zinc-900/50`}
                                    >
                                        <span className="font-mono font-bold text-lg text-white">{room.number}</span>
                                        <span className="text-[9px] uppercase font-bold opacity-60 mt-1">{roomType?.name || 'Standard'}</span>
                                        {res && <UserIcon size={12} className="mt-1 text-zinc-400" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderYieldManagement = () => (
        <div className="bg-zinc-950/90 border-l border-zinc-800 w-96 p-6 flex flex-col gap-6 animate-slideInRight h-full absolute right-0 top-0 z-50 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-violet-500" size={20} />
                        Yield Management
                    </h2>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Dynamic Pricing Engine</p>
                </div>
                <button
                    onClick={() => setShowYield(false)}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 transition"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
                    <div className="flex items-center gap-2 text-violet-400 mb-2">
                        <Brain size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Oracle AI Insight</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                        Occupancy is pacing 12% ahead of same-time-last-year. I recommend activating the "High Occupancy Premium" to capture BHD 3.2k additional yield.
                    </p>
                </div>

                <div className="space-y-3">
                    <h3 className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest px-1">Active Yield Rules</h3>
                    {yieldRules.map(rule => (
                        <div key={rule.id} className={`p-4 rounded-2xl border transition ${rule.isActive ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-950/50 border-zinc-900 opacity-60'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${rule.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <Zap size={14} />
                                    </div>
                                    <span className="text-sm font-bold text-zinc-100">{rule.name}</span>
                                </div>
                                <button
                                    onClick={() => revenueEngine.toggleRule(rule.id, !rule.isActive)}
                                    className={`p-1.5 rounded-lg transition ${rule.isActive ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                                >
                                    <Power size={14} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-zinc-500">Trigger Condition</span>
                                    <span className="text-zinc-300 font-mono">{rule.condition.metric} {rule.condition.operator} {rule.condition.value}%</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-zinc-500">Price Adjustment</span>
                                    <span className={`font-bold ${rule.action.adjustmentType === 'Increase' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {rule.action.adjustmentType === 'Increase' ? '+' : '-'}{rule.action.value}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="w-full py-3 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition flex items-center justify-center gap-2 text-xs font-medium">
                    <Plus size={14} /> Add New Yield Rule
                </button>
            </div>

            <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400 font-medium">Applied Yield Impact</span>
                    <span className="text-xs text-emerald-400 font-bold">+ BHD 420.50</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[65%]" />
                </div>
            </div>
        </div>
    );



    const renderReports = () => (
        <UniversalReportCenter defaultCategory="FrontOffice" />
    );

    const renderRoomPlan = () => <RoomPlan />;

    const renderBusinessBlocks = () => <BusinessBlocks />;

    const renderArrivalsList = () => <ArrivalsList />;

    const renderDeparturesList = () => <DeparturesList />;

    const renderContent = () => {
        const floors: { [key: string]: Room[] } = {};
        // Use memoized filteredRooms
        filteredRooms.forEach(r => {
            const floor = r.number.charAt(0);
            if (!floors[floor]) floors[floor] = [];
            floors[floor].push(r);
        });

        return (
            <div className="space-y-4 animate-fadeIn">
                {Object.keys(floors).sort().map(floor => (
                    <div key={floor} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-5">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Map className="w-4 h-4" /> Floor {floor}
                        </h3>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
                            {floors[floor].map(room => (
                                <div
                                    key={room.id}
                                    onClick={() => handleRoomClick(room)}
                                    className={`w-14 h-14 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all duration-150 hover:scale-105 group relative ${getStatusColor(room.status)} bg-opacity-40`}
                                >
                                    <span className="text-sm font-bold opacity-90">{room.number}</span>
                                    <span className="text-[7px] uppercase font-bold opacity-60">
                                        {room.status.split('/')[0].slice(0, 3)}
                                    </span>
                                    {room.currentGuestId && (
                                        <div
                                            className="absolute -bottom-1 -right-1 w-5 h-5 bg-violet-600 border border-violet-500/50 rounded-full flex items-center justify-center shadow-lg transition z-10"
                                            onClick={(e) => { e.stopPropagation(); handleGuestClick(room.currentGuestId!); }}
                                            title="View Guest"
                                        >
                                            <UserIcon className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderGuestDirectory = () => (
        <div className="animate-fadeIn flex flex-col gap-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <BookUser className="w-4 h-4 text-violet-500" /> Guest Directory
                    </h3>
                    <div className="text-xs text-zinc-500">{guests.length} Records</div>
                </div>
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3">System Code</th>
                                <th className="px-6 py-3">Guest Name</th>
                                <th className="px-6 py-3">Tier</th>
                                <th className="px-6 py-3">Preferences</th>
                                <th className="px-6 py-3">Sentiment</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {guests.filter(g => g.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(guest => (
                                <tr key={guest.principal} className="hover:bg-zinc-800/30 transition group">
                                    <td className="px-6 py-3 font-mono text-xs text-zinc-600 group-hover:text-zinc-400">
                                        {guest.principal.slice(0, 12)}...
                                    </td>
                                    <td className="px-6 py-3">
                                        <button
                                            onClick={() => handleGuestClick(guest.principal)}
                                            className="font-medium text-zinc-200 hover:text-violet-400 hover:underline transition flex items-center gap-2"
                                        >
                                            {guest.fullName}
                                        </button>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${guest.loyaltyTier === 'Diamond' ? 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' :
                                            guest.loyaltyTier === 'Platinum' ? 'text-zinc-300 border-zinc-400/30 bg-zinc-400/10' :
                                                'text-amber-500 border-amber-500/30 bg-amber-500/10'
                                            }`}>{guest.loyaltyTier}</span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex gap-1 flex-wrap">
                                            {guest.preferences.halal && <span className="text-[9px] bg-zinc-800 px-1.5 rounded text-zinc-400">Halal</span>}
                                            {guest.preferences.language && <span className="text-[9px] bg-zinc-800 px-1.5 rounded text-zinc-400">{guest.preferences.language}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-violet-500"
                                                style={{ width: `${((guest.valenceHistory[0]?.score || 5) / 10) * 100}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleGuestClick(guest.principal)}
                                            className="text-zinc-500 hover:text-white transition"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderReservationList = () => (
        <div className="animate-fadeIn flex flex-col gap-6 h-full pb-20">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                    <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-amber-500" /> Reservation Management
                    </h3>
                    <div className="flex gap-2">
                        <div className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center">
                            {filteredReservations.length} Records Found
                        </div>
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditorModal({ isOpen: true, reservation: undefined }); }}
                            disabled={!canCreateReservation}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-1.5 rounded-lg transition shadow-lg shadow-emerald-900/20"
                        >
                            + New Reservation
                        </button>
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3">Res ID</th>
                                <th className="px-6 py-3">Guest Name</th>
                                <th className="px-6 py-3">Date Range</th>
                                <th className="px-6 py-3">Room Type</th>
                                <th className="px-6 py-3">Allocated Room</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {/* Use memoized filteredReservations */}
                            {filteredReservations.map(res => {
                                const guest = guests.find(g => g.principal === res.guestId);
                                const room = rooms.find(r => r.id === res.roomId);
                                const roomType = ROOM_TYPES.find(t => t.id === res.roomTypeId);

                                return (
                                    <tr
                                        key={res.id}
                                        className="hover:bg-zinc-800/30 transition group cursor-pointer"
                                        onClick={() => handleReservationClick(res)}
                                    >
                                        <td className="px-6 py-3 font-mono text-xs text-zinc-500">
                                            #{res.id.split('_')[1]}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-zinc-200 group-hover:text-amber-500 transition">
                                                {guest?.fullName || 'Unknown'}
                                            </div>
                                            {guest?.loyaltyTier !== 'Standard' && (
                                                <div className="text-[9px] text-zinc-500">{guest?.loyaltyTier} Member</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="text-xs text-zinc-300">
                                                {new Date(res.checkIn).toLocaleDateString()} <span className="text-zinc-600">to</span> {new Date(res.checkOut).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-xs text-zinc-400">
                                            {roomType?.name}
                                        </td>
                                        <td className="px-6 py-3">
                                            {room ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-zinc-200">{room.number}</span>
                                                    <span className={`w-2 h-2 rounded-full ${room.status === 'Clean/Ready' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-zinc-600 italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${res.status === ReservationStatus.CHECKED_IN ? 'text-violet-400 border-violet-500/30 bg-violet-500/10' :
                                                res.status === ReservationStatus.CONFIRMED ? 'text-teal-400 border-teal-500/30 bg-teal-500/10' :
                                                    res.status === ReservationStatus.CHECKED_OUT ? 'text-zinc-500 border-zinc-600/30 bg-zinc-600/10' :
                                                        'text-rose-500 border-rose-500/30 bg-rose-500/10'
                                                }`}>
                                                {res.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {!res.roomId && res.status === ReservationStatus.CONFIRMED && (
                                                    <button
                                                        onClick={(e) => handleAllocateClick(e, res)}
                                                        disabled={!canCheckInOut}
                                                        className="text-[10px] bg-emerald-600/10 hover:bg-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-600/20 transition uppercase font-bold tracking-wider"
                                                    >
                                                        Assign Room
                                                    </button>
                                                )}
                                                <button className="p-1 hover:bg-zinc-700 rounded text-zinc-500 hover:text-white">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    return (
        <div className="module-container">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[50px] bg-emerald-500/20 rounded-[100%] blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 right-1/4 w-[600px] h-[300px] bg-violet-600/10 rounded-[100%] blur-[120px] pointer-events-none" />

            {/* Yield Management Overlay */}
            {showYield && renderYieldManagement()}

            {/* Room Allocation Modal */}
            <RoomAllocationModal
                isOpen={allocationModal.isOpen}
                reservation={allocationModal.reservation || undefined}
                rooms={rooms}
                onClose={() => setAllocationModal({ isOpen: false, reservation: null })}
                onAssign={handleRoomAssigned}
            />

            {/* V1 Command Header */}
            <div className="module-header glass-panel">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-violet-600/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
                        <ConciergeBell className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-light text-white tracking-tight">Front Desk Operations</h1>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Property Management Engine</p>
                    </div>
                </div>

                {/* Integration: Stats inside header row to save space */}
                <div className="flex items-center gap-3 px-4 py-1.5 bg-zinc-950/20 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{stats.occupancy}% OCC</span>
                    </div>
                </div>

                {/* V1 Sub-Navigation */}
                <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5 mx-4">
                    {[
                        { id: 'grid', label: 'Monitor', icon: Grid },
                        { id: 'roomplan', label: 'Timeline', icon: Calendar },
                        { id: 'arrivals', label: 'Arrivals', icon: LogIn },
                        { id: 'departures', label: 'Departures', icon: LogOut },
                        { id: 'list', label: 'Hash', icon: Hash },
                        { id: 'livebi', label: 'Oracle', icon: OracleIcon },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id as any)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${view === item.id
                                ? 'bg-zinc-800 text-white shadow-lg shadow-black/40'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            <item.icon size={11} />
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {/* Search Bar re-integrated */}
                    <div className="relative group" ref={searchRef}>
                        <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 shadow-xl transition-all focus-within:border-violet-500/50">
                            <Search className="w-3.5 h-3.5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search command..."
                                className="w-32 bg-transparent border-none outline-none ml-2 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:w-48 transition-all duration-300"
                                value={searchTerm}
                                onChange={e => handleSearchChange(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        onClick={() => setShowYield(!showYield)}
                        className={`p-2 rounded-xl border transition-all duration-300 ${showYield ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-zinc-900 border-zinc-800 text-emerald-400 hover:border-emerald-500/50'}`}
                    >
                        <TrendingUp className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <main className="module-body z-0 relative">
                {['grid', 'floorplan'].includes(view) && (
                    <div className="flex items-center justify-between mb-2">
                        {/* Premium Stats Pill */}
                        <div className="flex bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-1 shadow-lg">
                            <div className="flex items-center gap-3 px-5 py-2.5 hover:bg-zinc-800/50 rounded-xl transition cursor-default">
                                <div className="p-1.5 bg-violet-500/10 rounded-lg"><Users className="w-4 h-4 text-violet-400" /></div>
                                <div>
                                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">In-House</div>
                                    <div className="text-sm font-black text-white">{stats.inHouseCount}</div>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-zinc-800 my-auto mx-2" />
                            <div className="flex items-center gap-3 px-5 py-2.5 hover:bg-zinc-800/50 rounded-xl transition cursor-default">
                                <div className="p-1.5 bg-teal-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-teal-400" /></div>
                                <div>
                                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Occupancy</div>
                                    <div className="text-sm font-black text-white">{stats.occupancy}%</div>
                                </div>
                            </div>
                        </div>

                        {/* Floor Selector (Glass Pill) */}
                        <div className="flex items-center p-1 bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl shadow-lg">
                            <div className="px-4 border-r border-zinc-800 flex items-center gap-2">
                                <Map className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Floor Focus</span>
                            </div>
                            <div className="flex gap-1 px-1 overflow-x-auto scrollbar-hide py-1">
                                <button
                                    onClick={() => setSelectedFloor('all')}
                                    className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${selectedFloor === 'all' ? 'bg-zinc-700 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                                >
                                    Global
                                </button>
                                {stats.floors.map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setSelectedFloor(f)}
                                        className={`min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${selectedFloor === f ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


                {view === 'livebi' && (
                    <div className="flex-1 min-h-[600px] flex flex-col bg-zinc-950/20 backdrop-blur-xl rounded-[40px] border border-zinc-800 overflow-hidden shadow-2xl animate-fadeIn m-8">
                        {/* Oracle Query Bar */}
                        <div className="p-8 border-b border-zinc-800 bg-zinc-900/20">
                            <div className="flex items-center gap-4 max-w-4xl">
                                <div className="p-3 bg-amber-600/10 rounded-2xl border border-amber-500/20 text-amber-500">
                                    <OracleIcon className={`w-6 h-6 ${isBiLoading ? 'animate-pulse' : ''}`} />
                                </div>
                                <input
                                    type="text"
                                    className="flex-1 bg-zinc-900/50 border border-zinc-700/50 rounded-2xl px-6 py-4 text-sm text-zinc-100 outline-none focus:border-amber-500 transition-all placeholder:text-zinc-600 font-medium"
                                    placeholder="Ask Oracle: 'What is our occupancy forecast?' or 'Show revenue by market segment'..."
                                    value={biQuery}
                                    onChange={(e) => setBiQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleBIQuery()}
                                />
                                <button
                                    onClick={handleBIQuery}
                                    disabled={isBiLoading}
                                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-bold px-8 py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-amber-900/20"
                                >
                                    {isBiLoading ? 'Calculating...' : 'Ask Oracle'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 relative">
                            <ReportEngine
                                key={`${biConfig.dim}-${biConfig.met}-${biConfig.chart}-${biConfig.isPredictive}`}
                                title={biConfig.isPredictive ? "AI Property Demand Forecast" : "Property Intelligence Platform"}
                                data={reservations}
                                dimensions={propertyDimensions}
                                metrics={propertyMetrics}
                                defaultDimension={biConfig.dim}
                                defaultMetric={biConfig.met}
                                defaultChartType={biConfig.chart}
                                projectedData={biConfig.isPredictive ? forecastSummary?.monthlyForecast : undefined}
                                insights={biConfig.isPredictive ? forecastSummary?.insights : undefined}
                            />
                        </div>
                    </div>
                )}
                {view === 'grid' && (
                    <div className="p-8 pb-32 h-full overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 auto-rows-max">
                            {filteredRooms.map((room) => {
                                const res = reservations.find(r => r.roomId === room.id && (r.status === ReservationStatus.CHECKED_IN || r.status === ReservationStatus.CONFIRMED));
                                const type = ROOM_TYPES.find(t => t.id === room.typeId);
                                const guest = res ? guests.find(g => g.principal === res.guestId) : null;
                                const isArrival = res?.status === ReservationStatus.CONFIRMED;

                                // Base status mapping for visual style
                                const isDirty = room.status.includes('Dirty');
                                const isReady = room.status === RoomStatus.CLEAN_READY;

                                return (
                                    <div
                                        key={room.id}
                                        onClick={() => handleRoomClick(room)}
                                        className={`group relative h-32 rounded-2xl border p-4 flex flex-col justify-between cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isReady ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)]' :
                                            isDirty ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50 hover:shadow-[0_10px_30px_rgba(244,63,94,0.15)]' :
                                                'bg-zinc-900/60 backdrop-blur-sm border-zinc-700/50 hover:border-violet-500/50 hover:shadow-[0_10px_30px_rgba(139,92,246,0.15)]'
                                            }`}
                                    >
                                        {/* Subtle internal gradient glow */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        <div className="relative z-10 flex justify-between items-start">
                                            <span className="text-2xl font-black tracking-tight text-white drop-shadow-md">{room.number}</span>
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${isReady ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                                                    isDirty ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                                                        'text-zinc-400 bg-zinc-800/50 border-zinc-700'
                                                    }`}>
                                                    {room.status.split('/')[0]}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative z-10 mt-auto">
                                            <div className="text-[10px] text-zinc-400 font-medium mb-2 truncate max-w-[80%]">{type?.name}</div>
                                            {guest ? (
                                                <div className="flex items-center gap-2.5 p-1.5 -mx-1.5 rounded-lg hover:bg-white/5 transition-colors">
                                                    <div className={`shrink-0 w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold border shadow-inner ${isArrival ? 'bg-teal-500/10 text-teal-400 border-teal-500/30' : 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                                                        }`}>
                                                        {guest.fullName[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-zinc-200 truncate">{guest.fullName}</div>
                                                        <div className="text-[9px] font-medium text-zinc-500 uppercase flex items-center gap-1">
                                                            {isArrival ? <LogIn className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                                                            {isArrival ? 'Arriving' : 'In-House'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs font-medium text-zinc-600 flex items-center gap-2 px-1 py-2">
                                                    <BedDouble className="w-4 h-4 opacity-50" /> Vacant Ready
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                {view === 'list' && renderReservationList()}
                {view === 'floorplan' && renderFloorPlan()}
                {view === 'guests' && renderGuestDirectory()}
                {view === 'reports' && renderReports()}
                {view === 'roomplan' && renderRoomPlan()}
                {view === 'blocks' && renderBusinessBlocks()}
                {view === 'arrivals' && renderArrivalsList()}
                {view === 'departures' && renderDeparturesList()}

            </main>

            {/* Application Modals — Rendered outside main's stacking context */}
            <ReservationEditorModal
                isOpen={editorModal.isOpen}
                onClose={() => setEditorModal({ isOpen: false, reservation: undefined })}
                onSave={handleSaveReservation}
                initialData={editorModal.reservation}
                guests={guests}
            />

            {/* Standard Footer */}
            <footer className="module-footer">
                <div className="flex items-center gap-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
                    <Activity className="w-3 h-3 text-emerald-500" /> System Active
                    <div className="h-4 w-[1px] bg-zinc-800" />
                    <span>User: Front_Office_Lead</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-[9px] text-zinc-500 uppercase font-medium">Singularity Grand • PMS Engine V4</div>
                </div>
            </footer>
        </div>
    );
};

export default FrontDesk;
