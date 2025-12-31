# Bar Chart Mode Specification

## Overview

This specification defines a new **Bar Chart Mode** for the Guitar Chords Sheet application. This mode provides a structured way to display chord progressions using musical measures (bars), offering perfect alignment and a professional chord chart layout.

---

## Table of Contents

1. [Feature Summary](#feature-summary)
2. [Mode Toggle](#mode-toggle)
3. [Page Layout](#page-layout)
4. [Measure Structure](#measure-structure)
5. [Chord Positioning](#chord-positioning)
6. [Sections](#sections)
7. [Line Types](#line-types)
8. [User Interactions](#user-interactions)
9. [Direction Support (LTR/RTL)](#direction-support-ltrrtl)
10. [Visual Design](#visual-design)
11. [Data Model](#data-model)
12. [Component Architecture](#component-architecture)

---

## 1. Feature Summary

The Bar Chart Mode allows users to create chord charts using a measure-based layout where:
- Chords are displayed in fixed-width measures (bars)
- Each measure can contain 1 to 4 chords representing different beat durations
- All measures align perfectly across lines for easy reading
- Sections can be added to organize the song structure
- Both LTR and RTL directions are supported

---

## 2. Mode Toggle

### Requirements

- **Toggle Button**: A mode switch button shall be added to the application header/toolbar
- **Two Modes**:
  - **Lyrics & Chords Mode** (existing functionality)
  - **Bar Chart Mode** (new functionality)
- **Visual Indicator**: The current active mode shall be clearly indicated
- **State Persistence**: The selected mode shall be saved and restored on page reload
- **Separate Data**: Each mode maintains its own data (switching modes does not affect the other mode's content)

### UI Placement

The mode toggle should be placed in a prominent location, such as:
- Next to the existing toolbar buttons (columns, direction, etc.)
- As a segmented control or toggle switch

---

## 3. Page Layout

### Requirements

The Bar Chart Mode shall use the **same A4 page layout** as the existing Lyrics & Chords mode:

- **A4 Page Dimensions**: Standard A4 proportions (210mm × 297mm ratio)
- **Column Options**: 
  - 1 column layout
  - 2 column layout
  - 3 column layout
- **Page Margins**: Consistent margins matching the existing mode
- **Print/Export**: Compatible with PDF export functionality

### Column Behavior

- Each column contains independent lines of measures
- Content flows from top to bottom within each column
- Column width adjusts based on the number of columns selected

---

## 4. Measure Structure

### Definition

A **measure** (or **bar**) is a fixed-width container that represents one bar of music in common time (4/4).

### Requirements

- Each measure is divided into **4 equal positions** (representing 4 beats)
- Measures have a **fixed width** regardless of content
- Visual separators (bar lines) divide measures
- Multiple measures can appear on a single line

### Measures Per Line

The number of measures per line should be configurable or automatically calculated based on:
- Column width
- Measure width setting
- Suggested defaults:
  - 1 column: 4-8 measures per line
  - 2 columns: 3-4 measures per line
  - 3 columns: 2-3 measures per line

---

## 5. Chord Positioning

### Beat Positions

Each measure contains 4 beat positions:

| Position | Beat | Description |
|----------|------|-------------|
| 1 | Beat 1 | First quarter of the measure |
| 2 | Beat 2 | Second quarter of the measure |
| 3 | Beat 3 | Third quarter of the measure |
| 4 | Beat 4 | Fourth quarter of the measure |

### Chord Duration Patterns

Chords can occupy different durations based on their position:

#### Full Measure (1 chord)
```
| Chord |   -   |   -   |   -   |
```
- One chord on beat 1, holds for entire measure
- Positions 2, 3, 4 display as empty/continuation

#### Half Measures (2 chords)
```
| Chord |   -   | Chord |   -   |
```
- First chord on beat 1, holds for 2 beats
- Second chord on beat 3, holds for 2 beats

#### Quarter Notes (4 chords)
```
| Chord | Chord | Chord | Chord |
```
- Each position has its own chord
- Each chord is one beat duration

#### Mixed Durations

**Half + Two Quarters:**
```
| Chord |   -   | Chord | Chord |
```
- First chord on beat 1 (half note)
- Second chord on beat 3 (quarter note)
- Third chord on beat 4 (quarter note)

**Quarter + Half + Quarter:**
```
| Chord | Chord |   -   | Chord |
```
- First chord on beat 1 (quarter note)
- Second chord on beat 2 (half note, holds through beat 3)
- Third chord on beat 4 (quarter note)

**Two Quarters + Half:**
```
| Chord | Chord | Chord |   -   |
```
- First chord on beat 1 (quarter note)
- Second chord on beat 2 (quarter note)
- Third chord on beat 3 (half note, holds through beat 4)

### Visual Representation

- **Filled Position**: Displays chord name (e.g., "Am", "G7", "Cmaj7")
- **Empty/Continuation Position**: Displays a dash "-" or empty space or continuation symbol
- **Empty Beat (no chord)**: Can show "%" or remain empty for rests

---

## 6. Sections

### Requirements

Sections organize the song structure, identical to the existing Lyrics & Chords mode:

- **Section Types**:
  - Intro
  - Verse (with numbering: Verse 1, Verse 2, etc.)
  - Pre-Chorus
  - Chorus
  - Bridge
  - Outro
  - Instrumental
  - Solo
  - Custom (user-defined)

### Section Display

- Section headers appear as text lines above measure lines
- Section names are styled distinctly (bold, larger font, or colored)
- Sections can be collapsed/expanded (optional enhancement)

---

## 7. Line Types

### Two Line Types in Bar Chart Mode

1. **Text Line (Section Header)**
   - Contains section name/title
   - Editable text field
   - Examples: "Verse 1", "Chorus", "Bridge"

2. **Measure Line (Bar Line)**
   - Contains a row of measures
   - Each measure has 4 chord positions
   - Clickable positions for chord entry

### Adding Lines

Users can add new lines via:
- **Add Text Line Button**: Adds a section header line
- **Add Measure Line Button**: Adds a new row of empty measures
- Context menu or toolbar buttons
- Keyboard shortcuts (optional)

### Line Operations

- **Add**: Insert new line (text or measure)
- **Delete**: Remove a line
- **Reorder**: Drag and drop to reorder lines (optional enhancement)
- **Duplicate**: Copy a line (optional enhancement)

---

## 8. User Interactions

### Chord Entry

1. User clicks on a beat position within a measure
2. Chord dropdown/picker opens (same component as Lyrics & Chords mode)
3. User selects a chord
4. Chord is placed in the clicked position
5. Dropdown closes

### Chord Modification

- **Change Chord**: Click on existing chord → dropdown opens → select new chord
- **Remove Chord**: Click on chord → select "Remove" or empty option
- **Clear Position**: Set position back to empty/continuation

### Measure Operations

- **Add Measure**: Button to add more measures to a line
- **Remove Measure**: Delete a measure from a line
- **Clear Measure**: Reset all positions in a measure to empty

### Keyboard Navigation (Optional Enhancement)

- Arrow keys to navigate between positions
- Enter to open chord picker
- Delete/Backspace to clear position
- Tab to move to next measure

---

## 9. Direction Support (LTR/RTL)

### Requirements

Both reading directions shall be supported:

#### Left-to-Right (LTR)
- Measures flow from left to right
- Beat 1 is on the left, Beat 4 is on the right
- Default for most Western music

#### Right-to-Left (RTL)
- Measures flow from right to left
- Beat 1 is on the right, Beat 4 is on the left
- Useful for Hebrew/Arabic text sections
- Measure internal order remains musical (beat 1 → beat 4)

### Direction Toggle

- Same direction toggle as existing Lyrics & Chords mode
- Affects both section headers and measure flow
- Visual layout mirrors appropriately

---

## 10. Visual Design

### Measure Styling

```
┌─────────┬─────────┬─────────┬─────────┐
│   Am    │    -    │    G    │    -    │
└─────────┴─────────┴─────────┴─────────┘
```

**Ending Double Bar Line:**
```
┌─────────┬─────────┬─────────┬─────────┐║
│   Am    │    -    │    G    │    -    │║
└─────────┴─────────┴─────────┴─────────┘║
```

- **Bar Lines**: Vertical lines separating measures
- **Double Bar Line**: Thick double line on the final measure of the document
- **Beat Dividers**: Subtle internal dividers between beat positions
- **Chord Text**: Centered within each beat position
- **Hover State**: Highlight on hoverable positions
- **Selected State**: Visual indication when position is selected

### Color Scheme

- Consistent with existing application theme
- Clear contrast for readability
- Distinct styling for:
  - Empty positions
  - Filled chord positions
  - Section headers

### Typography

- **Chord Names**: Clear, readable font (monospace or music-friendly)
- **Section Headers**: Bold, slightly larger
- **Consistent sizing**: All chords same font size for alignment

### Responsive Behavior

- Measures maintain fixed proportions
- Number of measures per line adjusts to available width
- Mobile considerations (if applicable)

---

## 11. Data Model

### TypeScript Interfaces

```typescript
// Mode type
type AppMode = 'lyrics' | 'barChart';

// Beat position within a measure (1-4)
type BeatPosition = 1 | 2 | 3 | 4;

// Individual beat in a measure
interface Beat {
  position: BeatPosition;
  chord: string | null;  // null means empty/continuation
  isHold: boolean;       // true if this beat continues previous chord
}

// A single measure (bar)
interface Measure {
  id: string;
  beats: [Beat, Beat, Beat, Beat];  // Always 4 beats
  isEnding?: boolean;               // True for final measure (shows double bar line)
}

// A line of measures
interface MeasureLine {
  id: string;
  type: 'measures';
  measures: Measure[];
}

// A section header line
interface SectionLine {
  id: string;
  type: 'section';
  text: string;
  sectionType?: SectionType;
}

// Union type for all line types in Bar Chart mode
type BarChartLine = MeasureLine | SectionLine;

// Complete Bar Chart document
interface BarChartDocument {
  id: string;
  title: string;
  artist?: string;
  direction: 'ltr' | 'rtl';
  columns: 1 | 2 | 3;
  lines: BarChartLine[];
  measuresPerLine: number;
}

// Section types (shared with Lyrics mode)
type SectionType = 
  | 'intro'
  | 'verse'
  | 'pre-chorus'
  | 'chorus'
  | 'bridge'
  | 'outro'
  | 'instrumental'
  | 'solo'
  | 'custom';
```

### Storage

- Bar Chart data stored separately from Lyrics & Chords data
- LocalStorage key: `barChartDocument` (or similar)
- JSON serialization for persistence

---

## 12. Component Architecture

### New Components

| Component | Description |
|-----------|-------------|
| `ModeToggle` | Switch between Lyrics and Bar Chart modes |
| `BarChartEditor` | Main container for Bar Chart mode |
| `MeasureLine` | Renders a line of measures |
| `Measure` | Single measure with 4 beat positions |
| `BeatPosition` | Individual clickable beat slot |
| `SectionHeader` | Editable section title line |
| `BarChartToolbar` | Toolbar with add line buttons |

### Component Hierarchy

```
App
├── ModeToggle
├── [Lyrics Mode Components] (when mode === 'lyrics')
│   └── A4Page
│       └── LyricsEditor
│           └── ...
└── [Bar Chart Mode Components] (when mode === 'barChart')
    └── A4Page
        └── BarChartEditor
            ├── BarChartToolbar
            │   ├── AddSectionButton
            │   └── AddMeasureLineButton
            └── BarChartContent
                ├── SectionHeader (for section lines)
                └── MeasureLine (for measure lines)
                    └── Measure
                        └── BeatPosition
                            └── ChordDropdown (on click)
```

### Shared Components

The following existing components will be reused:

- `A4Page` - Page layout container
- `ChordDropdown` - Chord selection picker
- `FileDialog` - Save/Load dialogs (extended for Bar Chart)
- Direction toggle and column controls

---

## Implementation

For detailed implementation phases, tasks, and acceptance criteria, see:
**[bar_chart_TODO.md](bar_chart_TODO.md)**

---

## Design Decisions

### Measures Per Line
- **Decision**: User-configurable, but consistent across the entire document
- **Rationale**: Allows flexibility for different song complexities while maintaining perfect alignment
- **Implementation**: A document-level setting that applies to all measure lines

### Copy/Paste Functionality
- **Decision**: Full copy/paste support for both sections and measure lines
- **Rationale**: Essential for efficient workflow, matching Lyrics mode capabilities
- **Implementation**: 
  - Copy button on each line (section or measure)
  - Paste button in toolbar
  - Copying a measure line includes all chord data
  - Copying a section copies the text content

---

## Open Questions (Future Enhancements)

1. **Repeat signs**: Should we support repeat bar notation (:|, |:)?
2. **Time signatures**: Should we support other time signatures (3/4, 6/8)?
3. **Annotations**: Should users be able to add notes/annotations to measures?

---

## References

- Existing application: Lyrics & Chords mode implementation
- [src/components/](src/components/) - Current component structure
- [src/types/](src/types/) - Type definitions
- [specification.md](specification.md) - Original application specification
