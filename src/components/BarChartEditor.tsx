import React, { useState, useCallback } from 'react';
import type { TextDirection } from '../types';
import type { BarChartDocument, BarChartLine, MeasureLine, SectionLine, Measure } from '../types/barChart';
import { createMeasureLine, createSectionLine, createEmptyMeasure } from '../types/barChart';
import type { ChordDefinition } from '../data/chords';
import MeasureLineComponent from './MeasureLineComponent';
import SectionHeader from './SectionHeader';
import ChordDropdown from './ChordDropdown';
import '../styles/BarChartEditor.css';

interface BarChartEditorProps {
  document: BarChartDocument;
  onDocumentChange: (document: BarChartDocument) => void;
  direction: TextDirection;
  columnCount: 1 | 2;
  fontSize: number;
}

/**
 * BarChartEditor Component
 * 
 * Main editor for Bar Chart mode. Renders measures with chord positions
 * in a structured bar chart format with separate columns.
 */
const BarChartEditor: React.FC<BarChartEditorProps> = ({
  document,
  onDocumentChange,
  direction,
  columnCount,
  fontSize,
}) => {
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null);
  const [selectedBeat, setSelectedBeat] = useState<1 | 2 | 3 | 4 | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<'left' | 'right' | null>(null);
  const [showChordDropdown, setShowChordDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [expandedMeasureIds, setExpandedMeasureIds] = useState<Set<string>>(new Set());
  const [isRightClickAction, setIsRightClickAction] = useState(false);

  // Update a measure's beat with a new chord (defined first as other handlers depend on it)
  const updateMeasureBeat = useCallback((
    lines: BarChartLine[],
    measureId: string,
    beatPosition: 1 | 2 | 3 | 4,
    chordSymbol: string | null
  ): BarChartLine[] => {
    return lines.map(line => {
      if (line.type !== 'measures') return line;
      
      const measureLine = line as MeasureLine;
      const measureIndex = measureLine.measures.findIndex(m => m.id === measureId);
      if (measureIndex === -1) return line;

      const newMeasures = [...measureLine.measures];
      const measure = { ...newMeasures[measureIndex] };
      const newBeats = [...measure.beats] as Measure['beats'];
      
      // Update the beat
      const beatIndex = beatPosition - 1;
      newBeats[beatIndex] = {
        ...newBeats[beatIndex],
        chord: chordSymbol,
        isHold: false,
      };
      
      // Update hold markers for subsequent beats
      // A beat is "hold" if it has no chord but a previous beat in the measure has a chord
      for (let i = beatIndex + 1; i < 4; i++) {
        if (newBeats[i].chord) {
          // Stop at the next chord
          break;
        }
        // Check if any previous beat has a chord
        let hasPreviousChord = false;
        for (let j = 0; j <= i - 1; j++) {
          if (newBeats[j].chord) {
            hasPreviousChord = true;
            break;
          }
        }
        newBeats[i] = {
          ...newBeats[i],
          isHold: hasPreviousChord,
        };
      }
      
      // Also update hold markers for beats before this one if we cleared a chord
      if (chordSymbol === null) {
        // Recalculate all hold markers
        let lastChordIndex = -1;
        for (let i = 0; i < 4; i++) {
          if (newBeats[i].chord) {
            lastChordIndex = i;
            newBeats[i] = { ...newBeats[i], isHold: false };
          } else {
            newBeats[i] = { ...newBeats[i], isHold: lastChordIndex >= 0 };
          }
        }
      }
      
      measure.beats = newBeats;
      newMeasures[measureIndex] = measure;
      
      return { ...measureLine, measures: newMeasures };
    });
  }, []);

  // Handle beat click - opens chord dropdown
  const handleBeatClick = useCallback((
    measureId: string, 
    beatPosition: 1 | 2 | 3 | 4, 
    column: 'left' | 'right',
    event: React.MouseEvent
  ) => {
    setSelectedMeasureId(measureId);
    setSelectedBeat(beatPosition);
    setSelectedColumn(column);
    setIsRightClickAction(false);
    
    // Position dropdown near click
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setDropdownPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 5
    });
    setShowChordDropdown(true);
  }, []);

  // Handle beat right-click - remove chord directly
  const handleBeatRightClick = useCallback((
    measureId: string, 
    beatPosition: 1 | 2 | 3 | 4, 
    column: 'left' | 'right',
    _event: React.MouseEvent
  ) => {
    // Directly remove the chord on right-click
    if (column === 'left') {
      onDocumentChange({
        ...document,
        leftLines: updateMeasureBeat(document.leftLines, measureId, beatPosition, null),
      });
    } else {
      onDocumentChange({
        ...document,
        rightLines: updateMeasureBeat(document.rightLines, measureId, beatPosition, null),
      });
    }
    
    // After removing chord, collapse the measure if it now has 0-1 chords
    setExpandedMeasureIds(prev => {
      const next = new Set(prev);
      next.delete(measureId);
      return next;
    });
  }, [document, onDocumentChange, updateMeasureBeat]);

  // Handle expand measure - force show all 4 beats
  const handleExpandMeasure = useCallback((
    measureId: string, 
    _column: 'left' | 'right',
    _event: React.MouseEvent
  ) => {
    setExpandedMeasureIds(prev => {
      const next = new Set(prev);
      next.add(measureId);
      return next;
    });
  }, []);

  // Close chord dropdown
  const handleCloseDropdown = useCallback(() => {
    setShowChordDropdown(false);
    setSelectedMeasureId(null);
    setSelectedBeat(null);
    setSelectedColumn(null);
  }, []);

  // Handle chord selection from dropdown
  const handleChordSelect = useCallback((chord: ChordDefinition) => {
    if (!selectedMeasureId || !selectedBeat || !selectedColumn) return;

    if (selectedColumn === 'left') {
      onDocumentChange({
        ...document,
        leftLines: updateMeasureBeat(document.leftLines, selectedMeasureId, selectedBeat, chord.symbol),
      });
    } else {
      onDocumentChange({
        ...document,
        rightLines: updateMeasureBeat(document.rightLines, selectedMeasureId, selectedBeat, chord.symbol),
      });
    }
    
    handleCloseDropdown();
  }, [document, selectedMeasureId, selectedBeat, selectedColumn, onDocumentChange, updateMeasureBeat, handleCloseDropdown]);

  // Update lines with new measures per line count
  const updateLinesWithMeasuresCount = useCallback((lines: BarChartLine[], newValue: number): BarChartLine[] => {
    return lines.map(line => {
      if (line.type === 'measures') {
        const measureLine = line as MeasureLine;
        const currentCount = measureLine.measures.length;
        
        if (currentCount === newValue) {
          return line;
        } else if (currentCount < newValue) {
          const newMeasures = [...measureLine.measures];
          for (let i = currentCount; i < newValue; i++) {
            newMeasures.push(createEmptyMeasure());
          }
          return { ...measureLine, measures: newMeasures };
        } else {
          return { ...measureLine, measures: measureLine.measures.slice(0, newValue) };
        }
      }
      return line;
    });
  }, []);

  // Handle measures per line change - updates all existing measure lines
  const handleMeasuresPerLineChange = useCallback((value: number) => {
    const newValue = Math.max(1, Math.min(8, value));
    
    onDocumentChange({
      ...document,
      measuresPerLine: newValue,
      leftLines: updateLinesWithMeasuresCount(document.leftLines, newValue),
      rightLines: updateLinesWithMeasuresCount(document.rightLines, newValue),
    });
  }, [document, onDocumentChange, updateLinesWithMeasuresCount]);

  // Add a new measure line to a specific column
  const handleAddMeasureLine = useCallback((column: 'left' | 'right') => {
    const newLine = createMeasureLine(document.measuresPerLine);
    if (column === 'left') {
      onDocumentChange({
        ...document,
        leftLines: [...document.leftLines, newLine],
      });
    } else {
      onDocumentChange({
        ...document,
        rightLines: [...document.rightLines, newLine],
      });
    }
  }, [document, onDocumentChange]);

  // Add a new section to a specific column
  const handleAddSection = useCallback((column: 'left' | 'right') => {
    const newSection = createSectionLine('[New Section]');
    if (column === 'left') {
      onDocumentChange({
        ...document,
        leftLines: [...document.leftLines, newSection],
      });
    } else {
      onDocumentChange({
        ...document,
        rightLines: [...document.rightLines, newSection],
      });
    }
  }, [document, onDocumentChange]);

  // Handle section text change
  const handleSectionTextChange = useCallback((lineId: string, text: string, column: 'left' | 'right') => {
    const updateLines = (lines: BarChartLine[]) => lines.map(line => {
      if (line.id === lineId && line.type === 'section') {
        return { ...line, text };
      }
      return line;
    });

    if (column === 'left') {
      onDocumentChange({
        ...document,
        leftLines: updateLines(document.leftLines),
      });
    } else {
      onDocumentChange({
        ...document,
        rightLines: updateLines(document.rightLines),
      });
    }
  }, [document, onDocumentChange]);

  // Find the index of the last measure line for the ending double bar
  const getLastMeasureLineIndex = (lines: BarChartLine[]) => {
    return lines.reduce((lastIdx, line, idx) => {
      return line.type === 'measures' ? idx : lastIdx;
    }, -1);
  };

  // Render a line based on its type
  const renderLine = (line: BarChartLine, _index: number, isLastLine: boolean, column: 'left' | 'right') => {
    if (line.type === 'section') {
      return (
        <SectionHeader
          key={line.id}
          section={line as SectionLine}
          direction={direction}
          editable={true}
          onTextChange={(text) => handleSectionTextChange(line.id, text, column)}
        />
      );
    } else if (line.type === 'measures') {
      return (
        <MeasureLineComponent
          key={line.id}
          line={line as MeasureLine}
          onBeatClick={handleBeatClick}
          onBeatRightClick={handleBeatRightClick}
          onExpandMeasure={handleExpandMeasure}
          selectedMeasureId={selectedMeasureId}
          selectedBeat={selectedBeat}
          direction={direction}
          isLastLine={isLastLine}
          column={column}
          expandedMeasureIds={expandedMeasureIds}
        />
      );
    }
    return null;
  };

  // Render column content with add buttons
  const renderColumn = (column: 'left' | 'right', lines: BarChartLine[]) => {
    const lastMeasureLineIndex = getLastMeasureLineIndex(lines);
    const columnLabel = direction === 'rtl' 
      ? (column === 'left' ? 'Right' : 'Left')
      : (column === 'left' ? 'Left' : 'Right');

    return (
      <div className={`bar-chart-column ${column}`}>
        {/* Column add buttons - at the top */}
        <div className="column-actions">
          <button
            className="column-btn add-section-btn"
            onClick={() => handleAddSection(column)}
            title={`Add a section header to ${columnLabel} column`}
          >
            + Section
          </button>
          <button
            className="column-btn add-measures-btn"
            onClick={() => handleAddMeasureLine(column)}
            title={`Add measures to ${columnLabel} column`}
          >
            + Measures
          </button>
        </div>

        {/* Column content */}
        <div className="column-content">
          {lines.length === 0 ? (
            <div className="bar-chart-empty">
              <div className="empty-icon">🎼</div>
              <p>No measures</p>
              <p className="empty-hint">Use the buttons above to add content</p>
            </div>
          ) : (
            lines.map((line, index) => 
              renderLine(line, index, index === lastMeasureLineIndex, column)
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`bar-chart-editor ${direction}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Toolbar for measures per line */}
      <div className="bar-chart-toolbar">
        <div className="toolbar-group">
          <label className="toolbar-label">
            Measures/Line:
            <div className="measures-control">
              <button
                className="measures-btn"
                onClick={() => handleMeasuresPerLineChange(document.measuresPerLine - 1)}
                disabled={document.measuresPerLine <= 1}
                aria-label="Decrease measures per line"
              >
                −
              </button>
              <span className="measures-value">{document.measuresPerLine}</span>
              <button
                className="measures-btn"
                onClick={() => handleMeasuresPerLineChange(document.measuresPerLine + 1)}
                disabled={document.measuresPerLine >= 8}
                aria-label="Increase measures per line"
              >
                +
              </button>
            </div>
          </label>
        </div>
      </div>

      {/* Columns container */}
      <div className={`bar-chart-columns columns-${columnCount} ${direction}`}>
        {/* Left/First Column */}
        {renderColumn('left', document.leftLines)}

        {/* Right/Second Column - only shown when columnCount is 2 */}
        {columnCount === 2 && renderColumn('right', document.rightLines)}
      </div>

      {/* Chord Dropdown - only for selecting/changing chords */}
      {showChordDropdown && !isRightClickAction && (
        <ChordDropdown
          position={dropdownPosition}
          onSelectChord={handleChordSelect}
          onClose={handleCloseDropdown}
        />
      )}
    </div>
  );
};

export default BarChartEditor;
