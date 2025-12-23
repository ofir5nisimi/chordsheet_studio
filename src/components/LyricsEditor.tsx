import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ChordDropdown from './ChordDropdown';
import type { ChordDefinition } from '../data/chords';
import type { TextDirection } from '../types';
import { transposeChord, shouldPreferFlats } from '../utils';
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
  placeholder?: string;
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
  placeholder = 'Type your lyrics here...',
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
  const [copiedChords, setCopiedChords] = useState<PlacedChord[] | null>(null);
  const [lineHoverIndex, setLineHoverIndex] = useState<number | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

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
    const charWidth = 8.4;
    const charIndex = Math.max(0, Math.floor(clickX / charWidth));

    setDropdownPosition({ x: e.clientX, y: e.clientY });
    setPendingChordPosition({ lineIndex, charIndex });
    setSelectedChordId(null);
  }, [chordMode]);

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

  // Handle chord drag start
  const handleChordDragStart = useCallback((e: React.MouseEvent, chord: PlacedChord) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingChordId(chord.id);
    setDragStartX(e.clientX);
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
        const charPosition = chord.charIndex * 8.4; // charWidth
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

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [draggingChordId, dragStartX, dragStartOffset, chords, onChordsChange]);

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
  const getCharacterPosition = useCallback((charIndex: number): number => {
    const charWidth = 8.4; // Approximate width of a character at 14px font
    return charIndex * charWidth;
  }, []);

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
    if (lineChords.length > 0) {
      setCopiedChords(lineChords);
      setContextMenuPosition(null);
    }
  }, [getChordsForLine]);

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
  }, [getChordsForLine, getCharacterPosition, selectedChordId, draggingChordId, handleChordClick, handleChordDragStart, handleChordContextMenu, chordMode, handleChordRowClick, direction, lineHoverIndex, copiedChords, handleCopyChords, handlePasteChords, lineIndicators, handleToggleLineIndicator, transposeSemitones]);

  // Render a single line
  const renderLine = useCallback((line: string, lineIndex: number) => {
    const isEditing = editingLineIndex === lineIndex && !chordMode;
    const isChordOnlyLine = line === '' && getChordsForLine(lineIndex).length > 0;
    
    return (
      <div key={lineIndex} className={`lyrics-line ${direction} ${isChordOnlyLine ? 'chord-only-line' : ''}`}>
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
  }, [editingLineIndex, chordMode, direction, renderLineChords, handleLineChange, handleLineKeyDown, handleCharClick, getChordsForLine]);

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
    <div ref={editorRef} className="lyrics-editor">
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
          <button className="context-menu-item change" onClick={handleChangeChordClick}>
            ✏️ Change Chord
          </button>
          <button className="context-menu-item delete" onClick={handleDeleteClick}>
            🗑️ Delete Chord
          </button>
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
