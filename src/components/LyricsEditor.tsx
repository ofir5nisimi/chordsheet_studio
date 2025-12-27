import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ChordDropdown from './ChordDropdown';
import type { ChordDefinition } from '../data/chords';
import type { TextDirection } from '../types';
import { transposeChord, shouldPreferFlats } from '../utils';
import { 
  isSectionLine, 
  getSectionRange, 
} from '../data/sections';
import '../styles/LyricsEditor.css';

/** Represents a placed chord with position info */
export interface PlacedChord {
  id: string;
  chordSymbol: string;
  chordName: string;
  lineIndex: number;
  charIndex: number;
  offsetX: number; // Fine-tuning offset from character position
}

interface LyricsEditorProps {
  text: string;
  onTextChange: (text: string) => void;
  chords: PlacedChord[];
  onChordsChange: (chords: PlacedChord[]) => void;
  direction?: TextDirection;
  showGrid?: boolean;
  lineIndicators?: Set<number>;
  onLineIndicatorsChange?: (indicators: Set<number>) => void;
  transposeSemitones?: number;
  fontSize?: number;
  placeholder?: string;
  copiedSection?: { lines: string[]; chords: PlacedChord[] } | null;
  onCopiedSectionChange?: (section: { lines: string[]; chords: PlacedChord[] } | null) => void;
  copiedChords?: PlacedChord[] | null;
  onCopiedChordsChange?: (chords: PlacedChord[] | null) => void;
}

/**
 * LyricsEditor Component
 * 
 * Renders lyrics text with chords positioned above.
 * Uses a structured view where each line has a chord row and lyrics row.
 */
