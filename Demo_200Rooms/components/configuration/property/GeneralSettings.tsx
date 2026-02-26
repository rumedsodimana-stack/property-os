import React from 'react';
import { PropertyConfiguration } from '../../../types/configuration';
import { Building2, Globe, Phone, MapPin } from 'lucide-react';

interface GeneralSettingsProps {
    config: PropertyConfiguration;
    onChange: (config: PropertyConfiguration) => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ config, onChange }) => {
    const handleChange = (field: keyof PropertyConfiguration, value: any) => {
        onChange({ ...config, [field]: value });
    };

    const handleAddressChange = (field: string, value: string) => {
        onChange({
            ...config,
            address: { ...config.address, [field]: value }
        });
    };

    const handleContactChange = (field: string, value: string) => {
        onChange({
            ...config,
            contact: { ...config.contact, [field]: value }
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Building2 size={20} className="text-violet-500" />
                    Property Identity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Property Name</label>
                        <input
                            type="text"
                            value={config.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Brand Name</label>
                        <input
                            type="text"
                            value={config.brandName || ''}
                            onChange={(e) => handleChange('brandName', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Property Type</label>
                        <select
                            value={config.type}
                            onChange={(e) => handleChange('type', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        >
                            <option value="Hotel">Hotel</option>
                            <option value="Resort">Resort</option>
                            <option value="Motel">Motel</option>
                            <option value="Boutique">Boutique</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-violet-500" />
                    Location
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Street Address</label>
                        <input
                            type="text"
                            value={config.address.street}
                            onChange={(e) => handleAddressChange('street', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">City</label>
                        <input
                            type="text"
                            value={config.address.city}
                            onChange={(e) => handleAddressChange('city', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">State/Province</label>
                        <input
                            type="text"
                            value={config.address.state}
                            onChange={(e) => handleAddressChange('state', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Postal Code</label>
                        <input
                            type="text"
                            value={config.address.postalCode}
                            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Country</label>
                        <input
                            type="text"
                            value={config.address.country}
                            onChange={(e) => handleAddressChange('country', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Phone size={20} className="text-violet-500" />
                    Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Phone Number</label>
                        <input
                            type="tel"
                            value={config.contact.phone}
                            onChange={(e) => handleContactChange('phone', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Email Address</label>
                        <input
                            type="email"
                            value={config.contact.email}
                            onChange={(e) => handleContactChange('email', e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 transition"
                        />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-medium text-zinc-400 uppercase">Website</label>
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 focus-within:border-violet-500 transition">
                            <Globe size={16} className="text-zinc-500" />
                            <input
                                type="url"
                                value={config.contact.website}
                                onChange={(e) => handleContactChange('website', e.target.value)}
                                className="w-full bg-transparent text-white focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;
