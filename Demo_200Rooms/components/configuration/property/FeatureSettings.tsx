import React from 'react';
import { PropertyConfiguration } from '../../../types/configuration';
import { Wifi, Car, Waves, Dumbbell, Utensils, Wine, Coffee, Sparkles } from 'lucide-react';

interface FeatureSettingsProps {
    config: PropertyConfiguration;
    onChange: (config: PropertyConfiguration) => void;
}

const FeatureSettings: React.FC<FeatureSettingsProps> = ({ config, onChange }) => {
    const handleFeatureToggle = (field: string) => {
        onChange({
            ...config,
            features: {
                ...config.features,
                [field]: !config.features[field as keyof typeof config.features]
            }
        });
    };

    const handleWifiChange = (value: 'free' | 'paid' | 'none') => {
        onChange({
            ...config,
            features: { ...config.features, wifi: value }
        });
    };

    const features = [
        { id: 'parking', label: 'Parking Available', icon: Car },
        { id: 'pool', label: 'Swimming Pool', icon: Waves },
        { id: 'gym', label: 'Fitness Center', icon: Dumbbell },
        { id: 'spa', label: 'Spa Services', icon: Sparkles },
        { id: 'restaurant', label: 'On-site Restaurant', icon: Utensils },
        { id: 'bar', label: 'Bar / Lounge', icon: Wine },
        { id: 'roomService', label: 'Room Service', icon: Coffee },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6">Property Amenities</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature) => {
                        const Icon = feature.icon;
                        const isEnabled = config.features[feature.id as keyof typeof config.features];

                        return (
                            <button
                                key={feature.id}
                                onClick={() => handleFeatureToggle(feature.id)}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                                    ${isEnabled
                                        ? 'bg-violet-600/10 border-violet-500/50 hover:bg-violet-600/20'
                                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isEnabled ? 'bg-violet-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`font-medium ${isEnabled ? 'text-white' : 'text-zinc-400'}`}>
                                        {feature.label}
                                    </span>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isEnabled ? 'bg-violet-600' : 'bg-zinc-800'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Wifi size={20} className="text-violet-500" />
                    Connectivity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['free', 'paid', 'none'].map((option) => (
                        <button
                            key={option}
                            onClick={() => handleWifiChange(option as any)}
                            className={`p-4 rounded-xl border text-center transition
                                ${config.features.wifi === option
                                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                        >
                            <span className="capitalize font-medium block">{option} Wi-Fi</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeatureSettings;