const LyricsEditor: React.FC<LyricsEditorProps> = ({
  text,
  onTextChange,
  chords,
  onChordsChange,
  direction = 'ltr',
  showGrid = false,
  lineIndicators = new Set(),
  onLineIndicatorsChange,
  transposeSemitones = 0,
  fontSize = 14,
  placeholder = 'Type your lyrics here...',
  copiedSection = null,
  onCopiedSectionChange,
  copiedChords = null,
  onCopiedChordsChange,
}) => {
  const [dropdownPosition, setDropdownPosition] = useState<{ x: number; y: number } | null>(null);
  const [pendingChordPosition, setPendingChordPosition] = useState<{ lineIndex: number; charIndex: number } | null>(null);
  const [selectedChordId, setSelectedChordId] = useState<string | null>(null);
  const [draggingChordId, setDraggingChordId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  const [chordMode, setChordMode] = useState(false);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuChordId, setContextMenuChordId] = useState<string | null>(null);
  const [editingChordId, setEditingChordId] = useState<string | null>(null);
  const [lineHoverIndex, setLineHoverIndex] = useState<number | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // Calculate character width based on font size (ratio: 8.4px at 14px font = 0.6)
  const charWidth = useMemo(() => fontSize * 0.6, [fontSize]);

  // Split text into lines
  const lines = useMemo(() => text.split('\n'), [text]);

  // Get chords for a specific line
  const getChordsForLine = useCallback((lineIndex: number): PlacedChord[] => {
    return chords.filter(c => c.lineIndex === lineIndex);
  }, [chords]);

  // Generate unique ID for new chords
  const generateChordId = useCallback(() => {
    return `chord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Handle line text change
  const handleLineChange = useCallback((lineIndex: number, newLineText: string) => {
    const newLines = [...lines];
    newLines[lineIndex] = newLineText;
    onTextChange(newLines.join('\n'));
  }, [lines, onTextChange]);

  // Handle paste with multi-line text
  const handleLinePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>, lineIndex: number) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Check if pasted text contains newlines
    if (pastedText.includes('\n') || pastedText.includes('\r')) {
      e.preventDefault();
      
      // Split by various newline formats and filter empty lines at the end
      const pastedLines = pastedText.split(/\r\n|\r|\n/);
      
      // Get current input element and cursor position
      const input = e.currentTarget;
      const cursorPos = input.selectionStart || 0;
      const currentLine = lines[lineIndex] || '';
      
      // Split current line at cursor position
      const beforeCursor = currentLine.slice(0, cursorPos);
      const afterCursor = currentLine.slice(input.selectionEnd || cursorPos);
      
      // Build new lines array
      const newLines = [...lines];
      
      // First pasted line goes with text before cursor
      const firstLine = beforeCursor + pastedLines[0];
      
      // Last pasted line goes with text after cursor
      const lastLine = pastedLines[pastedLines.length - 1] + afterCursor;
      
      // Middle lines (if any) are inserted as-is
      const middleLines = pastedLines.slice(1, -1);
      
      // Replace current line and insert new lines
      if (pastedLines.length === 1) {
        // Single line paste (shouldn't reach here, but just in case)
        newLines[lineIndex] = firstLine + afterCursor;
      } else {
        // Multi-line paste
        newLines.splice(lineIndex, 1, firstLine, ...middleLines, lastLine);
      }
      
      // Update text
      onTextChange(newLines.join('\n'));
      
      // Shift chords on lines after the current line
      const numNewLines = pastedLines.length - 1;
      if (numNewLines > 0) {
        const updatedChords = chords.map(chord => 
          chord.lineIndex > lineIndex
            ? { ...chord, lineIndex: chord.lineIndex + numNewLines }
            : chord
        );
        onChordsChange(updatedChords);
      }
      
      // Focus the last inserted line
      const lastInsertedLineIndex = lineIndex + pastedLines.length - 1;
      setTimeout(() => {
        setEditingLineIndex(lastInsertedLineIndex);
        const inputEl = inputRefs.current.get(lastInsertedLineIndex);
        if (inputEl) {
          inputEl.focus();
          // Set cursor at the position after the last pasted content (before afterCursor)
          const cursorPosition = lastLine.length - afterCursor.length;
          inputEl.setSelectionRange(cursorPosition, cursorPosition);
        }
      }, 0);
    }
    // If no newlines, let the default paste behavior handle it
  }, [lines, chords, onTextChange, onChordsChange]);

  // Handle key down in line input
  const handleLineKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, lineIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Insert new line after current
      const newLines = [...lines];
      newLines.splice(lineIndex + 1, 0, '');
      onTextChange(newLines.join('\n'));
      
      // Shift all chords on lines after the inserted line down by 1
      const updatedChords = chords.map(chord => 
        chord.lineIndex > lineIndex
          ? { ...chord, lineIndex: chord.lineIndex + 1 }
          : chord
      );
      onChordsChange(updatedChords);
      
      // Focus new line
      setTimeout(() => {
        setEditingLineIndex(lineIndex + 1);
        inputRefs.current.get(lineIndex + 1)?.focus();
      }, 0);
    } else if (e.key === 'Backspace' && lines[lineIndex] === '' && lineIndex > 0) {
      e.preventDefault();
      // Delete empty line
      const newLines = lines.filter((_, i) => i !== lineIndex);
      onTextChange(newLines.join('\n'));
      
      // Remove chords on the deleted line and shift chords on lines after it up by 1
      const updatedChords = chords
        .filter(chord => chord.lineIndex !== lineIndex) // Remove chords on deleted line
        .map(chord => 
          chord.lineIndex > lineIndex
            ? { ...chord, lineIndex: chord.lineIndex - 1 }
            : chord
        );
      onChordsChange(updatedChords);
      
      // Focus previous line
      setTimeout(() => {
        setEditingLineIndex(lineIndex - 1);
        inputRefs.current.get(lineIndex - 1)?.focus();
      }, 0);
    } else if (e.key === 'ArrowUp' && lineIndex > 0) {
      e.preventDefault();
      setEditingLineIndex(lineIndex - 1);
      inputRefs.current.get(lineIndex - 1)?.focus();
    } else if (e.key === 'ArrowDown' && lineIndex < lines.length - 1) {
      e.preventDefault();
      setEditingLineIndex(lineIndex + 1);
      inputRefs.current.get(lineIndex + 1)?.focus();
    }
  }, [lines, chords, onTextChange, onChordsChange]);

  // Handle click on character to add chord
  const handleCharClick = useCallback((e: React.MouseEvent, lineIndex: number, charIndex: number) => {
    if (!chordMode) return;
    e.stopPropagation();
    
    if ((e.target as HTMLElement).closest('.chord-display')) {
      return;
    }

    setDropdownPosition({ x: e.clientX, y: e.clientY });
    setPendingChordPosition({ lineIndex, charIndex });
    setSelectedChordId(null);
  }, [chordMode]);

  // Handle click on empty chord row (for chord-only lines)
  const handleChordRowClick = useCallback((e: React.MouseEvent, lineIndex: number) => {
    if (!chordMode) return;
    e.stopPropagation();
    
    if ((e.target as HTMLElement).closest('.chord-display')) {
      return;
    }

    // Calculate approximate character position based on click X position
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const charIndex = Math.max(0, Math.floor(clickX / charWidth));

    setDropdownPosition({ x: e.clientX, y: e.clientY });
    setPendingChordPosition({ lineIndex, charIndex });
    setSelectedChordId(null);
  }, [chordMode, charWidth]);

  // Handle chord selection from dropdown
  const handleSelectChord = useCallback((chord: ChordDefinition) => {
    if (editingChordId) {
      // Changing an existing chord
      onChordsChange(
        chords.map(c =>
          c.id === editingChordId
            ? { ...c, chordSymbol: chord.symbol, chordName: chord.name }
            : c
        )
      );
      setEditingChordId(null);
    } else if (pendingChordPosition) {
      // Adding a new chord
      const newChord: PlacedChord = {
        id: generateChordId(),
        chordSymbol: chord.symbol,
        chordName: chord.name,
        lineIndex: pendingChordPosition.lineIndex,
        charIndex: pendingChordPosition.charIndex,
        offsetX: 0,
      };
      onChordsChange([...chords, newChord]);
    }
    setDropdownPosition(null);
    setPendingChordPosition(null);
  }, [pendingChordPosition, editingChordId, chords, onChordsChange, generateChordId]);

  // Close dropdown
  const handleCloseDropdown = useCallback(() => {
    setDropdownPosition(null);
    setPendingChordPosition(null);
    setEditingChordId(null);
  }, []);

  // Handle chord click (select)
  const handleChordClick = useCallback((e: React.MouseEvent, chordId: string) => {
    e.stopPropagation();
    setSelectedChordId(selectedChordId === chordId ? null : chordId);
  }, [selectedChordId]);

  // Handle chord drag start (mouse)
  const handleChordDragStart = useCallback((e: React.MouseEvent, chord: PlacedChord) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingChordId(chord.id);
    setDragStartX(e.clientX);
    setDragStartOffset(chord.offsetX);
    setSelectedChordId(chord.id);
  }, []);

  // Handle chord drag start (touch)
  const handleChordTouchStart = useCallback((e: React.TouchEvent, chord: PlacedChord) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setDraggingChordId(chord.id);
    setDragStartX(touch.clientX);
    setDragStartOffset(chord.offsetX);
    setSelectedChordId(chord.id);
  }, []);

  // Handle chord drag
  useEffect(() => {
    if (!draggingChordId) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX;
      // For RTL, invert the drag direction since we use 'right' positioning
      const adjustedDelta = direction === 'rtl' ? -deltaX : deltaX;
      let newOffset = dragStartOffset + adjustedDelta;
      
      // Constrain to column boundaries with some padding for flexibility
      const chord = chords.find(c => c.id === draggingChordId);
      if (chord && editorRef.current) {
        const columnWidth = editorRef.current.offsetWidth;
        const charPosition = chord.charIndex * charWidth;
        const padding = 5; // Extra space on both sides for positioning flexibility
        const minOffset = -charPosition - padding; // Allow some space past the left edge
        const maxOffset = columnWidth - charPosition + padding; // Allow some space past the right edge
        newOffset = Math.max(minOffset, Math.min(maxOffset, newOffset));
      }
      
      onChordsChange(
        chords.map(c => 
          c.id === draggingChordId 
            ? { ...c, offsetX: newOffset }
            : c
        )
      );
    };

    const handleMouseUp = () => {
      setDraggingChordId(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && draggingChordId) {
        // Cancel drag - restore original position
        onChordsChange(
          chords.map(c => 
            c.id === draggingChordId 
              ? { ...c, offsetX: dragStartOffset }
              : c
          )
        );
        setDraggingChordId(null);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStartX;
        // For RTL, invert the drag direction since we use 'right' positioning
        const adjustedDelta = direction === 'rtl' ? -deltaX : deltaX;
        let newOffset = dragStartOffset + adjustedDelta;
        
        // Constrain to column boundaries
        const chord = chords.find(c => c.id === draggingChordId);
        if (chord && editorRef.current) {
          const columnWidth = editorRef.current.offsetWidth;
          const charPosition = chord.charIndex * charWidth;
          const padding = 5;
          const minOffset = -charPosition - padding;
          const maxOffset = columnWidth - charPosition + padding;
          newOffset = Math.max(minOffset, Math.min(maxOffset, newOffset));
        }
        
        onChordsChange(
          chords.map(c => 
            c.id === draggingChordId 
              ? { ...c, offsetX: newOffset }
              : c
          )
        );
      }
    };

    const handleTouchEnd = () => {
      setDraggingChordId(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [draggingChordId, dragStartX, dragStartOffset, chords, onChordsChange, direction, charWidth]);

  // Handle right-click context menu
  const handleChordContextMenu = useCallback((e: React.MouseEvent, chordId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuChordId(chordId);
    setSelectedChordId(chordId);
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenuPosition(null);
    setContextMenuChordId(null);
  }, []);

  // Show delete confirmation
  const handleDeleteClick = useCallback(() => {
    if (contextMenuChordId) {
      setShowDeleteConfirm(contextMenuChordId);
    }
    closeContextMenu();
  }, [contextMenuChordId, closeContextMenu]);

  // Handle change chord click from context menu
  const handleChangeChordClick = useCallback(() => {
    if (contextMenuChordId && contextMenuPosition) {
      setEditingChordId(contextMenuChordId);
      setDropdownPosition({ x: contextMenuPosition.x, y: contextMenuPosition.y });
    }
    closeContextMenu();
  }, [contextMenuChordId, contextMenuPosition, closeContextMenu]);

  // Confirm delete
  const confirmDelete = useCallback(() => {
    if (showDeleteConfirm) {
      onChordsChange(chords.filter(c => c.id !== showDeleteConfirm));
      setSelectedChordId(null);
    }
    setShowDeleteConfirm(null);
  }, [showDeleteConfirm, chords, onChordsChange]);

  // Cancel delete
  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(null);
  }, []);

  // Handle keyboard events for chord deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedChordId && editingLineIndex === null && !draggingChordId) {
        e.preventDefault();
        setShowDeleteConfirm(selectedChordId);
      }
      if (e.key === 'Escape') {
        setSelectedChordId(null);
        setChordMode(false);
        handleCloseDropdown();
        closeContextMenu();
        cancelDelete();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedChordId, editingLineIndex, draggingChordId, handleCloseDropdown, closeContextMenu, cancelDelete]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      closeContextMenu();
    };
    
    if (contextMenuPosition) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenuPosition, closeContextMenu]);

  // Toggle chord mode
  const toggleChordMode = useCallback(() => {
    setChordMode(prev => !prev);
    setSelectedChordId(null);
    setEditingLineIndex(null);
  }, []);

  // Render chord symbol with colored accidentals
  const renderChordSymbol = (symbol: string) => {
    return symbol
      .replace(/♯/g, '<span class="sharp">♯</span>')
      .replace(/♭/g, '<span class="flat">♭</span>');
  };

  // Calculate character position for chord placement
  const getCharacterPosition = useCallback((charIdx: number): number => {
    return charIdx * charWidth;
  }, [charWidth]);

  // Render grid lines
  const renderGrid = useMemo(() => {
    if (!showGrid) return null;

    const horizontalLines = [];
    const verticalLines = [];
    const lineHeight = 52;
    const columnWidth = 20;

    for (let i = 0; i < 20; i++) {
      horizontalLines.push(
        <div key={`h-${i}`} className="grid-line-horizontal" style={{ top: i * lineHeight }} />
      );
    }

    for (let i = 0; i < 30; i++) {
      verticalLines.push(
        <div key={`v-${i}`} className="grid-line-vertical" style={{ left: i * columnWidth }} />
      );
    }

    return (
      <div className="grid-overlay">
        {horizontalLines}
        {verticalLines}
      </div>
    );
  }, [showGrid]);

  // Handle copying chords from a line
  const handleCopyChords = useCallback((lineIndex: number) => {
    const lineChords = getChordsForLine(lineIndex);
    if (lineChords.length > 0 && onCopiedChordsChange) {
      onCopiedChordsChange(lineChords);
      setContextMenuPosition(null);
    }
  }, [getChordsForLine, onCopiedChordsChange]);

  // Handle pasting chords to a line
  const handlePasteChords = useCallback((targetLineIndex: number) => {
    if (!copiedChords || copiedChords.length === 0) return;
    
    // Create new chords with updated line index and new IDs
    const newChords = copiedChords.map(chord => ({
      ...chord,
      id: generateChordId(),
      lineIndex: targetLineIndex,
    }));
    
    // Remove existing chords on target line and add new ones
    const filteredChords = chords.filter(c => c.lineIndex !== targetLineIndex);
    onChordsChange([...filteredChords, ...newChords]);
  }, [copiedChords, chords, onChordsChange, generateChordId]);

  // Toggle indicator for a specific line
  const handleToggleLineIndicator = useCallback((lineIndex: number) => {
    if (!onLineIndicatorsChange) return;
    const newIndicators = new Set(lineIndicators);
    if (newIndicators.has(lineIndex)) {
      newIndicators.delete(lineIndex);
    } else {
      newIndicators.add(lineIndex);
    }
    onLineIndicatorsChange(newIndicators);
  }, [lineIndicators, onLineIndicatorsChange]);

  // ====== Section Handling Functions ======

  // Handle copying an entire section (from section header to next section or end)
  // Only copies the CONTENT of the section, not the section header itself
  const handleCopySection = useCallback((sectionLineIndex: number) => {
    if (!onCopiedSectionChange) return;
    
    const { startLine, endLine } = getSectionRange(text, sectionLineIndex);
    
    // Get all lines in the section, EXCLUDING the section header (startLine)
    // Start from startLine + 1 to skip the [Section] line
    const contentStartLine = startLine + 1;
    
    // If there's no content (section header is the only line), don't copy anything
    if (contentStartLine > endLine) {
      onCopiedSectionChange({ lines: [], chords: [] });
      return;
    }
    
    const sectionLines = lines.slice(contentStartLine, endLine + 1);
    
    // Get all chords in the section content, adjusting their line indices to be relative
    const sectionChords = chords
      .filter(chord => chord.lineIndex >= contentStartLine && chord.lineIndex <= endLine)
      .map(chord => ({
        ...chord,
        lineIndex: chord.lineIndex - contentStartLine, // Make relative to content start
      }));
    
    onCopiedSectionChange({ lines: sectionLines, chords: sectionChords });
  }, [text, lines, chords, onCopiedSectionChange]);

  // Handle pasting a copied section
  const handlePasteSection = useCallback((targetLineIndex: number) => {
    if (!copiedSection) return;
    
    const { lines: sectionLines, chords: sectionChords } = copiedSection;
    
    // Insert section lines AFTER the target line (not at it)
    // This prevents duplicating the section header when pasting on a section line
    const insertIndex = targetLineIndex + 1;
    const newLines = [...lines];
    newLines.splice(insertIndex, 0, ...sectionLines);
    onTextChange(newLines.join('\n'));
    
    // Shift existing chords that are at or after the insertion point
    const shiftAmount = sectionLines.length;
    const shiftedChords = chords.map(chord => 
      chord.lineIndex >= insertIndex
        ? { ...chord, lineIndex: chord.lineIndex + shiftAmount }
        : chord
    );
    
    // Add the section chords with new IDs and adjusted line indices
    const newSectionChords = sectionChords.map(chord => ({
      ...chord,
      id: generateChordId(),
      lineIndex: chord.lineIndex + insertIndex,
    }));
    
    onChordsChange([...shiftedChords, ...newSectionChords]);
  }, [copiedSection, lines, onTextChange, chords, onChordsChange, generateChordId]);

  // Handle deleting an entire section (from section header to next section or end)
  const handleDeleteSection = useCallback((sectionLineIndex: number) => {
    const { startLine, endLine } = getSectionRange(text, sectionLineIndex);
    
    // Calculate how many lines to remove
    const linesToRemove = endLine - startLine + 1;
    
    // Remove the section lines
    const newLines = [...lines];
    newLines.splice(startLine, linesToRemove);
    onTextChange(newLines.join('\n'));
    
    // Remove chords in the section and shift chords after it
    const updatedChords = chords
      .filter(chord => chord.lineIndex < startLine || chord.lineIndex > endLine)
      .map(chord => 
        chord.lineIndex > endLine
          ? { ...chord, lineIndex: chord.lineIndex - linesToRemove }
          : chord
      );
    
    onChordsChange(updatedChords);
  }, [text, lines, chords, onTextChange, onChordsChange]);

  // Render chords for a line
  const renderLineChords = useCallback((lineIndex: number, isChordOnlyLine: boolean = false) => {
    const lineChords = getChordsForLine(lineIndex);
    const isRtl = direction === 'rtl';
    const hasChords = lineChords.length > 0;
    const canPaste = copiedChords && copiedChords.length > 0;
    const showIndicatorForLine = lineIndicators.has(lineIndex);
    
    return (
      <div 
        className={`line-chords-row ${chordMode ? 'clickable' : ''} ${isChordOnlyLine ? 'chord-only' : ''}`}
        onClick={chordMode ? (e) => handleChordRowClick(e, lineIndex) : undefined}
        onMouseEnter={() => setLineHoverIndex(lineIndex)}
        onMouseLeave={() => setLineHoverIndex(null)}
        title={chordMode ? 'Click to add chord here' : undefined}
      >
        {lineChords.map((chord) => {
          const position = getCharacterPosition(chord.charIndex) + chord.offsetX;
          // For RTL, position from right; for LTR, position from left
          const positionStyle = isRtl ? { right: position } : { left: position };
          // Apply transposition to the chord symbol
          const displaySymbol = transposeSemitones !== 0
            ? transposeChord(chord.chordSymbol, transposeSemitones, shouldPreferFlats(chord.chordSymbol))
            : chord.chordSymbol;
          return (
            <div
              key={chord.id}
              className={`chord-display ${selectedChordId === chord.id ? 'selected' : ''} ${draggingChordId === chord.id ? 'dragging' : ''} ${showIndicatorForLine ? 'with-indicator' : ''}`}
              style={positionStyle}
              onClick={(e) => handleChordClick(e, chord.id)}
              onMouseDown={(e) => handleChordDragStart(e, chord)}
              onTouchStart={(e) => handleChordTouchStart(e, chord)}
              onContextMenu={(e) => handleChordContextMenu(e, chord.id)}
              title={`${chord.chordName} - Drag to move, Right-click to delete`}
            >
              <span dangerouslySetInnerHTML={{ __html: renderChordSymbol(displaySymbol) }} />
              {showIndicatorForLine && <span className="chord-indicator">|</span>}
            </div>
          );
        })}
        {chordMode && lineChords.length === 0 && (
          <span className="chord-placeholder">+ Click to add chord</span>
        )}
        {!chordMode && lineHoverIndex === lineIndex && (
          <div className="chord-line-actions">
            {hasChords && (
              <>
                <button 
                  className={`indicator-toggle-btn ${showIndicatorForLine ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); handleToggleLineIndicator(lineIndex); }}
                  title={showIndicatorForLine ? 'Hide position indicators' : 'Show position indicators'}
                >
                  {showIndicatorForLine ? '↓ Hide' : '↓ Show'}
                </button>
                <button 
                  className="copy-chords-btn"
                  onClick={(e) => { e.stopPropagation(); handleCopyChords(lineIndex); }}
                  title="Copy chords from this line (Ctrl+C)"
                >
                  📋 Copy
                </button>
              </>
            )}
            {canPaste && (
              <button 
                className="paste-chords-btn"
                onClick={(e) => { e.stopPropagation(); handlePasteChords(lineIndex); }}
                title="Paste chords to this line (Ctrl+V)"
              >
                📄 Paste
              </button>
            )}
          </div>
        )}
      </div>
    );
  }, [getChordsForLine, getCharacterPosition, selectedChordId, draggingChordId, handleChordClick, handleChordDragStart, handleChordTouchStart, handleChordContextMenu, chordMode, handleChordRowClick, direction, lineHoverIndex, copiedChords, handleCopyChords, handlePasteChords, lineIndicators, handleToggleLineIndicator, transposeSemitones]);

  // Render a single line
  const renderLine = useCallback((line: string, lineIndex: number) => {
    const isEditing = editingLineIndex === lineIndex && !chordMode;
    const isChordOnlyLine = line === '' && getChordsForLine(lineIndex).length > 0;
    const isSection = isSectionLine(line);
    
    // Handle right-click on section line
    const handleSectionContextMenu = (e: React.MouseEvent) => {
      if (isSection) {
        e.preventDefault();
        setContextMenuPosition({ x: e.clientX, y: e.clientY });
        setContextMenuChordId(`section-${lineIndex}`); // Use special ID for section context menu
      }
    };
    
    return (
      <div 
        key={lineIndex} 
        className={`lyrics-line ${direction} ${isChordOnlyLine ? 'chord-only-line' : ''} ${isSection ? 'section-line' : ''}`}
        onMouseEnter={() => setLineHoverIndex(lineIndex)}
        onMouseLeave={() => setLineHoverIndex(null)}
        onContextMenu={isSection ? handleSectionContextMenu : undefined}
      >
        {/* Chords Row */}
        {renderLineChords(lineIndex, isChordOnlyLine)}
        
        {/* Lyrics Row */}
        <div className={`line-lyrics-row ${isChordOnlyLine ? 'chord-only' : ''}`}>
          {isEditing ? (
            <input
              ref={(el) => { if (el) inputRefs.current.set(lineIndex, el); }}
              type="text"
              className={`line-input ${direction}`}
              value={line}
              onChange={(e) => handleLineChange(lineIndex, e.target.value)}
              onKeyDown={(e) => handleLineKeyDown(e, lineIndex)}
              onPaste={(e) => handleLinePaste(e, lineIndex)}
              onBlur={() => setEditingLineIndex(null)}
              autoFocus
            />
          ) : chordMode ? (
            // Chord mode - clickable characters
            <div className="line-text-clickable">
              {line.length === 0 ? (
                <span 
                  className="char-span empty-line" 
                  onClick={(e) => handleCharClick(e, lineIndex, 0)}
                >
                  {isChordOnlyLine ? '(chords only)' : '\u00A0'}
                </span>
              ) : (
                line.split('').map((char, charIndex) => (
                  <span
                    key={charIndex}
                    className="char-span"
                    onClick={(e) => handleCharClick(e, lineIndex, charIndex)}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))
              )}
            </div>
          ) : (
            // Display mode - click to edit
            <div 
              className="line-text-display"
              onClick={(e) => {
                e.stopPropagation();
                setEditingLineIndex(lineIndex);
                // Focus the input after a brief delay
                setTimeout(() => {
                  inputRefs.current.get(lineIndex)?.focus();
                }, 0);
              }}
            >
              {line || (isChordOnlyLine ? '' : '\u00A0')}
            </div>
          )}
        </div>
      </div>
    );
  }, [editingLineIndex, chordMode, direction, renderLineChords, handleLineChange, handleLineKeyDown, handleLinePaste, handleCharClick, getChordsForLine, lineHoverIndex, copiedSection, handleCopySection, handlePasteSection]);

  // Handle adding new line at end
  const handleAddLine = useCallback(() => {
    if (!chordMode) {
      onTextChange(text + '\n');
      const newLineIndex = lines.length;
      setTimeout(() => {
        setEditingLineIndex(newLineIndex);
        inputRefs.current.get(newLineIndex)?.focus();
      }, 0);
    }
  }, [chordMode, text, lines.length, onTextChange]);

  // Handle adding chord-only line (empty line for chords without lyrics)
  const handleAddChordOnlyLine = useCallback(() => {
    // Add empty line at end
    const newText = text.endsWith('\n') ? text + '\n' : text + '\n\n';
    onTextChange(newText);
    // Note: The user can now click on this empty line's chord row to add chords
  }, [text, onTextChange]);

  // Keyboard shortcuts for copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && lineHoverIndex !== null && !editingLineIndex) {
        e.preventDefault();
        handleCopyChords(lineHoverIndex);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v' && lineHoverIndex !== null && copiedChords && !editingLineIndex) {
        e.preventDefault();
        handlePasteChords(lineHoverIndex);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lineHoverIndex, copiedChords, editingLineIndex, handleCopyChords, handlePasteChords]);

  return (
    <div 
      ref={editorRef} 
      className="lyrics-editor"
      style={{ '--lyrics-font-size': `${fontSize}px` } as React.CSSProperties}
    >
      {/* Editor Controls */}
      <div className="editor-controls">
        <button
          className={`chord-mode-toggle ${chordMode ? 'active' : ''}`}
          onClick={toggleChordMode}
          title={chordMode ? 'Exit chord mode (Esc)' : 'Click to add chords'}
        >
          {chordMode ? '✓ Adding Chords' : '🎸 Add Chords'}
        </button>
        
        {chordMode && (
          <button
            className="chord-only-line-btn"
            onClick={handleAddChordOnlyLine}
            title="Add a line for chords only (no lyrics)"
          >
            🎵 Add Chord Line
          </button>
        )}
      </div>

      {/* Grid Overlay */}
      {renderGrid}

      {/* Lines Container */}
      <div className={`lyrics-lines-container ${direction}`}>
        {lines.length === 0 ? (
          <div className="lyrics-line">
            <div className="line-chords-row" />
            <div className="line-lyrics-row">
              <input
                ref={(el) => { if (el) inputRefs.current.set(0, el); }}
                type="text"
                className={`line-input ${direction}`}
                value=""
                onChange={(e) => onTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onTextChange('\n');
                    setTimeout(() => {
                      setEditingLineIndex(1);
                      inputRefs.current.get(1)?.focus();
                    }, 0);
                  }
                }}
                placeholder={placeholder}
                autoFocus
              />
            </div>
          </div>
        ) : (
          lines.map((line, index) => renderLine(line, index))
        )}
        
        {/* Add new line area */}
        {!chordMode && lines.length > 0 && lines[lines.length - 1] !== '' && (
          <div className="add-line-area" onClick={handleAddLine}>
            + Add new line
          </div>
        )}
      </div>

      {/* Chord Dropdown */}
      {dropdownPosition && (
        <ChordDropdown
          position={dropdownPosition}
          onSelectChord={handleSelectChord}
          onClose={handleCloseDropdown}
        />
      )}

      {/* Context Menu */}
      {contextMenuPosition && (
        <div 
          className="chord-context-menu"
          style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenuChordId?.startsWith('section-') ? (
            // Section context menu
            <>
              <button 
                className="context-menu-item copy-section" 
                onClick={() => {
                  const lineIndex = parseInt(contextMenuChordId.replace('section-', ''), 10);
                  handleCopySection(lineIndex);
                  setContextMenuPosition(null);
                  setContextMenuChordId(null);
                }}
              >
                📋 Copy Section
              </button>
              {copiedSection && (
                <button 
                  className="context-menu-item paste-section" 
                  onClick={() => {
                    const lineIndex = parseInt(contextMenuChordId.replace('section-', ''), 10);
                    handlePasteSection(lineIndex);
                    setContextMenuPosition(null);
                    setContextMenuChordId(null);
                  }}
                >
                  📄 Paste Section Here
                </button>
              )}
              <button 
                className="context-menu-item delete-section" 
                onClick={() => {
                  const lineIndex = parseInt(contextMenuChordId.replace('section-', ''), 10);
                  handleDeleteSection(lineIndex);
                  setContextMenuPosition(null);
                  setContextMenuChordId(null);
                }}
              >
                🗑️ Delete Section
              </button>
            </>
          ) : (
            // Chord context menu
            <>
              <button className="context-menu-item change" onClick={handleChangeChordClick}>
                ✏️ Change Chord
              </button>
              <button className="context-menu-item delete" onClick={handleDeleteClick}>
                🗑️ Delete Chord
              </button>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={cancelDelete}>
          <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p>Delete this chord?</p>
            <div className="delete-confirm-buttons">
              <button className="confirm-yes" onClick={confirmDelete}>Yes</button>
              <button className="confirm-no" onClick={cancelDelete}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LyricsEditor;
