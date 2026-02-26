
import React, { useState, useEffect } from 'react';
import { usePms } from '../../services/kernel/persistence';
import { ShieldCheck, UserCheck, Key, Lock, Eye, Radio, AlertTriangle, Shield, MapPin, Camera, Zap, Activity, Search } from 'lucide-react';
import OracleWidget from '../shared/OracleWidget';
import Inspectable from '../shared/Inspectable';
import { useInspector } from '../../context/InspectorContext';

const SecurityConsole: React.FC = () => {
   const { inspect } = useInspector();
   const { visitors: VISITORS, employees: EMPLOYEES, incidents: MOCK_INCIDENTS, shifts: SHIFTS } = usePms();
   const [activeTab, setActiveTab] = useState<'Operations' | 'Surveillance' | 'Incidents'>('Operations');
   const [isEncoding, setIsEncoding] = useState(false);

   const activeGuards = SHIFTS.filter(s => s.department === 'Security' && s.status === 'ClockedIn')
      .map(s => EMPLOYEES.find(e => e.principal === s.employeeId));

   const handleEncode = () => {
      setIsEncoding(true);
      setTimeout(() => setIsEncoding(false), 2000);
   };

   return (
      <div className="module-container">
         {/* Security Command Header */}
         <div className="module-header glass-panel border border-rose-500/20">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-rose-600/10 border border-rose-500/20 rounded-xl flex items-center justify-center text-rose-400">
                  <Shield className="w-5 h-5" />
               </div>
               <div>
                  <h1 className="text-xl font-light text-white tracking-tight">Security Console</h1>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Sovereign Defense</p>
               </div>
            </div>

            {/* Functional Switcher */}
            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
               {[
                  { id: 'Operations', label: 'Operations', icon: Radio },
                  { id: 'Surveillance', label: 'Monitor', icon: Camera },
                  { id: 'Incidents', label: 'Reports', icon: AlertTriangle },
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
               <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/5 border border-rose-500/20 rounded-xl text-[10px] font-bold text-rose-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  SYSTEM SECURE
               </div>
            </div>
         </div>

         <main className="module-body grid grid-cols-12 gap-8">
            {/* Left Column - Real-time Status */}
            <div className="col-span-8 space-y-8 overflow-y-auto custom-scrollbar pr-4">
               {activeTab === 'Operations' && (
                  <>
                     <div className="module-grid">
                        <StatusCard icon={<Lock className="w-5 h-5" />} label="Perimeter" value="SECURE" color="text-emerald-500" />
                        <StatusCard icon={<UserCheck className="w-5 h-5" />} label="Active Visitors" value={VISITORS.length.toString()} color="text-violet-400" />
                        <StatusCard icon={<ShieldCheck className="w-5 h-5" />} label="Quick Response" value="AVAIL" color="text-teal-400" />
                     </div>

                     <div className="grid grid-cols-2 gap-8">
                        {/* Visitor Log */}
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col min-h-[400px]">
                           <div className="p-5 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
                              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                                 <UserCheck className="w-4 h-4 text-emerald-500" /> Visitor Authorization
                              </h3>
                              <button className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-bold rounded-lg border border-emerald-500/20 transition uppercase">Reg New</button>
                           </div>
                           <div className="flex-1 overflow-y-auto p-4 space-y-3">
                              {VISITORS.map(visitor => (
                                 <div key={visitor.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition group relative overflow-hidden">
                                    <div className="flex justify-between items-start">
                                       <div className="space-y-1">
                                          <Inspectable type="visitor" id={visitor.id}>
                                             <div className="text-sm font-medium text-zinc-100 group-hover:text-violet-400 transition cursor-pointer">{visitor.fullName}</div>
                                          </Inspectable>
                                          <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">
                                             {visitor.purpose}
                                          </div>
                                       </div>
                                       <div className="px-2 py-1 bg-zinc-900 rounded font-mono text-[9px] text-zinc-500 border border-zinc-800">
                                          {visitor.badgeNumber}
                                       </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-zinc-900/50 flex justify-between items-center">
                                       <div className="text-[10px] text-zinc-600 italic">
                                          Auth by: <Inspectable type="employee" id={visitor.hostEmployeeId} className="text-zinc-500 hover:text-zinc-300">@{visitor.hostEmployeeId.split('_')[1]}</Inspectable>
                                       </div>
                                       <span className={`text-[9px] font-bold uppercase ${visitor.status === 'On Site' ? 'text-teal-400' : 'text-zinc-700'}`}>
                                          {visitor.status}
                                       </span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        {/* Access Point Monitor */}
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-6">
                           <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                              <Zap className="w-4 h-4 text-amber-500" /> System Control
                           </h3>

                           <div className="space-y-4">
                              <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
                                 <h4 className="text-[10px] font-bold text-zinc-500 uppercase mb-4 flex items-center gap-2">
                                    <Key className="w-3 h-3 text-violet-500" /> RFID Encoder (S-21)
                                 </h4>
                                 <div className="space-y-4">
                                    <input className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 outline-none focus:border-violet-500 transition" placeholder="Target Principal ID" />
                                    <div className="flex gap-2">
                                       <select className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-400 flex-1 outline-none">
                                          <option>Level 4 (Master)</option>
                                          <option>Level 3 (Manager)</option>
                                          <option>Level 2 (Staff)</option>
                                          <option>Level 1 (Guest)</option>
                                       </select>
                                    </div>
                                    <button
                                       onClick={handleEncode}
                                       disabled={isEncoding}
                                       className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${isEncoding ? 'bg-zinc-800 text-zinc-500' : 'bg-violet-600 hover:bg-violet-500 text-white'
                                          }`}
                                    >
                                       {isEncoding ? <Activity className="w-3 h-3 animate-pulse" /> : <Radio className="w-3 h-3" />}
                                       {isEncoding ? 'ENCODING...' : 'INITIALIZE KEY'}
                                    </button>
                                 </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Main Lift</span>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                 </div>
                                 <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-between">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Back Gate</span>
                                    <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </>
               )}

               {activeTab === 'Surveillance' && (
                  <div className="grid grid-cols-3 gap-6 animate-fadeIn">
                     {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative group">
                           <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-rose-500 text-[8px] font-bold text-white rounded">LIVE</div>
                           <div className="absolute top-2 right-2 text-[8px] font-mono text-zinc-500 uppercase">CAM-0{i}</div>
                           <div className="inset-0 flex items-center justify-center bg-black/40 text-zinc-700">
                              <Camera className="w-8 h-8 opacity-20" />
                           </div>
                           <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black to-transparent p-2">
                              <div className="text-[8px] text-zinc-400 uppercase font-bold tracking-widest">
                                 {['Lobby North', 'Kitchen', 'Pool Area', 'Parking P1', 'Staff Entrance', 'Roof Bar'][i - 1]}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}

               {activeTab === 'Incidents' && (
                  <div className="space-y-4 animate-fadeIn">
                     {MOCK_INCIDENTS.map(incident => (
                        <div key={incident.id} className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 flex gap-6 hover:border-rose-500/30 transition">
                           <div className="p-4 bg-rose-500/10 rounded-2xl">
                              <AlertTriangle className="w-6 h-6 text-rose-500" />
                           </div>
                           <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                 <div>
                                    <h4 className="text-sm font-bold text-zinc-100">{incident.type}</h4>
                                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{incident.id}</div>
                                 </div>
                                 <span className="px-2 py-0.5 bg-rose-500 text-[10px] font-bold text-white rounded uppercase">{incident.priority}</span>
                              </div>
                              <p className="text-xs text-zinc-400 leading-relaxed mb-4">{incident.description}</p>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="text-[10px] text-zinc-600">Reported by: <span className="text-zinc-500 uppercase font-bold">{incident.reportedBy}</span></div>
                                    <div className="text-[10px] text-zinc-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> Area 102</div>
                                 </div>
                                 <div className="text-[10px] text-teal-400 font-bold uppercase">{incident.status}</div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            {/* Right Column - Personnel & Comms */}
            <div className="col-span-4 space-y-8">
               <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2 mb-6 text-teal-400">
                     <ShieldCheck className="w-4 h-4" /> Duty Roster
                  </h3>
                  <div className="space-y-4">
                     {activeGuards.length > 0 ? activeGuards.map(guard => (
                        guard && (
                           <div key={guard.principal} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                 <Inspectable type="employee" id={guard.principal}>
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-zinc-400 text-xs font-bold group-hover:bg-teal-500/10 group-hover:text-teal-400 transition cursor-pointer font-mono">
                                       {guard.fullName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                 </Inspectable>
                                 <div>
                                    <div className="text-xs font-bold text-zinc-200">{guard.fullName}</div>
                                    <div className="text-[9px] text-zinc-500 uppercase tracking-tighter">{guard.role}</div>
                                 </div>
                              </div>
                              <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_8px_#14b8a6]"></div>
                           </div>
                        )
                     )) : (
                        <div className="text-xs text-zinc-600 italic py-4">No security staff currently clocked in.</div>
                     )}
                  </div>
                  <button className="w-full mt-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition border border-zinc-700">
                     Summon Backup
                  </button>
               </div>

               <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-6">
                  <h3 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Emergency Hub</h3>
                  <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">Immediate broadcast to all staff devices and PA systems.</p>
                  <div className="grid grid-cols-2 gap-3">
                     <button className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-bold transition shadow-lg shadow-rose-900/20">FIRE ALERT</button>
                     <button className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-bold transition shadow-lg shadow-rose-900/20">LOCKDOWN</button>
                  </div>
               </div>
            </div>
         </main>

      </div >
   );
};

const StatusCard = ({ icon, label, value, color }: any) => (
   <div className="bg-zinc-900/40 border border-zinc-800 p-5 rounded-3xl flex items-center gap-5">
      <div className={`p-3 rounded-2xl bg-zinc-950 border border-zinc-800/50 ${color}`}>
         {icon}
      </div>
      <div>
         <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</div>
         <div className={`text-xl font-light tracking-tight mt-0.5 ${color === 'text-emerald-500' ? 'text-emerald-400' : 'text-zinc-100'}`}>{value}</div>
      </div>
   </div>
);

export default SecurityConsole;
