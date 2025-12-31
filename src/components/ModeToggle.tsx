import React from 'react';
import type { AppMode } from '../types/barChart';
import '../styles/ModeToggle.css';

interface ModeToggleProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

/**
 * ModeToggle Component
 * 
 * A segmented control for switching between Lyrics & Chords mode
 * and Bar Chart mode.
 */
const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="mode-toggle">
      <button
        className={`mode-toggle-button ${mode === 'lyrics' ? 'active' : ''}`}
        onClick={() => onModeChange('lyrics')}
        title="Lyrics & Chords Mode - Edit lyrics with chord positions"
      >
        🎤 Lyrics & Chords
      </button>
      <button
        className={`mode-toggle-button ${mode === 'barChart' ? 'active' : ''}`}
        onClick={() => onModeChange('barChart')}
        title="Bar Chart Mode - Create chord charts with measures"
      >
        🎼 Bar Chart
      </button>
    </div>
  );
};

export default ModeToggle;
