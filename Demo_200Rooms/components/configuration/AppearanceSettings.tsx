import React from 'react';
import { useAppearance, Theme, AccentColor, SidebarSize } from '../../src/context/AppearanceContext';

const AppearanceSettings: React.FC = () => {
    const {
        theme, setTheme,
        accentColor, setAccentColor,
        sidebarSize, setSidebarSize,
        allowWallpaperTinting, setAllowWallpaperTinting
    } = useAppearance();

    const colors: { id: AccentColor; hex: string; label: string }[] = [
        { id: 'multicolor', hex: 'linear-gradient(to right, #AF52DE, #FF2D55, #FF9500)', label: 'Multicolour' },
        { id: 'blue', hex: '#007AFF', label: 'Blue' },
        { id: 'purple', hex: '#AF52DE', label: 'Purple' },
        { id: 'pink', hex: '#FF2D55', label: 'Pink' },
        { id: 'red', hex: '#FF3B30', label: 'Red' },
        { id: 'orange', hex: '#FF9500', label: 'Orange' },
        { id: 'yellow', hex: '#FFCC00', label: 'Yellow' },
        { id: 'green', hex: '#28CD41', label: 'Green' },
    ];

    return (
        <div className="w-full max-w-2xl mx-auto py-8">
            <h1 className="text-2xl font-bold text-white mb-8">Appearance</h1>

            <div className="bg-white/5 dark:bg-zinc-900/60 backdrop-blur-2xl border border-zinc-200/20 dark:border-zinc-700/50 rounded-2xl shadow-xl overflow-hidden divide-y divide-zinc-200/10 dark:divide-zinc-800">
                {/* Theme Selection */}
                <div className="p-6">
                    <div className="grid grid-cols-[140px_1fr] items-start gap-8">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200 pt-1">Appearance</label>
                        <div className="flex items-center gap-6">
                            {(['light', 'dark', 'auto'] as Theme[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className="flex flex-col items-center gap-2 group"
                                >
                                    <div className={`w-20 h-14 rounded-lg border-2 overflow-hidden transition-all ${theme === t ? 'border-blue-500 shadow-[0_0_0_2px_rgba(0,122,255,0.3)]' : 'border-transparent group-hover:border-zinc-300 dark:group-hover:border-zinc-700'}`}>
                                        <div className={`w-full h-full flex items-center justify-center text-[8px] font-bold shadow-inner ${t === 'light' ? 'bg-zinc-100 text-zinc-400' :
                                            t === 'dark' ? 'bg-zinc-900 text-zinc-600' :
                                                'bg-gradient-to-r from-zinc-100 to-zinc-900 text-zinc-500'
                                            }`}>
                                            {/* Mock Mac Window */}
                                            <div className="w-[80%] h-[80%] rounded-[3px] border border-zinc-500/20 flex flex-col bg-inherit overflow-hidden relative shadow-sm">
                                                <div className="h-[30%] flex gap-[2px] p-1 border-b border-zinc-500/20 backdrop-blur-sm bg-black/10">
                                                    <div className="w-1 h-1 rounded-full bg-red-400"></div>
                                                    <div className="w-1 h-1 rounded-full bg-yellow-400"></div>
                                                    <div className="w-1 h-1 rounded-full bg-green-400"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-300 capitalize">
                                        {t}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Accent Color Selection */}
                <div className="p-6">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-8">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Accent color</label>
                        <div className="flex items-center gap-3">
                            {colors.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => setAccentColor(c.id)}
                                    title={c.label}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all focus:outline-none ${accentColor === c.id ? 'ring-2 ring-offset-2 ring-blue-500 ring-offset-black' : 'hover:scale-110'}`}
                                    style={{
                                        background: c.hex,
                                        boxShadow: accentColor === c.id ? '0 0 10px rgba(0,0,0,0.5)' : 'none'
                                    }}
                                >
                                    {c.id === 'multicolor' && accentColor === c.id && (
                                        <div className="w-2 h-2 bg-white rounded-full shadow-sm"></div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Highlight Color */}
                <div className="p-6">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-8">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Highlight colour</label>
                        <select className="bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-200 outline-none w-48 shadow-sm">
                            <option>Accent Colour</option>
                            <option>Blue</option>
                            <option>Purple</option>
                            <option>Pink</option>
                        </select>
                    </div>
                </div>

                {/* Sidebar icon size */}
                <div className="p-6">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-8">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Sidebar icon size</label>
                        <select
                            value={sidebarSize}
                            onChange={(e) => setSidebarSize(e.target.value as SidebarSize)}
                            className="bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-200 outline-none w-48 shadow-sm"
                        >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                </div>

                {/* Wallpaper tinting */}
                <div className="p-6">
                    <div className="grid grid-cols-[140px_1fr] items-center gap-8">
                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">Allow wallpaper tinting in windows</label>
                        <div className="flex justify-end lg:justify-start">
                            <button
                                onClick={() => setAllowWallpaperTinting(!allowWallpaperTinting)}
                                className={`w-11 h-6 rounded-full transition-colors relative shadow-inner ${allowWallpaperTinting ? 'bg-blue-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                            >
                                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${allowWallpaperTinting ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-xs text-zinc-500">macOS Design Inspiration. Appearance settings are saved to your local session.</p>
            </div>
        </div>
    );
};

export default AppearanceSettings;
