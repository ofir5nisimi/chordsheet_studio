import React from 'react';
import type { TextDirection } from '../types';
import type { BarChartDocument } from '../types/barChart';
import '../styles/BarChartEditor.css';

interface BarChartEditorProps {
  document: BarChartDocument;
  onDocumentChange: (document: BarChartDocument) => void;
  direction: TextDirection;
  columnCount: 2 | 3;
  fontSize: number;
}

/**
 * BarChartEditor Component
 * 
 * Main editor for Bar Chart mode. Renders measures with chord positions
 * in a structured bar chart format.
 * 
 * Phase 1: Basic placeholder structure
 * TODO: Implement full measure editing in Phase 2
 */
const BarChartEditor: React.FC<BarChartEditorProps> = ({
  document,
  onDocumentChange: _onDocumentChange,
  direction,
  columnCount,
  fontSize,
}) => {
  // Temporarily suppress unused variable warning until Phase 2
  void _onDocumentChange;
  return (
    <div 
      className="bar-chart-editor"
      style={{ fontSize: `${fontSize}px` }}
    >
      <div className="bar-chart-placeholder">
        <div className="placeholder-icon">🎼</div>
        <h3>Bar Chart Mode</h3>
        <p>Create chord charts with aligned measures</p>
        <div className="placeholder-info">
          <span>Direction: {direction.toUpperCase()}</span>
          <span>•</span>
          <span>Columns: {columnCount}</span>
          <span>•</span>
          <span>Measures per line: {document.measuresPerLine}</span>
        </div>
        <p className="placeholder-hint">
          Full editing functionality coming in Phase 2
        </p>
      </div>
    </div>
  );
};

export default BarChartEditor;
