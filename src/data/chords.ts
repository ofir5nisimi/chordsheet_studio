/**
 * Comprehensive Guitar Chord Database
 * Contains 200+ chord variations organized by root note
 */

export interface ChordDefinition {
  symbol: string;
  name: string;
  root: string;
  category?: ChordCategory;  // Optional for dynamically created slash chords
  quality?: string;          // Optional quality description for slash chords
}

export type ChordCategory = 
  | 'major'
  | 'minor'
  | 'seventh'
  | 'major-seventh'
  | 'minor-seventh'
  | 'suspended'
  | 'add'
  | 'extended'
  | 'diminished'
  | 'augmented';

// Note: 'slash' category removed - slash chords are now generated dynamically via bass selector

export type RootNote = 'A' | 'A♯' | 'B♭' | 'B' | 'C' | 'C♯' | 'D♭' | 'D' | 'D♯' | 'E♭' | 'E' | 'F' | 'F♯' | 'G♭' | 'G' | 'G♯' | 'A♭';

// Root notes in order
export const ROOT_NOTES: RootNote[] = [
  'A', 'A♯', 'B♭', 'B', 'C', 'C♯', 'D♭', 'D', 'D♯', 'E♭', 'E', 'F', 'F♯', 'G♭', 'G', 'G♯', 'A♭'
];

// Natural notes for grouping
export const NATURAL_NOTES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

/**
 * Generate chord variations for a given root note
 */
function generateChordsForRoot(root: string): ChordDefinition[] {
  const chords: ChordDefinition[] = [];
  
  // Major
  chords.push({ symbol: root, name: `${root} Major`, root, category: 'major' });
  
  // Minor
  chords.push({ symbol: `${root}m`, name: `${root} Minor`, root, category: 'minor' });
  
  // Seventh chords
  chords.push({ symbol: `${root}7`, name: `${root} Dominant 7th`, root, category: 'seventh' });
  chords.push({ symbol: `${root}maj7`, name: `${root} Major 7th`, root, category: 'major-seventh' });
  chords.push({ symbol: `${root}m7`, name: `${root} Minor 7th`, root, category: 'minor-seventh' });
  chords.push({ symbol: `${root}m(maj7)`, name: `${root} Minor Major 7th`, root, category: 'minor-seventh' });
  
  // Suspended
  chords.push({ symbol: `${root}sus2`, name: `${root} Suspended 2nd`, root, category: 'suspended' });
  chords.push({ symbol: `${root}sus4`, name: `${root} Suspended 4th`, root, category: 'suspended' });
  chords.push({ symbol: `${root}7sus4`, name: `${root} 7th Suspended 4th`, root, category: 'suspended' });
  
  // Add chords
  chords.push({ symbol: `${root}add9`, name: `${root} Add 9th`, root, category: 'add' });
  chords.push({ symbol: `${root}add11`, name: `${root} Add 11th`, root, category: 'add' });
  chords.push({ symbol: `${root}madd9`, name: `${root} Minor Add 9th`, root, category: 'add' });
  
  // Extended chords
  chords.push({ symbol: `${root}9`, name: `${root} 9th`, root, category: 'extended' });
  chords.push({ symbol: `${root}m9`, name: `${root} Minor 9th`, root, category: 'extended' });
  chords.push({ symbol: `${root}maj9`, name: `${root} Major 9th`, root, category: 'extended' });
  chords.push({ symbol: `${root}11`, name: `${root} 11th`, root, category: 'extended' });
  chords.push({ symbol: `${root}m11`, name: `${root} Minor 11th`, root, category: 'extended' });
  chords.push({ symbol: `${root}13`, name: `${root} 13th`, root, category: 'extended' });
  
  // Diminished and Augmented
  chords.push({ symbol: `${root}dim`, name: `${root} Diminished`, root, category: 'diminished' });
  chords.push({ symbol: `${root}dim7`, name: `${root} Diminished 7th`, root, category: 'diminished' });
  chords.push({ symbol: `${root}aug`, name: `${root} Augmented`, root, category: 'augmented' });
  chords.push({ symbol: `${root}aug7`, name: `${root} Augmented 7th`, root, category: 'augmented' });
  
  // Power chord
  chords.push({ symbol: `${root}5`, name: `${root} Power Chord`, root, category: 'major' });
  
  // 6th chords
  chords.push({ symbol: `${root}6`, name: `${root} 6th`, root, category: 'major' });
  chords.push({ symbol: `${root}m6`, name: `${root} Minor 6th`, root, category: 'minor' });
  
  return chords;
}

/**
 * Complete chord database
 */
function buildChordDatabase(): ChordDefinition[] {
  const allChords: ChordDefinition[] = [];
  
  // Generate chords for all root notes
  for (const root of ROOT_NOTES) {
    allChords.push(...generateChordsForRoot(root));
  }
  
  // Note: Slash chords are now generated dynamically via the bass selector UI
  // This allows ANY chord + ANY bass combination
  
  return allChords;
}

// Export the complete chord database
export const CHORD_DATABASE: ChordDefinition[] = buildChordDatabase();

/**
 * Get chords grouped by root note
 */
export function getChordsByRoot(): Map<string, ChordDefinition[]> {
  const grouped = new Map<string, ChordDefinition[]>();
  
  for (const chord of CHORD_DATABASE) {
    const existing = grouped.get(chord.root) || [];
    existing.push(chord);
    grouped.set(chord.root, existing);
  }
  
  return grouped;
}

/**
 * Get chords grouped by natural root note (A, B, C, D, E, F, G)
 * Sharp and flat variants are grouped with their natural note
 */
export function getChordsByNaturalRoot(): Map<string, ChordDefinition[]> {
  const grouped = new Map<string, ChordDefinition[]>();
  
  // Initialize groups for natural notes
  for (const note of NATURAL_NOTES) {
    grouped.set(note, []);
  }
  
  for (const chord of CHORD_DATABASE) {
    // Get the base natural note
    const naturalNote = chord.root.charAt(0);
    const existing = grouped.get(naturalNote) || [];
    existing.push(chord);
    grouped.set(naturalNote, existing);
  }
  
  return grouped;
}

/**
 * Search chords by query string
 */
export function searchChords(query: string): ChordDefinition[] {
  if (!query.trim()) {
    return CHORD_DATABASE;
  }
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return CHORD_DATABASE.filter(chord => {
    const symbolMatch = chord.symbol.toLowerCase().includes(normalizedQuery);
    const nameMatch = chord.name.toLowerCase().includes(normalizedQuery);
    return symbolMatch || nameMatch;
  });
}

/**
 * Get total chord count
 */
export function getChordCount(): number {
  return CHORD_DATABASE.length;
}

// Log chord count for verification
console.log(`Chord database initialized with ${getChordCount()} chords`);
