/**
 * Section types for chord sheets
 * Supports both English (LTR) and Hebrew (RTL) section names
 */

export interface SectionType {
  id: string;
  nameEn: string;
  nameHe: string;
  /** Whether this section type supports numbering (e.g., Verse 1, Verse 2) */
  numbered: boolean;
}

/** Available section types */
export const SECTION_TYPES: SectionType[] = [
  { id: 'intro', nameEn: 'Intro', nameHe: 'פתיחה', numbered: false },
  { id: 'verse', nameEn: 'Verse', nameHe: 'בית', numbered: true },
  { id: 'pre-chorus', nameEn: 'Pre-Chorus', nameHe: 'טרום פזמון', numbered: false },
  { id: 'chorus', nameEn: 'Chorus', nameHe: 'פזמון', numbered: false },
  { id: 'bridge', nameEn: 'Bridge', nameHe: 'גשר', numbered: false },
  { id: 'instrumental', nameEn: 'Instrumental', nameHe: 'אינסטרומנטלי', numbered: false },
  { id: 'solo', nameEn: 'Solo', nameHe: 'סולו', numbered: false },
  { id: 'outro', nameEn: 'Outro', nameHe: 'סיום', numbered: false },
  { id: 'interlude', nameEn: 'Interlude', nameHe: 'אינטרלוד', numbered: false },
];

/** Pattern to detect section markers in text: [Section Name] or [Section Name 1] */
export const SECTION_PATTERN = /^\[([^\]]+)\]$/;

/** Check if a line is a section header */
export function isSectionLine(line: string): boolean {
  return SECTION_PATTERN.test(line.trim());
}

/** Extract section name from a section line */
export function getSectionName(line: string): string | null {
  const match = line.trim().match(SECTION_PATTERN);
  return match ? match[1] : null;
}

/** Get section display name based on direction */
export function getSectionDisplayName(
  sectionType: SectionType,
  direction: 'ltr' | 'rtl',
  number?: number
): string {
  const baseName = direction === 'rtl' ? sectionType.nameHe : sectionType.nameEn;
  if (sectionType.numbered && number !== undefined) {
    return `${baseName} ${number}`;
  }
  return baseName;
}

/** Format a section name as a section marker */
export function formatSectionMarker(name: string): string {
  return `[${name}]`;
}

/** Get all section names that match a pattern (for finding sections to copy) */
export function findSectionsInText(text: string): Array<{ lineIndex: number; name: string }> {
  const lines = text.split('\n');
  const sections: Array<{ lineIndex: number; name: string }> = [];
  
  lines.forEach((line, index) => {
    const sectionName = getSectionName(line);
    if (sectionName) {
      sections.push({ lineIndex: index, name: sectionName });
    }
  });
  
  return sections;
}

/** Get the range of lines for a section (from section header to next section or end) */
export function getSectionRange(
  text: string,
  sectionLineIndex: number
): { startLine: number; endLine: number } {
  const lines = text.split('\n');
  const startLine = sectionLineIndex;
  let endLine = lines.length - 1;
  
  // Find the next section header
  for (let i = sectionLineIndex + 1; i < lines.length; i++) {
    if (isSectionLine(lines[i])) {
      endLine = i - 1;
      break;
    }
  }
  
  return { startLine, endLine };
}
