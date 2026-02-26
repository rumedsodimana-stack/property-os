
import React, { useState, useEffect, useMemo } from 'react';
import { Zap, Thermometer, Droplet, Activity, AlertTriangle, ShieldCheck, RefreshCw, Layers, Cpu, Radio, Power, Gauge, BarChart3, Bell, Settings, Search, X } from 'lucide-react';
import OracleWidget from '../shared/OracleWidget';
import { botEngine } from '../../services/kernel/systemBridge';

type DeviceType = 'Climate' | 'Lighting' | 'Utility' | 'Transport' | 'Power' | 'Security';

interface IotDevice {
    id: string;
    name: string;
    status: 'Online' | 'Offline' | 'Warning' | 'Critical' | 'Optimal';
    type: DeviceType;
    // Dynamic props
    temp?: number;
    load?: number;
    energy?: number;
    brightness?: number;
    power?: number;
    flow?: number;
    pressure?: number;
    floor?: number;
    direction?: 'Up' | 'Down' | 'Idle';
    charge?: number;
    activeNodes?: number;
    health?: number;
}

const IOTControlCenter: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDevice, setSelectedDevice] = useState<IotDevice | null>(null);

    const [devices, setDevices] = useState<IotDevice[]>([
        { id: 'hvac_01', name: 'Lobby HVAC Unit 1', status: 'Online', type: 'Climate', temp: 22.4, load: 65, energy: 4.2 },
        { id: 'hvac_02', name: 'Rooftop AHU-4', status: 'Warning', type: 'Climate', temp: 24.8, load: 88, energy: 6.8 },
        { id: 'lgt_lby', name: 'Lobby Lighting Grid', status: 'Online', type: 'Lighting', brightness: 75, power: 1.2 },
        { id: 'wtr_main', name: 'Main Water Inflow', status: 'Online', type: 'Utility', flow: 124, pressure: 55 },
        { id: 'elev_01', name: 'Guest Elevator A', status: 'Online', type: 'Transport', floor: 12, direction: 'Up' },
        { id: 'pwr_ups', name: 'Data Center UPS', status: 'Optimal', type: 'Power', charge: 100, load: 22 },
        { id: 'iot_cam_01', name: 'Perimeter Sensor Net', status: 'Online', type: 'Security', activeNodes: 42, health: 99 },
        { id: 'hvac_03', name: 'Conference Hall HVAC', status: 'Offline', type: 'Climate', temp: 0, load: 0, energy: 0 },
        { id: 'lgt_corr', name: 'Corridor Smart LED', status: 'Online', type: 'Lighting', brightness: 40, power: 0.8 },
    ]);

    const [realtimeMetrics, setRealtimeMetrics] = useState({
        totalConsumption: 442,
        gridStability: 99.8,
        activeAlerts: 2,
        systemEfficiency: 88
    });

    // Simulated Real-time Data
    useEffect(() => {
        const interval = setInterval(() => {
            setRealtimeMetrics(prev => ({
                ...prev,
                totalConsumption: prev.totalConsumption + (Math.random() - 0.5) * 5,
                gridStability: Math.min(100, Math.max(90, prev.gridStability + (Math.random() - 0.5) * 0.1)),
                systemEfficiency: Math.min(100, Math.max(80, prev.systemEfficiency + (Math.random() - 0.5) * 0.5))
            }));

            // Randomly update a device
            setDevices(prevDevices => prevDevices.map(d => {
                if (Math.random() > 0.7) {
                    if (d.type === 'Climate') return { ...d, temp: Number((d.temp! + (Math.random() - 0.5)).toFixed(1)) };
                    if (d.type === 'Utility') return { ...d, flow: Number((d.flow! + (Math.random() - 0.5) * 5).toFixed(0)) };
                    if (d.type === 'Power') return { ...d, load: Math.min(100, Math.max(0, Number((d.load! + (Math.random() - 0.5) * 2).toFixed(0)))) };
                }
                return d;
            }));

        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const filteredDevices = useMemo(() => {
        return devices.filter(d => {
            const matchesTab = selectedTab === 'All' || d.type === selectedTab;
            const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.id.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [devices, selectedTab, searchQuery]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Online':
            case 'Optimal': return 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
            case 'Warning': return 'text-amber-500 border-amber-500/30 bg-amber-500/10';
            case 'Critical':
            case 'Offline': return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
            default: return 'text-zinc-500 border-zinc-800 bg-zinc-900';
        }
    };

    const handleDeviceAction = (device: IotDevice, action: string) => {
        botEngine.logActivity('IOT', action, `Manual override on ${device.id}`, 'Admin_Console');
        // Visual feedback could be added here
        alert(`Command '${action}' sent to ${device.name}`);
    };

    return (
        <div className="module-container">
            <div className="module-header glass-panel border border-cyan-500/20">
                <div className="module-header-v2-branding justify-between">
                    <div className="flex items-center gap-4">
                        <div className="module-header-v2-icon-alt">
                            <Radio className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div>
                            <h1 className="module-header-v2-title text-cyan-50">IOT Control Center</h1>
                            <p className="module-header-v2-subtitle uppercase tracking-widest">Autonomous Smart Grid · Real-time Telemetry</p>
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-4">
                        {/* Search Bar (Condensed for V2 Header) */}
                        <div className="relative group">
                            <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 shadow-xl transition-all focus-within:border-cyan-500/50">
                                <Search className="w-3.5 h-3.5 text-zinc-500" />
                                <input
                                    type="text"
                                    placeholder="Search nodes..."
                                    className="w-32 bg-transparent border-none outline-none ml-2 text-[11px] text-zinc-200 placeholder:text-zinc-600 focus:w-48 transition-all duration-300"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            Stable
                        </div>
                    </div>
                </div>

                {/* Standardized V2 Tab Bar */}
                <div className="module-tabs-v2">
                    {[
                        { id: 'All', label: 'All Clusters', icon: Layers },
                        { id: 'Climate', label: 'Climate', icon: Thermometer },
                        { id: 'Lighting', label: 'Lighting', icon: Zap },
                        { id: 'Utility', label: 'Utility', icon: Droplet },
                        { id: 'Power', label: 'Power', icon: Cpu },
                        { id: 'Security', label: 'Security', icon: ShieldCheck },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedTab(item.id)}
                            className={`module-tab-v2 ${selectedTab === item.id ? 'active' : ''}`}
                        >
                            <item.icon className="w-3.5 h-3.5" />
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="module-tab-divider" />
            </div>

            <main className="module-body flex-1 overflow-hidden flex gap-6 p-6">
                {/* Left Column: Device Grid */}
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-4 flex-shrink-0">
                        <MetricCard title="Total Energy Draw" value={`${realtimeMetrics.totalConsumption.toFixed(1)} kW`} icon={<Zap className="w-4 h-4" />} color="text-amber-400" bg="bg-amber-400/10" borderColor="border-amber-400/20" />
                        <MetricCard title="Grid Stability" value={`${realtimeMetrics.gridStability.toFixed(1)}%`} icon={<Activity className="w-4 h-4" />} color="text-cyan-400" bg="bg-cyan-400/10" borderColor="border-cyan-400/20" />
                        <MetricCard title="Efficiency Score" value={`${realtimeMetrics.systemEfficiency.toFixed(0)}/100`} icon={<Gauge className="w-4 h-4" />} color="text-emerald-400" bg="bg-emerald-400/10" borderColor="border-emerald-400/20" />
                        <MetricCard title="Active Alerts" value={realtimeMetrics.activeAlerts.toString()} icon={<AlertTriangle className="w-4 h-4" />} color="text-rose-400" bg="bg-rose-400/10" borderColor="border-rose-400/20" />
                    </div>

                    {/* Scrollable Device List */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {filteredDevices.map(device => (
                            <div
                                key={device.id}
                                onClick={() => setSelectedDevice(device)}
                                className={`group flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 rounded-2xl cursor-pointer transition-all hover:bg-zinc-800/50 hover:border-zinc-700 ${selectedDevice?.id === device.id ? 'border-cyan-500/50 bg-cyan-900/5' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl border ${device.status === 'Offline' ? 'bg-zinc-950 border-zinc-800 grayscale opacity-50' : 'bg-zinc-950 border-zinc-800'}`}>
                                        {device.type === 'Climate' && <Thermometer className="w-5 h-5 text-amber-500" />}
                                        {device.type === 'Lighting' && <Zap className="w-5 h-5 text-yellow-400" />}
                                        {device.type === 'Utility' && <Droplet className="w-5 h-5 text-blue-500" />}
                                        {device.type === 'Power' && <Cpu className="w-5 h-5 text-emerald-500" />}
                                        {device.type === 'Security' && <ShieldCheck className="w-5 h-5 text-violet-500" />}
                                        {device.type === 'Transport' && <Layers className="w-5 h-5 text-zinc-400" />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{device.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{device.id}</span>
                                            <span className="text-zinc-700 mx-1">•</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getStatusColor(device.status)}`}>{device.status}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats inline */}
                                <div className="flex items-center gap-8 mr-4 opacity-60 group-hover:opacity-100 transition-opacity">
                                    {device.temp && (
                                        <div className="text-right">
                                            <div className="text-[9px] text-zinc-500 uppercase font-bold">Temp</div>
                                            <div className="text-xs font-mono text-zinc-300">{device.temp}°C</div>
                                        </div>
                                    )}
                                    {device.load !== undefined && (
                                        <div className="text-right">
                                            <div className="text-[9px] text-zinc-500 uppercase font-bold">Load</div>
                                            <div className="text-xs font-mono text-zinc-300">{device.load}%</div>
                                        </div>
                                    )}
                                    {device.type === 'Security' && (
                                        <div className="text-right">
                                            <div className="text-[9px] text-zinc-500 uppercase font-bold">Nodes</div>
                                            <div className="text-xs font-mono text-zinc-300">{device.activeNodes}</div>
                                        </div>
                                    )}
                                    <div className="p-2 rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-cyan-500 group-hover:text-white transition-colors shadow-lg">
                                        <Settings className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                {/* Right Column: Inspector & Insights */}
                <div className="w-96 flex flex-col gap-6 flex-shrink-0">

                    {/* Device Inspector Panel */}
                    <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl flex flex-col">
                        {selectedDevice ? (
                            <>
                                <div className="absolute top-0 right-0 p-4">
                                    <button onClick={() => setSelectedDevice(null)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mb-6 text-center pt-4">
                                    <div className="w-16 h-16 mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-black/20">
                                        {selectedDevice.type === 'Climate' && <Thermometer className="w-8 h-8 text-amber-500" />}
                                        {selectedDevice.type === 'Lighting' && <Zap className="w-8 h-8 text-yellow-400" />}
                                        {selectedDevice.type === 'Utility' && <Droplet className="w-8 h-8 text-blue-500" />}
                                        {selectedDevice.type === 'Power' && <Cpu className="w-8 h-8 text-emerald-500" />}
                                        {selectedDevice.type === 'Security' && <ShieldCheck className="w-8 h-8 text-violet-500" />}
                                        {selectedDevice.type === 'Transport' && <Layers className="w-8 h-8 text-zinc-400" />}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">{selectedDevice.name}</h3>
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(selectedDevice.status)}`}>
                                        {selectedDevice.status}
                                    </span>
                                </div>

                                <div className="space-y-4 flex-1">
                                    <div className="p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-xl">
                                        <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3 border-b border-zinc-800 pb-2">Diagnostic Data</h4>
                                        <div className="space-y-2">
                                            {Object.entries(selectedDevice).map(([key, value]) => {
                                                if (['id', 'name', 'status', 'type'].includes(key)) return null;
                                                return (
                                                    <div key={key} className="flex justify-between items-center text-xs">
                                                        <span className="text-zinc-400 capitalize">{key}</span>
                                                        <span className="font-mono text-zinc-200">{value}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleDeviceAction(selectedDevice, 'RESTART')}
                                            className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex flex-col items-center gap-2 transition"
                                        >
                                            <RefreshCw className="w-4 h-4 text-zinc-400" />
                                            <span className="text-[10px] font-bold text-zinc-300">RESTART</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeviceAction(selectedDevice, 'DIAGNOSTIC')}
                                            className="p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl flex flex-col items-center gap-2 transition"
                                        >
                                            <Activity className="w-4 h-4 text-zinc-400" />
                                            <span className="text-[10px] font-bold text-zinc-300">TEST</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeviceAction(selectedDevice, 'SHUTDOWN')}
                                            className="col-span-2 p-3 bg-rose-900/20 hover:bg-rose-900/30 border border-rose-900/40 rounded-xl flex flex-col items-center gap-2 transition group"
                                        >
                                            <Power className="w-4 h-4 text-rose-500 group-hover:text-rose-400" />
                                            <span className="text-[10px] font-bold text-rose-500 group-hover:text-rose-400">EMERGENCY SHUTDOWN</span>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
                                <Radio className="w-12 h-12 text-zinc-500 mb-4 animate-pulse" />
                                <p className="text-sm text-zinc-300 font-medium">Select a device to view diagnostics</p>
                            </div>
                        )}
                    </div>

                    <div className="h-1/3">
                        <OracleWidget context={{ moduleId: 'IOT', fieldId: selectedDevice?.id || 'GLOBAL' }} />
                    </div>

                </div>
            </main>
        </div>
    );
};

const MetricCard = ({ title, value, icon, color, bg, borderColor }: any) => (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between h-28 relative overflow-hidden group hover:border-zinc-700 transition">
        <div className={`absolute top-0 right-0 w-16 h-16 ${bg} rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>

        <div className="flex justify-between items-start mb-2 relative z-10">
            <div className={`p-2 rounded-lg border ${bg} ${borderColor} ${color}`}>
                {icon}
            </div>
            <Activity className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition" />
        </div>

        <div className="relative z-10">
            <div className="text-2xl font-mono text-zinc-100 font-medium tracking-tighter">{value}</div>
            <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">{title}</div>
        </div>
    </div>
);

export default IOTControlCenter;
