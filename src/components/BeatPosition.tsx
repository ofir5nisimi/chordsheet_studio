import React from 'react';
import type { Beat } from '../types/barChart';
import '../styles/BeatPosition.css';

interface BeatPositionProps {
  beat: Beat;
  onClick?: () => void;
  isSelected?: boolean;
  direction?: 'ltr' | 'rtl';
}

/**
 * BeatPosition Component
 * 
 * Renders an individual beat slot within a measure.
 * Shows the chord name, continuation marker ("-"), or empty state.
 */
const BeatPosition: React.FC<BeatPositionProps> = ({
  beat,
  onClick,
  isSelected = false,
  direction = 'ltr',
}) => {
  const getDisplayContent = (): string => {
    if (beat.isHold) {
      return '-';
    }
    if (beat.chord) {
      return beat.chord;
    }
    return '';
  };

  const content = getDisplayContent();
  const isEmpty = !beat.chord && !beat.isHold;
  const isHold = beat.isHold;
  const hasChord = !!beat.chord;

  return (
    <div
      className={`beat-position beat-${beat.position} ${isEmpty ? 'empty' : ''} ${isHold ? 'hold' : ''} ${hasChord ? 'has-chord' : ''} ${isSelected ? 'selected' : ''} ${direction}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Beat ${beat.position}${content ? `: ${content}` : ', empty'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <span className="beat-content">{content}</span>
    </div>
  );
};

export default BeatPosition;
