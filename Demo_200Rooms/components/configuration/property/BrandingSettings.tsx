import React from 'react';
import { PropertyConfiguration } from '../../../types/configuration';
import { Palette, Upload, Image } from 'lucide-react';

interface BrandingSettingsProps {
    config: PropertyConfiguration;
    onChange: (config: PropertyConfiguration) => void;
}

const BrandingSettings: React.FC<BrandingSettingsProps> = ({ config, onChange }) => {
    const handleBrandChange = (field: string, value: string) => {
        onChange({
            ...config,
            branding: { ...config.branding, [field]: value }
        });
    };

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Palette size={20} className="text-violet-500" />
                    Visual Identity
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Color Palette */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-zinc-400 uppercase">Brand Colors</h4>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Primary Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={config.branding.primaryColor}
                                        onChange={(e) => handleBrandChange('primaryColor', e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={config.branding.primaryColor}
                                        onChange={(e) => handleBrandChange('primaryColor', e.target.value)}
                                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm uppercase w-full focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-zinc-500 mb-1 block">Secondary Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={config.branding.secondaryColor}
                                        onChange={(e) => handleBrandChange('secondaryColor', e.target.value)}
                                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent"
                                    />
                                    <input
                                        type="text"
                                        value={config.branding.secondaryColor}
                                        onChange={(e) => handleBrandChange('secondaryColor', e.target.value)}
                                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm uppercase w-full focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-zinc-400 uppercase">Property Logo</h4>

                        <div className="border-2 border-dashed border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-violet-500/50 transition cursor-pointer bg-zinc-950/50">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-violet-500">
                                <Image size={24} />
                            </div>
                            <p className="text-sm font-medium text-white mb-1">Click to upload brand logo</p>
                            <p className="text-xs text-zinc-500">SVG, PNG, JPG (Max 2MB)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-medium text-zinc-400 uppercase mb-4">Live Preview</h3>
                <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800 flex items-center justify-center gap-4">
                    <button
                        className="px-6 py-2.5 rounded-lg text-white font-medium shadow-lg transition-transform hover:scale-105"
                        style={{ backgroundColor: config.branding.primaryColor }}
                    >
                        Primary Action
                    </button>
                    <button
                        className="px-6 py-2.5 rounded-lg text-white font-medium shadow-lg transition-transform hover:scale-105"
                        style={{ backgroundColor: config.branding.secondaryColor }}
                    >
                        Secondary Action
                    </button>
                    <div className="px-6 py-2.5 rounded-lg border border-zinc-700 text-zinc-300">
                        Ghost Button
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandingSettings;
