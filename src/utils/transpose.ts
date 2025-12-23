/**
 * Chord Transposition Utility
 * Transposes chord symbols by semitones while preserving chord quality
 */

// Chromatic scale using sharps (for display consistency)
const CHROMATIC_SHARP: string[] = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const CHROMATIC_FLAT: string[] = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

// Map notes to semitone index
const NOTE_TO_INDEX: Record<string, number> = {
  'C': 0, 'C♯': 1, 'C#': 1, 'D♭': 1, 'Db': 1,
  'D': 2, 'D♯': 3, 'D#': 3, 'E♭': 3, 'Eb': 3,
  'E': 4, 'E♯': 5, 'E#': 5, 'F♭': 4, 'Fb': 4,
  'F': 5, 'F♯': 6, 'F#': 6, 'G♭': 6, 'Gb': 6,
  'G': 7, 'G♯': 8, 'G#': 8, 'A♭': 8, 'Ab': 8,
  'A': 9, 'A♯': 10, 'A#': 10, 'B♭': 10, 'Bb': 10,
  'B': 11, 'B♯': 0, 'B#': 0, 'C♭': 11, 'Cb': 11,
};

/**
 * Parse a chord symbol to extract root note and quality
 * @param chord - The chord symbol (e.g., "Am7", "F♯m", "Cmaj7")
 * @returns Object with root and quality, or null if invalid
 */
export function parseChord(chord: string): { root: string; quality: string; bass?: string } | null {
  if (!chord || chord.trim() === '') return null;
  
  // Handle slash chords (e.g., "Am/G", "C/E")
  let bassNote: string | undefined;
  let mainChord = chord;
  
  const slashIndex = chord.indexOf('/');
  if (slashIndex > 0) {
    mainChord = chord.substring(0, slashIndex);
    const bassStr = chord.substring(slashIndex + 1);
    // Parse bass note
    if (bassStr.length >= 1) {
      const bassMatch = bassStr.match(/^([A-G])([♯♭#b])?/);
      if (bassMatch) {
        bassNote = bassMatch[1] + (bassMatch[2] || '');
      }
    }
  }
  
  // Match root note: letter + optional sharp/flat
  const rootMatch = mainChord.match(/^([A-G])([♯♭#b])?/);
  if (!rootMatch) return null;
  
  const root = rootMatch[1] + (rootMatch[2] || '');
  const quality = mainChord.substring(root.length);
  
  return { root, quality, bass: bassNote };
}

/**
 * Transpose a single note by semitones
 * @param note - The note to transpose (e.g., "C", "F♯", "Bb")
 * @param semitones - Number of semitones to transpose (-12 to +12)
 * @param preferFlats - Whether to prefer flat notation
 * @returns The transposed note
 */
export function transposeNote(note: string, semitones: number, preferFlats: boolean = false): string {
  // Normalize the note
  const normalizedNote = note.replace('#', '♯').replace('b', '♭');
  
  const index = NOTE_TO_INDEX[normalizedNote] ?? NOTE_TO_INDEX[note];
  if (index === undefined) return note; // Return unchanged if unknown
  
  // Calculate new index (wrap around chromatic scale)
  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  // Choose sharp or flat based on preference
  const scale = preferFlats ? CHROMATIC_FLAT : CHROMATIC_SHARP;
  return scale[newIndex];
}

/**
 * Transpose a chord symbol by semitones
 * @param chord - The chord symbol (e.g., "Am7", "F♯maj7", "C/G")
 * @param semitones - Number of semitones to transpose (-12 to +12)
 * @param preferFlats - Whether to prefer flat notation
 * @returns The transposed chord symbol
 */
export function transposeChord(chord: string, semitones: number, preferFlats: boolean = false): string {
  if (semitones === 0) return chord;
  
  const parsed = parseChord(chord);
  if (!parsed) return chord;
  
  const newRoot = transposeNote(parsed.root, semitones, preferFlats);
  let result = newRoot + parsed.quality;
  
  // Handle bass note for slash chords
  if (parsed.bass) {
    const newBass = transposeNote(parsed.bass, semitones, preferFlats);
    result += '/' + newBass;
  }
  
  return result;
}

/**
 * Determine if we should prefer flats based on the original chord's notation
 * @param chordSymbol - Original chord symbol
 * @returns true if flats should be preferred
 */
export function shouldPreferFlats(chordSymbol: string): boolean {
  return chordSymbol.includes('♭') || chordSymbol.includes('b');
}

/**
 * Get the display name for a transposition amount
 * @param semitones - Number of semitones
 * @returns Human-readable description
 */
export function getTransposeLabel(semitones: number): string {
  if (semitones === 0) return 'Original';
  const direction = semitones > 0 ? '+' : '';
  return `${direction}${semitones} semitones`;
}
