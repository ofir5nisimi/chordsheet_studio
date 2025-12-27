/**
 * Storage utility for saving and loading chord sheet documents
 */

import type { PlacedChord } from '../components/LyricsEditor';
import type { TextDirection } from '../types';

/** Document data structure for saving/loading */
export interface ChordSheetDocument {
  id: string;
  name: string;
  title: string;
  leftColumnText: string;
  middleColumnText: string;
  rightColumnText: string;
  leftColumnChords: PlacedChord[];
  middleColumnChords: PlacedChord[];
  rightColumnChords: PlacedChord[];
  direction: TextDirection;
  showGrid: boolean;
  columnCount: 2 | 3;
  fontSize?: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/** Storage keys */
const STORAGE_KEYS = {
  DOCUMENTS: 'guitar-chords-documents',
  AUTOSAVE: 'guitar-chords-autosave',
  RECENT_FILES: 'guitar-chords-recent',
};

/** Current document version for migration support */
const DOCUMENT_VERSION = 1;

/**
 * Generate unique document ID
 */
export function generateDocumentId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all saved documents
 */
export function getAllDocuments(): ChordSheetDocument[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
    if (!data) return [];
    return JSON.parse(data) as ChordSheetDocument[];
  } catch (error) {
    console.error('Failed to load documents:', error);
    return [];
  }
}

/**
 * Get a specific document by ID
 */
export function getDocument(id: string): ChordSheetDocument | null {
  const documents = getAllDocuments();
  return documents.find(doc => doc.id === id) || null;
}

/**
 * Save a document (create new or update existing)
 */
export function saveDocument(document: ChordSheetDocument): boolean {
  try {
    const documents = getAllDocuments();
    const existingIndex = documents.findIndex(doc => doc.id === document.id);
    
    const updatedDocument: ChordSheetDocument = {
      ...document,
      updatedAt: new Date().toISOString(),
      version: DOCUMENT_VERSION,
    };
    
    if (existingIndex >= 0) {
      documents[existingIndex] = updatedDocument;
    } else {
      updatedDocument.createdAt = new Date().toISOString();
      documents.push(updatedDocument);
    }
    
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    addToRecentFiles(document.id, document.name);
    return true;
  } catch (error) {
    console.error('Failed to save document:', error);
    return false;
  }
}

/**
 * Delete a document by ID
 */
export function deleteDocument(id: string): boolean {
  try {
    const documents = getAllDocuments();
    const filtered = documents.filter(doc => doc.id !== id);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete document:', error);
    return false;
  }
}

/**
 * Auto-save current document state
 */
export function autoSave(document: Omit<ChordSheetDocument, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'version'>): boolean {
  try {
    const autoSaveData = {
      ...document,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.AUTOSAVE, JSON.stringify(autoSaveData));
    return true;
  } catch (error) {
    console.error('Failed to auto-save:', error);
    return false;
  }
}

/**
 * Get auto-saved document
 */
export function getAutoSave(): (Omit<ChordSheetDocument, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'version'> & { savedAt: string }) | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.AUTOSAVE);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load auto-save:', error);
    return null;
  }
}

/**
 * Clear auto-save data
 */
export function clearAutoSave(): void {
  localStorage.removeItem(STORAGE_KEYS.AUTOSAVE);
}

/** Recent file entry */
export interface RecentFile {
  id: string;
  name: string;
  accessedAt: string;
}

/**
 * Get recent files list
 */
export function getRecentFiles(): RecentFile[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.RECENT_FILES);
    if (!data) return [];
    return JSON.parse(data) as RecentFile[];
  } catch (error) {
    console.error('Failed to load recent files:', error);
    return [];
  }
}

/**
 * Add to recent files list
 */
export function addToRecentFiles(id: string, name: string): void {
  try {
    let recentFiles = getRecentFiles();
    // Remove if already exists
    recentFiles = recentFiles.filter(f => f.id !== id);
    // Add to front
    recentFiles.unshift({
      id,
      name,
      accessedAt: new Date().toISOString(),
    });
    // Keep only last 10
    recentFiles = recentFiles.slice(0, 10);
    localStorage.setItem(STORAGE_KEYS.RECENT_FILES, JSON.stringify(recentFiles));
  } catch (error) {
    console.error('Failed to update recent files:', error);
  }
}

/**
 * Export document as JSON file (download)
 */
export function exportAsJson(doc: ChordSheetDocument): void {
  const json = JSON.stringify(doc, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = `${doc.name || 'chord-sheet'}.json`;
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import document from JSON file
 */
export function importFromJson(file: File): Promise<ChordSheetDocument> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const doc = JSON.parse(content) as ChordSheetDocument;
        // Validate required fields
        if (!doc.title && doc.title !== '') reject(new Error('Invalid document format'));
        resolve(doc);
      } catch {
        reject(new Error('Failed to parse document file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
