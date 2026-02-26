import React from 'react';
import { PosOrder, OrderItem } from '../../types';
import { usePms } from '../../services/kernel/persistence';
import { Clock, CheckCircle, ChefHat, Martini, AlertCircle, Star, Crown, MapPin, RotateCcw, Sparkles } from 'lucide-react';

interface KDSProps {
  orders: PosOrder[];
  onCompleteOrder: (orderId: string) => void;
  onRefire?: (orderId: string) => void; // Refire order to kitchen
  isBar?: boolean;
}

const KDS: React.FC<KDSProps> = ({ orders, onCompleteOrder, onRefire, isBar = false }) => {
  const { outlets: OUTLETS } = usePms();
  // Filter only active orders
  const activeOrders = orders.filter(o => o.status === 'Sent');

  // Logic: Each display (Kitchen or Bar) should only show items relevant to it.
  // If an order has both food and beverage, it appears on both displays but only shows its relevant items.
  const targetDepartment = isBar ? 'Beverage' : 'Food';

  return (
    <div className="h-full flex flex-col animate-fadeIn bg-transparent">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
        {activeOrders.map(order => {
          // Filter items based on the department for THIS specific display
          const filteredItems = (order.items || []).filter(i => i.department === targetDepartment || (targetDepartment === 'Food' && i.department === 'Amenity'));

          if (filteredItems.length === 0) return null;

          const elapsedMinutes = Math.floor((Date.now() - order.timestamp) / 60000);
          const isAmenity = order.items.some(i => i.department === 'Amenity');
          const outletName = OUTLETS.find(o => o.id === order.outletId)?.name || 'Unknown Outlet';

          let statusBorder = 'border-zinc-800/50';
          let timeColor = 'text-zinc-500';
          let bgClass = 'bg-zinc-900/40';

          if (isAmenity) {
            statusBorder = 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]';
            bgClass = 'bg-gradient-to-b from-amber-950/20 to-zinc-900/40';
          } else {
            if (elapsedMinutes > 15) {
              statusBorder = 'border-amber-500/50';
              timeColor = 'text-amber-500';
            }
            if (elapsedMinutes > 25) {
              statusBorder = 'border-rose-500/50';
              timeColor = 'text-rose-500';
            }
          }

          return (
            <div key={order.id} className={`${bgClass} border ${statusBorder} rounded-3xl backdrop-blur-md flex flex-col min-h-[350px] transition-all relative overflow-hidden group/card`}>

              {isAmenity && (
                <div className="absolute top-0 right-0 bg-amber-500 text-black text-[9px] font-black px-3 py-1.5 rounded-bl-2xl flex items-center gap-1 z-20">
                  <Crown className="w-3 h-3" /> VIP AMENITY
                </div>
              )}

              <div className="p-6 border-b border-zinc-800/50 bg-zinc-950/30 flex justify-between items-start relative overflow-hidden">
                <div className="relative z-10">
                  <div className="font-light text-2xl text-zinc-100 tracking-tight">
                    {order.roomId ? (
                      <span className="flex items-center gap-2">Room {order.roomId}</span>
                    ) : (
                      <span>Tbl {order.tableId?.replace('tbl_', '').split('_').pop()}</span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Order #{order.id.slice(-4)}</div>
                  {/* Outlet Tag */}
                  <div className="mt-3 flex items-center gap-2 text-[9px] text-zinc-400 bg-zinc-900/80 px-2.5 py-1 rounded-full w-fit border border-zinc-800">
                    <MapPin className="w-3 h-3" /> {outletName}
                  </div>
                </div>
                <div className={`flex flex-col items-end relative z-10`}>
                  <div className={`font-mono text-2xl font-light tracking-tighter ${timeColor}`}>{elapsedMinutes}m</div>
                  <div className="text-[9px] uppercase font-bold text-zinc-600 mt-1">Wait Time</div>
                </div>

                {/* Aesthetic background indicator */}
                <div className={`absolute top-0 left-0 w-1 h-full ${isAmenity ? 'bg-amber-500' : elapsedMinutes > 25 ? 'bg-rose-500' : elapsedMinutes > 15 ? 'bg-amber-500' : 'bg-emerald-500/30'}`} />
              </div>

              <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar">
                {filteredItems.map((item, idx) => (
                  <div key={idx} className={`flex justify-between items-start group/item p-3 rounded-xl transition-all ${item.status === 'New' ? 'bg-violet-500/10 border border-violet-500/30 animate-pulse' : ''}`}>
                    <div className="flex gap-4">
                      <span className={`font-bold text-xl font-mono ${isAmenity ? 'text-amber-400' : item.status === 'New' ? 'text-violet-400' : 'text-amber-500'}`}>{item.qty}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-100 text-lg font-light leading-snug">{item.name}</span>
                          {item.status === 'New' && (
                            <span className="text-[9px] bg-violet-500 text-white px-2 py-0.5 rounded-full font-black uppercase animate-bounce">NEW</span>
                          )}
                        </div>
                        {item.course && (
                          <div className="text-cyan-400 text-[10px] font-bold uppercase tracking-wider mt-1 bg-cyan-500/10 w-fit px-2 py-0.5 rounded border border-cyan-500/20">
                            Course: {item.course}
                          </div>
                        )}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <div className="text-rose-400 text-xs font-bold uppercase tracking-wider mt-1.5 bg-rose-500/10 w-fit px-2 py-0.5 rounded border border-rose-500/20">{item.modifiers.join(', ')}</div>
                        )}
                        {item.comment && (
                          <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mt-1.5 bg-emerald-500/10 w-fit px-2 py-0.5 rounded border border-emerald-500/20 italic flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> "{item.comment}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 space-y-2">
                {/* Refire Button */}
                {onRefire && (
                  <button
                    onClick={() => onRefire(order.id)}
                    className="w-full py-3 bg-zinc-900/80 border border-zinc-800 hover:bg-amber-600 hover:border-amber-500 hover:text-white text-zinc-500 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-3 h-3" /> Refire
                  </button>
                )}
                <button
                  onClick={() => onCompleteOrder(order.id)}
                  className="w-full py-4 bg-zinc-900/80 border border-zinc-800 hover:bg-emerald-600 hover:border-emerald-500 hover:text-white text-zinc-400 rounded-2xl transition-all duration-300 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg"
                >
                  <CheckCircle className="w-4 h-4" /> {isBar ? 'Complete Pour' : 'Ready for Expo'}
                </button>
              </div>
            </div>
          );
        })}

        {activeOrders.length === 0 && (
          <div className="col-span-full h-96 flex flex-col items-center justify-center text-zinc-700 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10">
            <div className="p-8 bg-zinc-900/30 rounded-full border border-zinc-800/50 mb-6">
              {isBar ? <Martini className="w-12 h-12 opacity-20" /> : <ChefHat className="w-12 h-12 opacity-20" />}
            </div>
            <p className="text-lg font-light text-zinc-500 tracking-wide uppercase font-bold text-sm">Station Clear: No Active Tickets</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KDS;
