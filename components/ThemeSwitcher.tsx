import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Palette } from 'lucide-react';
import type { ThemeId } from '../src/themes';

const THEME_OPTIONS: { id: ThemeId; label: string }[] = [
  { id: 'paraiso', label: 'Paraíso' },
  { id: 'command', label: 'Command' },
  { id: 'bento', label: 'Bento' },
  { id: 'glass', label: 'Glass' },
  { id: 'terminal', label: 'Terminal' },
];

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-switcher">
      <div className="theme-switcher__header">
        <Palette className="theme-switcher__icon" size={14} />
        <span className="theme-switcher__label">Theme</span>
      </div>
      <div className="theme-switcher__options">
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={`theme-switcher__btn ${theme === opt.id ? 'theme-switcher__btn--active' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSwitcher;
