import { useState, useCallback, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { A4Page, FileDialog, HelpGuide } from './components';
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
} from './utils';
import './App.css';

/**
 * ChordSheet Studio Application
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
  const [leftColumnIndicators, setLeftColumnIndicators] = useState<Set<number>>(new Set());
  const [middleColumnIndicators, setMiddleColumnIndicators] = useState<Set<number>>(new Set());
  const [rightColumnIndicators, setRightColumnIndicators] = useState<Set<number>>(new Set());
  const [columnCount, setColumnCount] = useState<2 | 3>(2);
  const [showColumnSeparators, setShowColumnSeparators] = useState(true);
  const [transposeSemitones, setTransposeSemitones] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(14); // Default font size in pixels

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
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfFilename, setPdfFilename] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChangeRef = useRef<number>(0);
  const a4PageRef = useRef<HTMLDivElement>(null);

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
          fontSize,
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
  }, [hasUnsavedChanges, title, leftColumnText, middleColumnText, rightColumnText, leftColumnChords, middleColumnChords, rightColumnChords, direction, showGrid, columnCount, fontSize]);

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

  // Toggle column count with content redistribution
  // Note: offsetX is NOT scaled because it's a fine-tuning offset from character position,
  // not an absolute position. Character positions remain valid across column width changes.
  const toggleColumnCount = useCallback(() => {
    setColumnCount((prev) => {
      if (prev === 2) {
        // Moving from 2 to 3 columns
        // In RTL: right(1st) → left(2nd) becomes right(1st) → middle(2nd) → left(3rd)
        // Move the 2nd column content to middle
        if (direction === 'ltr') {
          // LTR: Move right column content to middle, clear right
          setMiddleColumnText(rightColumnText);
          setMiddleColumnChords([...rightColumnChords]);
          setRightColumnText('');
          setRightColumnChords([]);
        } else {
          // RTL: Move left column content to middle, clear left
          setMiddleColumnText(leftColumnText);
          setMiddleColumnChords([...leftColumnChords]);
          setLeftColumnText('');
          setLeftColumnChords([]);
        }
        return 3;
      } else {
        // Moving from 3 to 2 columns
        // Need to merge middle column content into the appropriate column
        if (direction === 'ltr') {
          if (middleColumnText.trim()) {
            // Append middle content to right column
            const newRightText = middleColumnText + (rightColumnText ? '\n' + rightColumnText : '');
            const middleLineCount = middleColumnText.split('\n').length;
            // Shift right column chord line indices by the number of middle column lines
            const adjustedRightChords = rightColumnChords.map(chord => ({
              ...chord,
              lineIndex: chord.lineIndex + middleLineCount
            }));
            setRightColumnText(newRightText);
            setRightColumnChords([...middleColumnChords, ...adjustedRightChords]);
          }
          setMiddleColumnText('');
          setMiddleColumnChords([]);
        } else {
          // RTL: Append middle content to left column
          if (middleColumnText.trim()) {
            const newLeftText = middleColumnText + (leftColumnText ? '\n' + leftColumnText : '');
            const middleLineCount = middleColumnText.split('\n').length;
            const adjustedLeftChords = leftColumnChords.map(chord => ({
              ...chord,
              lineIndex: chord.lineIndex + middleLineCount
            }));
            setLeftColumnText(newLeftText);
            setLeftColumnChords([...middleColumnChords, ...adjustedLeftChords]);
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
      fontSize,
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
  }, [currentDocId, title, leftColumnText, middleColumnText, rightColumnText, leftColumnChords, middleColumnChords, rightColumnChords, direction, showGrid, columnCount, fontSize, showStatusMessage]);

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
    setFontSize(doc.fontSize ?? 14);
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

  // Open PDF save dialog
  const handleSavePdf = useCallback(() => {
    // Set default filename from title or current file name
    const defaultName = (title || currentFileName || 'ChordSheet').replace(/[^a-zA-Z0-9-_\s\u0590-\u05FF]/g, '').trim();
    setPdfFilename(defaultName);
    setShowPdfDialog(true);
  }, [title, currentFileName]);

  // Actually generate and save the PDF
  const performPdfSave = useCallback(async (filename: string) => {
    const element = a4PageRef.current?.querySelector('.a4-page') as HTMLElement;
    if (!element) {
      showStatusMessage('Error: Could not find page to export');
      return;
    }

    const finalFilename = (filename || 'ChordSheet').trim() + '.pdf';
    
    showStatusMessage('Generating PDF...');
    setShowPdfDialog(false);
    
    // Store original styles
    const originalWidth = element.style.width;
    const originalHeight = element.style.height;
    const originalMinHeight = element.style.minHeight;
    const originalPadding = element.style.padding;
    const originalBoxShadow = element.style.boxShadow;
    const originalOverflow = element.style.overflow;
    
    // Add class to body to hide UI elements via CSS
    document.body.classList.add('pdf-export-mode');
    
    // Get columns container and check settings
    const columnsContainer = element.querySelector('.columns-container') as HTMLElement;
    const isRtl = columnsContainer?.classList.contains('rtl');
    const hasSeparators = !columnsContainer?.classList.contains('no-separators');
    const originalColumns = columnsContainer ? Array.from(columnsContainer.children) as HTMLElement[] : [];
    
    // Hide CSS pseudo-element separators - we'll add real DOM elements instead
    columnsContainer?.classList.add('no-separators');
    
    if (isRtl && columnsContainer && originalColumns.length > 0) {
      // Remove RTL class and set normal row direction
      columnsContainer.classList.remove('rtl');
      columnsContainer.style.flexDirection = 'row';
      // Reverse columns in DOM so they appear in correct visual order for RTL
      [...originalColumns].reverse().forEach(col => columnsContainer.appendChild(col));
    }
    
    // Set element to A4 dimensions for capture
    element.style.width = '794px';
    element.style.height = 'auto';
    element.style.minHeight = 'auto';
    element.style.padding = '40px';
    element.style.boxShadow = 'none';
    element.style.overflow = 'visible';
    
    // Wait for layout to apply
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Insert real separator divs between columns if separators are enabled
    const separatorElements: HTMLElement[] = [];
    if (hasSeparators && columnsContainer) {
      const columns = Array.from(columnsContainer.children) as HTMLElement[];
      // Insert separator after each column except the last
      for (let i = 0; i < columns.length - 1; i++) {
        const separator = document.createElement('div');
        separator.className = 'pdf-separator';
        separator.style.cssText = 'width: 1px; background-color: #d8d8d8; flex-shrink: 0; align-self: stretch;';
        columns[i].after(separator);
        separatorElements.push(separator);
      }
    }
    
    // Wait for separators to render
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      // Capture the element with html2canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
      });
      
      // Create PDF with A4 dimensions (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const canvasAspectRatio = canvas.height / canvas.width;
      const imgWidth = pdfWidth;
      const imgHeight = pdfWidth * canvasAspectRatio;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pdfHeight));
      pdf.save(finalFilename);
      
      showStatusMessage('PDF saved successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      showStatusMessage('Error generating PDF');
    } finally {
      // Remove separator elements
      separatorElements.forEach(sep => sep.remove());
      
      // Restore original state
      element.style.width = originalWidth;
      element.style.height = originalHeight;
      element.style.minHeight = originalMinHeight;
      element.style.padding = originalPadding;
      element.style.boxShadow = originalBoxShadow;
      element.style.overflow = originalOverflow;
      
      // Restore separator visibility
      if (hasSeparators) {
        columnsContainer?.classList.remove('no-separators');
      }
      
      if (isRtl && columnsContainer && originalColumns.length > 0) {
        // Restore RTL class
        columnsContainer.classList.add('rtl');
        columnsContainer.style.flexDirection = '';
        // Restore original column order
        originalColumns.forEach(col => columnsContainer.appendChild(col));
      }
      document.body.classList.remove('pdf-export-mode');
    }
  }, [showStatusMessage]);

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
      setFontSize(doc.fontSize ?? 14);
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
        {/* Branding Row */}
        <div className="toolbar-row toolbar-row-branding">
          <div className="app-branding">
            <h1 className="app-title">ChordSheet Studio</h1>
            <span className="app-author">By Ofir Nisimi</span>
          </div>
          <button
            className="toolbar-button help-button"
            onClick={(e) => {
              (e.currentTarget as HTMLButtonElement).blur();
              setShowHelpGuide(true);
            }}
            title="Help Guide"
          >
            ?
          </button>
        </div>

        {/* Main Buttons Row */}
        <div className="toolbar-row toolbar-row-main">
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
          <button
            className="toolbar-button"
            onClick={handleSavePdf}
            title="Save directly as PDF file"
          >
            📑 Save PDF
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
        </div>

        {/* Bottom Row */}
        <div className="toolbar-row toolbar-row-secondary">
          {/* View Actions */}
          <div className="toolbar-section view-actions">
          <button
            className={`toolbar-button ${columnCount === 3 ? 'active' : ''}`}
            onClick={toggleColumnCount}
            aria-label={`Switch to ${columnCount === 2 ? '3' : '2'} columns`}
            title="Toggle 3rd Column"
          >
            {columnCount === 2 ? '⊞ 2 Columns' : '⊟ 3 Columns'}
          </button>
          <button
            className={`toolbar-button ${showColumnSeparators ? 'active' : ''}`}
            onClick={() => setShowColumnSeparators(prev => !prev)}
            title="Toggle column separator lines in print"
          >
            {showColumnSeparators ? '┃ Lines On' : '┃ Lines Off'}
          </button>
          <button
            className={`toolbar-button direction-toggle ${direction === 'rtl' ? 'active' : ''}`}
            onClick={toggleDirection}
            aria-label={`Switch to ${direction === 'ltr' ? 'RTL' : 'LTR'} mode`}
            title="Toggle Direction (Ctrl+L)"
          >
            {direction === 'ltr' ? '🔤 LTR → RTL' : '🔠 RTL → LTR'}
          </button>
        </div>

        {/* Font Size Controls - force LTR to prevent RTL reversal */}
        <div className="toolbar-section font-size-section" dir="ltr">
          <span className="font-size-label">Font:</span>
          <button
            className="toolbar-button font-size-btn"
            onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
            disabled={fontSize <= 10}
            title="Decrease font size"
          >
            A−
          </button>
          <span className={`font-size-value ${fontSize !== 14 ? 'active' : ''}`}>
            {fontSize}px
          </span>
          <button
            className="toolbar-button font-size-btn"
            onClick={() => setFontSize(prev => Math.min(20, prev + 1))}
            disabled={fontSize >= 20}
            title="Increase font size"
          >
            A+
          </button>
          {fontSize !== 14 && (
            <button
              className="toolbar-button font-size-reset"
              onClick={() => setFontSize(14)}
              title="Reset to default font size (14px)"
            >
              Reset
            </button>
          )}
        </div>

        {/* Transpose Controls - force LTR to prevent RTL reversal */}
        <div className="toolbar-section transpose-section" dir="ltr">
          <span className="transpose-label">Transpose:</span>
          <button
            className="toolbar-button transpose-btn"
            onClick={() => setTransposeSemitones(prev => Math.max(-12, prev - 1))}
            disabled={transposeSemitones <= -12}
            title="Transpose down by 1 semitone"
          >
            −
          </button>
          <span className={`transpose-value ${transposeSemitones !== 0 ? 'active' : ''}`}>
            {transposeSemitones > 0 ? '+' : ''}{transposeSemitones}
          </span>
          <button
            className="toolbar-button transpose-btn"
            onClick={() => setTransposeSemitones(prev => Math.min(12, prev + 1))}
            disabled={transposeSemitones >= 12}
            title="Transpose up by 1 semitone"
          >
            +
          </button>
          {transposeSemitones !== 0 && (
            <button
              className="toolbar-button transpose-reset"
              onClick={() => setTransposeSemitones(0)}
              title="Reset to original key"
            >
              Reset
            </button>
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
        </div>
      </header>

      {/* Main Editor */}
      <main className="editor" ref={a4PageRef}>
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
          leftColumnIndicators={leftColumnIndicators}
          onLeftColumnIndicatorsChange={setLeftColumnIndicators}
          middleColumnIndicators={middleColumnIndicators}
          onMiddleColumnIndicatorsChange={setMiddleColumnIndicators}
          rightColumnIndicators={rightColumnIndicators}
          onRightColumnIndicatorsChange={setRightColumnIndicators}
          direction={direction}
          showGrid={showGrid}
          columnCount={columnCount}
          showColumnSeparators={showColumnSeparators}
          transposeSemitones={transposeSemitones}
          fontSize={fontSize}
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

      {/* PDF Filename Dialog */}
      {showPdfDialog && (
        <div className="confirm-overlay" onClick={() => setShowPdfDialog(false)}>
          <div className="confirm-dialog pdf-dialog" onClick={(e) => e.stopPropagation()}>
            <p>Save as PDF</p>
            <input
              type="text"
              className="pdf-filename-input"
              value={pdfFilename}
              onChange={(e) => setPdfFilename(e.target.value)}
              placeholder="Enter filename"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pdfFilename.trim()) {
                  performPdfSave(pdfFilename);
                } else if (e.key === 'Escape') {
                  setShowPdfDialog(false);
                }
              }}
            />
            <div className="confirm-buttons">
              <button
                className="confirm-yes"
                onClick={() => performPdfSave(pdfFilename)}
                disabled={!pdfFilename.trim()}
              >
                Save
              </button>
              <button
                className="confirm-no"
                onClick={() => setShowPdfDialog(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Guide */}
      <HelpGuide
        isOpen={showHelpGuide}
        onClose={() => setShowHelpGuide(false)}
        direction={direction}
      />
    </div>
  );
}

export default App;
