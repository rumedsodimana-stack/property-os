import React, { useState, useEffect } from 'react';
import { MenuItem, OrderItem, PosOrder, Table } from '../../types';
import { CURRENT_PROPERTY } from '../../services/kernel/config';
import { usePms } from '../../services/kernel/persistence';
import { Search, Plus, Minus, Trash2, Send, CreditCard, Sparkles, ChefHat, ArrowLeft, Wine, Coffee, Cake, UtensilsCrossed, Percent, Banknote, Smartphone, Home, CheckCircle, ChevronRight, X } from 'lucide-react';
import { deductInventoryForOrder } from '../../services/operations/fnbService';
import { updateItem } from '../../services/kernel/firestoreService';
import { botEngine } from '../../services/kernel/systemBridge';
import { validateRoomCharge, postOrderToFolio } from '../../services/operations/posToFolioService';

interface OrderEntryProps {
  table: Table;
  existingOrder?: PosOrder;
  onClose: () => void;
  onSendToKitchen: (items: OrderItem[], discountInfo?: { type: 'Percent' | 'Amount', value: number }) => void;
  onSettle?: (orderId: string, method: any) => void;
  isBar?: boolean;
}

const OrderEntry: React.FC<OrderEntryProps> = ({ table, existingOrder, onClose, onSendToKitchen, onSettle, isBar = false }) => {
  const { menuItems: MENU_ITEMS, recipeDrafts: RECIPE_DRAFTS, rooms, reservations, folios, outlets } = usePms();
  const [currentItems, setCurrentItems] = useState<OrderItem[]>(existingOrder ? existingOrder.items : []);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpsell, setShowUpsell] = useState<MenuItem | null>(null);
  const [showSettlement, setShowSettlement] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [splitWays, setSplitWays] = useState(1);

  // Discount State
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState<'Percent' | 'Amount'>('Percent');
  const [discountValue, setDiscountValue] = useState(0);

  useEffect(() => {
    if (existingOrder) {
      setCurrentItems(existingOrder.items);
    }
  }, [existingOrder]);

  const categories = ['All', 'Starter', 'Main', 'Dessert', 'Beverage', 'Amenity'];
  const filteredItems = MENU_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    // Filter for bar mode if needed
    const matchesBar = isBar ? item.department === 'Beverage' || item.category === 'Starter' : true;
    return matchesCategory && matchesSearch && matchesBar;
  });

  const calculateDiscount = () => {
    if (discountType === 'Percent') {
      return (subtotal * discountValue) / 100;
    }
    return discountValue;
  };

  const subtotal = currentItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = calculateDiscount();
  const total = subtotal - discountAmount;

  const handleAddItem = (item: MenuItem) => {
    const existing = currentItems.find(i => i.menuItemId === item.id);
    // Map menu category to course
    const course = item.category === 'Starter' ? 'Starter' :
      item.category === 'Main' ? 'Main' :
        item.category === 'Dessert' ? 'Dessert' :
          item.category === 'Beverage' ? 'Beverage' : undefined;

    // F&B Cost Calculation
    const recipe = RECIPE_DRAFTS.find(r => r.menuItemId === item.id);
    const foodCost = recipe ? recipe.totalCost : item.price * 0.3; // Fallback to 30%
    const grossProfit = item.price - foodCost;
    const foodCostPct = (foodCost / item.price) * 100;

    if (existing && existing.status !== 'Sent') {
      // Only increment quantity if not already sent to kitchen
      setCurrentItems(currentItems.map(i => i.menuItemId === item.id ? { ...i, qty: i.qty + 1 } : i));
    } else if (existing && existing.status === 'Sent') {
      // If already sent, add as new line item
      setCurrentItems([...currentItems, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
        department: item.department,
        course: course as any,
        status: 'New',
        foodCost,
        grossProfit,
        foodCostPct
      }]);
    } else {
      setCurrentItems([...currentItems, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        qty: 1,
        department: item.department,
        course: course as any,
        status: 'New',
        foodCost,
        grossProfit,
        foodCostPct
      }]);
      if (item.category === 'Main' && Math.random() > 0.5) {
        const dessert = MENU_ITEMS.find(m => m.category === 'Dessert');
        if (dessert) setShowUpsell(dessert);
      }
    }
  };

  const handleRemoveItem = (itemId: string) => {
    const item = currentItems.find(i => i.menuItemId === itemId);
    if (!item) return;

    if (item.status === 'Sent') {
      alert("Cannot remove sent items. Please use Void function.");
      return;
    }

    if (item.qty > 1) {
      setCurrentItems(currentItems.map(i => i.menuItemId === itemId ? { ...i, qty: i.qty - 1 } : i));
    } else {
      setCurrentItems(currentItems.filter(i => i.menuItemId !== itemId));
    }
  };

  const handleVoidItem = (itemId: string) => {
    const reason = prompt("Enter void reason:");
    if (reason) {
      setCurrentItems(currentItems.map(i =>
        i.menuItemId === itemId ? { ...i, status: 'Void', voidReason: reason, voidedBy: 'Manager' } : i
      ));
      botEngine.logActivity('POS', 'VOID_ITEM', `Voided ${itemId} - Reason: ${reason}`, 'Manager');
    }
  };

  const handleFireOrder = () => {
    const newItems = currentItems.filter(i => i.status === 'New');
    if (newItems.length === 0) return;

    onSendToKitchen(currentItems, { type: discountType, value: discountValue });
    botEngine.logActivity('POS', 'ORDER_FIRED', `Table ${table.number} - ${newItems.length} items sent to kitchen`, 'Server');
    onClose();
  };

  // --- SETTLEMENT HANDLERS ---

  const handleRoomPost = async () => {
    if (!existingOrder) return;

    const roomNumber = prompt("Enter Room Number:");
    if (!roomNumber) return;

    try {
      // Validate Room Charge
      const validation = validateRoomCharge(roomNumber, rooms, reservations, folios);

      if (!validation.isValid) {
        alert(`❌ Room Charge Failed: ${validation.error}`);
        return;
      }

      // Deduct Inventory
      await deductInventoryForOrder({ ...existingOrder, items: currentItems }, RECIPE_DRAFTS);

      // Post to PMS
      const result = await postOrderToFolio(existingOrder, roomNumber, rooms, reservations, folios, outlets);

      if (result.success) {
        if (onSettle) {
          onSettle(existingOrder.id, {
            type: 'RoomPost',
            roomId: roomNumber,
            amount: (total / splitWays) + tipAmount,
            tips: tipAmount,
            pmsTransactionId: result.pmsTransactionId
          });
        }
        alert(`✅ Posted to Room ${roomNumber}\nFolio Balance: ${CURRENT_PROPERTY.currency} ${result.folioBalance?.toFixed(2)}`);
        setShowSettlement(false);
        onClose();
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleCardPayment = (cardType: 'Visa' | 'MasterCard' | 'Amex') => {
    if (!existingOrder) return;

    const finalAmount = (total / splitWays) + tipAmount;
    const authCode = `AUTH${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Simulate card terminal processing
    botEngine.logActivity('POS', 'CARD_PAYMENT_INIT', `Initiating ${cardType} payment for ${CURRENT_PROPERTY.currency} ${finalAmount.toFixed(2)}`, 'POS_Terminal');

    setTimeout(async () => {
      const success = Math.random() > 0.05; // 95% success rate

      if (success) {
        // Deduct Inventory
        await deductInventoryForOrder({ ...existingOrder, items: currentItems }, RECIPE_DRAFTS);

        if (onSettle) {
          onSettle(existingOrder.id, {
            type: 'Card',
            card: cardType,
            tips: tipAmount,
            authCode,
            amount: finalAmount
          });
        }

        botEngine.logActivity('POS', 'CARD_PAYMENT_SUCCESS', `${cardType} payment approved - Auth: ${authCode} - Amount: ${finalAmount.toFixed(2)}`, 'POS_Terminal', 'SUCCESS');
        alert(`✓ Payment Approved\n\n${cardType} - ${CURRENT_PROPERTY.currency} ${finalAmount.toFixed(2)}\nAuth Code: ${authCode}\n\nReceipt printing...`);
        setShowSettlement(false);
        onClose();
      } else {
        botEngine.logActivity('POS', 'CARD_PAYMENT_DECLINED', `${cardType} payment declined`, 'POS_Terminal', 'ERROR');
        alert(`✗ Payment Declined\n\nPlease try another card or payment method.`);
      }
    }, 1500);
  };

  const handleCashPayment = async () => {
    if (!existingOrder) return;

    const finalAmount = (total / splitWays) + tipAmount;
    const tendered = prompt(`Cash Payment\n\nTotal Due: ${CURRENT_PROPERTY.currency} ${finalAmount.toFixed(2)}\n\nEnter amount tendered:`, finalAmount.toFixed(2));

    if (!tendered) return;

    const tenderedAmount = parseFloat(tendered);
    if (isNaN(tenderedAmount) || tenderedAmount < finalAmount) {
      alert(`Insufficient amount. Need ${CURRENT_PROPERTY.currency} ${finalAmount.toFixed(2)}`);
      return;
    }

    const change = tenderedAmount - finalAmount;

    // Deduct Inventory
    await deductInventoryForOrder({ ...existingOrder, items: currentItems }, RECIPE_DRAFTS);

    if (onSettle) {
      onSettle(existingOrder.id, {
        type: 'Cash',
        tips: tipAmount,
        tendered: tenderedAmount,
        change: change,
        amount: finalAmount
      });
    }

    botEngine.logActivity('POS', 'CASH_PAYMENT', `Cash payment ${finalAmount.toFixed(2)} - Tendered: ${tenderedAmount.toFixed(2)} - Change: ${change.toFixed(2)}`, 'Cashier', 'SUCCESS');

    alert(`✓ Cash Payment Complete\n\nTotal: ${CURRENT_PROPERTY.currency} ${finalAmount.toFixed(2)}\nTendered: ${CURRENT_PROPERTY.currency} ${tenderedAmount.toFixed(2)}\nChange Due: ${CURRENT_PROPERTY.currency} ${change.toFixed(2)}\n\nPlease give change to customer.`);
    setShowSettlement(false);
    onClose();
  };

  const handleMobilePayment = () => {
    alert("Scan QR Code on secondary display");
    // Simulate async payment
    setTimeout(() => {
      handleCardPayment('Visa'); // Reuse logic for prototype
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 w-full max-w-6xl h-[90vh] rounded-2xl border border-zinc-800 flex overflow-hidden shadow-2xl">

        {/* Left: Menu Catalog */}
        <div className="w-2/3 flex flex-col border-r border-zinc-800 bg-zinc-900/30">
          {/* Header & Categories */}
          <div className="p-4 border-b border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <UtensilsCrossed className="text-violet-500" />
                Menu Catalog
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 w-64"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/20'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleAddItem(item)}
                  className="bg-zinc-800/50 hover:bg-zinc-700 border border-zinc-700/50 hover:border-violet-500/50 p-4 rounded-xl flex flex-col gap-3 transition-all group text-left h-full"
                >
                  <div className="w-full aspect-square bg-zinc-900 rounded-lg overflow-hidden relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <ChefHat size={32} />
                      </div>
                    )}
                    {(item.allergens || []).length > 0 && (
                      <div className="absolute top-1 right-1 flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-white line-clamp-2 text-sm mb-1">{item.name}</div>
                    <div className="text-violet-400 font-mono text-sm">{CURRENT_PROPERTY.currency} {item.price.toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="w-1/3 flex flex-col bg-zinc-950">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">Table {table.number}</h3>
              <p className="text-xs text-zinc-500">Check #{existingOrder ? existingOrder.id.slice(-6) : 'NEW'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          {/* Order Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {currentItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 opacity-50">
                <UtensilsCrossed size={48} />
                <p>No items added</p>
              </div>
            ) : (
              currentItems.map((item, idx) => (
                <div key={`${item.menuItemId}-${idx}`} className={`flex justify-between items-start p-3 rounded-lg ${item.status === 'Void' ? 'bg-red-900/10 border-red-900/30' : 'bg-zinc-900/50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{item.name}</span>
                      {item.status === 'Sent' && <CheckCircle size={12} className="text-emerald-500" />}
                      {item.status === 'New' && <span className="text-[10px] bg-blue-500 text-white px-1.5 rounded">New</span>}
                      {item.status === 'Void' && <span className="text-[10px] bg-red-500 text-white px-1.5 rounded">VOID</span>}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5 max-w-[200px] truncate">
                      {item.grossProfit && `GP: ${item.grossProfit.toFixed(2)} (${item.foodCostPct?.toFixed(0)}%)`}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveItem(item.menuItemId)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-4 text-center text-sm font-mono text-white">{item.qty}</span>
                      <button
                        onClick={() => handleAddItem(MENU_ITEMS.find(m => m.id === item.menuItemId)!)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="font-mono text-white w-16 text-right">
                      {(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Actions */}
          <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-400 cursor-pointer hover:text-violet-400 transition" onClick={() => setShowDiscountModal(true)}>
                <span>Discount {discountValue > 0 && `(${discountType === 'Percent' ? `${discountValue}%` : 'Fixed'})`}</span>
                <span className="text-red-400">-{discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-zinc-800">
                <span>Total</span>
                <span>{CURRENT_PROPERTY.currency} {total.toFixed(2)}</span>
              </div>
              {splitWays > 1 && (
                <div className="flex justify-between text-base font-bold text-violet-400 pt-1">
                  <span>Per Person (x{splitWays})</span>
                  <span>{CURRENT_PROPERTY.currency} {(total / splitWays).toFixed(2)}</span>
                </div>
              )}
            </div>

            {!showSettlement ? (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleFireOrder}
                  disabled={currentItems.filter(i => i.status === 'New').length === 0}
                  className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition"
                >
                  <ChefHat size={18} />
                  Fire Order
                </button>
                <button
                  onClick={() => setShowSettlement(true)}
                  className="bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition"
                >
                  <CreditCard size={18} />
                  Pay & Settle
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-zinc-800 p-2 rounded-lg">
                  <span className="text-xs text-zinc-400 font-medium px-2 uppercase tracking-wider">Split Check</span>
                  <div className="flex items-center gap-3 bg-zinc-900 rounded-md p-1 border border-zinc-700">
                    <button onClick={() => setSplitWays(Math.max(1, splitWays - 1))} className="w-6 h-6 flex items-center justify-center text-white bg-zinc-800 rounded hover:bg-zinc-700 transition"><Minus size={14} /></button>
                    <span className="text-sm font-bold w-4 text-center text-white">{splitWays}</span>
                    <button onClick={() => setSplitWays(splitWays + 1)} className="w-6 h-6 flex items-center justify-center text-white bg-zinc-800 rounded hover:bg-zinc-700 transition"><Plus size={14} /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleCashPayment} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-medium flex-col flex items-center justify-center gap-1">
                    <Banknote size={20} />
                    <span className="text-xs">Cash</span>
                  </button>
                  <button onClick={() => handleCardPayment('Visa')} className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium flex-col flex items-center justify-center gap-1">
                    <CreditCard size={20} />
                    <span className="text-xs">Card</span>
                  </button>
                  <button onClick={handleRoomPost} className="bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-medium flex-col flex items-center justify-center gap-1">
                    <Home size={20} />
                    <span className="text-xs">Room Charge</span>
                  </button>
                  <button onClick={() => { setShowSettlement(false); setSplitWays(1); }} className="bg-zinc-700 hover:bg-zinc-600 text-white py-3 rounded-xl font-medium flex-col flex items-center justify-center gap-1">
                    <ArrowLeft size={20} />
                    <span className="text-xs">Back</span>
                  </button>
                  <div className="col-span-2 mt-2">
                    <label className="text-xs text-zinc-500 block mb-1">Add Tip</label>
                    <div className="flex gap-2">
                      {[0, 5, 10, 15, 20].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setTipAmount(amt)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border ${tipAmount === amt ? 'bg-violet-600 border-violet-600 text-white' : 'border-zinc-700 text-zinc-400'}`}
                        >
                          {amt === 0 ? 'None' : `+ ${amt}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-700 w-96 space-y-4">
            <h3 className="text-lg font-semibold text-white">Apply Discount</h3>
            <div className="flex gap-2 p-1 bg-zinc-800 rounded-lg">
              <button
                onClick={() => setDiscountType('Percent')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${discountType === 'Percent' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                Percentage (%)
              </button>
              <button
                onClick={() => setDiscountType('Amount')}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition ${discountType === 'Amount' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                Fixed Amount
              </button>
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Value</label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowDiscountModal(false)} className="flex-1 px-4 py-2 bg-zinc-800 rounded-lg text-white hover:bg-zinc-700">Cancel</button>
              <button onClick={() => setShowDiscountModal(false)} className="flex-1 px-4 py-2 bg-violet-600 rounded-lg text-white hover:bg-violet-500">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* Upsell Modal */}
      {showUpsell && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] bg-zinc-900 border border-violet-500/30 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-300">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="text-violet-400" size={32} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Perfect Pairing!</h3>
              <p className="text-zinc-400 text-sm mt-1">Would you like to add <span className="text-violet-300 font-medium">{showUpsell.name}</span> for {CURRENT_PROPERTY.currency} {showUpsell.price}?</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowUpsell(null)} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-sm font-medium">No thanks</button>
              <button
                onClick={() => {
                  handleAddItem(showUpsell);
                  setShowUpsell(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 text-sm font-medium"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderEntry;