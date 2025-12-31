import React from 'react';
import type { Measure as MeasureType } from '../types/barChart';
import BeatPosition from './BeatPosition';
import '../styles/Measure.css';

interface MeasureProps {
  measure: MeasureType;
  onBeatClick?: (beatPosition: 1 | 2 | 3 | 4) => void;
  selectedBeat?: 1 | 2 | 3 | 4 | null;
  direction?: 'ltr' | 'rtl';
  isFirst?: boolean;
  isLast?: boolean;
}

/**
 * Measure Component
 * 
 * Renders a single measure (bar) with 4 beat positions.
 * Displays bar lines on left/right and optional double bar line for endings.
 */
const Measure: React.FC<MeasureProps> = ({
  measure,
  onBeatClick,
  selectedBeat = null,
  direction = 'ltr',
  isFirst = false,
  isLast = false,
}) => {
  const handleBeatClick = (position: 1 | 2 | 3 | 4) => {
    onBeatClick?.(position);
  };

  return (
    <div
      className={`measure ${measure.isEnding ? 'ending' : ''} ${isFirst ? 'first' : ''} ${isLast ? 'last' : ''} ${direction}`}
      data-measure-id={measure.id}
    >
      {/* Left bar line */}
      <div className="bar-line bar-line-left" />
      
      {/* Beat positions container */}
      <div className="beats-container">
        {measure.beats.map((beat) => (
          <BeatPosition
            key={beat.position}
            beat={beat}
            onClick={() => handleBeatClick(beat.position)}
            isSelected={selectedBeat === beat.position}
            direction={direction}
          />
        ))}
      </div>
      
      {/* Right bar line (double for ending measures) */}
      <div className={`bar-line bar-line-right ${measure.isEnding ? 'double' : ''}`} />
    </div>
  );
};

export default Measure;
