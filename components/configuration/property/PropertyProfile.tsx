import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Building2 } from 'lucide-react';
import { PropertyConfiguration, defaultPropertyConfig } from '../../../types/configuration';
import { getPropertyConfig, savePropertyConfig } from '../../../services/kernel/persistence';
import GeneralSettings from './GeneralSettings';
import OperationsSettings from './OperationsSettings';
import FeatureSettings from './FeatureSettings';
import BrandingSettings from './BrandingSettings';

const PropertyProfile: React.FC = () => {
    const [config, setConfig] = useState<PropertyConfiguration>(defaultPropertyConfig);
    const [loading, setLoading] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
    const [activeSection, setActiveSection] = useState<'general' | 'operations' | 'features' | 'branding'>('general');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        // Load config from persistence
        const loadedConfig = getPropertyConfig();
        setConfig(loadedConfig);
        setLoading(false);
    }, []);

    const handleChange = (newConfig: PropertyConfiguration) => {
        setConfig(newConfig);
        setIsDirty(true);
        setSaveStatus('idle');
    };

    const handleSave = () => {
        setSaveStatus('saving');

        // Simulate API delay
        setTimeout(() => {
            savePropertyConfig({ ...config, lastUpdated: new Date().toISOString() });
            setSaveStatus('saved');
            setIsDirty(false);

            // Revert status after 2 seconds
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 800);
    };

    if (loading) {
        return <div className="text-center p-12 text-zinc-500">Loading Configuration...</div>;
    }

    return (
        <div className="flex h-[calc(100vh-8rem)]">
            {/* Inner Sidebar */}
            <div className="w-64 border-r border-zinc-800 pr-6 mr-6 flex flex-col gap-2">
                <button
                    onClick={() => setActiveSection('general')}
                    className={`text-left px-4 py-3 rounded-xl transition-all ${activeSection === 'general' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                    <span className="font-semibold block">General Info</span>
                    <span className="text-xs opacity-70">Name, Address, Contact</span>
                </button>
                <button
                    onClick={() => setActiveSection('operations')}
                    className={`text-left px-4 py-3 rounded-xl transition-all ${activeSection === 'operations' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                    <span className="font-semibold block">Operations</span>
                    <span className="text-xs opacity-70">Policies, Timing, Finance</span>
                </button>
                <button
                    onClick={() => setActiveSection('features')}
                    className={`text-left px-4 py-3 rounded-xl transition-all ${activeSection === 'features' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                    <span className="font-semibold block">Amenities</span>
                    <span className="text-xs opacity-70">Facilities & Features</span>
                </button>
                <button
                    onClick={() => setActiveSection('branding')}
                    className={`text-left px-4 py-3 rounded-xl transition-all ${activeSection === 'branding' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                    <span className="font-semibold block">Branding</span>
                    <span className="text-xs opacity-70">Colors, Logo, Identity</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Building2 className="text-violet-500" />
                            {config.name || 'Property Setup'}
                        </h2>
                        <p className="text-sm text-zinc-500 mt-1">Last updated: {new Date(config.lastUpdated).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {isDirty && <span className="text-xs text-amber-500 font-medium">Unsaved Changes</span>}
                        <button
                            onClick={handleSave}
                            disabled={!isDirty || saveStatus === 'saving'}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg
                                ${saveStatus === 'saved'
                                    ? 'bg-emerald-500 text-white'
                                    : isDirty
                                        ? 'bg-violet-600 hover:bg-violet-700 text-white'
                                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                        >
                            {saveStatus === 'saving' ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                            {saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 pb-12 custom-scrollbar">
                    {activeSection === 'general' && <GeneralSettings config={config} onChange={handleChange} />}
                    {activeSection === 'operations' && <OperationsSettings config={config} onChange={handleChange} />}
                    {activeSection === 'features' && <FeatureSettings config={config} onChange={handleChange} />}
                    {activeSection === 'branding' && <BrandingSettings config={config} onChange={handleChange} />}
                </div>
            </div>
        </div>
    );
};

export default PropertyProfile;
