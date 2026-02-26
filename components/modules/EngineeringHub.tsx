
import React, { useState, useEffect, useMemo } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { MaintenanceTask } from '../../types';
import { Wrench, Activity, Zap, Thermometer, Droplet, AlertTriangle, CheckCircle, Package, Box, Settings, Cpu, BarChart3, Clock, MapPin, Search } from 'lucide-react';
import OracleWidget from '../shared/OracleWidget';
import Inspectable from '../shared/Inspectable';
import { useInspector } from '../../context/InspectorContext';
import { queryItems } from '../../services/kernel/firestoreService';
import { limit, orderBy } from 'firebase/firestore';
import UniversalReportCenter from '../shared/UniversalReportCenter';
import { botEngine } from '../../services/kernel/systemBridge';

const EngineeringHub: React.FC = () => {
   const { inspect } = useInspector();
   const { assets: ASSETS, maintenance: TASKS, loading: pmsLoading } = usePms();
   const [activeTab, setActiveTab] = useState<'Maintenance' | 'Assets' | 'Energy'>('Maintenance');
   const [selectedTask, setSelectedTask] = useState<any>(null);
   const [maintenanceTasks, setMaintenanceTasks] = useState<MaintenanceTask[]>([]);
   const [isLoadingTasks, setIsLoadingTasks] = useState(false);


   useEffect(() => {
      const loadTasks = async () => {
         setIsLoadingTasks(true);
         try {
            // Implement server-side pagination logic (limit to recent 50 for scale)
            const tasks = await queryItems<MaintenanceTask>('maintenanceTasks', orderBy('timestamp', 'desc'), limit(50));
            setMaintenanceTasks(tasks);
         } catch (err) {
            console.error('Failed to load maintenance tasks:', err);
         } finally {
            setIsLoadingTasks(false);
         }
      };
      if (activeTab === 'Maintenance') {
         loadTasks();
      }
   }, [activeTab]);

   return (
      <div className="module-container">
         {/* Command Center Header */}
         <div className="module-header glass-panel">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-violet-600/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
                  <Wrench className="w-5 h-5" />
               </div>
               <div>
                  <h1 className="text-xl font-light text-white">Engineering Hub</h1>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Infrastructure & Critical Systems</p>
               </div>
            </div>

            {/* Navigation / Tab Switcher */}
            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
               {[
                  { id: 'Maintenance', label: 'Maintenance', icon: Activity },
                  { id: 'Assets', label: 'Assets', icon: Package },
                  { id: 'Energy', label: 'Energy', icon: Zap },
                  { id: 'Reports', label: 'BI', icon: Cpu },
               ].map(item => (
                  <button
                     key={item.id}
                     onClick={() => setActiveTab(item.id as any)}
                     className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === item.id
                        ? 'bg-zinc-800 text-white shadow-lg shadow-black/40'
                        : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                  >
                     <item.icon size={12} />
                     {item.label}
                  </button>
               ))}
            </div>

            <div className="flex items-center gap-2">
               <button className="flex items-center gap-2 px-3 py-1.5 bg-violet-600/10 hover:bg-violet-600 text-violet-400 hover:text-white border border-violet-500/20 rounded-xl transition-all duration-300 font-bold text-[10px] uppercase tracking-widest">
                  <Wrench className="w-3 h-3" /> New Task
               </button>
            </div>
         </div>

         <main className="module-body z-0 relative">
            {/* EMS Mini Stats Bar */}
            <div className="module-grid shrink-0">
               <MiniEMS icon={<Zap className="w-4 h-4" />} label="Total Load" value="452 kW" trend="-4%" color="text-amber-500" />
               <MiniEMS icon={<Thermometer className="w-4 h-4" />} label="HVAC Perf" value="94%" trend="+2.1%" color="text-cyan-500" />
               <MiniEMS icon={<Droplet className="w-4 h-4" />} label="Water Flow" value="1.2 kL/h" trend="-1%" color="text-blue-500" />
               <MiniEMS icon={<Activity className="w-4 h-4" />} label="Asset Health" value="88.4" trend="Stable" color="text-teal-500" />
            </div>

            <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col">
               <div className="p-6 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     {activeTab === 'Maintenance' && <Wrench className="w-5 h-5 text-violet-500" />}
                     {activeTab === 'Assets' && <Package className="w-5 h-5 text-emerald-500" />}
                     {activeTab === 'Energy' && <BarChart3 className="w-5 h-5 text-amber-500" />}
                     <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">
                        {activeTab} Management
                     </h3>
                  </div>
                  <button className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-violet-900/20">
                     <Wrench className="w-3 h-3" /> {activeTab === 'Maintenance' ? 'Schedule Task' : 'Register Asset'}
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto">
                  {activeTab === 'Maintenance' && (
                     <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-bold sticky top-0 z-10">
                           <tr>
                              <th className="px-8 py-4">Task ID</th>
                              <th className="px-8 py-4">Asset</th>
                              <th className="px-8 py-4">Issue Description</th>
                              <th className="px-8 py-4">Priority</th>
                              <th className="px-8 py-4">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                           {isLoadingTasks ? (
                              <tr><td colSpan={5} className="px-8 py-5 text-center text-zinc-500">Loading tasks...</td></tr>
                           ) : maintenanceTasks.length === 0 ? (
                              <tr><td colSpan={5} className="px-8 py-5 text-center text-zinc-500">No recent maintenance tasks.</td></tr>
                           ) : maintenanceTasks.map(task => (
                              <Inspectable key={task.id} type="maintenance_task" id={task.id}>
                                 <tr
                                    onClick={() => inspect('maintenance_task', task.id)}
                                    className="hover:bg-zinc-900/50 cursor-pointer transition group"
                                 >
                                    <td className="px-8 py-5 font-mono text-xs text-violet-400">#{task.id}</td>
                                    <td className="px-8 py-5">
                                       <div className="text-zinc-200 font-medium">
                                          {ASSETS.find(a => a.id === task.assetId)?.name}
                                       </div>
                                       <div className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter mt-0.5">
                                          {ASSETS.find(a => a.id === task.assetId)?.category}
                                       </div>
                                    </td>
                                    <td className="px-8 py-5 text-zinc-400 max-w-xs truncate">{task.description}</td>
                                    <td className="px-8 py-5">
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${task.priority === 'High' ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-800/50 text-zinc-500'
                                          }`}>
                                          {task.priority}
                                       </span>
                                    </td>
                                    <td className="px-8 py-5">
                                       <div className="flex items-center gap-2">
                                          <div className={`w-2 h-2 rounded-full ${task.status === 'In Progress' ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]' : 'bg-zinc-700'
                                             }`}></div>
                                          <span className="text-[11px] font-bold uppercase tracking-tight text-zinc-300">{task.status}</span>
                                       </div>
                                    </td>
                                 </tr>
                              </Inspectable>
                           ))}
                        </tbody>
                     </table>
                  )}

                  {activeTab === 'Assets' && (
                     <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ASSETS.map(asset => (
                           <Inspectable key={asset.id} type="asset" id={asset.id}>
                              <div
                                 onClick={() => inspect('asset', asset.id)}
                                 className="bg-zinc-950 border border-zinc-800 p-6 rounded-3xl hover:border-emerald-500/50 transition group cursor-pointer relative overflow-hidden"
                              >
                                 <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-500/5 rounded-2xl group-hover:bg-emerald-500/10 transition">
                                       <Settings className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="text-right">
                                       <div className="text-xl font-light text-zinc-100">{asset.healthScore}%</div>
                                       <div className="text-[10px] text-zinc-500 uppercase font-bold">Health Score</div>
                                    </div>
                                 </div>
                                 <h4 className="text-sm font-bold text-zinc-200 mb-1">{asset.name}</h4>
                                 <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                                    <MapPin className="w-3 h-3" /> {asset.location}
                                 </div>

                                 <div className="mt-6 flex justify-between items-center text-[10px]">
                                    <div className="flex flex-col gap-1">
                                       <span className="text-zinc-600 font-bold uppercase">Next Service</span>
                                       <span className="text-zinc-300 font-mono flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> {new Date(asset.nextServiceDate).toLocaleDateString()}
                                       </span>
                                    </div>
                                    <div className="h-8 w-px bg-zinc-800"></div>
                                    <div className="flex flex-col gap-1 text-right">
                                       <span className="text-zinc-600 font-bold uppercase">Status</span>
                                       <span className="text-emerald-400 font-bold uppercase">Functional</span>
                                    </div>
                                 </div>
                              </div>
                           </Inspectable>
                        ))}
                     </div>
                  )}

                  {activeTab === 'Energy' && (
                     <div className="p-12 flex flex-col items-center justify-center text-center">
                        <BarChart3 className="w-16 h-16 text-zinc-800 mb-6 animate-pulse" />
                        <h3 className="text-xl font-light text-zinc-200">Singularity EMS™ Live Insights</h3>
                        <p className="text-sm text-zinc-500 mt-2 max-w-sm leading-relaxed">
                           Connecting to property-wide IoT sensor network... Real-time energy telemetry including sub-metering data will be available shortly.
                        </p>
                        <div className="mt-8 px-6 py-2 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold border border-amber-500/20">
                           DEMAND RESPONSE ACTIVE
                        </div>
                     </div>
                  )}

                  {activeTab === ('Reports' as any) && (
                     <UniversalReportCenter defaultCategory="Maintenance" />
                  )}
               </div>
            </div>
         </main>

      </div>
   );
};

const MiniEMS = ({ icon, label, value, trend, color }: any) => (
   <div className="bg-zinc-900 border border-zinc-800/50 p-4 rounded-3xl flex items-center justify-between group hover:border-zinc-700 transition">
      <div className="flex items-center gap-4">
         <div className={`p-2 rounded-xl bg-zinc-950 border border-zinc-800/50 ${color}`}>
            {icon}
         </div>
         <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{label}</div>
            <div className={`text-sm font-bold text-zinc-100 mt-0.5`}>{value}</div>
         </div>
      </div>
      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${trend.includes('-') ? 'bg-emerald-500/10 text-emerald-500' :
         trend.includes('+') ? 'bg-rose-500/10 text-rose-500' : 'bg-zinc-800 text-zinc-500'
         }`}>
         {trend}
      </div>
   </div>
);

export default EngineeringHub;
