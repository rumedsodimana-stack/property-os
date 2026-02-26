import React from 'react';
import { Table, PosOrder } from '../../types';
import { Users, Utensils, Clock, Martini } from 'lucide-react';

interface TableMapProps {
  tables: Table[];
  orders: PosOrder[];
  onTableClick: (tableId: string) => void;
  isBar?: boolean;
}

const TableMap: React.FC<TableMapProps> = ({ tables, orders, onTableClick, isBar = false }) => {
  const getStatusColor = (status: Table['status'], orderStatus?: PosOrder['status']) => {
    // Active Order (Sent/Served)
    if (orderStatus === 'Sent') return 'bg-amber-900/30 border-amber-500 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse-slow'; // Waiting/Prep
    if (orderStatus === 'Served') return 'bg-emerald-900/30 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]'; // Served/Active

    switch (status) {
      case 'Available': return 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 hover:bg-zinc-800';
      case 'Occupied': return 'bg-amber-900/20 border-amber-600/50 text-amber-500';
      case 'Dirty': return 'bg-rose-900/20 border-rose-900/50 text-rose-700';
      case 'Reserved': return 'bg-zinc-800 border-zinc-700 text-zinc-400';
      default: return 'bg-zinc-900 border-zinc-800 text-zinc-500';
    }
  };

  return (
    <div className="h-full">
      {isBar && (
        <div className="mb-6">
          <h3 className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
            <Martini className="w-4 h-4" /> Bar Seating & Tabs
          </h3>
        </div>
      )}

      <div className={isBar ? "module-grid-dense" : "module-grid"}>
        {tables.map(table => {
          // Look up order by currentOrderId first, then fallback to tableId
          let order = orders.find(o => o.id === table.currentOrderId);
          if (!order) {
            order = orders.find(o => o.tableId === table.id && o.status !== 'Paid' && o.status !== 'Void');
          }

          if (isBar) {
            // Bar Stool / Tab View
            return (
              <div
                key={table.id}
                onClick={() => onTableClick(table.id)}
                className={`aspect-[3/4] rounded-xl border flex flex-col items-center justify-between p-4 cursor-pointer transition-all hover:-translate-y-1 shadow-lg relative overflow-hidden ${getStatusColor(table.status, order?.status)}`}
              >
                <div className="w-full flex justify-between items-start">
                  <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">{table.status === 'Available' ? 'Open' : table.status}</span>
                  {order && <Clock className="w-3 h-3 opacity-70 animate-pulse" />}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className={`p-3 rounded-full backdrop-blur ${table.status === 'Occupied' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-950/50 text-zinc-600'}`}>
                    <Martini className="w-5 h-5" />
                  </div>
                  <div className="font-mono text-xl font-bold">{table.number}</div>
                </div>

                <div className="w-full text-center">
                  {order ? (
                    <div className="space-y-1">
                      <div className="text-[10px] text-violet-400 font-mono">Check #{order.id.slice(-6).toUpperCase()}</div>
                      <div className="text-sm font-bold">${order.total.toFixed(2)}</div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono opacity-60">No Tab</span>
                  )}
                </div>
              </div>
            );
          }

          // Restaurant Table View
          return (
            <div
              key={table.id}
              onClick={() => onTableClick(table.id)}
              className={`aspect-square rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all transform hover:scale-[1.02] shadow-xl relative overflow-hidden ${getStatusColor(table.status, order?.status)}`}
            >
              {/* Status Indicator */}
              <div className="absolute top-4 right-4 flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{table.status}</span>
              </div>

              <div className="text-6xl font-thin mb-3 opacity-90">{table.number}</div>

              <div className="flex items-center gap-2 text-sm opacity-60 font-medium">
                <Users className="w-4 h-4" />
                <span>{table.seats} Seats</span>
              </div>

              {order && (
                <div className="mt-4 flex flex-col items-center gap-1">
                  <div className="text-[10px] uppercase font-bold bg-zinc-950/50 backdrop-blur px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                    {order.status === 'Sent' ? <Clock className="w-3 h-3 animate-spin-slow" /> : <Utensils className="w-3 h-3" />}
                    <span>{order.status === 'Sent' ? 'Preparing' : 'Active'}</span>
                  </div>
                  <div className="text-[10px] text-violet-400 font-mono mt-1">Check #{order.id.slice(-6).toUpperCase()}</div>
                  <div className="text-sm font-light opacity-80">${order.total.toFixed(2)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableMap;