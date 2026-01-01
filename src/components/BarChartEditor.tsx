import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { TextDirection } from '../types';
import type { BarChartDocument, BarChartLine, BarChartRow, MeasureLine, SectionLine, Measure, RowLayout } from '../types/barChart';
import { createMeasureLine, createSectionLine, createEmptyMeasure, createFullWidthRow, createSplitRow } from '../types/barChart';
import type { ChordDefinition } from '../data/chords';
import MeasureLineComponent from './MeasureLineComponent';
import SectionHeader from './SectionHeader';
import ChordDropdown from './ChordDropdown';
import '../styles/BarChartEditor.css';

// A4 page dimensions at 96 DPI
// Available content height = page height - top padding - bottom padding - title section
// Page: 297mm = 1123px, Top padding: 94px, Bottom padding: 94px, Title: ~80px, Toolbar: ~50px
const AVAILABLE_CONTENT_HEIGHT = 1123 - 94 - 94 - 80 - 50; // ~805px

interface BarChartEditorProps {
  document: BarChartDocument;
  onDocumentChange: (document: BarChartDocument) => void;
  direction: TextDirection;
  fontSize: number;
  onContentHeightChange?: (height: number, availableHeight: number) => void;
}

/**
 * BarChartEditor Component
 * 
 * Main editor for Bar Chart mode. Renders measures with chord positions
 * in a structured bar chart format. Each row can be full-width or split into 2 columns.
 */
