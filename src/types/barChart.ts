/**
 * Type definitions for Bar Chart Mode
 */

import type { TextDirection } from './index';

/** Application mode type */
export type AppMode = 'lyrics' | 'barChart';

/** Beat position within a measure (1-4) */
export type BeatPosition = 1 | 2 | 3 | 4;

/** Individual beat in a measure */
export interface Beat {
  position: BeatPosition;
  chord: string | null;  // null means empty/continuation
  isHold: boolean;       // true if this beat continues previous chord
}

/** A single measure (bar) */
export interface Measure {
  id: string;
  beats: [Beat, Beat, Beat, Beat];  // Always 4 beats
  isEnding?: boolean;               // True for final measure (shows double bar line)
}

/** A line of measures */
export interface MeasureLine {
  id: string;
  type: 'measures';
  measures: Measure[];
}

/** A section header line */
export interface SectionLine {
  id: string;
  type: 'section';
  text: string;
}

/** Union type for all line types in Bar Chart mode */
export type BarChartLine = MeasureLine | SectionLine;

/** Complete Bar Chart document */
export interface BarChartDocument {
  id: string;
  title: string;
  artist?: string;
  direction: TextDirection;
  columns: 1 | 2;
  leftLines: BarChartLine[];
  rightLines: BarChartLine[];
  measuresPerLine: number;
}

/** Helper function to create an empty beat */
export function createEmptyBeat(position: BeatPosition): Beat {
  return {
    position,
    chord: null,
    isHold: false,
  };
}

/** Helper function to create an empty measure */
export function createEmptyMeasure(): Measure {
  return {
    id: `measure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    beats: [
      createEmptyBeat(1),
      createEmptyBeat(2),
      createEmptyBeat(3),
      createEmptyBeat(4),
    ],
    isEnding: false,
  };
}

/** Helper function to create a new section line */
export function createSectionLine(text: string = 'New Section'): SectionLine {
  return {
    id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'section',
    text,
  };
}

/** Helper function to create a new measure line */
export function createMeasureLine(measuresPerLine: number = 4): MeasureLine {
  const measures: Measure[] = [];
  for (let i = 0; i < measuresPerLine; i++) {
    measures.push(createEmptyMeasure());
  }
  return {
    id: `measureline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'measures',
    measures,
  };
}

/** Helper function to create a default Bar Chart document */
export function createDefaultBarChartDocument(): BarChartDocument {
  return {
    id: `barchart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: '',
    direction: 'ltr',
    columns: 2,
    leftLines: [],
    rightLines: [],
    measuresPerLine: 4,
  };
}
