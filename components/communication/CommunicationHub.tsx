import React, { useState, useRef, useEffect } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { CommsMessage, Task, Incident, Priority, TaskDepartment, PosOrder, OrderItem, LoyaltyTier, RoomStatus } from '../../types';
import {
    MessageSquare, CheckSquare, AlertTriangle, Send, Paperclip,
    Search, MoreVertical, Plus, Clock, User, Filter,
    ChevronRight, Brain, ShieldCheck, FileText, CheckCircle,
    AlertCircle, Archive, Mail, Users, Wine, Utensils, BedDouble, ConciergeBell, Radio, Crown, X, ChefHat, Martini, FileBarChart, Download, Printer, Calendar, Activity
} from 'lucide-react';
import KDS from '../pos/KDS';
import { botEngine } from '../../services/kernel/systemBridge';
import OracleWidget from '../shared/OracleWidget';
import { subscribeToItems, addItem } from '../../services/kernel/firestoreService';

const CommunicationHub: React.FC = () => {
    const {
        tasks: PMS_TASKS,
        incidents: PMS_INCIDENTS,
        employees: EMPLOYEES,
        posOrders: POS_ORDERS,
        reservations: RESERVATIONS,
        guests: GUESTS,
        menuItems: MENU_ITEMS,
        outlets: OUTLETS,
        rooms: ROOMS
    } = usePms();

    const [activeTab, setActiveTab] = useState<'Inbox' | 'Tasks' | 'Incidents' | 'Reports'>('Tasks');
    // Lifted Order State for real-time sync between Tasks and KDS
    const [orders, setOrders] = useState<PosOrder[]>([]);

    useEffect(() => {
        if (POS_ORDERS && POS_ORDERS.length > 0) {
            setOrders(POS_ORDERS);
        }
    }, [POS_ORDERS]);

    // Local temporary messages state since messages aren't in PmsState yet
    const [messages, setMessages] = useState<CommsMessage[]>([]);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        if (val.length < 1) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        const term = val.toLowerCase();
        const matches: any[] = [];

        // Search Tasks
        PMS_TASKS.forEach(t => {
            if (t.title.toLowerCase().includes(term)) {
                matches.push({ type: 'Task', label: t.title, sub: t.status });
            }
        });
        // Search Incidents
        PMS_INCIDENTS.forEach(i => {
            if (i.type.toLowerCase().includes(term)) {
                matches.push({ type: 'Incident', label: i.type, sub: i.priority });
            }
        });

        setSuggestions(matches.slice(0, 5));
        setShowSuggestions(true);
    };

    const handleAddOrder = (newOrder: PosOrder) => {
        setOrders(prev => [...prev, newOrder]);
        POS_ORDERS.push(newOrder);
    };

    const handleBumpTicket = (orderId: string) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Served' } : o));
        botEngine.logActivity('POS', 'Task_Order_Completed', `Ticket #${orderId.slice(-4)} via Task Force`, 'KDS_Bridge');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Tasks': return <TaskForceBoard onAddOrder={handleAddOrder} orders={orders} onCompleteOrder={handleBumpTicket} />;
            case 'Incidents': return <IncidentLog />;
            case 'Reports': return <ReportsGenerator />;
            default: return <Inbox />;
        }
    };

    return (
        <div className="module-container bg-transparent flex flex-col h-full overflow-hidden">
            {/* Standardized Connect Header */}
            <header className="module-header flex items-center justify-between gap-6 flex-nowrap">
                <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="p-3 bg-violet-500/10 rounded-2xl border border-violet-500/20">
                        <MessageSquare className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-light text-white tracking-tight leading-none">Connect Hub</h2>
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Operational Messaging & Tasks</div>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-nowrap overflow-x-auto scrollbar-hide py-1">
                    <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 flex-nowrap">
                        {['Inbox', 'Tasks', 'Incidents'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`min-w-[90px] px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === tab ? 'bg-zinc-800 text-white shadow-xl shadow-black/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {tab}
                            </button>
                        ))}
                        <button
                            onClick={() => setActiveTab('Reports')}
                            className={`min-w-[90px] flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'Reports' ? 'bg-violet-600 text-white' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <FileBarChart className="w-3.5 h-3.5" /> Reports
                        </button>
                    </div>

                    <div className="h-8 w-px bg-zinc-800 mx-2 flex-shrink-0"></div>

                    <OracleWidget context={{ moduleId: 'Connect', fieldId: 'NavigationTabs' }} />

                    {/* Search */}
                    <div className="relative flex-shrink-0" ref={searchRef}>
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search Connect..."
                            className="w-48 bg-zinc-900 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-[11px] text-zinc-300 focus:border-violet-500/50 outline-none transition-all focus:w-64"
                            value={searchTerm}
                            onChange={e => handleSearchChange(e.target.value)}
                            onFocus={() => { if (searchTerm) setShowSuggestions(true); }}
                        />
                        {/* Suggestions */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-slideUp">
                                <ul>
                                    {suggestions.map((item, idx) => (
                                        <li
                                            key={`sug-${idx}`}
                                            className="px-4 py-3 hover:bg-zinc-800 cursor-pointer transition flex items-center gap-3 border-b border-zinc-800/50 last:border-0"
                                        >
                                            <CheckSquare className="w-4 h-4 text-teal-500" />
                                            <div>
                                                <div className="text-sm font-medium text-zinc-200">{item.label}</div>
                                                <div className="text-[9px] text-zinc-500 uppercase">{item.sub}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="module-body">
                {renderContent()}
            </main>

            <footer className="module-footer flex items-center justify-between border-t border-zinc-800 bg-zinc-900/50 px-6 py-3">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Connect Online</span>
                    </div>
                    <div className="h-4 w-px bg-zinc-800"></div>
                    <span className="text-[10px] text-zinc-500 font-medium">System Response: 12ms</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-right">User: Admin_01</span>
                </div>
            </footer>
        </div>
    );
};

const Inbox: React.FC = () => {
    const { employees: EMPLOYEES } = usePms();
    const [messages, setMessages] = useState<CommsMessage[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeToItems<CommsMessage>('messages', (msgs) => {
            setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
        });
        return () => unsubscribe();
    }, []);

    const [selectedThread, setSelectedThread] = useState<string | null>('th_001');
    const [inputText, setInputText] = useState('');

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const newMsg: Partial<CommsMessage> = {
            senderId: 'emp_001',
            receiverId: 'group_general',
            threadId: selectedThread || 'th_001',
            content: inputText.trim(),
            type: 'Chat',
            timestamp: Date.now(),
            read: true
        };

        await addItem('messages', newMsg);
        botEngine.logActivity('KERNEL', 'Message_Sent', `Thread: ${newMsg.threadId} | Content: "${inputText.substring(0, 20)}..."`, 'User');
        setInputText('');
    };

    const threads = Array.from(new Set(messages.map(m => m.threadId)));
    if (threads.length === 0) threads.push('th_001');

    return (
        <div className="flex h-full">
            {/* Thread List */}
            <div className="w-80 border-r border-zinc-800 bg-zinc-900/30 flex flex-col">
                <div className="p-4 border-b border-zinc-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                        <input type="text" placeholder="Search messages..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-300 focus:border-violet-500/50 outline-none" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {threads.map(th => (
                        <div
                            key={th}
                            onClick={() => setSelectedThread(th)}
                            className={`p-4 border-b border-zinc-800 cursor-pointer transition ${selectedThread === th ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}
                        >
                            <div className="text-sm font-medium text-zinc-200">
                                {th === 'th_001' ? 'General Ops Group' : `Thread: ${th}`}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1 truncate">
                                {messages.filter(m => m.threadId === th).pop()?.content || 'No messages'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-zinc-950">
                <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur">
                    <div className="flex items-center gap-3">
                        <div className="text-zinc-300 font-medium text-sm">
                            {selectedThread === 'th_001' ? 'General Ops Group' : `Thread: ${selectedThread}`}
                        </div>
                    </div>
                    <button className="p-2 text-zinc-500 hover:text-white"><MoreVertical className="w-5 h-5" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.filter(m => m.threadId === selectedThread).map(msg => (
                        <div key={msg.id} className={`flex gap-4 ${msg.senderId === 'emp_001' ? 'justify-end' : ''}`}>
                            {msg.senderId !== 'emp_001' && (
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 mt-1">
                                    {EMPLOYEES.find(e => e.principal === msg.senderId)?.fullName[0] || '?'}
                                </div>
                            )}
                            <div className={`max-w-[60%] space-y-1 ${msg.senderId === 'emp_001' ? 'items-end flex flex-col' : ''}`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-zinc-400">{EMPLOYEES.find(e => e.principal === msg.senderId)?.fullName || 'Me'}</span>
                                    <span className="text-zinc-600 text-[10px]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.senderId === 'emp_001'
                                    ? 'bg-violet-600 text-white rounded-tr-none'
                                    : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* AI Suggestion */}
                <div className="px-6 py-2">
                    <div className="flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 px-3 py-2 rounded-lg border border-violet-500/20">
                        <Brain className="w-3 h-3" />
                        <span>AI Suggestion: "I can create a procurement task for this directly."</span>
                        <button className="ml-auto text-white underline hover:no-underline">Execute</button>
                    </div>
                </div>

                <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2">
                        <button className="p-2 text-zinc-500 hover:text-white transition"><Paperclip className="w-5 h-5" /></button>
                        <input
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-200 placeholder-zinc-600"
                            placeholder="Type your message..."
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend} className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition shadow-lg shadow-violet-900/20">
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface TaskForceBoardProps {
    onAddOrder: (order: PosOrder) => void;
    orders: PosOrder[];
    onCompleteOrder: (orderId: string) => void;
}

const TaskForceBoard: React.FC<TaskForceBoardProps> = ({ onAddOrder, orders, onCompleteOrder }) => {
    const { tasks: PMS_TASKS, rooms: ROOMS, outlets: OUTLETS, reservations: RESERVATIONS, guests: GUESTS } = usePms();
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        if (PMS_TASKS) setTasks(PMS_TASKS);
    }, [PMS_TASKS]);

    const [selectedDept, setSelectedDept] = useState<TaskDepartment | 'All'>('All');
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTaskForm, setNewTaskForm] = useState<Partial<Task>>({
        title: '', description: '', department: 'General', priority: 'Medium'
    });
    const [activeOutletFilter, setActiveOutletFilter] = useState<string>('all');

    const getPriorityColor = (p: Priority) => {
        switch (p) {
            case 'High': case 'Critical': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            case 'Medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        }
    };

    const getDepartmentIcon = (dept: TaskDepartment) => {
        switch (dept) {
            case 'MiniBar': return <Wine className="w-3 h-3" />;
            case 'IRD': return <Utensils className="w-3 h-3" />;
            case 'Housekeeping': return <BedDouble className="w-3 h-3" />;
            case 'Concierge': return <ConciergeBell className="w-3 h-3" />;
            case 'Kitchen': return <ChefHat className="w-3 h-3" />;
            case 'Bar': return <Martini className="w-3 h-3" />;
            default: return <CheckSquare className="w-3 h-3" />;
        }
    };

    const handleAcceptTask = (taskId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, status: 'In Progress', acceptedBy: 'Current User', assigneeId: 'Current User' }
                : t
        ));
        const task = tasks.find(t => t.id === taskId);
        botEngine.logActivity('HK', 'Task_Accepted', `Task: ${task?.title}`, 'Director.Ops');
    };

    const handleCompleteTask = (taskId: string) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId
                ? { ...t, status: 'Done' }
                : t
        ));

        const task = tasks.find(t => t.id === taskId);
        botEngine.logActivity('HK', 'Task_Completed', `Task: ${task?.title}`, 'Director.Ops');

        if (task && task.department === 'MiniBar' && task.title.startsWith('Refill Room')) {
            const roomNumber = task.title.split('Refill Room ')[1]?.trim();
            if (roomNumber) {
                const room = ROOMS.find(r => r.number === roomNumber);
                if (room) {
                    room.status = RoomStatus.CLEAN_READY;
                    alert(`Workflow Automation: Minibar Refilled. Room ${roomNumber} status updated to Clean/Ready automatically.`);
                }
            }
        }
    };

    const handleAddTask = () => {
        if (!newTaskForm.title) return;

        const task: Task = {
            id: `task_${Date.now()}`,
            title: newTaskForm.title || '',
            description: newTaskForm.description || '',
            department: newTaskForm.department as TaskDepartment,
            priority: newTaskForm.priority as Priority,
            status: 'Open',
            dueDate: Date.now() + 86400000,
            aiSuggested: false,
            delegatorId: 'emp_001',
            assigneeId: undefined
        };

        setTasks([...tasks, task]);

        // LOG THE TASK CREATION - THIS WAS MISSING
        botEngine.logActivity(
            'HK',
            'Task_Created',
            `Title: ${task.title} | Priority: ${task.priority} | Dept: ${task.department}`,
            'Director.Ops'
        );

        if (task.department === 'IRD' || task.department === 'Kitchen' || task.title.toLowerCase().includes('food') || task.title.toLowerCase().includes('burger')) {

            let targetOutletId = 'out_01';
            if (task.department === 'IRD') targetOutletId = 'out_03';

            const kitchenOrder: PosOrder = {
                id: `po_task_${Date.now()}`,
                outletId: targetOutletId,
                roomId: task.title.match(/\d{3}/)?.[0] || 'Unknown',
                items: [{ menuItemId: 'gen_food', name: task.title, qty: 1, price: 0, department: 'Food' }],
                status: 'Sent',
                total: 0,
                subtotal: 0,
                discountAmount: 0,
                timestamp: Date.now()
            };
            onAddOrder(kitchenOrder);
            alert(`Task sent to Kitchen Display System (KDS) automatically. Tagged to Outlet: ${targetOutletId === 'out_03' ? 'In-Room Dining' : 'Restaurant'}`);
        }

        setShowAddTask(false);
        setNewTaskForm({ title: '', description: '', department: 'General', priority: 'Medium' });
    };

    const handleAutoScheduleAmenities = () => {
        let count = 0;

        RESERVATIONS.forEach(res => {
            if (res.status === 'Checked In' || res.status === 'Confirmed') {
                const guest = GUESTS.find(g => g.principal === res.guestId);
                if (guest) {
                    let amenityItemName = '';
                    let amenityItem: OrderItem | null = null;

                    if (guest.loyaltyTier === LoyaltyTier.GOLD) {
                        amenityItemName = 'Welcome Fruit Platter';
                        amenityItem = { menuItemId: 'am_01', name: amenityItemName, qty: 1, price: 0, department: 'Amenity' };
                    } else if (guest.loyaltyTier === LoyaltyTier.PLATINUM) {
                        amenityItemName = 'VIP Macarons';
                        amenityItem = { menuItemId: 'am_02', name: amenityItemName, qty: 1, price: 0, department: 'Amenity' };
                    } else if (guest.loyaltyTier === LoyaltyTier.DIAMOND) {
                        amenityItemName = 'Royal Dates & Coffee';
                        amenityItem = { menuItemId: 'am_03', name: amenityItemName, qty: 1, price: 0, department: 'Amenity' };
                    }

                    if (amenityItem) {
                        const amenityTask: Task = {
                            id: `task_amenity_${res.id}`,
                            title: `Deliver ${amenityItemName}`,
                            description: `VIP Amenity for ${guest.fullName} (${guest.loyaltyTier}). Arrival/Check-in Time.`,
                            department: 'IRD',
                            priority: 'High',
                            status: 'Open',
                            dueDate: Date.now() + 3600000,
                            aiSuggested: true,
                            delegatorId: 'system_concierge'
                        };

                        if (!tasks.find(t => t.id === amenityTask.id)) {
                            setTasks(prev => [...prev, amenityTask]);

                            const amenityOrder: PosOrder = {
                                id: `po_amenity_${res.id}`,
                                outletId: 'out_03',
                                roomId: res.roomId || 'Pending',
                                items: [amenityItem],
                                status: 'Sent',
                                total: 0,
                                subtotal: 0,
                                discountAmount: 0,
                                timestamp: Date.now()
                            };
                            onAddOrder(amenityOrder);
                            count++;
                        }
                    }
                }
            }
        });

        if (count > 0) {
            botEngine.logActivity('HK', 'Batch_Auto_Schedule', `Scheduled ${count} VIP Amenities`, 'System_AI');
            alert(`Scheduled ${count} VIP Amenities. Sent to Task Force & Kitchen Display (In-Room Dining).`);
        }
        else alert("No new VIP amenities to schedule.");
    };

    const filteredTasks = tasks.filter(t => selectedDept === 'All' || t.department === selectedDept);

    if (selectedDept === 'Kitchen') {
        const kitchenOutlets = OUTLETS.filter(o => o.type !== 'Bar');
        const filteredOrders = activeOutletFilter === 'all'
            ? orders.filter(o => kitchenOutlets.some(ko => ko.id === o.outletId))
            : orders.filter(o => o.outletId === activeOutletFilter);

        return (
            <div className="h-full flex flex-col relative">
                <div className="px-6 py-4 bg-zinc-950/50 border-b border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-3">
                    {renderFilterBar(selectedDept, setSelectedDept)}

                    <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                        <button
                            onClick={() => setActiveOutletFilter('all')}
                            className={`px-3 py-1 text-xs rounded transition ${activeOutletFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                        >
                            All Outlets
                        </button>
                        {kitchenOutlets.map(out => (
                            <button
                                key={out.id}
                                onClick={() => setActiveOutletFilter(out.id)}
                                className={`px-3 py-1 text-xs rounded transition ${activeOutletFilter === out.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}
                            >
                                {out.name}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <KDS
                        orders={filteredOrders}
                        onCompleteOrder={onCompleteOrder}
                        isBar={false}
                    />
                </div>
            </div>
        );
    }

    if (selectedDept === 'Bar') {
        return (
            <div className="h-full flex flex-col relative">
                <div className="px-6 py-4 bg-zinc-950/50 border-b border-zinc-800 flex items-center justify-between">
                    {renderFilterBar(selectedDept, setSelectedDept)}
                </div>
                <div className="flex-1 overflow-hidden">
                    <KDS
                        orders={orders.filter(o => o.outletId === 'out_02')}
                        onCompleteOrder={onCompleteOrder}
                        isBar={true}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative">
            <div className="px-6 py-4 bg-zinc-950/50 border-b border-zinc-800 flex items-center justify-between">
                {renderFilterBar(selectedDept, setSelectedDept)}

                <div className="flex gap-2">
                    <button
                        onClick={handleAutoScheduleAmenities}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold transition"
                    >
                        <Crown className="w-3 h-3" /> Schedule Amenities
                    </button>
                    <button
                        onClick={() => setShowAddTask(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-xs font-bold transition"
                    >
                        <Plus className="w-3 h-3" /> New Task
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-x-auto">
                <div className="flex gap-6 h-full min-w-[1000px]">
                    {['Open', 'In Progress', 'Done'].map(status => (
                        <div key={status} className="flex-1 flex flex-col bg-zinc-900/30 border border-zinc-800 rounded-2xl h-full relative">
                            <div className="absolute -top-3 -right-3 z-20">
                                {/* Oracle Trigger: Status Column Flow */}
                                <OracleWidget context={{ moduleId: 'Connect', fieldId: `TaskStatus_${status}`, dependencies: ['Housekeeping'] }} size="sm" />
                            </div>

                            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/30 rounded-t-2xl">
                                <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${status === 'Open' ? 'bg-zinc-500' : status === 'In Progress' ? 'bg-amber-500' : 'bg-teal-500'}`}></div>
                                    {status}
                                </h3>
                                <span className="bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {filteredTasks.filter(t => t.status === status).length}
                                </span>
                            </div>

                            <div className="p-4 space-y-3 overflow-y-auto flex-1">
                                {filteredTasks.filter(t => t.status === status).map(task => (
                                    <div key={task.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl hover:border-zinc-700 transition group cursor-pointer relative overflow-hidden flex flex-col gap-3">
                                        {task.aiSuggested && (
                                            <div className="absolute top-0 right-0 p-1.5 bg-violet-500/10 rounded-bl-xl border-b border-l border-violet-500/20">
                                                <Brain className="w-3 h-3 text-violet-400" />
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start">
                                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                                {getDepartmentIcon(task.department)} {task.department}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-zinc-200 mb-1 leading-tight">{task.title}</h4>
                                            <p className="text-xs text-zinc-500 line-clamp-2">{task.description}</p>
                                        </div>

                                        {status === 'Open' && !task.assigneeId && (
                                            <div className="text-[10px] text-teal-500 flex items-center gap-1 bg-teal-500/10 p-2 rounded border border-teal-500/20 animate-pulse">
                                                <Radio className="w-3 h-3" /> Broadcasting to {task.department} Staff...
                                            </div>
                                        )}

                                        {task.acceptedBy && (
                                            <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                                                <User className="w-3 h-3" /> Accepted by: <span className="text-zinc-300">{task.acceptedBy}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between items-center border-t border-zinc-900 pt-3 mt-auto">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 border border-zinc-700">
                                                    {task.assigneeId ? 'Me' : '?'}
                                                </div>
                                                <span className="text-xs text-zinc-500">
                                                    {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>

                                            {status === 'Open' && (
                                                <button
                                                    onClick={() => handleAcceptTask(task.id)}
                                                    className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded shadow-lg shadow-violet-900/20 transition"
                                                >
                                                    Accept
                                                </button>
                                            )}
                                            {status === 'In Progress' && (
                                                <button
                                                    onClick={() => handleCompleteTask(task.id)}
                                                    className="flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-teal-500 hover:text-white text-zinc-400 text-xs font-medium rounded transition"
                                                >
                                                    <CheckCircle className="w-3 h-3" /> Complete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showAddTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowAddTask(false)}>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-light text-zinc-100 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-violet-500" /> New Task
                            </h3>
                            <button onClick={() => setShowAddTask(false)} className="text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Title</label>
                                <input
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 outline-none focus:border-violet-500/50"
                                    placeholder="e.g. Clean Room 102"
                                    value={newTaskForm.title}
                                    onChange={e => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Department</label>
                                <select
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 outline-none focus:border-violet-500/50"
                                    value={newTaskForm.department}
                                    onChange={e => setNewTaskForm({ ...newTaskForm, department: e.target.value as any })}
                                >
                                    <option value="General">General</option>
                                    <option value="Housekeeping">Housekeeping</option>
                                    <option value="IRD">In-Room Dining (Sync to KDS)</option>
                                    <option value="MiniBar">Mini Bar</option>
                                    <option value="Concierge">Concierge</option>
                                    <option value="Kitchen">Kitchen</option>
                                    <option value="Bar">Bar</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Priority</label>
                                <select
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 outline-none focus:border-violet-500/50"
                                    value={newTaskForm.priority}
                                    onChange={e => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 outline-none focus:border-violet-500/50"
                                    placeholder="Details..."
                                    value={newTaskForm.description}
                                    onChange={e => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <button
                            onClick={handleAddTask}
                            className="w-full mt-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold shadow-lg shadow-violet-900/20 transition"
                        >
                            Create Task
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const renderFilterBar = (selectedDept: string, setSelectedDept: (d: any) => void) => {
    const getDepartmentIcon = (dept: string) => {
        switch (dept) {
            case 'MiniBar': return <Wine className="w-3 h-3" />;
            case 'IRD': return <Utensils className="w-3 h-3" />;
            case 'Housekeeping': return <BedDouble className="w-3 h-3" />;
            case 'Concierge': return <ConciergeBell className="w-3 h-3" />;
            case 'Kitchen': return <ChefHat className="w-3 h-3" />;
            case 'Bar': return <Martini className="w-3 h-3" />;
            default: return <CheckSquare className="w-3 h-3" />;
        }
    };

    return (
        <div className="flex items-center gap-2 overflow-x-auto relative">
            {/* Oracle Trigger: Filter Logic */}
            <div className="absolute -left-2 -top-2 z-20">
                <OracleWidget context={{ moduleId: 'Connect', fieldId: 'TaskFilters' }} size="sm" />
            </div>

            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-2 pl-3">Display:</span>
            {['All', 'Housekeeping', 'MiniBar', 'IRD', 'Concierge', 'Kitchen', 'Bar'].map((dept) => (
                <button
                    key={dept}
                    onClick={() => setSelectedDept(dept as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition flex items-center gap-2 whitespace-nowrap ${selectedDept === dept
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/20'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                        }`}
                >
                    {dept !== 'All' && getDepartmentIcon(dept)}
                    {dept}
                </button>
            ))}
        </div>
    );
}

const ReportsGenerator: React.FC = () => {
    const [filterType, setFilterType] = useState<'All' | 'Tasks' | 'Incidents' | 'Performance'>('All');
    const [filterDept, setFilterDept] = useState<string>('All');
    const [dateRange, setDateRange] = useState<'Today' | 'Week' | 'Month'>('Today');

    const { tasks: PMS_TASKS, incidents: PMS_INCIDENTS } = usePms();

    const getReportData = () => {
        const allData: any[] = [];
        PMS_TASKS.forEach(t => {
            if (filterType !== 'Incidents' && (filterDept === 'All' || t.department === filterDept)) {
                allData.push({
                    id: t.id,
                    category: 'Task',
                    title: t.title,
                    status: t.status,
                    dept: t.department,
                    priority: t.priority,
                    timestamp: t.dueDate - 86400000,
                    details: t.description
                });
            }
        });
        PMS_INCIDENTS.forEach(inc => {
            if (filterType !== 'Tasks' && filterType !== 'Performance') {
                allData.push({
                    id: inc.id,
                    category: 'Incident',
                    title: inc.type,
                    status: inc.status,
                    dept: 'General',
                    priority: inc.priority,
                    timestamp: inc.timestamp,
                    details: inc.description
                });
            }
        });
        return allData.sort((a, b) => b.timestamp - a.timestamp);
    };

    const reportData = getReportData();

    return (
        <div className="h-full flex flex-col bg-zinc-950 p-6 animate-fadeIn">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
                <h3 className="text-lg font-light text-zinc-100 flex items-center gap-2 mb-6">
                    <FileBarChart className="w-5 h-5 text-violet-500" /> Operational Reporting
                </h3>
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Report Type</label>
                        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                            {['All', 'Tasks', 'Incidents'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFilterType(t as any)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${filterType === t ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Department</label>
                        <select
                            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-violet-500 w-40"
                            value={filterDept}
                            onChange={(e) => setFilterDept(e.target.value)}
                        >
                            <option value="All">All Departments</option>
                            <option value="Housekeeping">Housekeeping</option>
                            <option value="Kitchen">Kitchen</option>
                        </select>
                    </div>
                    <button className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-bold transition shadow-lg shadow-violet-900/20">
                        Refresh
                    </button>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex-1 flex flex-col animate-slideUp">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                    <div className="flex items-center gap-2">
                        <FileBarChart className="w-4 h-4 text-zinc-400" />
                        <span className="text-sm font-bold text-zinc-200">Activity Report</span>
                        <span className="text-xs text-zinc-500">({reportData.length} records)</span>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"><Printer className="w-4 h-4" /></button>
                        <button className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"><Download className="w-4 h-4" /></button>
                    </div>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold">
                            <tr>
                                <th className="px-6 py-3">Timestamp</th>
                                <th className="px-6 py-3">Type</th>
                                <th className="px-6 py-3">Title</th>
                                <th className="px-6 py-3">Dept</th>
                                <th className="px-6 py-3">Priority</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {reportData.map((row, i) => (
                                <tr key={i} className="hover:bg-zinc-800/50">
                                    <td className="px-6 py-3 font-mono text-xs">{new Date(row.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-3 text-xs uppercase font-bold">{row.category}</td>
                                    <td className="px-6 py-3 font-medium text-zinc-200">{row.title}</td>
                                    <td className="px-6 py-3 text-xs">{row.dept}</td>
                                    <td className="px-6 py-3"><span className="text-xs">{row.priority}</span></td>
                                    <td className="px-6 py-3"><span className="bg-zinc-800 px-2 py-1 rounded text-[10px] uppercase font-bold">{row.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const IncidentLog: React.FC = () => {
    const { incidents: PMS_INCIDENTS } = usePms();
    const [showModal, setShowModal] = useState(false);
    const [newIncident, setNewIncident] = useState({ type: '', desc: '', priority: 'Medium' });

    const handleSubmit = () => {
        botEngine.logActivity('PMS', 'Incident_Reported', `${newIncident.type}: ${newIncident.desc}`, 'Director.Ops', 'WARNING');
        setShowModal(false);
        setNewIncident({ type: '', desc: '', priority: 'Medium' });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-6 pb-2 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400 hover:text-white">
                        <Filter className="w-3 h-3" /> Filter
                    </button>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-rose-900/20 flex items-center gap-2"
                >
                    <AlertCircle className="w-4 h-4" /> Report Incident
                </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {PMS_INCIDENTS.map(inc => (
                    <div key={inc.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-3 flex justify-between items-center">
                        <div>
                            <div className="text-zinc-200 font-bold text-sm">{inc.type}</div>
                            <div className="text-zinc-500 text-xs">{inc.description}</div>
                        </div>
                        <div className="px-2 py-1 bg-rose-500/10 text-rose-500 text-xs rounded border border-rose-500/20 font-bold uppercase">{inc.status}</div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setShowModal(false)}>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg text-zinc-100 mb-4">Report Incident</h3>
                        <input className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 mb-3" placeholder="Type (e.g. Injury)" onChange={e => setNewIncident({ ...newIncident, type: e.target.value })} />
                        <textarea className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 mb-4" placeholder="Description..." onChange={e => setNewIncident({ ...newIncident, desc: e.target.value })} />
                        <button onClick={handleSubmit} className="w-full bg-rose-600 text-white py-2 rounded font-bold">Submit Report</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunicationHub;
