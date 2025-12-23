import React, { useRef, useCallback, useMemo, useState } from 'react';
import LyricsEditor, { type PlacedChord } from './LyricsEditor';
import '../styles/A4Page.css';
import type { TextDirection } from '../types';

// Maximum lines that fit in a column before overflow
const MAX_LINES_PER_COLUMN = 22;

interface A4PageProps {
  title: string;
  onTitleChange: (title: string) => void;
  leftColumnText: string;
  onLeftColumnChange: (text: string) => void;
  middleColumnText: string;
  onMiddleColumnChange: (text: string) => void;
  rightColumnText: string;
  onRightColumnChange: (text: string) => void;
  leftColumnChords: PlacedChord[];
  onLeftColumnChordsChange: (chords: PlacedChord[]) => void;
  middleColumnChords: PlacedChord[];
  onMiddleColumnChordsChange: (chords: PlacedChord[]) => void;
  rightColumnChords: PlacedChord[];
  onRightColumnChordsChange: (chords: PlacedChord[]) => void;
  leftColumnIndicators?: Set<number>;
  onLeftColumnIndicatorsChange?: (indicators: Set<number>) => void;
  middleColumnIndicators?: Set<number>;
  onMiddleColumnIndicatorsChange?: (indicators: Set<number>) => void;
  rightColumnIndicators?: Set<number>;
  onRightColumnIndicatorsChange?: (indicators: Set<number>) => void;
  direction?: TextDirection;
  showGrid?: boolean;
  columnCount?: 2 | 3;
  transposeSemitones?: number;
}

/**
 * A4Page Component
 * 
 * Renders an A4-sized page with:
 * - Centered title section at the top
 * - Two-column layout for lyrics with chord support
 * - Support for RTL/LTR text direction
 * - Optional alignment grid
 */
