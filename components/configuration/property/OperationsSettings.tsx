import React from 'react';
import { PropertyConfiguration } from '../../../types/configuration';
import { Clock, DollarSign, Calendar, Map } from 'lucide-react';

interface OperationsSettingsProps {
    config: PropertyConfiguration;
    onChange: (config: PropertyConfiguration) => void;
}

const OperationsSettings: React.FC<OperationsSettingsProps> = ({ config, onChange }) => {
    const handleOpChange = (field: string, value: any) => {
        onChange({
            ...config,
            operations: { ...config.operations, [field]: value }
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-violet-500" />
                    Timing & Policies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Check-In Time</label>
                        <input
                            type="time"
                            value={config.operations.checkInTime}
                            onChange={(e) => handleOpChange('checkInTime', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Check-Out Time</label>
                        <input
                            type="time"
                            value={config.operations.checkOutTime}
                            onChange={(e) => handleOpChange('checkOutTime', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Time Zone</label>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus-within:border-violet-500 transition">
                            <Map size={16} className="text-zinc-500" />
                            <select
                                value={config.operations.timezone}
                                onChange={(e) => handleOpChange('timezone', e.target.value)}
                                className="w-full bg-transparent text-white focus:outline-none appearance-none"
                            >
                                <option value="UTC-12">UTC-12:00</option>
                                <option value="UTC-8">UTC-08:00 (Pacific Time)</option>
                                <option value="UTC-5">UTC-05:00 (Eastern Time)</option>
                                <option value="UTC+0">UTC+00:00 (London)</option>
                                <option value="UTC+4">UTC+04:00 (Dubai)</option>
                                <option value="UTC+8">UTC+08:00 (Singapore)</option>
                                <option value="UTC+9">UTC+09:00 (Tokyo)</option>
                            </select>
                        </div>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Cancellation Policy (Default)</label>
                        <div className="grid grid-cols-2 gap-4">
                            {['flexible', 'moderate', 'strict', 'non_refundable'].map((policy) => (
                                <button
                                    key={policy}
                                    onClick={() => handleOpChange('cancellationPolicy', policy)}
                                    className={`px-4 py-3 rounded-lg border text-sm font-medium capitalize text-left transition
                                        ${config.operations.cancellationPolicy === policy
                                            ? 'bg-violet-600 border-violet-500 text-white'
                                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
                                >
                                    {policy.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-violet-500" />
                    Financial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Primary Currency</label>
                        <select
                            value={config.operations.currency}
                            onChange={(e) => handleOpChange('currency', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        >
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="JPY">JPY (¥)</option>
                            <option value="AED">AED (د.إ)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationsSettings;