const BarChartEditor: React.FC<BarChartEditorProps> = ({
  document,
  onDocumentChange,
  direction,
  fontSize,
  onContentHeightChange,
}) => {
  const [selectedMeasureId, setSelectedMeasureId] = useState<string | null>(null);
  const [selectedBeat, setSelectedBeat] = useState<1 | 2 | 3 | 4 | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);
  const [showChordDropdown, setShowChordDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [expandedMeasureIds, setExpandedMeasureIds] = useState<Set<string>>(new Set());
  
  // Content height tracking
  const rowsContainerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [pageOverflow, setPageOverflow] = useState(false);

  // Measure content height after each render
  useEffect(() => {
    if (rowsContainerRef.current) {
      const height = rowsContainerRef.current.scrollHeight;
      setContentHeight(height);
      setPageOverflow(height > AVAILABLE_CONTENT_HEIGHT);
      onContentHeightChange?.(height, AVAILABLE_CONTENT_HEIGHT);
    }
  }, [document.rows, onContentHeightChange]);

  // Update a measure's beat with a new chord
  const updateMeasureBeat = useCallback((
    line: BarChartLine | null,
    measureId: string,
    beatPosition: 1 | 2 | 3 | 4,
    chordSymbol: string | null
  ): BarChartLine | null => {
    if (!line || line.type !== 'measures') return line;
    
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
    
    // Update hold markers
    let lastChordIndex = -1;
    for (let i = 0; i < 4; i++) {
      if (newBeats[i].chord) {
        lastChordIndex = i;
        newBeats[i] = { ...newBeats[i], isHold: false };
      } else {
        newBeats[i] = { ...newBeats[i], isHold: lastChordIndex >= 0 };
      }
    }
    
    measure.beats = newBeats;
    newMeasures[measureIndex] = measure;
    
    return { ...measureLine, measures: newMeasures };
  }, []);

  // Handle beat click - opens chord dropdown
  const handleBeatClick = useCallback((
    measureId: string, 
    beatPosition: 1 | 2 | 3 | 4, 
    rowId: string,
    side: 'left' | 'right',
    event: React.MouseEvent
  ) => {
    setSelectedMeasureId(measureId);
    setSelectedBeat(beatPosition);
    setSelectedRowId(rowId);
    setSelectedSide(side);
    
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
    rowId: string,
    side: 'left' | 'right',
    _event: React.MouseEvent
  ) => {
    onDocumentChange({
      ...document,
      rows: document.rows.map(row => {
        if (row.id !== rowId) return row;
        
        if (side === 'left' || row.layout === 'full') {
          return { ...row, leftLine: updateMeasureBeat(row.leftLine, measureId, beatPosition, null) };
        } else {
          return { ...row, rightLine: updateMeasureBeat(row.rightLine, measureId, beatPosition, null) };
        }
      }),
    });
    
    setExpandedMeasureIds(prev => {
      const next = new Set(prev);
      next.delete(measureId);
      return next;
    });
  }, [document, onDocumentChange, updateMeasureBeat]);

  // Handle expand measure
  const handleExpandMeasure = useCallback((measureId: string) => {
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
    setSelectedRowId(null);
    setSelectedSide(null);
  }, []);

  // Handle chord selection from dropdown
  const handleChordSelect = useCallback((chord: ChordDefinition) => {
    if (!selectedMeasureId || !selectedBeat || !selectedRowId || !selectedSide) return;

    onDocumentChange({
      ...document,
      rows: document.rows.map(row => {
        if (row.id !== selectedRowId) return row;
        
        if (selectedSide === 'left' || row.layout === 'full') {
          return { ...row, leftLine: updateMeasureBeat(row.leftLine, selectedMeasureId, selectedBeat, chord.symbol) };
        } else {
          return { ...row, rightLine: updateMeasureBeat(row.rightLine, selectedMeasureId, selectedBeat, chord.symbol) };
        }
      }),
    });
    
    handleCloseDropdown();
  }, [document, selectedMeasureId, selectedBeat, selectedRowId, selectedSide, onDocumentChange, updateMeasureBeat, handleCloseDropdown]);

  // Handle measures per line change
  const handleMeasuresPerLineChange = useCallback((value: number) => {
    const newValue = Math.max(1, Math.min(8, value));
    
    const updateLine = (line: BarChartLine | null): BarChartLine | null => {
      if (!line || line.type !== 'measures') return line;
      const measureLine = line as MeasureLine;
      const currentCount = measureLine.measures.length;
      
      if (currentCount === newValue) return line;
      
      if (currentCount < newValue) {
        const newMeasures = [...measureLine.measures];
        for (let i = currentCount; i < newValue; i++) {
          newMeasures.push(createEmptyMeasure());
        }
        return { ...measureLine, measures: newMeasures };
      } else {
        return { ...measureLine, measures: measureLine.measures.slice(0, newValue) };
      }
    };

    onDocumentChange({
      ...document,
      measuresPerLine: newValue,
      rows: document.rows.map(row => ({
        ...row,
        leftLine: updateLine(row.leftLine),
        rightLine: updateLine(row.rightLine),
      })),
    });
  }, [document, onDocumentChange]);

  // Toggle row layout between full and split
  const handleToggleRowLayout = useCallback((rowId: string) => {
    onDocumentChange({
      ...document,
      rows: document.rows.map(row => {
        if (row.id !== rowId) return row;
        
        if (row.layout === 'full') {
          // Split: keep leftLine as is, rightLine becomes null
          return { ...row, layout: 'split' as RowLayout };
        } else {
          // Full: keep leftLine, move rightLine content if any
          // For now, just merge - leftLine takes priority
          return { ...row, layout: 'full' as RowLayout };
        }
      }),
    });
  }, [document, onDocumentChange]);

  // Delete a row
  const handleDeleteRow = useCallback((rowId: string) => {
    onDocumentChange({
      ...document,
      rows: document.rows.filter(row => row.id !== rowId),
    });
  }, [document, onDocumentChange]);

  // Add a new row with content
  // position can be: 'start' (top), 'end' (bottom), or a rowId (insert after that row)
  const handleAddRow = useCallback((layout: RowLayout, contentType: 'section' | 'measures', position: 'start' | 'end' | string = 'end') => {
    const newLine: BarChartLine = contentType === 'section' 
      ? createSectionLine('[New Section]')
      : createMeasureLine(document.measuresPerLine);
    
    const newRow: BarChartRow = layout === 'full'
      ? createFullWidthRow(newLine)
      : createSplitRow(newLine, null);

    let newRows: BarChartRow[];
    if (position === 'start') {
      newRows = [newRow, ...document.rows];
    } else if (position === 'end') {
      newRows = [...document.rows, newRow];
    } else {
      // position is a rowId - insert after that row
      const index = document.rows.findIndex(r => r.id === position);
      newRows = [
        ...document.rows.slice(0, index + 1),
        newRow,
        ...document.rows.slice(index + 1),
      ];
    }

    onDocumentChange({
      ...document,
      rows: newRows,
    });
  }, [document, onDocumentChange]);

  // Add content to a specific side of a split row
  const handleAddContent = useCallback((rowId: string, side: 'left' | 'right', contentType: 'section' | 'measures') => {
    const newLine: BarChartLine = contentType === 'section' 
      ? createSectionLine('[New Section]')
      : createMeasureLine(document.measuresPerLine);

    onDocumentChange({
      ...document,
      rows: document.rows.map(row => {
        if (row.id !== rowId) return row;
        if (side === 'left') {
          return { ...row, leftLine: newLine };
        } else {
          return { ...row, rightLine: newLine };
        }
      }),
    });
  }, [document, onDocumentChange]);

  // Delete content from a side of a row
  const handleDeleteContent = useCallback((rowId: string, side: 'left' | 'right') => {
    onDocumentChange({
      ...document,
      rows: document.rows.map(row => {
        if (row.id !== rowId) return row;
        if (side === 'left') {
          return { ...row, leftLine: null };
        } else {
          return { ...row, rightLine: null };
        }
      }),
    });
  }, [document, onDocumentChange]);

  // Handle section text change
  const handleSectionTextChange = useCallback((rowId: string, side: 'left' | 'right', text: string) => {
    onDocumentChange({
      ...document,
      rows: document.rows.map(row => {
        if (row.id !== rowId) return row;
        
        const updateLine = (line: BarChartLine | null) => {
          if (!line || line.type !== 'section') return line;
          return { ...line, text };
        };

        if (side === 'left' || row.layout === 'full') {
          return { ...row, leftLine: updateLine(row.leftLine) };
        } else {
          return { ...row, rightLine: updateLine(row.rightLine) };
        }
      }),
    });
  }, [document, onDocumentChange]);

  // Check if this row contains the last measure line in the document
  const isLastMeasureLine = useCallback((rowIndex: number, side: 'left' | 'right'): boolean => {
    // Go through all rows after this one
    for (let i = document.rows.length - 1; i >= rowIndex; i--) {
      const row = document.rows[i];
      if (i === rowIndex) {
        // Same row - check if we're the last measure
        if (row.layout === 'full') {
          return row.leftLine?.type === 'measures';
        } else {
          // For split rows, check both sides
          if (side === 'right' && row.rightLine?.type === 'measures') return true;
          if (side === 'left' && row.leftLine?.type === 'measures' && !row.rightLine) return true;
        }
      } else {
        // Later row has measures
        if (row.leftLine?.type === 'measures' || row.rightLine?.type === 'measures') {
          return false;
        }
      }
    }
    return false;
  }, [document.rows]);

  // Render a single line (section or measures)
  const renderLine = (
    line: BarChartLine, 
    rowId: string, 
    side: 'left' | 'right',
    isLast: boolean,
    showDeleteBtn: boolean = false
  ) => {
    if (line.type === 'section') {
      return (
        <div className="line-content">
          <SectionHeader
            section={line as SectionLine}
            direction={direction}
            editable={true}
            onTextChange={(text) => handleSectionTextChange(rowId, side, text)}
          />
          {showDeleteBtn && (
            <button
              className="content-delete-btn"
              onClick={() => handleDeleteContent(rowId, side)}
              title="Remove this content"
            >
              ✕
            </button>
          )}
        </div>
      );
    } else {
      return (
        <div className="line-content">
          <MeasureLineComponent
            line={line as MeasureLine}
            onBeatClick={(measureId, beat, event) => handleBeatClick(measureId, beat, rowId, side, event)}
            onBeatRightClick={(measureId, beat, event) => handleBeatRightClick(measureId, beat, rowId, side, event)}
            onExpandMeasure={(measureId) => handleExpandMeasure(measureId)}
            selectedMeasureId={selectedMeasureId}
            selectedBeat={selectedBeat}
            direction={direction}
            isLastLine={isLast}
            expandedMeasureIds={expandedMeasureIds}
          />
          {showDeleteBtn && (
            <button
              className="content-delete-btn"
              onClick={() => handleDeleteContent(rowId, side)}
              title="Remove this content"
            >
              ✕
            </button>
          )}
        </div>
      );
    }
  };

  // Render empty slot placeholder with add buttons
  const renderEmptySlot = (rowId: string, side: 'left' | 'right') => {
    return (
      <div className="empty-slot">
        <button
          className="slot-btn add-section-btn"
          onClick={() => handleAddContent(rowId, side, 'section')}
          title="Add section"
        >
          + Section
        </button>
        <button
          className="slot-btn add-measures-btn"
          onClick={() => handleAddContent(rowId, side, 'measures')}
          title="Add measures"
        >
          + Measures
        </button>
      </div>
    );
  };

  // Render a single row
  const renderRow = (row: BarChartRow, index: number) => {
    const isFullWidth = row.layout === 'full';
    
    return (
      <div key={row.id} className={`bar-chart-row ${isFullWidth ? 'full-width' : 'split'}`}>
        {/* Row controls - shown on hover */}
        <div className="row-controls">
          <button
            className={`row-control-btn toggle-layout-btn ${isFullWidth ? 'is-full' : 'is-split'}`}
            onClick={() => handleToggleRowLayout(row.id)}
            title={isFullWidth ? 'Split into 2 columns' : 'Merge to full width'}
          >
            {isFullWidth ? '⊟' : '⊞'}
          </button>
          <button
            className="row-control-btn delete-row-btn"
            onClick={() => handleDeleteRow(row.id)}
            title="Delete this row"
          >
            ✕
          </button>
        </div>

        {/* Row content */}
        <div className={`row-content ${direction}`}>
          {isFullWidth ? (
            // Full width row - single content area
            <div className="full-width-cell">
              {row.leftLine 
                ? renderLine(row.leftLine, row.id, 'left', isLastMeasureLine(index, 'left'))
                : renderEmptySlot(row.id, 'left')
              }
            </div>
          ) : (
            // Split row - two columns
            <>
              <div className="split-cell left">
                {row.leftLine 
                  ? renderLine(row.leftLine, row.id, 'left', isLastMeasureLine(index, 'left'), true)
                  : renderEmptySlot(row.id, 'left')
                }
              </div>
              <div className="split-cell right">
                {row.rightLine 
                  ? renderLine(row.rightLine, row.id, 'right', isLastMeasureLine(index, 'right'), true)
                  : renderEmptySlot(row.id, 'right')
                }
              </div>
            </>
          )}
        </div>

        {/* Add row buttons (shown below each row on hover) */}
        <div className="add-row-buttons">
          <div className="add-row-group">
            <span className="add-row-label">Full:</span>
            <button
              className="add-row-btn add-section-btn"
              onClick={() => handleAddRow('full', 'section', row.id)}
              title="Add full-width section below"
            >
              + Section
            </button>
            <button
              className="add-row-btn add-measures-btn"
              onClick={() => handleAddRow('full', 'measures', row.id)}
              title="Add full-width measures below"
            >
              + Measures
            </button>
          </div>
          <div className="add-row-group">
            <span className="add-row-label">Split:</span>
            <button
              className="add-row-btn add-section-btn"
              onClick={() => handleAddRow('split', 'section', row.id)}
              title="Add split section row below"
            >
              + Section
            </button>
            <button
              className="add-row-btn add-measures-btn"
              onClick={() => handleAddRow('split', 'measures', row.id)}
              title="Add split measures row below"
            >
              + Measures
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`bar-chart-editor ${direction}`}
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Toolbar */}
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

      {/* Page usage indicator */}
      {document.rows.length > 0 && (
        <div className={`page-usage-indicator ${pageOverflow ? 'overflow' : ''}`}>
          <div className="usage-bar">
            <div 
              className="usage-fill" 
              style={{ width: `${Math.min(100, (contentHeight / AVAILABLE_CONTENT_HEIGHT) * 100)}%` }}
            />
          </div>
          <span className="usage-text">
            {pageOverflow 
              ? `⚠️ Page overflow (${Math.round((contentHeight / AVAILABLE_CONTENT_HEIGHT) * 100)}%)`
              : `${Math.round((contentHeight / AVAILABLE_CONTENT_HEIGHT) * 100)}% of page used`
            }
          </span>
        </div>
      )}

      {/* Rows container */}
      <div className="bar-chart-rows" ref={rowsContainerRef}>
        {document.rows.length === 0 ? (
          // Empty state - show initial add buttons
          <div className="bar-chart-empty-state">
            <div className="empty-icon">🎼</div>
            <p>Start building your chord chart</p>
            <div className="initial-add-buttons">
              <div className="add-row-group">
                <span className="add-row-label">Full Width:</span>
                <button
                  className="initial-add-btn add-section-btn"
                  onClick={() => handleAddRow('full', 'section')}
                >
                  + Section
                </button>
                <button
                  className="initial-add-btn add-measures-btn"
                  onClick={() => handleAddRow('full', 'measures')}
                >
                  + Measures
                </button>
              </div>
              <div className="add-row-group">
                <span className="add-row-label">Split (2 Columns):</span>
                <button
                  className="initial-add-btn add-section-btn"
                  onClick={() => handleAddRow('split', 'section')}
                >
                  + Section
                </button>
                <button
                  className="initial-add-btn add-measures-btn"
                  onClick={() => handleAddRow('split', 'measures')}
                >
                  + Measures
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top add buttons */}
            <div className="top-add-buttons">
              <div className="add-row-group">
                <span className="add-row-label">Full:</span>
                <button
                  className="add-row-btn add-section-btn"
                  onClick={() => handleAddRow('full', 'section', 'start')}
                  title="Add full-width section at top"
                >
                  + Section
                </button>
                <button
                  className="add-row-btn add-measures-btn"
                  onClick={() => handleAddRow('full', 'measures', 'start')}
                  title="Add full-width measures at top"
                >
                  + Measures
                </button>
              </div>
              <div className="add-row-group">
                <span className="add-row-label">Split:</span>
                <button
                  className="add-row-btn add-section-btn"
                  onClick={() => handleAddRow('split', 'section', 'start')}
                  title="Add split section row at top"
                >
                  + Section
                </button>
                <button
                  className="add-row-btn add-measures-btn"
                  onClick={() => handleAddRow('split', 'measures', 'start')}
                  title="Add split measures row at top"
                >
                  + Measures
                </button>
              </div>
            </div>

            {/* All rows */}
            {document.rows.map((row, index) => renderRow(row, index))}
          </>
        )}
      </div>

      {/* Chord Dropdown */}
      {showChordDropdown && (
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
