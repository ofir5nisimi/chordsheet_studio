import { useState, useCallback, useEffect, useRef } from 'react';
import { A4Page, FileDialog } from './components';
import type { PlacedChord } from './components';
import type { TextDirection } from './types';
import {
  saveDocument,
  autoSave,
  clearAutoSave,
  generateDocumentId,
  exportAsJson,
  importFromJson,
  type ChordSheetDocument,
} from './utils/storage';
import './App.css';

/**
 * Guitar Chords Sheet Application
 * 
 * Main application component that manages the chord sheet state
 * and renders the A4 page editor.
 */
// History state type for undo/redo
interface HistoryState {
  title: string;
  leftColumnText: string;
  middleColumnText: string;
  rightColumnText: string;
  leftColumnChords: PlacedChord[];
  middleColumnChords: PlacedChord[];
  rightColumnChords: PlacedChord[];
}

const MAX_HISTORY_SIZE = 50;

function App() {
  // Document state
  const [title, setTitle] = useState('');
  const [leftColumnText, setLeftColumnText] = useState('');
  const [middleColumnText, setMiddleColumnText] = useState('');
  const [rightColumnText, setRightColumnText] = useState('');
  const [leftColumnChords, setLeftColumnChords] = useState<PlacedChord[]>([]);
  const [middleColumnChords, setMiddleColumnChords] = useState<PlacedChord[]>([]);
  const [rightColumnChords, setRightColumnChords] = useState<PlacedChord[]>([]);
  const [direction, setDirection] = useState<TextDirection>('ltr');
  const [showGrid, setShowGrid] = useState(false);
  const [columnCount, setColumnCount] = useState<2 | 3>(2);

  // Undo/Redo history
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoRef = useRef(false);
  const historyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // File management state
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChangeRef = useRef<number>(0);

  // Track changes
  useEffect(() => {
    if (currentDocId || title || leftColumnText || middleColumnText || rightColumnText || 
        leftColumnChords.length || middleColumnChords.length || rightColumnChords.length) {
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
      lastChangeRef.current = Date.now();
    }
  }, [title, leftColumnText, middleColumnText, rightColumnText, leftColumnChords, middleColumnChords, rightColumnChords, direction, columnCount]);

  // Auto-save every 30 seconds if changes were made
  useEffect(() => {
    const checkAutoSave = () => {
      if (hasUnsavedChanges && Date.now() - lastChangeRef.current >= 5000) {
        autoSave({
          title,
          leftColumnText,
          middleColumnText,
          rightColumnText,
          leftColumnChords,
          middleColumnChords,
          rightColumnChords,
          direction,
          showGrid,
          columnCount,
        });
        showStatusMessage('Auto-saved');
      }
    };

    autoSaveTimerRef.current = setInterval(checkAutoSave, 30000);
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [hasUnsavedChanges, title, leftColumnText, middleColumnText, rightColumnText, leftColumnChords, middleColumnChords, rightColumnChords, direction, showGrid, columnCount]);

  // Show status message temporarily
  const showStatusMessage = useCallback((message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 2000);
  }, []);

  // Track changes for undo/redo history (debounced)
  useEffect(() => {
    // Skip if this change is from undo/redo
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    // Debounce history updates to avoid too many entries
    if (historyTimeoutRef.current) {
      clearTimeout(historyTimeoutRef.current);
    }

    historyTimeoutRef.current = setTimeout(() => {
      const currentState: HistoryState = {
        title,
        leftColumnText,
        middleColumnText,
        rightColumnText,
        leftColumnChords,
        middleColumnChords,
        rightColumnChords,
      };

      setHistory(prev => {
        // If we're not at the end, truncate future states
        const newHistory = prev.slice(0, historyIndex + 1);
        
        // Don't add if identical to last state
        const lastState = newHistory[newHistory.length - 1];
        if (lastState && 
            lastState.title === currentState.title &&
            lastState.leftColumnText === currentState.leftColumnText &&
            lastState.middleColumnText === currentState.middleColumnText &&
            lastState.rightColumnText === currentState.rightColumnText &&
            JSON.stringify(lastState.leftColumnChords) === JSON.stringify(currentState.leftColumnChords) &&
            JSON.stringify(lastState.middleColumnChords) === JSON.stringify(currentState.middleColumnChords) &&
            JSON.stringify(lastState.rightColumnChords) === JSON.stringify(currentState.rightColumnChords)) {
          return prev;
        }

        // Add new state and limit history size
        const updatedHistory = [...newHistory, currentState].slice(-MAX_HISTORY_SIZE);
        setHistoryIndex(updatedHistory.length - 1);
        return updatedHistory;
      });
    }, 300); // 300ms debounce

    return () => {
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current);
      }
    };
  }, [title, leftColumnText, middleColumnText, rightColumnText, leftColumnChords, middleColumnChords, rightColumnChords, historyIndex]);

  // Undo function
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoRef.current = true;
      const prevState = history[historyIndex - 1];
      setTitle(prevState.title);
      setLeftColumnText(prevState.leftColumnText);
      setMiddleColumnText(prevState.middleColumnText);
      setRightColumnText(prevState.rightColumnText);
      setLeftColumnChords(prevState.leftColumnChords);
      setMiddleColumnChords(prevState.middleColumnChords);
      setRightColumnChords(prevState.rightColumnChords);
      setHistoryIndex(historyIndex - 1);
    }
  }, [history, historyIndex]);

  // Redo function
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoRef.current = true;
      const nextState = history[historyIndex + 1];
      setTitle(nextState.title);
      setLeftColumnText(nextState.leftColumnText);
      setMiddleColumnText(nextState.middleColumnText);
      setRightColumnText(nextState.rightColumnText);
      setLeftColumnChords(nextState.leftColumnChords);
      setMiddleColumnChords(nextState.middleColumnChords);
      setRightColumnChords(nextState.rightColumnChords);
      setHistoryIndex(historyIndex + 1);
    }
  }, [history, historyIndex]);

  // Check if undo/redo are available
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Toggle text direction
  const toggleDirection = useCallback(() => {
    setDirection((prev) => (prev === 'ltr' ? 'rtl' : 'ltr'));
  }, []);

  // Toggle grid visibility
  const toggleGrid = useCallback(() => {
    setShowGrid((prev) => !prev);
  }, []);

  // Helper function to scale chord positions when column width changes
  const scaleChordPositions = (chords: PlacedChord[], scaleFactor: number): PlacedChord[] => {
    return chords.map(chord => ({
      ...chord,
      offsetX: chord.offsetX * scaleFactor
    }));
  };

  // Toggle column count with content redistribution and position scaling
  const toggleColumnCount = useCallback(() => {
    // Column width calculations based on CSS:
    // Page content width: 794px - 76px*2 (margins) = 642px
    // 2 columns: (642 - 57 gap) / 2 = 292.5px per column
    // 3 columns: (642 - 30*2 gaps) / 3 = 194px per column
    const COLUMN_WIDTH_2 = 292.5;
    const COLUMN_WIDTH_3 = 194;
    
    setColumnCount((prev) => {
      if (prev === 2) {
        // Moving from 2 to 3 columns - columns get narrower
        const scaleFactor = COLUMN_WIDTH_3 / COLUMN_WIDTH_2; // ~0.664
        
        // Scale chord positions in existing columns
        setLeftColumnChords(prevChords => scaleChordPositions(prevChords, scaleFactor));
        setRightColumnChords(prevChords => scaleChordPositions(prevChords, scaleFactor));
        
        // In RTL: right(1st) → left(2nd) becomes right(1st) → middle(2nd) → left(3rd)
        // Move the 2nd column content to middle
        if (direction === 'ltr') {
          // LTR: Move right column content to middle, clear right
          setMiddleColumnText(rightColumnText);
          setMiddleColumnChords(scaleChordPositions(rightColumnChords, scaleFactor));
          setRightColumnText('');
          setRightColumnChords([]);
        } else {
          // RTL: Move left column content to middle, clear left
          setMiddleColumnText(leftColumnText);
          setMiddleColumnChords(scaleChordPositions(leftColumnChords, scaleFactor));
          setLeftColumnText('');
          setLeftColumnChords([]);
        }
        return 3;
      } else {
        // Moving from 3 to 2 columns - columns get wider
        const scaleFactor = COLUMN_WIDTH_2 / COLUMN_WIDTH_3; // ~1.508
        
        // Scale chord positions in remaining columns
        setLeftColumnChords(prevChords => scaleChordPositions(prevChords, scaleFactor));
        setRightColumnChords(prevChords => scaleChordPositions(prevChords, scaleFactor));
        
        // Need to merge middle column content into the appropriate column
        if (direction === 'ltr') {
          if (middleColumnText.trim()) {
            // Append middle content to right column
            const newRightText = middleColumnText + (rightColumnText ? '\n' + rightColumnText : '');
            const middleLineCount = middleColumnText.split('\n').length;
            const scaledMiddleChords = scaleChordPositions(middleColumnChords, scaleFactor);
            const adjustedRightChords = rightColumnChords.map(chord => ({
              ...chord,
              lineIndex: chord.lineIndex + middleLineCount,
              offsetX: chord.offsetX * scaleFactor
            }));
            setRightColumnText(newRightText);
            setRightColumnChords([...scaledMiddleChords, ...adjustedRightChords]);
          }
          setMiddleColumnText('');
          setMiddleColumnChords([]);
        } else {
          // RTL: Append middle content to left column
          if (middleColumnText.trim()) {
            const newLeftText = middleColumnText + (leftColumnText ? '\n' + leftColumnText : '');
            const middleLineCount = middleColumnText.split('\n').length;
            const scaledMiddleChords = scaleChordPositions(middleColumnChords, scaleFactor);
            const adjustedLeftChords = leftColumnChords.map(chord => ({
              ...chord,
              lineIndex: chord.lineIndex + middleLineCount,
              offsetX: chord.offsetX * scaleFactor
            }));
            setLeftColumnText(newLeftText);
            setLeftColumnChords([...scaledMiddleChords, ...adjustedLeftChords]);
          }
          setMiddleColumnText('');
          setMiddleColumnChords([]);
        }
        return 2;
      }
    });
  }, [direction, leftColumnText, leftColumnChords, middleColumnText, middleColumnChords, rightColumnText, rightColumnChords]);

  // Create new document
  const handleNew = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowNewConfirm(true);
    } else {
      resetDocument();
    }
  }, [hasUnsavedChanges]);

  // Reset to blank document
  const resetDocument = useCallback(() => {
    setTitle('');
    setLeftColumnText('');
    setMiddleColumnText('');
    setRightColumnText('');
    setLeftColumnChords([]);
    setMiddleColumnChords([]);
    setRightColumnChords([]);
    setDirection('ltr');
    setShowGrid(false);
    setColumnCount(2);
    setCurrentDocId(null);
    setCurrentFileName('');
    setHasUnsavedChanges(false);
    setSaveStatus(null);
    clearAutoSave();
    showStatusMessage('New document created');
  }, [showStatusMessage]);

  // Open save dialog
  const handleSave = useCallback(() => {
    if (currentDocId && currentFileName) {
      // Quick save existing document
      performSave(currentFileName);
    } else {
      setShowSaveDialog(true);
    }
  }, [currentDocId, currentFileName]);

  // Open save-as dialog
  const handleSaveAs = useCallback(() => {
    setShowSaveDialog(true);
  }, []);

  // Perform save operation
  const performSave = useCallback((fileName: string) => {
    setSaveStatus('saving');
    
    const docId = currentDocId || generateDocumentId();
    const document: ChordSheetDocument = {
      id: docId,
      name: fileName,
      title,
      leftColumnText,
      middleColumnText,
      rightColumnText,
      leftColumnChords,
      middleColumnChords,
      rightColumnChords,
      direction,
      showGrid,
      columnCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    if (saveDocument(document)) {
      setCurrentDocId(docId);
      setCurrentFileName(fileName);
      setHasUnsavedChanges(false);
      setSaveStatus('saved');
      clearAutoSave();
      showStatusMessage('Document saved successfully');
    } else {
      setSaveStatus('unsaved');
      showStatusMessage('Failed to save document');
    }
    
    setShowSaveDialog(false);
  }, [currentDocId, title, leftColumnText, middleColumnText, rightColumnText, leftColumnChords, middleColumnChords, rightColumnChords, direction, showGrid, columnCount, showStatusMessage]);

  // Load document
  const handleLoadDocument = useCallback((doc: ChordSheetDocument) => {
    setTitle(doc.title);
    setLeftColumnText(doc.leftColumnText);
    setMiddleColumnText(doc.middleColumnText);
    setRightColumnText(doc.rightColumnText);
    setLeftColumnChords(doc.leftColumnChords);
    setMiddleColumnChords(doc.middleColumnChords);
    setRightColumnChords(doc.rightColumnChords);
    setDirection(doc.direction);
    setShowGrid(doc.showGrid);
    setColumnCount(doc.columnCount);
    setCurrentDocId(doc.id);
    setCurrentFileName(doc.name);
    setHasUnsavedChanges(false);
    setSaveStatus('saved');
    clearAutoSave();
    setShowLoadDialog(false);
    showStatusMessage('Document loaded successfully');
  }, [showStatusMessage]);

  // Print/Export to PDF
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Export to file (JSON)
  const handleExportToFile = useCallback(() => {
    const docId = currentDocId || generateDocumentId();
    const document: ChordSheetDocument = {
      id: docId,
      name: currentFileName || title || 'Untitled',
      title,
      leftColumnText,
      middleColumnText,
      rightColumnText,
      leftColumnChords,
      middleColumnChords,
      rightColumnChords,
      direction,
      showGrid,
      columnCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    exportAsJson(document);
    showStatusMessage('Song exported to file');
  }, [currentDocId, currentFileName, title, leftColumnText, middleColumnText, rightColumnText, leftColumnChords, middleColumnChords, rightColumnChords, direction, showGrid, columnCount, showStatusMessage]);

  // Import from file (JSON)
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const doc = await importFromJson(file);
      // Load the imported document
      setTitle(doc.title);
      setLeftColumnText(doc.leftColumnText || '');
      setMiddleColumnText(doc.middleColumnText || '');
      setRightColumnText(doc.rightColumnText || '');
      setLeftColumnChords(doc.leftColumnChords || []);
      setMiddleColumnChords(doc.middleColumnChords || []);
      setRightColumnChords(doc.rightColumnChords || []);
      setDirection(doc.direction || 'ltr');
      setShowGrid(doc.showGrid || false);
      setColumnCount(doc.columnCount || 2);
      // Generate new ID for imported document (don't overwrite existing)
      setCurrentDocId(null);
      setCurrentFileName(doc.name || 'Imported Song');
      setHasUnsavedChanges(true);
      setSaveStatus('unsaved');
      showStatusMessage('Song imported successfully');
    } catch (error) {
      showStatusMessage('Failed to import file: Invalid format');
      console.error('Import error:', error);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [showStatusMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input fields (except for save)
      const target = e.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            // Ctrl+S: Save
            e.preventDefault();
            if (e.shiftKey) {
              handleSaveAs();
            } else {
              handleSave();
            }
            break;
          case 'o':
            // Ctrl+O: Open
            e.preventDefault();
            setShowLoadDialog(true);
            break;
          case 'n':
            // Ctrl+N: New
            e.preventDefault();
            handleNew();
            break;
          case 'p':
            // Ctrl+P: Print/PDF
            e.preventDefault();
            handlePrint();
            break;
          case 'l':
            // Ctrl+L: Toggle RTL/LTR (only if not in input)
            if (!isInputElement) {
              e.preventDefault();
              toggleDirection();
            }
            break;
          case 'g':
            // Ctrl+G: Toggle Grid
            e.preventDefault();
            toggleGrid();
            break;
          case 'z':
            // Ctrl+Z: Undo, Ctrl+Shift+Z: Redo
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
          case 'y':
            // Ctrl+Y: Redo
            e.preventDefault();
            handleRedo();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleDirection, toggleGrid, handleSave, handleSaveAs, handleNew, handlePrint, handleUndo, handleRedo]);

  return (
    <div className={`app ${direction}`} dir={direction}>
      {/* Toolbar */}
      <header className="toolbar">
        <h1 className="app-title">Guitar Chords Sheet</h1>
        
        {/* File Actions */}
        <div className="toolbar-section file-actions">
          <button
            className="toolbar-button"
            onClick={handleNew}
            title="New Document (Ctrl+N)"
          >
            📄 New
          </button>
          <button
            className="toolbar-button"
            onClick={() => setShowLoadDialog(true)}
            title="Open Document (Ctrl+O)"
          >
            📂 Open
          </button>
          <button
            className="toolbar-button"
            onClick={handleSave}
            title="Save Document (Ctrl+S)"
          >
            💾 Save
          </button>
          <button
            className="toolbar-button"
            onClick={handlePrint}
            title="Print / Export PDF (Ctrl+P)"
          >
            🖨️ Print
          </button>
          <span className="toolbar-divider">|</span>
          <button
            className={`toolbar-button ${!canUndo ? 'disabled' : ''}`}
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↩️ Undo
          </button>
          <button
            className={`toolbar-button ${!canRedo ? 'disabled' : ''}`}
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
          >
            ↪️ Redo
          </button>
          <span className="toolbar-divider">|</span>
          <button
            className="toolbar-button"
            onClick={handleExportToFile}
            title="Export song to file (for transferring to another PC)"
          >
            📤 Export
          </button>
          <button
            className="toolbar-button"
            onClick={handleImportClick}
            title="Import song from file"
          >
            📥 Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />
        </div>

        {/* View Actions */}
        <div className="toolbar-section view-actions">
          <button
            className={`toolbar-button ${showGrid ? 'active' : ''}`}
            onClick={toggleGrid}
            aria-label={`${showGrid ? 'Hide' : 'Show'} alignment grid`}
            title="Toggle Grid (Ctrl+G)"
          >
            ⊞ Grid
          </button>
          <button
            className={`toolbar-button ${columnCount === 3 ? 'active' : ''}`}
            onClick={toggleColumnCount}
            aria-label={`Switch to ${columnCount === 2 ? '3' : '2'} columns`}
            title="Toggle 3rd Column"
          >
            {columnCount === 2 ? '⊞ 3 Columns' : '⊟ 2 Columns'}
          </button>
          <button
            className={`toolbar-button direction-toggle ${direction === 'rtl' ? 'active' : ''}`}
            onClick={toggleDirection}
            aria-label={`Switch to ${direction === 'ltr' ? 'RTL' : 'LTR'} mode`}
            title="Toggle Direction (Ctrl+L)"
          >
            {direction === 'ltr' ? '🔤 LTR → RTL' : '🔠 RTL → LTR'}
          </button>
          {direction === 'rtl' && (
            <span className="rtl-indicator" title="Right-to-Left mode active">עב</span>
          )}
        </div>

        {/* Status */}
        <div className="toolbar-section status-section">
          {currentFileName && (
            <span className="current-file" title={currentFileName}>
              {currentFileName}
            </span>
          )}
          {saveStatus === 'saved' && <span className="save-status saved">✓ Saved</span>}
          {saveStatus === 'unsaved' && <span className="save-status unsaved">● Unsaved</span>}
          {saveStatus === 'saving' && <span className="save-status saving">⏳ Saving...</span>}
          {statusMessage && <span className="status-message">{statusMessage}</span>}
        </div>
      </header>

      {/* Main Editor */}
      <main className="editor">
        <A4Page
          title={title}
          onTitleChange={setTitle}
          leftColumnText={leftColumnText}
          onLeftColumnChange={setLeftColumnText}
          middleColumnText={middleColumnText}
          onMiddleColumnChange={setMiddleColumnText}
          rightColumnText={rightColumnText}
          onRightColumnChange={setRightColumnText}
          leftColumnChords={leftColumnChords}
          onLeftColumnChordsChange={setLeftColumnChords}
          middleColumnChords={middleColumnChords}
          onMiddleColumnChordsChange={setMiddleColumnChords}
          rightColumnChords={rightColumnChords}
          onRightColumnChordsChange={setRightColumnChords}
          direction={direction}
          showGrid={showGrid}
          columnCount={columnCount}
        />
      </main>

      {/* Save Dialog */}
      {showSaveDialog && (
        <FileDialog
          mode="save"
          currentFileName={currentFileName}
          onSave={performSave}
          onClose={() => setShowSaveDialog(false)}
        />
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <FileDialog
          mode="load"
          onLoad={handleLoadDocument}
          onClose={() => setShowLoadDialog(false)}
        />
      )}

      {/* New Document Confirmation */}
      {showNewConfirm && (
        <div className="confirm-overlay" onClick={() => setShowNewConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <p>Discard unsaved changes?</p>
            <div className="confirm-buttons">
              <button
                className="confirm-yes"
                onClick={() => {
                  setShowNewConfirm(false);
                  resetDocument();
                }}
              >
                Yes, discard
              </button>
              <button
                className="confirm-no"
                onClick={() => setShowNewConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
