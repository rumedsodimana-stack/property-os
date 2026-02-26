import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'auto';
export type AccentColor = 'blue' | 'purple' | 'pink' | 'red' | 'orange' | 'yellow' | 'green' | 'multicolor';
export type SidebarSize = 'small' | 'medium' | 'large';

interface AppearanceState {
    theme: Theme;
    accentColor: AccentColor;
    sidebarSize: SidebarSize;
    allowWallpaperTinting: boolean;
}

interface AppearanceContextType extends AppearanceState {
    setTheme: (theme: Theme) => void;
    setAccentColor: (color: AccentColor) => void;
    setSidebarSize: (size: SidebarSize) => void;
    setAllowWallpaperTinting: (allow: boolean) => void;
}

const defaultState: AppearanceState = {
    theme: 'dark', // System defaults to dark mode traditionally
    accentColor: 'blue',
    sidebarSize: 'medium',
    allowWallpaperTinting: true,
};

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(defaultState.theme);
    const [accentColor, setAccentColorState] = useState<AccentColor>(defaultState.accentColor);
    const [sidebarSize, setSidebarSizeState] = useState<SidebarSize>(defaultState.sidebarSize);
    const [allowWallpaperTinting, setAllowWallpaperTintingState] = useState<boolean>(defaultState.allowWallpaperTinting);

    // Load from local storage on mount
    useEffect(() => {
        try {
            const savedState = localStorage.getItem('singularity_appearance');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                if (parsed.theme) setThemeState(parsed.theme);
                if (parsed.accentColor) setAccentColorState(parsed.accentColor);
                if (parsed.sidebarSize) setSidebarSizeState(parsed.sidebarSize);
                if (parsed.allowWallpaperTinting !== undefined) setAllowWallpaperTintingState(parsed.allowWallpaperTinting);
            }
        } catch (e) {
            console.error('Failed to load appearance state from local storage', e);
        }
    }, []);

    // Save to local storage and update CSS variables whenever state changes
    useEffect(() => {
        try {
            const stateToSave = { theme, accentColor, sidebarSize, allowWallpaperTinting };
            localStorage.setItem('singularity_appearance', JSON.stringify(stateToSave));

            // Apply global CSS updates
            const root = document.documentElement;

            // Handle Light/Dark Theme (Auto relies on prefers-color-scheme media query)
            const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            if (isDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }

            // Handle Accent Colors (Mapping to standard Tailwind-like hex values)
            const colorMapping: Record<AccentColor, { main: string; light: string; alpha: string }> = {
                blue: { main: '#007AFF', light: '#34C759', alpha: 'rgba(0,122,255,0.2)' }, // iOS Blue
                purple: { main: '#AF52DE', light: '#BF5AF2', alpha: 'rgba(175,82,222,0.2)' }, // iOS Purple
                pink: { main: '#FF2D55', light: '#FF375F', alpha: 'rgba(255,45,85,0.2)' }, // iOS Pink
                red: { main: '#FF3B30', light: '#FF453A', alpha: 'rgba(255,59,48,0.2)' }, // iOS Red
                orange: { main: '#FF9500', light: '#FF9F0A', alpha: 'rgba(255,149,0,0.2)' }, // iOS Orange
                yellow: { main: '#FFCC00', light: '#FFD60A', alpha: 'rgba(255,204,0,0.2)' }, // iOS Yellow
                green: { main: '#28CD41', light: '#32D74B', alpha: 'rgba(40,205,65,0.2)' }, // iOS Green
                multicolor: { main: '#AF52DE', light: '#FF2D55', alpha: 'rgba(175,82,222,0.2)' }, // Default fallback for multi
            };

            const selectedColors = colorMapping[accentColor];
            root.style.setProperty('--system-accent', selectedColors.main);
            root.style.setProperty('--system-accent-light', selectedColors.light);
            root.style.setProperty('--system-accent-alpha', selectedColors.alpha);

            const sizeMapping: Record<SidebarSize, string> = {
                small: '220px',
                medium: '260px',
                large: '300px'
            };
            root.style.setProperty('--sidebar-width', sizeMapping[sidebarSize]);


        } catch (e) {
            console.error('Failed to save appearance state or update CSS', e);
        }
    }, [theme, accentColor, sidebarSize, allowWallpaperTinting]);

    const value = {
        theme,
        accentColor,
        sidebarSize,
        allowWallpaperTinting,
        setTheme: setThemeState,
        setAccentColor: setAccentColorState,
        setSidebarSize: setSidebarSizeState,
        setAllowWallpaperTinting: setAllowWallpaperTintingState,
    };

    return (
        <AppearanceContext.Provider value={value}>
            {children}
        </AppearanceContext.Provider>
    );
};

export const useAppearance = () => {
    const context = useContext(AppearanceContext);
    if (context === undefined) {
        throw new Error('useAppearance must be used within an AppearanceProvider');
    }
    return context;
};
