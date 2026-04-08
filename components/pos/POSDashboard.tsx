
import React, { useState, useRef, useEffect } from 'react';
import { CURRENT_PROPERTY, randomInt } from '../../services/kernel/config';
import { Table, PosOrder, OrderItem, Outlet, Ingredient, RecipeDraft, MasterInventoryItem } from '../../types';
import TableMap from './TableMap';
import TableMapView from './TableMapView';
import OrderEntry from './OrderEntry';
import KDS from './KDS';
import MenuEngineering from './MenuEngineering';
import POSTerminal from './POSTerminal';
import { LayoutGrid, MonitorPlay, RefreshCw, Beer, Utensils, ChevronDown, FilePenLine, Plus, Search, Scale, ChefHat, Save, ArrowRight, ScanBarcode, Trash2, FileBarChart, Wine, Printer, Download, Box, AlertCircle, Info, Clock, UtensilsCrossed, Zap, PlusSquare, CheckCircle, Activity, Monitor } from 'lucide-react';
import { botEngine } from '../../services/kernel/systemBridge';
import { useInspector } from '../../context/InspectorContext';
import Inspectable from '../shared/Inspectable';
import OracleWidget from '../shared/OracleWidget';
import FNBReports from './FNBReports';

import { updateItem, addItem } from '../../services/kernel/firestoreService';
import { seedDatabase } from '../../services/kernel/seeder';
import { reverseRoomCharge } from '../../services/operations/posToFolioService';
import { usePms } from '../../services/kernel/persistence';


