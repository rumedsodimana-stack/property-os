import React, { useState, useEffect } from 'react';
import { PosOrder, Outlet } from '../../types';
import { updateItem, addItem } from '../../services/kernel/firestoreService';
import { usePms } from '../../services/kernel/persistence';
import { Monitor, Plus, ChefHat, Wine, LayoutGrid, Users, Clock, ChevronDown, User, DollarSign } from 'lucide-react';
import OrderEntry from './OrderEntry';
import KDS from './KDS';
import { botEngine } from '../../services/kernel/systemBridge';

interface POSTerminalProps {
    onOpenTableMap?: () => void;
    openChecks: PosOrder[];
    setOpenChecks: React.Dispatch<React.SetStateAction<PosOrder[]>>;
}

const POSTerminal: React.FC<POSTerminalProps> = ({ onOpenTableMap, openChecks, setOpenChecks }) => {
    const { outlets: OUTLETS } = usePms();
    const [activeOutlet, setActiveOutlet] = useState<string>('');

    // Set initial outlet when loaded
    useEffect(() => {
        if (OUTLETS.length > 0 && !activeOutlet) {
            setActiveOutlet(OUTLETS[0].id);
        }
    }, [OUTLETS, activeOutlet]);

    const [isShiftOpen, setIsShiftOpen] = useState(false);
    const [currentShiftId, setCurrentShiftId] = useState('');

    const handleClockIn = async () => {
        const shiftId = `shift_${Date.now()}`;
        await addItem('shifts', {
            id: shiftId,
            userId: 'Staff_001',
            outletId: activeOutlet,
            startTime: Date.now(),
            status: 'Open',
            declaredCash: 0
        } as any);
        setIsShiftOpen(true);
        setCurrentShiftId(shiftId);
        botEngine.logActivity('POS', 'SHIFT_STARTED', `Server Started Shift in ${currentOutlet?.name}`, 'Server');
    };

    const handleClockOut = async () => {
        if (!currentShiftId) return;
        await updateItem('shifts', currentShiftId, {
            endTime: Date.now(),
            status: 'Closed'
        });
        setIsShiftOpen(false);
        setCurrentShiftId('');
        botEngine.logActivity('POS', 'SHIFT_ENDED', `Server Ended Shift in ${currentOutlet?.name}`, 'Server');
    };

    const [view, setView] = useState<'terminal' | 'kds' | 'bar'>('terminal');
    const [showCheckWizard, setShowCheckWizard] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [tableNumber, setTableNumber] = useState('');
    const [guestCount, setGuestCount] = useState('');
    const [selectedCheck, setSelectedCheck] = useState<PosOrder | null>(null);
    const [pickUpCheckNumber, setPickUpCheckNumber] = useState('');
    const [showOutletDropdown, setShowOutletDropdown] = useState(false);

    const currentOutlet = OUTLETS.find(o => o.id === activeOutlet);

    const handleBeginCheck = () => {
        setShowCheckWizard(true);
        setWizardStep(1);
        setTableNumber('');
        setGuestCount('');
    };

    const handleBeginCheckByTableMap = () => {
        if (onOpenTableMap) {
            onOpenTableMap();
        } else {
            alert('Table Map integration - Select table from layout');
        }
    };

    const handleWizardNext = () => {
        if (wizardStep === 1 && tableNumber) {
            setWizardStep(2);
        } else if (wizardStep === 2 && guestCount) {
            createNewCheck();
        }
    };

    const createNewCheck = () => {
        const checkNumber = `CHK${Date.now().toString().slice(-6)}`;
        const newCheck: PosOrder = {
            id: `order_${Date.now()}`,
            outletId: activeOutlet,
            tableId: `table_${tableNumber}`,
            items: [],
            status: 'Sent',
            total: 0,
            subtotal: 0,
            discountAmount: 0,
            timestamp: Date.now(),
            guestCount: parseInt(guestCount),
            orderType: 'DineIn',
            serverId: 'Staff_001',
            openedBy: 'Current User'
        };

        addItem('posOrders', newCheck);
        setOpenChecks(prev => [...prev, newCheck]);
        setSelectedCheck(newCheck);
        setShowCheckWizard(false);
        setWizardStep(1);

        botEngine.logActivity('POS', 'CHECK_CREATED', `Check ${checkNumber} - Table ${tableNumber} - ${guestCount} guests`, 'Server');
    };

    const handlePickUpCheck = () => {
        if (!pickUpCheckNumber) return;

        const check = openChecks.find(c => c.id.includes(pickUpCheckNumber) || c.id.slice(-6) === pickUpCheckNumber);
        if (check) {
            setSelectedCheck(check);
            setPickUpCheckNumber('');
        } else {
            alert(`Check ${pickUpCheckNumber} not found`);
        }
    };

    const handleCheckClick = (check: PosOrder) => {
        setSelectedCheck(check);
    };

    const handleCloseCheck = () => {
        setSelectedCheck(null);
    };

    const handleSendToKitchen = (items: any[], discount?: any) => {
        if (!selectedCheck) return;

        const total = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

        const updatedCheck: PosOrder = {
            ...selectedCheck,
            items: items.map(i => ({ ...i, status: 'Sent' as any, firedAt: Date.now() })),
            total: total,
            subtotal: total,
            status: 'Sent'
        };

        // Update open checks in parent state (if provided)
        setOpenChecks(prev => prev.map(c => c.id === updatedCheck.id ? updatedCheck : c));
        updateItem('posOrders', updatedCheck.id, updatedCheck);

        botEngine.logActivity('POS', 'ORDER_FIRED', `Order fired for Check #${updatedCheck.id.slice(-6)} - Table ${selectedCheck.tableId?.split('_')[1]}`, 'Server');

        // Close order entry and return to terminal
        setSelectedCheck(null);
        setView('terminal');
    };

    const handleSettleCheck = async (checkId: string, paymentDetails?: any) => {
        // Mark as paid and merge payment details (method, tips, tendered, etc)
        const settlementData = {
            status: 'Paid' as any,
            ...paymentDetails,
            settlementTimestamp: Date.now(),
            auditLog: [...(openChecks.find(c => c.id === checkId)?.auditLog || []), {
                action: 'PAYMENT_RECEIVED',
                by: 'Current_Staff',
                timestamp: Date.now(),
                details: `${paymentDetails?.type} payment - Total: ${openChecks.find(c => c.id === checkId)?.total || 0}`
            }]
        };

        setOpenChecks(prev => prev.map(c =>
            c.id === checkId ? {
                ...c,
                ...settlementData
            } : c
        ));

        // Persist to Database so Reports can see it
        await updateItem('posOrders', checkId, settlementData);

        setSelectedCheck(null);
        botEngine.logActivity('POS', 'CHECK_SETTLED', `Check #${checkId.slice(-6)} settled via ${paymentDetails?.type || 'Unknown'}`, 'Server');
    };

    const handleCompleteOrder = (orderId: string) => {
        setOpenChecks(prev => prev.map(c =>
            c.id === orderId ? { ...c, status: 'Ready' as any } : c
        ));
        updateItem('posOrders', orderId, { status: 'Ready' });
        botEngine.logActivity('POS', 'ORDER_READY', `Order #${orderId.slice(-6)} marked as Ready`, 'Kitchen');
    };

    const getCheckStatus = (check: PosOrder): { label: string; color: string } => {
        if (check.status === 'Ready') return { label: 'Ready', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' };
        if (check.items.length === 0) return { label: 'Open', color: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30' };
        if (check.items.every(i => i.status === 'Sent')) return { label: 'Fired', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
        if (check.items.some(i => i.status === 'Sent')) return { label: 'Partial', color: 'bg-violet-500/10 text-violet-400 border-violet-500/30' };
        return { label: 'Open', color: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30' };
    };

    const getCheckTotal = (check: PosOrder): number => {
        return check.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    };

    const getElapsedTime = (timestamp: number): string => {
        const elapsed = Math.floor((Date.now() - timestamp) / 60000);
        return elapsed < 60 ? `${elapsed}m` : `${Math.floor(elapsed / 60)}h ${elapsed % 60}m`;
    };

    // Filter checks for current outlet
    const outletChecks = openChecks.filter(c => c.outletId === activeOutlet);

    console.log('[POSTerminal] Rendering with', { activeOutlet, view, outletChecks: outletChecks.length });

    return (
        <div className="flex flex-col w-full">
            {/* POS Terminal Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-600/10 rounded-2xl border border-amber-500/20">
                        <Monitor className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-light text-white tracking-tight">POS Terminal</h2>
                        <div className="text-xs text-zinc-500">
                            {currentOutlet?.name} • {currentOutlet?.seatingCapacity} seats
                        </div>
                    </div>
                </div>

                {/* Navigation: Terminal → Kitchen → Bar → Outlet */}
                <div className="flex items-center gap-2">

                    {/* Shift Controls */}
                    <div className="flex items-center gap-2 mr-4">
                        {!isShiftOpen ? (
                            <button onClick={handleClockIn} className="px-4 py-2 bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-xs font-bold transition flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Clock In
                            </button>
                        ) : (
                            <button onClick={handleClockOut} className="px-4 py-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 border border-red-500/30 rounded-lg text-xs font-bold transition flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Clock Out
                            </button>
                        )}
                    </div>

                    {/* View Navigation */}
                    <div className="flex items-center bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
                        {[
                            { id: 'terminal', label: 'Terminal', icon: Monitor },
                            { id: 'kds', label: 'Kitchen Display', icon: ChefHat },
                            { id: 'bar', label: 'Bar Display', icon: Wine }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setView(item.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${view === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Outlet Selector - At the END */}
                    <div className="relative">
                        <button
                            onClick={() => setShowOutletDropdown(!showOutletDropdown)}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white hover:border-violet-500/50 transition"
                        >
                            <span className="font-bold text-xs">{currentOutlet?.name}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${showOutletDropdown ? 'rotate-180' : ''}`} />
                        </button>
                        {showOutletDropdown && (
                            <div className="absolute top-full right-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl shadow-2xl z-50 min-w-[220px] overflow-hidden">
                                <div className="px-4 py-2 text-[10px] text-zinc-500 uppercase font-bold bg-zinc-950/50 border-b border-zinc-800">
                                    Select Outlet
                                </div>
                                {OUTLETS.map(outlet => (
                                    <button
                                        key={outlet.id}
                                        onClick={() => {
                                            setActiveOutlet(outlet.id);
                                            setShowOutletDropdown(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 transition border-b border-zinc-800/50 last:border-0 ${activeOutlet === outlet.id ? 'bg-violet-600/10 text-violet-400' : 'text-zinc-300'
                                            }`}
                                    >
                                        <div className="font-bold">{outlet.name}</div>
                                        <div className="text-[10px] text-zinc-500">{outlet.type} • {outlet.seatingCapacity} seats</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {view === 'terminal' && (
                <>
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleBeginCheck}
                                className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-violet-900/20"
                            >
                                <Plus className="w-4 h-4" />
                                Begin Check
                            </button>

                            <button
                                onClick={handleBeginCheckByTableMap}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-sm font-bold text-white transition shadow-lg shadow-emerald-900/20"
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Begin Check by Table Map
                            </button>

                            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2">
                                <input
                                    type="text"
                                    placeholder="Check #"
                                    value={pickUpCheckNumber}
                                    onChange={(e) => setPickUpCheckNumber(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePickUpCheck()}
                                    className="bg-transparent text-sm text-white outline-none w-24"
                                />
                                <button
                                    onClick={handlePickUpCheck}
                                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold text-white transition"
                                >
                                    Pick Up
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Open Checks Grid - Card View */}
                    <div>
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            Open Checks ({outletChecks.length})
                        </h3>

                        {outletChecks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-zinc-600 border border-dashed border-zinc-800 rounded-2xl">
                                <Monitor className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-sm font-medium">No open checks</p>
                                <p className="text-xs mt-1">Press "Begin Check" to start a new order</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {outletChecks.map(check => {
                                    const status = getCheckStatus(check);
                                    const total = getCheckTotal(check);
                                    const elapsed = getElapsedTime(check.timestamp);

                                    return (
                                        <div
                                            key={check.id}
                                            onClick={() => handleCheckClick(check)}
                                            className="bg-zinc-900/50 border border-zinc-800 hover:border-violet-500/50 rounded-2xl p-5 cursor-pointer transition group hover:bg-zinc-900/80"
                                        >
                                            {/* Header: Check # + Status */}
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-mono font-bold text-violet-400">#{check.id.slice(-6)}</span>
                                                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase border ${status.color}`}>
                                                    {status.label}
                                                </div>
                                            </div>

                                            {/* Check Details */}
                                            <div className="space-y-3 mb-4">
                                                {/* Table Number */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                        <Monitor className="w-3 h-3" />
                                                        Table
                                                    </div>
                                                    <span className="text-sm font-bold text-white">{check.tableId?.split('_')[1] || 'N/A'}</span>
                                                </div>

                                                {/* Guests */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                        <Users className="w-3 h-3" />
                                                        Guests
                                                    </div>
                                                    <span className="text-sm font-bold text-white">{check.guestCount || 0}</span>
                                                </div>

                                                {/* Server/User */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                        <User className="w-3 h-3" />
                                                        Server
                                                    </div>
                                                    <span className="text-xs font-medium text-zinc-400">{check.openedBy || 'Staff'}</span>
                                                </div>

                                                {/* Time */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                        <Clock className="w-3 h-3" />
                                                        Time
                                                    </div>
                                                    <span className="text-xs font-mono text-zinc-400">{elapsed}</span>
                                                </div>
                                            </div>

                                            {/* Footer: Total */}
                                            <div className="pt-4 border-t border-zinc-800">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                        <DollarSign className="w-3 h-3" />
                                                        Total
                                                    </div>
                                                    <span className="text-xl font-bold text-white">{total.toFixed(2)}</span>
                                                </div>
                                                <div className="text-[10px] text-zinc-600 mt-1">
                                                    {check.items.length} items
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {view === 'kds' && (
                <KDS
                    orders={openChecks.filter(c => c.items.some(i => i.department === 'Food'))}
                    onCompleteOrder={handleCompleteOrder}
                />
            )}

            {view === 'bar' && (
                <KDS
                    orders={openChecks.filter(c => c.items.some(i => i.department === 'Beverage'))}
                    onCompleteOrder={handleCompleteOrder}
                    isBar={true}
                />
            )}

            {/* Check Wizard Modal */}
            {showCheckWizard && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 w-full max-w-md">
                        <h3 className="text-2xl font-light text-white mb-6">
                            {wizardStep === 1 ? 'Enter Table Number' : 'Number of Guests'}
                        </h3>

                        {wizardStep === 1 ? (
                            <input
                                type="text"
                                placeholder="Table Number"
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleWizardNext()}
                                autoFocus
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 text-2xl text-white text-center outline-none focus:border-violet-500 mb-6"
                            />
                        ) : (
                            <input
                                type="number"
                                placeholder="Guest Count"
                                value={guestCount}
                                onChange={(e) => setGuestCount(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleWizardNext()}
                                autoFocus
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4 text-2xl text-white text-center outline-none focus:border-violet-500 mb-6"
                            />
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCheckWizard(false)}
                                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold text-white transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleWizardNext}
                                disabled={wizardStep === 1 ? !tableNumber : !guestCount}
                                className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-30 rounded-xl text-sm font-bold text-white transition"
                            >
                                {wizardStep === 1 ? 'Next' : 'Create Check'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Entry Modal - Fixed to not overlap sidebar */}
            {selectedCheck && (
                <div className="fixed inset-0 z-[150] bg-zinc-950 overflow-auto">
                    <OrderEntry
                        table={{ id: selectedCheck.tableId || '', number: selectedCheck.tableId?.split('_')[1] || '', seats: selectedCheck.guestCount || 2, status: 'Occupied' }}
                        existingOrder={selectedCheck}
                        onClose={handleCloseCheck}
                        onSendToKitchen={handleSendToKitchen}
                        onSettle={handleSettleCheck}
                    />
                </div>
            )}
        </div>
    );
};

export default POSTerminal;
