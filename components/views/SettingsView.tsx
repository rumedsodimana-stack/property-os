import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { THEMES } from '../../src/themes';
import { Palette } from 'lucide-react';

const SettingsView: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="page-view">
      <div className="content-card content-card--full">
        <h3 className="content-card__title">
          <Palette size={18} /> Theme
        </h3>
        <p className="content-card__desc">Choose a visual theme for the app.</p>
        <div className="theme-grid">
          {(Object.keys(THEMES) as Array<keyof typeof THEMES>).map((id) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`theme-option ${theme === id ? 'theme-option--active' : ''}`}
              style={{
                backgroundColor: THEMES[id].card,
                borderColor: theme === id ? THEMES[id].accent : THEMES[id].border,
                color: THEMES[id].text,
              }}
            >
              <span
                className="theme-option__dot"
                style={{ backgroundColor: THEMES[id].accent }}
              />
              {THEMES[id].name}
            </button>
          ))}
        </div>
      </div>

      <div className="content-card content-card--full">
        <h3 className="content-card__title">Property</h3>
        <p className="content-card__desc">Property configuration — coming soon.</p>
      </div>
    </div>
  );
};

export default SettingsView;
