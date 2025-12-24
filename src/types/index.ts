/**
 * Type definitions for ChordSheet Studio application
 */

/** Represents a chord placed above lyrics text */
export interface Chord {
  id: string;
  name: string;
  /** Character position in the lyrics text where the chord is placed */
  position: number;
  /** Horizontal offset in pixels for fine-tuning chord placement */
  offsetX: number;
}

/** Represents a line of lyrics with associated chords */
export interface LyricLine {
  id: string;
  text: string;
  chords: Chord[];
}

/** Represents a column of content on the page */
export interface Column {
  id: string;
  lines: LyricLine[];
}

/** Represents a single page in the document */
export interface Page {
  id: string;
  columns: [Column, Column]; // Two columns per page
}

/** Represents the complete document */
export interface Document {
  title: string;
  pages: Page[];
  direction: 'ltr' | 'rtl';
  createdAt: string;
  updatedAt: string;
}

/** Direction type for text layout */
export type TextDirection = 'ltr' | 'rtl';