const POSDashboard: React.FC = () => {
  const {
    tables, posOrders: orders, outlets, inventory: masterInventory, folios,
    loading
  } = usePms();

  // ─── ALL HOOKS MUST BE HERE BEFORE ANY EARLY RETURNS ───
  const [activeTab, setActiveTab] = useState<'Terminal' | 'TableMap' | 'MenuEng' | 'Inventory' | 'Reports'>('Terminal');
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [viewMode, setViewMode] = useState<'Grid' | 'List'>('Grid');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [manualTableNumber, setManualTableNumber] = useState('');
  const [showOutletDropdown, setShowOutletDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { inspect } = useInspector();

  useEffect(() => {
    if (outlets.length > 0 && !selectedOutlet) {
      setSelectedOutlet(outlets[0]);
    }
  }, [outlets, selectedOutlet]);

  console.log('[POSDashboard] Rendering with activeTab:', activeTab);

  // ─── NOW WE CAN HAVE EARLY RETURNS ───
  if (loading) return <div className="p-10 text-white animate-pulse">Loading POS...</div>;

  if (!selectedOutlet) return (
    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
      <div className="p-4 bg-zinc-900 rounded-full mb-4">
        <UtensilsCrossed className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">POS Setup Required</h3>
      <p className="max-w-md text-center text-xs">No outlets are currently configured for this property. Please initialize the F&B module/outlets to begin.</p>
    </div>
  );

  const handleReverseTransaction = async (orderId: string, reason: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (order.paymentMethod === 'RoomPost' && order.pmsTransactionId) {
      const result = await reverseRoomCharge(order.pmsTransactionId, reason, folios);
      if (!result.success) {
        alert(`Reversal Failed: ${result.error}`);
        return;
      }
    }

    // Update local order status
    updateItem('posOrders', orderId, {
      status: 'Void',
      voidReason: reason || 'Manager Reversal',
      voidedBy: 'Manager', // In real app, get current user
      auditLog: [...(order.auditLog || []), {
        action: 'ORDER_VOID',
        by: 'Manager',
        timestamp: Date.now(),
        details: `Reversed Transaction - Reason: ${reason}`
      }]
    });

    botEngine.logActivity('POS', 'Transaction_Reversed', `Order: ${orderId} reversed by Manager. Reason: ${reason}`, 'Manager');
    alert('Transaction Reversed Successfully');
  };

  const handleTableClick = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (table) setSelectedTable(table);
  };

  // Open an order directly - creates temporary table object if needed
  const handleOpenOrder = (order: PosOrder) => {
    let table = tables.find(t => t.id === order.tableId);
    if (!table) {
      // Create a temporary table object for walk-ins or orphaned orders
      table = {
        id: order.tableId || `temp_${order.id}`,
        number: order.tableId?.split('_').pop() || 'WI',
        seats: 4,
        status: 'Occupied' as const,
        currentOrderId: order.id
      };
    } else {
      // Ensure table has the currentOrderId set
      table = { ...table, currentOrderId: order.id };
    }
    setSelectedTable(table);
  };

  const handleBumpTicket = (orderId: string) => {
    updateItem('posOrders', orderId, { status: 'Ready' });
    botEngine.logActivity('POS', 'Order_Ready', `Order: ${orderId} - Ready for pickup`, 'F&B_Expeditor');
  };

  const handleSendOrder = (items: OrderItem[], discountInfo?: { type: 'Percent' | 'Amount', value: number }) => {
    if (!selectedTable && selectedOutlet.type !== 'RoomService') return;

    const existingOrderId = selectedTable?.currentOrderId;
    const subtotal = items.reduce((acc, i) => acc + (i.price * i.qty), 0);

    // Calculate discount
    let discountAmount = 0;
    if (discountInfo) {
      if (discountInfo.type === 'Percent') {
        discountAmount = subtotal * (discountInfo.value / 100);
      } else {
        discountAmount = Math.min(subtotal, discountInfo.value);
      }
    }

    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * CURRENT_PROPERTY.taxRate;
    const total = taxableAmount + tax;

    if (existingOrderId) {
      // Update existing order - preserve existing items that are already sent
      const existingOrder = orders.find(o => o.id === existingOrderId);
      const previousItems = existingOrder?.items || [];

      // Mark new items (items not previously sent)
      const updatedItems = items.map(item => {
        const wasAlreadySent = previousItems.some(p => p.menuItemId === item.menuItemId && p.status === 'Sent');
        return {
          ...item,
          status: wasAlreadySent ? 'Sent' : 'New' // Mark as New if not previously sent
        };
      });

      updateItem('posOrders', existingOrderId, {
        items: updatedItems,
        subtotal,
        discountAmount,
        discountType: discountInfo?.type,
        discountValue: discountInfo?.value,
        total,
        status: 'Sent',
        timestamp: Date.now()
      });
      botEngine.logActivity('POS', 'Order_Updated', `Table: ${selectedTable?.number} | Discount: ${discountAmount > 0 ? discountAmount.toFixed(2) : 'None'}`);
    } else {
      const orderId = `po_${Date.now()}`;
      const newOrder: PosOrder = {
        id: orderId,
        outletId: selectedOutlet.id,
        tableId: selectedTable?.id,
        items: items.map(item => ({ ...item, status: 'New' })),
        status: 'Sent',
        subtotal: subtotal,
        discountAmount,
        discountType: discountInfo?.type,
        discountValue: discountInfo?.value,
        total: total,
        timestamp: Date.now(),
        connectSection: selectedOutlet.type === 'RoomService' ? 'IRD' : 'Standard'
      };

      addItem('posOrders', newOrder).then((docRef) => {
        if (selectedTable) {
          updateItem('tables', selectedTable.id, {
            status: 'Occupied',
            currentOrderId: docRef.id || orderId
          });
        }
      });
      botEngine.logActivity('POS', 'Order_Fired', `Outlet: ${selectedOutlet.name}`);
    }

    setSelectedTable(null);
  };

  const handlePayment = (orderId: string, details: any) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    updateItem('posOrders', orderId, {
      status: 'Paid',
      paymentMethod: details.type,
      cardType: details.card,
      tips: details.tips || 0,
      pmsTransactionId: details.pmsTransactionId,
      roomId: details.roomId,
      settlementTimestamp: Date.now(),
      auditLog: [...(order.auditLog || []), {
        action: 'PAYMENT_RECEIVED',
        by: 'Current_Staff',
        timestamp: Date.now(),
        details: `${details.type} payment - Total: ${order.total}, Tips: ${details.tips || 0}`
      }]
    });

    if (order.tableId) {
      updateItem('tables', order.tableId, {
        status: 'Available',
        currentOrderId: null,
        serverId: null,
        guestCount: null
      });
    }

    setSelectedTable(null);
    botEngine.logActivity('POS', 'Check_Settled', `${details.type} settlement for Order: ${orderId}`, 'F&B_Cashier');
  };

  // Refire order - resend to kitchen
  const handleRefire = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    updateItem('posOrders', orderId, {
      status: 'Sent',
      refireCount: (order.refireCount || 0) + 1,
      auditLog: [...(order.auditLog || []), {
        action: 'REFIRE',
        by: 'Current_Staff',
        timestamp: Date.now(),
        details: `Order refired - Count: ${(order.refireCount || 0) + 1}`
      }]
    });
    botEngine.logActivity('POS', 'Order_Refired', `Order: ${orderId} refired to kitchen`, 'F&B_Expeditor');
  };

  const handleManualOpen = () => {
    if (!manualTableNumber) return;
    const tableId = `tbl_${selectedOutlet.id}_${manualTableNumber}`;
    let table = tables.find(t => t.id === tableId || t.number.includes(manualTableNumber));
    if (table) {
      setSelectedTable(table);
    } else {
      const newTable: Table = {
        id: tableId,
        number: manualTableNumber.toUpperCase(),
        seats: 4,
        status: 'Available'
      };
      setSelectedTable(newTable);
    }
    setManualTableNumber('');
  };

  const renderOutletInventory = () => (
    <div className="module-grid animate-fadeIn">
      {masterInventory.filter(m => m.locations.some(l => l.locationId === selectedOutlet.id)).map(item => (
        <div key={item.id} onClick={() => inspect('inventory', item.id)} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 hover:border-amber-500/50 transition group cursor-pointer relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-zinc-100 font-bold group-hover:text-amber-500 transition leading-tight">{item.name}</h4>
              <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">{item.sku}</span>
            </div>
            <div className={`p-2.5 rounded-xl ${item.totalStock < item.reorderPoint ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-800/50 text-zinc-500'}`}>
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div className="flex justify-between text-xs mb-3">
            <span className="text-zinc-500 uppercase font-bold text-[9px]">Local Stock</span>
            <span className={`font-mono font-bold ${item.totalStock < item.reorderPoint ? 'text-rose-400' : 'text-zinc-200'}`}>
              {item.locations.find(l => l.locationId === selectedOutlet.id)?.stock} {item.unit}
            </span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
            <div className={`h-full transition-all duration-1000 ${item.totalStock < item.reorderPoint ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.min((item.totalStock / item.parLevel) * 100, 100)}%` }}></div>
          </div>
          <div className="text-[8px] text-zinc-600 uppercase font-bold text-right tracking-tighter">Par Level: {item.parLevel}</div>
        </div>
      ))}
    </div>
  );

  const renderIRDConnect = () => {
    // Show orders routed to IRD and active Guest Requests
    const irdOrders = orders.filter(o => o.connectSection === 'IRD' || o.outletId === 'out_ird');
    return (
      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-8 animate-fadeIn h-full overflow-hidden">
        {/* IRD Order Stream */}
        <div className="2xl:col-span-8 overflow-y-auto scrollbar-hide">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-500" /> In-Room Dining Stream
          </h3>
          <KDS orders={irdOrders} onCompleteOrder={handleBumpTicket} onRefire={handleRefire} />
        </div>
        {/* Special Requests / Connect Panel */}
        <div className="2xl:col-span-4 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 flex flex-col">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-500" /> Connect Requests
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-2xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-500 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">ROOM {100 + i}</span>
                  <span className="text-[9px] text-zinc-600 font-mono">14:5{i}</span>
                </div>
                <p className="text-sm text-zinc-300">"Guest requesting set of extra pillows and fresh cutlery for order #{randomInt(1000, 9999)}."</p>
              </div>
            ))}
          </div>
          <button className="mt-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-violet-900/20">
            Acknowledge All
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="module-container bg-transparent flex flex-col h-full overflow-hidden">
      {/* Standardized Singularity Header Layout */}
      <header className="module-header glass-panel flex items-center justify-between flex-nowrap">
        {/* Left: Module Title */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="p-3 bg-violet-600/10 rounded-2xl border border-violet-500/20">
            <Utensils className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h2 className="text-2xl font-light text-white tracking-tight leading-none">Point of Sale</h2>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">{selectedOutlet?.name || 'No Outlet'} • Active</div>
          </div>
        </div>

        {/* Right: Sub-Menu (Tabs + Reports) + Search */}
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide flex-nowrap ml-auto">
          {/* Sub-menu */}
          <div className="flex items-center bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 flex-nowrap">
            {[
              { id: 'Terminal', label: 'POS' },
              { id: 'TableMap', label: 'Table Map' },
              { id: 'MenuEng', label: 'R&D' },
              { id: 'Inventory', label: 'Inventory' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`min-w-[90px] px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === tab.id ? 'bg-zinc-800 text-white shadow-xl shadow-black/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab.label}
              </button>
            ))}
            {/* Reports at the end of sub-menu */}
            <button
              onClick={() => setActiveTab('Reports')}
              className={`min-w-[90px] px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'Reports' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Reports
            </button>
          </div>

          {/* Secondary Actions & Search */}
          <div className="flex items-center gap-4">

            {/* Search Bar (At the last) */}
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl flex items-center px-3 py-1.5 focus-within:border-violet-500/50 transition-all">
              <Search className="w-3.5 h-3.5 text-zinc-500 mr-2" />
              <input
                type="text"
                placeholder="Search Database..."
                value={activeTab === 'TableMap' ? manualTableNumber : ""}
                onChange={(e) => activeTab === 'TableMap' && setManualTableNumber(e.target.value)}
                className="bg-transparent border-none text-[10px] text-zinc-300 w-32 focus:ring-0 outline-none p-0"
                onKeyDown={(e) => e.key === 'Enter' && activeTab === 'TableMap' && handleManualOpen()}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="module-body">
        {selectedTable && (
          <div className="fixed inset-0 z-[200]">
            <OrderEntry
              table={selectedTable}
              existingOrder={orders.find(o => o.id === selectedTable.currentOrderId)}
              onClose={() => setSelectedTable(null)}
              onSendToKitchen={handleSendOrder}
              onSettle={handlePayment}
              isBar={selectedOutlet.type === 'Bar'}
            />
          </div>
        )}

        {activeTab === 'Terminal' && (
          <POSTerminal
            openChecks={orders.filter(o => o.status !== 'Paid' && o.status !== 'Void')}
            setOpenChecks={() => { }}
          />
        )}

        {activeTab === 'TableMap' && (
          <TableMapView
            selectedOutlet={selectedOutlet}
            onOutletChange={setSelectedOutlet}
          />
        )}

        {activeTab === 'MenuEng' && (
          <MenuEngineering onBack={() => setActiveTab('Terminal')} />
        )}

        {activeTab === 'Inventory' && renderOutletInventory()}

        {activeTab === 'Reports' && (
          <FNBReports
            orders={orders}
            selectedOutlet={selectedOutlet}
            onReverse={handleReverseTransaction}
          />
        )}
      </main>
      <footer className="module-footer">
        <div className="flex items-center gap-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">
          <Activity className="w-3 h-3 text-emerald-500" /> POS Terminals Online
          <div className="h-4 w-[1px] bg-zinc-800" />
          <span>User: FNB_Manager_01</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[9px] text-zinc-500 uppercase font-medium">Singularity Grand • F&B Engine</div>
        </div>
      </footer>
    </div >
  );
};

export default POSDashboard;
