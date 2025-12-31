import React from 'react';
import type { SectionLine } from '../types/barChart';
import '../styles/SectionHeader.css';

interface SectionHeaderProps {
  section: SectionLine;
  direction?: 'ltr' | 'rtl';
  onTextChange?: (text: string) => void;
  editable?: boolean;
}

/**
 * SectionHeader Component
 * 
 * Renders a section header (e.g., "Verse", "Chorus", "[Intro]")
 * with distinct styling to separate song sections.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  section,
  direction = 'ltr',
  onTextChange,
  editable = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTextChange?.(e.target.value);
  };

  return (
    <div className={`section-header ${direction}`}>
      {editable ? (
        <input
          type="text"
          className="section-input"
          value={section.text}
          onChange={handleChange}
          placeholder="Section name..."
          aria-label="Section name"
        />
      ) : (
        <span className="section-text">{section.text}</span>
      )}
    </div>
  );
};

export default SectionHeader;
