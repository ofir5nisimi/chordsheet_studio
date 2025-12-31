import React from 'react';
import type { MeasureLine } from '../types/barChart';
import Measure from './Measure';
import '../styles/MeasureLineComponent.css';

interface MeasureLineComponentProps {
  line: MeasureLine;
  onBeatClick?: (measureId: string, beatPosition: 1 | 2 | 3 | 4) => void;
  selectedMeasureId?: string | null;
  selectedBeat?: 1 | 2 | 3 | 4 | null;
  direction?: 'ltr' | 'rtl';
  isLastLine?: boolean;
}

/**
 * MeasureLineComponent
 * 
 * Renders a horizontal row of measures.
 * Handles the configurable number of measures per line.
 */
const MeasureLineComponent: React.FC<MeasureLineComponentProps> = ({
  line,
  onBeatClick,
  selectedMeasureId = null,
  selectedBeat = null,
  direction = 'ltr',
  isLastLine = false,
}) => {
  const handleBeatClick = (measureId: string, beatPosition: 1 | 2 | 3 | 4) => {
    onBeatClick?.(measureId, beatPosition);
  };

  return (
    <div className={`measure-line ${direction}`}>
      {line.measures.map((measure, index) => {
        const isFirst = index === 0;
        const isLast = index === line.measures.length - 1;
        // Mark the last measure of the last line as ending
        const isEnding = isLastLine && isLast;
        
        return (
          <Measure
            key={measure.id}
            measure={{ ...measure, isEnding: measure.isEnding || isEnding }}
            onBeatClick={(beatPos) => handleBeatClick(measure.id, beatPos)}
            selectedBeat={selectedMeasureId === measure.id ? selectedBeat : null}
            direction={direction}
            isFirst={isFirst}
            isLast={isLast}
          />
        );
      })}
    </div>
  );
};

export default MeasureLineComponent;
