import React, { useState, useEffect, useRef } from 'react';
import { Network, Shield, ShieldAlert, Cpu, Printer, CreditCard, ScanLine, Key, Wifi, RefreshCw, CheckCircle, AlertOctagon, XCircle, Settings, Lock } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/kernel/firebase';

interface Device {
    id: string;
    type: 'ENCODER' | 'PRINTER' | 'SCANNER' | 'PAYMENT' | 'UNKNOWN';
    ip: string;
    mac: string;
    model: string;
    status: 'QUARANTINE' | 'APPROVED' | 'OFFLINE';
    lastSeen: string;
    mappedStation: string | null;
}

const HardwareCommandCenter: React.FC = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [isApproving, setIsApproving] = useState(false);
    const selectedDeviceRef = useRef<Device | null>(null);
    selectedDeviceRef.current = selectedDevice;

    // Live sync with the Singularity Edge Node via Firestore
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'hardware_devices'), (snapshot) => {
            const liveDevices: Device[] = [];
            snapshot.forEach((doc) => {
                liveDevices.push({ id: doc.id, ...doc.data() } as Device);
            });
            setDevices(liveDevices);

            // Update the selected device panel if it's currently open and its data changes
            const current = selectedDeviceRef.current;
            if (current) {
                const updatedSelected = liveDevices.find(d => d.id === current.id);
                if (updatedSelected) setSelectedDevice(updatedSelected);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleScanNetwork = () => {
        setIsScanning(true);
        // The UI button is now just a visual indicator. 
        // The actual scanning is performed by the external Edge Node daemon script.
        setTimeout(() => setIsScanning(false), 3000);
    };

    const handleApproveDevice = async (deviceId: string) => {
        setIsApproving(true);
        try {
            await updateDoc(doc(db, 'hardware_devices', deviceId), {
                status: 'APPROVED',
                model: 'Verified Terminal (Singularity Trusted)' // In a real app the user might type this
            });
            setSelectedDevice(null);
        } catch (error) {
            console.error("Failed to approve device:", error);
        } finally {
            setIsApproving(false);
        }
    };

    const handleRevokeDevice = async (deviceId: string) => {
        try {
            await updateDoc(doc(db, 'hardware_devices', deviceId), {
                status: 'QUARANTINE',
                mappedStation: null
            });
            setSelectedDevice(null);
        } catch (error) {
            console.error("Failed to revoke device:", error);
        }
    };

    const getDeviceIcon = (type: string) => {
        switch (type) {
            case 'ENCODER': return <Key size={20} />;
            case 'PRINTER': return <Printer size={20} />;
            case 'SCANNER': return <ScanLine size={20} />;
            case 'PAYMENT': return <CreditCard size={20} />;
            default: return <Cpu size={20} />;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-zinc-950 p-8 space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Lock className="text-emerald-500" /> Secure Hardware & IoT
                    </h1>
                    <p className="text-zinc-400 mt-2">Zero-Trust architecture. Live syncing with physical Edge Node.</p>
                </div>

                <button
                    onClick={handleScanNetwork}
                    disabled={isScanning}
                    className="px-6 py-3 bg-zinc-900 border border-zinc-700 hover:border-emerald-500 hover:bg-zinc-800 text-white rounded-xl font-bold transition flex items-center gap-2 shadow-lg"
                >
                    {isScanning ? <RefreshCw className="animate-spin text-emerald-500" size={18} /> : <Wifi size={18} />}
                    {isScanning ? 'Pinging Edge Node...' : 'Trigger Edge Scan'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column - Radar & List */}
                <div className="lg:col-span-2 space-y-6">

                    {/* The Quarantine Zone */}
                    {devices.some(d => d.status === 'QUARANTINE') && (
                        <div className="bg-rose-950/20 border border-rose-500/50 rounded-3xl p-6 relative overflow-hidden animate-pulse">
                            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldAlert className="text-rose-500" size={24} />
                                <h2 className="text-lg font-bold text-rose-500">QUARANTINE ZONE: Unauthorized Hardware Detected</h2>
                            </div>
                            <p className="text-sm text-rose-200/70 mb-4">
                                The Singularity Edge Node detected a new physical device plugged into the hotel network.
                                Under our Zero-Trust policy, this device is isolated and cannot touch Singularity OS data until Cryptographically Approved.
                            </p>

                            <div className="space-y-3">
                                {devices.filter(d => d.status === 'QUARANTINE').map(device => (
                                    <div
                                        key={device.id}
                                        onClick={() => setSelectedDevice(device)}
                                        className={`bg-zinc-950/50 border ${selectedDevice?.id === device.id ? 'border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'border-rose-900/50'} rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-rose-500/80 transition`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500">
                                                {getDeviceIcon(device.type)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{device.model}</div>
                                                <div className="text-xs text-zinc-500 font-mono">IP: {device.ip} • MAC: {device.mac}</div>
                                            </div>
                                        </div>
                                        <div className="text-rose-500 text-xs font-bold uppercase tracking-widest px-3 py-1 bg-rose-500/10 rounded">
                                            Untrusted
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {devices.length === 0 && (
                        <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl p-12 text-center">
                            <Wifi className="text-zinc-700 mx-auto mb-4" size={48} />
                            <h3 className="text-xl font-bold text-zinc-300 mb-2">Awaiting Edge Node</h3>
                            <p className="text-zinc-500">No devices detected. Please start the local Singularity Edge Node scanner daemon.</p>
                        </div>
                    )}

                    {/* Approved Devices */}
                    {devices.some(d => d.status !== 'QUARANTINE') && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Shield className="text-emerald-500" size={20} />
                                <h2 className="text-lg font-bold text-white">Cryptographically Approved Devices</h2>
                            </div>

                            <div className="space-y-3">
                                {devices.filter(d => d.status !== 'QUARANTINE').map(device => (
                                    <div
                                        key={device.id}
                                        onClick={() => setSelectedDevice(device)}
                                        className={`bg-zinc-950/50 border ${selectedDevice?.id === device.id ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-zinc-800/50'} rounded-xl p-4 flex items-center justify-between cursor-pointer hover:border-zinc-700 transition`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${device.status === 'OFFLINE' ? 'bg-zinc-800 text-zinc-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                {getDeviceIcon(device.type)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white flex items-center gap-2">
                                                    {device.model}
                                                    {device.status === 'OFFLINE' && <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded uppercase">Offline</span>}
                                                </div>
                                                <div className="text-xs text-zinc-500 font-mono mt-0.5">
                                                    IP: {device.ip} • Mapped to: <span className="text-zinc-300">{device.mappedStation || 'Unassigned'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-zinc-500">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Column - Device Inspector panel */}
                <div>
                    {selectedDevice ? (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden sticky top-8">
                            <div className={`p-6 border-b border-zinc-800 bg-gradient-to-r ${selectedDevice.status === 'QUARANTINE' ? 'from-rose-500/10' : selectedDevice.status === 'OFFLINE' ? 'from-zinc-500/10' : 'from-emerald-500/10'} to-transparent`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedDevice.status === 'QUARANTINE' ? 'bg-rose-500/20 text-rose-400' : selectedDevice.status === 'OFFLINE' ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        {getDeviceIcon(selectedDevice.type)}
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded border ${selectedDevice.status === 'QUARANTINE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : selectedDevice.status === 'OFFLINE' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                        {selectedDevice.status}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-white">{selectedDevice.model}</h3>
                                <p className="text-xs text-zinc-400 mt-1 uppercase tracking-wider">{selectedDevice.type} PERIPHERAL</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">IP Address</span>
                                        <span className="text-white font-mono">{selectedDevice.ip}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">MAC Address</span>
                                        <span className="text-white font-mono">{selectedDevice.mac}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Last Seen</span>
                                        <span className="text-white">{selectedDevice.lastSeen}</span>
                                    </div>
                                </div>

                                <div className="border-t border-zinc-800 pt-6">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Workstation Mapping</h4>
                                    {selectedDevice.status === 'QUARANTINE' ? (
                                        <p className="text-sm text-rose-400 flex items-center gap-2">
                                            <AlertOctagon size={16} /> Device must be approved before mapping.
                                        </p>
                                    ) : (
                                        <select
                                            value={selectedDevice.mappedStation || ''}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50"
                                            onChange={async (e) => {
                                                // Live Database Write for mapping
                                                await updateDoc(doc(db, 'hardware_devices', selectedDevice.id), {
                                                    mappedStation: e.target.value || null
                                                });
                                            }}
                                        >
                                            <option value="">-- Unassigned (Floating) --</option>
                                            <option value="TERM_FRONTDESK_1">Front Desk Terminal 1</option>
                                            <option value="TERM_FRONTDESK_2">Front Desk Terminal 2</option>
                                            <option value="TERM_BACKOFFICE">Back Office Desktop</option>
                                        </select>
                                    )}
                                </div>

                                <div className="pt-4">
                                    {selectedDevice.status === 'QUARANTINE' ? (
                                        <button
                                            onClick={() => handleApproveDevice(selectedDevice.id)}
                                            disabled={isApproving}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                                        >
                                            {isApproving ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                            {isApproving ? 'Generating Cert...' : 'Approve & Issue Certificate'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRevokeDevice(selectedDevice.id)}
                                            className="w-full py-3 bg-zinc-900 border border-rose-900/30 hover:bg-rose-950/30 text-rose-500 rounded-xl font-bold transition flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={18} />
                                            Revoke Trust (Quarantine)
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-zinc-900/30 border border-zinc-900 rounded-3xl border-dashed">
                            <Network className="text-zinc-700 mb-4" size={48} />
                            <h3 className="text-zinc-400 font-bold mb-2">Device Inspector</h3>
                            <p className="text-zinc-600 text-sm">Select any piece of hardware from the network list to inspect its security signature and mapping.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

// Helper component missing from imports in original snippet
const ChevronRight = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

export default HardwareCommandCenter;
