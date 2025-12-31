import React, { useState, useCallback } from 'react';
import type { TextDirection } from '../types';
import type { BarChartDocument, BarChartLine, MeasureLine, SectionLine } from '../types/barChart';
import { createMeasureLine, createSectionLine, createEmptyMeasure } from '../types/barChart';
import MeasureLineComponent from './MeasureLineComponent';
import SectionHeader from './SectionHeader';
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

  // Handle beat click
  const handleBeatClick = useCallback((measureId: string, beatPosition: 1 | 2 | 3 | 4) => {
    setSelectedMeasureId(measureId);
    setSelectedBeat(beatPosition);
    // TODO Phase 3: Open chord dropdown here
  }, []);

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
          selectedMeasureId={selectedMeasureId}
          selectedBeat={selectedBeat}
          direction={direction}
          isLastLine={isLastLine}
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
    </div>
  );
};

export default BarChartEditor;
