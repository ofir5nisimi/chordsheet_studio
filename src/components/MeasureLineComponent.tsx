import React from 'react';
import type { MeasureLine } from '../types/barChart';
import Measure from './Measure';
import '../styles/MeasureLineComponent.css';

interface MeasureLineComponentProps {
  line: MeasureLine;
  onBeatClick?: (measureId: string, beatPosition: 1 | 2 | 3 | 4, column: 'left' | 'right', event: React.MouseEvent) => void;
  onBeatRightClick?: (measureId: string, beatPosition: 1 | 2 | 3 | 4, column: 'left' | 'right', event: React.MouseEvent) => void;
  onExpandMeasure?: (measureId: string, column: 'left' | 'right', event: React.MouseEvent) => void;
  selectedMeasureId?: string | null;
  selectedBeat?: 1 | 2 | 3 | 4 | null;
  direction?: 'ltr' | 'rtl';
  isLastLine?: boolean;
  column: 'left' | 'right';
  expandedMeasureIds?: Set<string>;
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
  onBeatRightClick,
  onExpandMeasure,
  selectedMeasureId = null,
  selectedBeat = null,
  direction = 'ltr',
  isLastLine = false,
  column,
  expandedMeasureIds = new Set(),
}) => {
  const handleBeatClick = (measureId: string, beatPosition: 1 | 2 | 3 | 4, event: React.MouseEvent) => {
    onBeatClick?.(measureId, beatPosition, column, event);
  };

  const handleBeatRightClick = (measureId: string, beatPosition: 1 | 2 | 3 | 4, event: React.MouseEvent) => {
    onBeatRightClick?.(measureId, beatPosition, column, event);
  };

  const handleExpandMeasure = (measureId: string, event: React.MouseEvent) => {
    onExpandMeasure?.(measureId, column, event);
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
            onBeatClick={(beatPos, event) => handleBeatClick(measure.id, beatPos, event)}
            onBeatRightClick={(beatPos, event) => handleBeatRightClick(measure.id, beatPos, event)}
            onExpandClick={(event) => handleExpandMeasure(measure.id, event)}
            selectedBeat={selectedMeasureId === measure.id ? selectedBeat : null}
            direction={direction}
            isFirst={isFirst}
            isLast={isLast}
            forceExpanded={expandedMeasureIds.has(measure.id)}
          />
        );
      })}
    </div>
  );
};

export default MeasureLineComponent;