const A4Page: React.FC<A4PageProps> = ({
  title,
  onTitleChange,
  leftColumnText,
  onLeftColumnChange,
  middleColumnText,
  onMiddleColumnChange,
  rightColumnText,
  onRightColumnChange,
  leftColumnChords,
  onLeftColumnChordsChange,
  middleColumnChords,
  onMiddleColumnChordsChange,
  rightColumnChords,
  onRightColumnChordsChange,
  leftColumnIndicators = new Set(),
  onLeftColumnIndicatorsChange,
  middleColumnIndicators = new Set(),
  onMiddleColumnIndicatorsChange,
  rightColumnIndicators = new Set(),
  onRightColumnIndicatorsChange,
  direction = 'ltr',
  showGrid = false,
  columnCount = 2,
  transposeSemitones = 0,
}) => {
  const leftEditorRef = useRef<HTMLDivElement>(null);
  const middleEditorRef = useRef<HTMLDivElement>(null);
  const rightEditorRef = useRef<HTMLDivElement>(null);
  
  // Shared section clipboard across all columns
  const [copiedSection, setCopiedSection] = useState<{ lines: string[]; chords: PlacedChord[] } | null>(null);

  // Calculate line counts and overflow status
  const leftLineCount = useMemo(() => leftColumnText.split('\n').length, [leftColumnText]);
  const middleLineCount = useMemo(() => middleColumnText.split('\n').length, [middleColumnText]);
  const rightLineCount = useMemo(() => rightColumnText.split('\n').length, [rightColumnText]);

  const leftOverflow = leftLineCount > MAX_LINES_PER_COLUMN;
  const middleOverflow = middleLineCount > MAX_LINES_PER_COLUMN;
  const rightOverflow = rightLineCount > MAX_LINES_PER_COLUMN;

  // Check if all columns are full (need new page)
  const allColumnsFull = useMemo(() => {
    if (columnCount === 2) {
      return leftOverflow && rightOverflow;
    }
    return leftOverflow && middleOverflow && rightOverflow;
  }, [columnCount, leftOverflow, middleOverflow, rightOverflow]);

  /**
   * Handle title keydown - move focus to first column on Enter
   */
  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Focus the first editor based on text direction
        const targetRef = direction === 'rtl' ? rightEditorRef : leftEditorRef;
        targetRef.current?.querySelector('textarea, [role="textbox"]')?.dispatchEvent(
          new MouseEvent('click', { bubbles: true })
        );
      }
    },
    [direction]
  );

  /**
   * Get column label based on direction and column count
   */
  const getColumnLabel = (position: 'left' | 'middle' | 'right') => {
    if (columnCount === 2) {
      if (position === 'left') return direction === 'rtl' ? 'right' : 'left';
      if (position === 'right') return direction === 'rtl' ? 'left' : 'right';
      return 'middle';
    }
    return position;
  };

  return (
    <div className="a4-page-container">
      <div className="a4-page">
        <div className="a4-page-content">
          {/* Title Section */}
          <div className="title-section">
            <input
              type="text"
              className="title-input"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="Enter song title..."
              aria-label="Song title"
              maxLength={100}
            />
          </div>

          {/* Columns Layout */}
          <div className={`columns-container columns-${columnCount} ${direction}`}>
            {/* Left Column */}
            <div className={`column ${leftOverflow ? 'overflow' : ''}`} ref={leftEditorRef}>
              {leftOverflow && (
                <div className="overflow-indicator" title="Content exceeds page - move to next column">
                  ⚠️ Overflow - Move to next column
                </div>
              )}
              <LyricsEditor
                text={leftColumnText}
                onTextChange={onLeftColumnChange}
                chords={leftColumnChords}
                onChordsChange={onLeftColumnChordsChange}
                direction={direction}
                showGrid={showGrid}
                lineIndicators={leftColumnIndicators}
                onLineIndicatorsChange={onLeftColumnIndicatorsChange}
                transposeSemitones={transposeSemitones}
                placeholder={`Click to add lyrics in ${getColumnLabel('left')} column...`}
                copiedSection={copiedSection}
                onCopiedSectionChange={setCopiedSection}
              />
            </div>

            {/* Middle Column (only shown when columnCount is 3) */}
            {columnCount === 3 && (
              <div className={`column ${middleOverflow ? 'overflow' : ''}`} ref={middleEditorRef}>
                {middleOverflow && (
                  <div className="overflow-indicator" title="Content exceeds page - move to next column">
                    ⚠️ Overflow - Move to next column
                  </div>
                )}
                <LyricsEditor
                  text={middleColumnText}
                  onTextChange={onMiddleColumnChange}
                  chords={middleColumnChords}
                  onChordsChange={onMiddleColumnChordsChange}
                  direction={direction}
                  showGrid={showGrid}
                  lineIndicators={middleColumnIndicators}
                  onLineIndicatorsChange={onMiddleColumnIndicatorsChange}
                  transposeSemitones={transposeSemitones}
                  placeholder={`Click to add lyrics in ${getColumnLabel('middle')} column...`}
                  copiedSection={copiedSection}
                  onCopiedSectionChange={setCopiedSection}
                />
              </div>
            )}

            {/* Right Column */}
            <div className={`column ${rightOverflow ? 'overflow' : ''}`} ref={rightEditorRef}>
              {rightOverflow && (
                <div className="overflow-indicator" title="Content exceeds page - move to next column">
                  ⚠️ Overflow - Move to next column
                </div>
              )}
              <LyricsEditor
                text={rightColumnText}
                onTextChange={onRightColumnChange}
                chords={rightColumnChords}
                onChordsChange={onRightColumnChordsChange}
                direction={direction}
                showGrid={showGrid}
                lineIndicators={rightColumnIndicators}
                onLineIndicatorsChange={onRightColumnIndicatorsChange}
                transposeSemitones={transposeSemitones}
                placeholder={`Click to add lyrics in ${getColumnLabel('right')} column...`}
                copiedSection={copiedSection}
                onCopiedSectionChange={setCopiedSection}
              />
            </div>
          </div>

          {/* New Page Indicator */}
          {allColumnsFull && (
            <div className="new-page-indicator">
              📄 All columns full - A new page would be needed for more content
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default A4Page;
