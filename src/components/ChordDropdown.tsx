import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { searchChords, NATURAL_NOTES, type ChordDefinition } from '../data/chords';
import '../styles/ChordDropdown.css';

interface ChordDropdownProps {
  position: { x: number; y: number };
  onSelectChord: (chord: ChordDefinition) => void;
  onClose: () => void;
}

// All possible bass notes
const BASS_NOTES = [
  'A', 'A♯', 'B♭', 'B', 
  'C', 'C♯', 'D♭', 'D', 'D♯', 'E♭', 
  'E', 'F', 'F♯', 'G♭', 'G', 'G♯', 'A♭'
];

/**
 * ChordDropdown Component
 * 
 * Displays a searchable dropdown menu for selecting guitar chords.
 * Features:
 * - Real-time search filtering
 * - Keyboard navigation
 * - Grouped by root note
 * - Smart positioning to stay within viewport
 * - Optional bass note selection for slash chords
 */
const ChordDropdown: React.FC<ChordDropdownProps> = ({
  position,
  onSelectChord,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedChord, setSelectedChord] = useState<ChordDefinition | null>(null);
  const [showBassSelector, setShowBassSelector] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter chords based on search query
  const filteredChords = useMemo(() => {
    return searchChords(searchQuery);
  }, [searchQuery]);

  // Group filtered chords by natural root note
  const groupedChords = useMemo(() => {
    const groups = new Map<string, ChordDefinition[]>();
    
    for (const note of NATURAL_NOTES) {
      groups.set(note, []);
    }
    
    for (const chord of filteredChords) {
      const naturalNote = chord.root.charAt(0);
      const existing = groups.get(naturalNote) || [];
      existing.push(chord);
      groups.set(naturalNote, existing);
    }
    
    // Filter out empty groups
    const nonEmptyGroups = new Map<string, ChordDefinition[]>();
    for (const [note, chords] of groups) {
      if (chords.length > 0) {
        nonEmptyGroups.set(note, chords);
      }
    }
    
    return nonEmptyGroups;
  }, [filteredChords]);

  // Flatten chords for keyboard navigation
  const flatChordList = useMemo(() => {
    const flat: ChordDefinition[] = [];
    for (const chords of groupedChords.values()) {
      flat.push(...chords);
    }
    return flat;
  }, [groupedChords]);

  // Calculate smart position to keep dropdown in viewport
  const smartPosition = useMemo(() => {
    const dropdownWidth = 300;
    const dropdownHeight = 400;
    const padding = 10;
    
    let x = position.x;
    let y = position.y;
    
    // Adjust horizontal position
    if (x + dropdownWidth > window.innerWidth - padding) {
      x = window.innerWidth - dropdownWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }
    
    // Adjust vertical position
    if (y + dropdownHeight > window.innerHeight - padding) {
      y = position.y - dropdownHeight - 10; // Show above click position
    }
    if (y < padding) {
      y = padding;
    }
    
    return { x, y };
  }, [position]);

  // Focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // If bass selector is open, handle its navigation
    if (showBassSelector) {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          // Go back to chord selection
          setShowBassSelector(false);
          setSelectedChord(null);
          break;
        case 'Enter':
          e.preventDefault();
          // Select the highlighted bass note
          if (selectedChord && BASS_NOTES[highlightedIndex]) {
            handleBassSelect(BASS_NOTES[highlightedIndex]);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < BASS_NOTES.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : BASS_NOTES.length - 1
          );
          break;
      }
      return;
    }
    
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case 'Enter':
        e.preventDefault();
        if (flatChordList[highlightedIndex]) {
          onSelectChord(flatChordList[highlightedIndex]);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < flatChordList.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : flatChordList.length - 1
        );
        break;
    }
  }, [flatChordList, highlightedIndex, onClose, onSelectChord, showBassSelector, selectedChord]);

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Reset highlighted index when bass selector opens
  useEffect(() => {
    if (showBassSelector) {
      setHighlightedIndex(0);
    }
  }, [showBassSelector]);

  // Scroll highlighted item into view
  useEffect(() => {
    const highlightedElement = document.querySelector('.chord-item.highlighted, .bass-note-item.highlighted');
    if (highlightedElement && listRef.current) {
      highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlightedIndex]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Handle chord selection - now shows bass selector option
  const handleChordClick = useCallback((chord: ChordDefinition) => {
    // Direct select without bass
    onSelectChord(chord);
  }, [onSelectChord]);

  // Handle "Add Bass" button click
  const handleAddBassClick = useCallback((chord: ChordDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedChord(chord);
    setShowBassSelector(true);
    setHighlightedIndex(0);
  }, []);

  // Handle bass note selection
  const handleBassSelect = useCallback((bassNote: string) => {
    if (selectedChord) {
      // Create a new chord definition with the slash bass
      const slashChord: ChordDefinition = {
        symbol: `${selectedChord.symbol}/${bassNote}`,
        name: `${selectedChord.name} with ${bassNote} bass`,
        root: selectedChord.root,
        quality: selectedChord.quality,
      };
      onSelectChord(slashChord);
    }
  }, [selectedChord, onSelectChord]);

  // Go back from bass selector to chord list
  const handleBackToChords = useCallback(() => {
    setShowBassSelector(false);
    setSelectedChord(null);
    setHighlightedIndex(0);
  }, []);

  // Render chord item with highlighted musical symbols
  const renderChordSymbol = (symbol: string) => {
    return symbol
      .replace(/♯/g, '<span class="sharp">♯</span>')
      .replace(/♭/g, '<span class="flat">♭</span>');
  };

  let currentIndex = 0;

  // Render bass selector view
  if (showBassSelector && selectedChord) {
    return (
      <>
        <div className="chord-dropdown-overlay" onClick={handleOverlayClick} />
        <div
          ref={dropdownRef}
          className="chord-dropdown"
          style={{
            left: smartPosition.x,
            top: smartPosition.y,
          }}
          onKeyDown={handleKeyDown}
        >
          {/* Header with selected chord and back button */}
          <div className="bass-selector-header">
            <button className="bass-back-button" onClick={handleBackToChords} title="Back to chords">
              ← Back
            </button>
            <span className="bass-selected-chord" dangerouslySetInnerHTML={{ __html: renderChordSymbol(selectedChord.symbol) }} />
            <span className="bass-slash">/</span>
            <span className="bass-placeholder">?</span>
          </div>

          {/* Bass notes list */}
          <div ref={listRef} className="chord-dropdown-list bass-notes-list">
            <div className="bass-notes-grid">
              {BASS_NOTES.map((note, index) => (
                <button
                  key={note}
                  className={`bass-note-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                  onClick={() => handleBassSelect(note)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  dangerouslySetInnerHTML={{ __html: renderChordSymbol(note) }}
                />
              ))}
            </div>
          </div>

          {/* Keyboard Hint */}
          <div className="chord-dropdown-hint">
            <kbd>↑</kbd> <kbd>↓</kbd> Navigate • <kbd>Enter</kbd> Select • <kbd>Esc</kbd> Back
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay to capture clicks outside dropdown */}
      <div className="chord-dropdown-overlay" onClick={handleOverlayClick} />
      
      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className="chord-dropdown"
        style={{
          left: smartPosition.x,
          top: smartPosition.y,
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="chord-dropdown-search">
          <input
            ref={searchInputRef}
            type="text"
            className="chord-search-input"
            placeholder="Search chords (e.g., Am7, Gmaj7...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search chords"
          />
        </div>

        {/* Chord List */}
        <div ref={listRef} className="chord-dropdown-list">
          {filteredChords.length === 0 ? (
            <div className="chord-no-results">
              <span className="chord-no-results-icon">🎸</span>
              No chords found for "{searchQuery}"
            </div>
          ) : (
            Array.from(groupedChords.entries()).map(([rootNote, chords]) => (
              <div key={rootNote} className="chord-group">
                <div className="chord-group-header">{rootNote}</div>
                <div className="chord-group-items">
                  {chords.map((chord) => {
                    const index = currentIndex++;
                    return (
                      <div key={chord.symbol} className="chord-item-wrapper">
                        <button
                          className={`chord-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                          onClick={() => handleChordClick(chord)}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          title={chord.name}
                          dangerouslySetInnerHTML={{ __html: renderChordSymbol(chord.symbol) }}
                        />
                        <button
                          className="chord-bass-button"
                          onClick={(e) => handleAddBassClick(chord, e)}
                          title={`Add alternative bass to ${chord.symbol}`}
                        >
                          /
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Keyboard Hint */}
        <div className="chord-dropdown-hint">
          <kbd>↑</kbd> <kbd>↓</kbd> Navigate • <kbd>Enter</kbd> Select • <kbd>Esc</kbd> Close
        </div>
      </div>
    </>
  );
};

export default ChordDropdown;
