import React, { useMemo } from 'react';
import type { Measure as MeasureType } from '../types/barChart';
import BeatPosition from './BeatPosition';
import '../styles/Measure.css';

interface MeasureProps {
  measure: MeasureType;
  onBeatClick?: (beatPosition: 1 | 2 | 3 | 4, event: React.MouseEvent) => void;
  onBeatRightClick?: (beatPosition: 1 | 2 | 3 | 4, event: React.MouseEvent) => void;
  onExpandClick?: (event: React.MouseEvent) => void;
  selectedBeat?: 1 | 2 | 3 | 4 | null;
  direction?: 'ltr' | 'rtl';
  isFirst?: boolean;
  isLast?: boolean;
  forceExpanded?: boolean;
}

/**
 * Measure Component
 * 
 * Renders a single measure (bar) with smart compact/expanded modes:
 * - Compact mode: For measures with 0-1 chords (shows single chord spanning measure)
 * - Expanded mode: For measures with 2+ chords (shows 4 beat positions)
 */
const Measure: React.FC<MeasureProps> = ({
  measure,
  onBeatClick,
  onBeatRightClick,
  onExpandClick,
  selectedBeat = null,
  direction = 'ltr',
  isFirst = false,
  isLast = false,
  forceExpanded = false,
}) => {
  const handleBeatClick = (position: 1 | 2 | 3 | 4, event: React.MouseEvent) => {
    onBeatClick?.(position, event);
  };

  const handleBeatRightClick = (position: 1 | 2 | 3 | 4, event: React.MouseEvent) => {
    event.preventDefault();
    onBeatRightClick?.(position, event);
  };

  // Analyze the measure to determine display mode
  const measureAnalysis = useMemo(() => {
    const chordCount = measure.beats.filter(b => b.chord !== null).length;
    const firstChord = measure.beats.find(b => b.chord !== null)?.chord || null;
    const firstChordBeat = measure.beats.find(b => b.chord !== null)?.position || 1;
    // Force expanded if explicitly requested, otherwise compact for 0-1 chords
    const isCompact = !forceExpanded && chordCount <= 1;
    
    return { chordCount, firstChord, firstChordBeat, isCompact };
  }, [measure.beats, forceExpanded]);

  // Render compact mode (single chord or empty)
  const renderCompactMode = () => {
    const { firstChord, firstChordBeat } = measureAnalysis;
    
    return (
      <div 
        className="beats-container compact-mode"
        onClick={(e) => handleBeatClick(firstChordBeat as 1 | 2 | 3 | 4, e)}
        onContextMenu={(e) => {
          if (firstChord) {
            handleBeatRightClick(firstChordBeat as 1 | 2 | 3 | 4, e);
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const syntheticEvent = {
              target: e.target,
              currentTarget: e.currentTarget,
              clientX: (e.currentTarget as HTMLElement).getBoundingClientRect().left,
              clientY: (e.currentTarget as HTMLElement).getBoundingClientRect().bottom,
            } as unknown as React.MouseEvent;
            handleBeatClick(firstChordBeat as 1 | 2 | 3 | 4, syntheticEvent);
          }
        }}
      >
        <div className={`compact-chord ${firstChord ? 'has-chord' : 'empty'} ${selectedBeat === firstChordBeat ? 'selected' : ''}`}>
          {firstChord || ''}
          {!firstChord && <span className="empty-hint">+</span>}
        </div>
        {/* Expand button to add more chords */}
        {firstChord && onExpandClick && (
          <button
            className="expand-measure-btn"
            onClick={(e) => {
              e.stopPropagation();
              onExpandClick(e);
            }}
            title="Add more chords to this measure"
            aria-label="Expand measure to add more chords"
          >
            ⋯
          </button>
        )}
      </div>
    );
  };

  // Render expanded mode (multiple chords)
  const renderExpandedMode = () => {
    return (
      <div className="beats-container expanded-mode">
        {measure.beats.map((beat) => (
          <BeatPosition
            key={beat.position}
            beat={beat}
            onClick={(event) => handleBeatClick(beat.position, event)}
            onRightClick={(event) => handleBeatRightClick(beat.position, event)}
            isSelected={selectedBeat === beat.position}
            direction={direction}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className={`measure ${measure.isEnding ? 'ending' : ''} ${isFirst ? 'first' : ''} ${isLast ? 'last' : ''} ${direction} ${measureAnalysis.isCompact ? 'compact' : 'expanded'}`}
      data-measure-id={measure.id}
    >
      {/* Left bar line */}
      <div className="bar-line bar-line-left" />
      
      {/* Beat positions container - compact or expanded */}
      {measureAnalysis.isCompact ? renderCompactMode() : renderExpandedMode()}
      
      {/* Right bar line (double for ending measures) */}
      <div className={`bar-line bar-line-right ${measure.isEnding ? 'double' : ''}`} />
    </div>
  );
};

export default Measure;
