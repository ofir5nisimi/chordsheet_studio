import React from 'react';
import type { Beat } from '../types/barChart';
import '../styles/BeatPosition.css';

interface BeatPositionProps {
  beat: Beat;
  onClick?: (event: React.MouseEvent) => void;
  onRightClick?: (event: React.MouseEvent) => void;
  isSelected?: boolean;
  direction?: 'ltr' | 'rtl';
}

/**
 * BeatPosition Component
 * 
 * Renders an individual beat slot within a measure.
 * Shows the chord name, continuation marker ("-"), or empty state.
 * Left-click: Opens chord selector
 * Right-click: Opens remove option (when chord exists)
 */
const BeatPosition: React.FC<BeatPositionProps> = ({
  beat,
  onClick,
  onRightClick,
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

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(e);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Only trigger right-click if there's a chord to remove
    if (hasChord) {
      onRightClick?.(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Create a synthetic mouse event for keyboard activation
      const syntheticEvent = {
        target: e.target,
        currentTarget: e.currentTarget,
        clientX: (e.currentTarget as HTMLElement).getBoundingClientRect().left,
        clientY: (e.currentTarget as HTMLElement).getBoundingClientRect().bottom,
      } as unknown as React.MouseEvent;
      onClick?.(syntheticEvent);
    }
  };

  return (
    <div
      className={`beat-position beat-${beat.position} ${isEmpty ? 'empty' : ''} ${isHold ? 'hold' : ''} ${hasChord ? 'has-chord' : ''} ${isSelected ? 'selected' : ''} ${direction}`}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      role="button"
      tabIndex={0}
      aria-label={`Beat ${beat.position}${content ? `: ${content}` : ', empty'}`}
      onKeyDown={handleKeyDown}
    >
      <span className="beat-content">{content}</span>
    </div>
  );
};

export default BeatPosition;
