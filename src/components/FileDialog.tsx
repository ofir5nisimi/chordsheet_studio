import React, { useState, useEffect, useCallback } from 'react';
import { getAllDocuments, deleteDocument, type ChordSheetDocument } from '../utils/storage';
import '../styles/FileDialog.css';

interface FileDialogProps {
  mode: 'save' | 'load';
  currentFileName?: string;
  onSave?: (fileName: string) => void;
  onLoad?: (document: ChordSheetDocument) => void;
  onClose: () => void;
}

/**
 * FileDialog Component
 * 
 * Modal dialog for save and load operations
 */
const FileDialog: React.FC<FileDialogProps> = ({
  mode,
  currentFileName = '',
  onSave,
  onLoad,
  onClose,
}) => {
  const [fileName, setFileName] = useState(currentFileName);
  const [documents, setDocuments] = useState<ChordSheetDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load documents list
  useEffect(() => {
    if (mode === 'load') {
      setDocuments(getAllDocuments());
    }
  }, [mode]);

  // Handle save
  const handleSave = useCallback(() => {
    if (fileName.trim() && onSave) {
      onSave(fileName.trim());
    }
  }, [fileName, onSave]);

  // Handle load
  const handleLoad = useCallback(() => {
    if (selectedId && onLoad) {
      const doc = documents.find(d => d.id === selectedId);
      if (doc) {
        onLoad(doc);
      }
    }
  }, [selectedId, documents, onLoad]);

  // Handle delete
  const handleDelete = useCallback((id: string) => {
    if (deleteDocument(id)) {
      setDocuments(getAllDocuments());
      if (selectedId === id) {
        setSelectedId(null);
      }
    }
    setDeleteConfirmId(null);
  }, [selectedId]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deleteConfirmId) {
          setDeleteConfirmId(null);
        } else {
          onClose();
        }
      } else if (e.key === 'Enter') {
        if (mode === 'save' && fileName.trim()) {
          handleSave();
        } else if (mode === 'load' && selectedId) {
          handleLoad();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mode, fileName, selectedId, deleteConfirmId, onClose, handleSave, handleLoad]);

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="file-dialog-overlay" onClick={onClose}>
      <div className="file-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="file-dialog-header">
          <h2>{mode === 'save' ? '💾 Save Document' : '📂 Open Document'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="file-dialog-content">
          {mode === 'save' ? (
            <div className="save-form">
              <label htmlFor="fileName">File Name:</label>
              <input
                id="fileName"
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter file name..."
                autoFocus
              />
            </div>
          ) : (
            <div className="documents-list">
              {documents.length === 0 ? (
                <div className="empty-message">
                  No saved documents yet.
                </div>
              ) : (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`document-item ${selectedId === doc.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(doc.id)}
                    onDoubleClick={() => {
                      setSelectedId(doc.id);
                      if (onLoad) onLoad(doc);
                    }}
                  >
                    <div className="document-info">
                      <span className="document-name">{doc.name}</span>
                      <span className="document-title">{doc.title || '(No title)'}</span>
                      <span className="document-date">Modified: {formatDate(doc.updatedAt)}</span>
                    </div>
                    <button
                      className="delete-doc-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(doc.id);
                      }}
                      title="Delete document"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="file-dialog-actions">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          {mode === 'save' ? (
            <button
              className="primary-button"
              onClick={handleSave}
              disabled={!fileName.trim()}
            >
              💾 Save
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={handleLoad}
              disabled={!selectedId}
            >
              📂 Open
            </button>
          )}
        </div>

        {/* Delete Confirmation */}
        {deleteConfirmId && (
          <div className="delete-confirm-overlay" onClick={() => setDeleteConfirmId(null)}>
            <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <p>Delete this document?</p>
              <p className="delete-warning">This action cannot be undone.</p>
              <div className="delete-confirm-buttons">
                <button className="confirm-yes" onClick={() => handleDelete(deleteConfirmId)}>
                  Delete
                </button>
                <button className="confirm-no" onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDialog;
