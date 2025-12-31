# Bar Chart Mode - Implementation TODO

## Overview

This document outlines the implementation phases for the Bar Chart Mode feature. Each phase contains detailed instructions and acceptance criteria that must be verified before proceeding to the next phase.

---

## Phase 1: Core Structure & Mode Toggle ✅ COMPLETED

### Objectives
Set up the foundational architecture for the Bar Chart mode, including the mode toggle mechanism and basic component structure.

### Tasks

- [x] **1.1 Add Mode Type Definition**
  - Add `AppMode` type to `src/types/barChart.ts`: `type AppMode = 'lyrics' | 'barChart'`
  - Add all Bar Chart related interfaces (Measure, Beat, MeasureLine, SectionLine, etc.)

- [x] **1.2 Create Mode Toggle Component**
  - Create `src/components/ModeToggle.tsx`
  - Create `src/styles/ModeToggle.css`
  - Implement a segmented control or toggle switch UI
  - Display current mode visually (active state styling)

- [x] **1.3 Update App State Management**
  - Add `mode` state to `App.tsx`
  - Add `barChartDocument` state to store Bar Chart data separately
  - Implement mode switching logic

- [x] **1.4 Create BarChartEditor Component**
  - Create `src/components/BarChartEditor.tsx`
  - Create `src/styles/BarChartEditor.css`
  - Basic container that renders inside A4Page when mode is 'barChart'
  - Placeholder content for initial setup

- [x] **1.5 Integrate Mode Toggle in App**
  - Add ModeToggle to App sidebar
  - Conditionally render LyricsEditor or BarChartEditor based on mode
  - Ensure A4Page wrapper works for both modes

- [x] **1.6 Export New Components**
  - Update `src/components/index.ts` to export new components

- [x] **1.7 UI Redesign - Sidebar Layout**
  - Moved toolbar buttons to left sidebar for more vertical editing space
  - Kept slim header with title and help button
  - Improved layout efficiency

### Acceptance Criteria

- [x] Mode toggle button is visible in the application sidebar
- [x] Clicking the toggle switches between "Lyrics & Chords" and "Bar Chart" modes
- [x] When in Lyrics mode, the existing LyricsEditor is displayed
- [x] When in Bar Chart mode, the BarChartEditor placeholder is displayed
- [x] The A4Page layout (columns, direction) works correctly in both modes
- [x] Mode state persists after page refresh (stored in localStorage)
- [x] No console errors when switching modes
- [x] TypeScript compiles without errors

---

## Phase 2: Measure Rendering

### Objectives
Implement the visual rendering of measures (bars) with their 4 beat positions.

### Tasks

- [ ] **2.1 Create Measure Component**
  - Create `src/components/Measure.tsx`
  - Create `src/styles/Measure.css`
  - Render a measure with 4 beat position slots
  - Display bar lines (left and right borders)
  - Show beat dividers between positions

- [ ] **2.2 Create BeatPosition Component**
  - Create `src/components/BeatPosition.tsx`
  - Create `src/styles/BeatPosition.css`
  - Render individual beat slot
  - Display chord name if present
  - Display continuation marker ("-") if beat holds previous chord
  - Display empty state for unfilled beats

- [ ] **2.3 Implement Double Bar Line**
  - Add `isEnding` property to Measure
  - Render double bar line (||) on the right side of final measure
  - Automatically mark last measure in document as ending
  - Style double bar line distinctly (thicker/double stroke)

- [ ] **2.4 Create MeasureLineComponent**
  - Create `src/components/MeasureLineComponent.tsx`
  - Create `src/styles/MeasureLineComponent.css`
  - Render a horizontal row of measures
  - Handle configurable number of measures per line

- [ ] **2.5 Add Measures Per Line Configuration**
  - Add UI control for setting measures per line (e.g., dropdown or number input)
  - Store setting in document state
  - Apply setting to all MeasureLine components
  - Default value: 4 measures per line

- [ ] **2.6 Implement Basic BarChartEditor Content**
  - Initialize with sample data (one section, one measure line)
  - Render MeasureLineComponent for each measure line
  - Handle empty state (no lines yet)

- [ ] **2.7 Style Measures for A4 Layout**
  - Ensure measures fit within column widths
  - Test with 1, 2, and 3 column layouts
  - Maintain consistent measure width based on configuration

### Acceptance Criteria

- [ ] Measures display as rectangular boxes with visible borders
- [ ] Each measure shows 4 distinct beat positions
- [ ] Beat positions are evenly sized within the measure
- [ ] Measures per line control is visible and functional
- [ ] Changing measures per line updates the display immediately
- [ ] Measures align perfectly across multiple lines
- [ ] Layout works correctly in 1, 2, and 3 column modes
- [ ] Empty beat positions are clearly distinguishable from filled ones
- [ ] Measure width is consistent across the entire document
- [ ] Final measure displays a double bar line (||) on the right side
- [ ] Double bar line is visually distinct from regular bar lines

---

## Phase 3: Chord Interaction

### Objectives
Enable users to add, edit, and remove chords from beat positions using the existing ChordDropdown component.

### Tasks

- [ ] **3.1 Add Click Handler to BeatPosition**
  - Implement onClick event for BeatPosition component
  - Track which beat position is currently selected
  - Add visual feedback for selected/active state

- [ ] **3.2 Integrate ChordDropdown**
  - Position ChordDropdown near clicked beat position
  - Pass current chord value (if any) to dropdown
  - Handle chord selection callback

- [ ] **3.3 Implement Chord Placement Logic**
  - Update measure data when chord is selected
  - Handle chord at beat 1 (can be full, half, or quarter)
  - Handle chord at beat 2 (quarter or start of half)
  - Handle chord at beat 3 (half or quarter)
  - Handle chord at beat 4 (quarter only)

- [ ] **3.4 Implement Chord Duration Display**
  - When a chord is placed, determine its duration based on next chord position
  - Display "-" for continuation beats (hold)
  - Update display when chords are added/removed

- [ ] **3.5 Add Remove Chord Option**
  - Add "Remove" or "Clear" option in ChordDropdown
  - Allow clicking on existing chord to change or remove it
  - Handle cascading updates when removing a chord

- [ ] **3.6 Implement Measure-Level Operations**
  - Add "Clear Measure" functionality
  - Context menu or button to clear all chords in a measure

### Acceptance Criteria

- [ ] Clicking an empty beat position opens the ChordDropdown
- [ ] Selecting a chord places it in the clicked position
- [ ] Chord name displays correctly in the beat position
- [ ] Clicking an existing chord allows changing it
- [ ] Chords can be removed (position becomes empty)
- [ ] Continuation beats show "-" correctly based on chord positions
- [ ] ChordDropdown closes after selection
- [ ] ChordDropdown can be dismissed by clicking outside
- [ ] All chord types from chords.ts are available for selection
- [ ] Clear measure functionality works correctly

---

## Phase 4: Sections & Line Management

### Objectives
Implement section headers and the ability to add, remove, and reorder different line types.

### Tasks

- [ ] **4.1 Create SectionHeader Component**
  - Create `src/components/SectionHeader.tsx`
  - Create `src/styles/SectionHeader.css`
  - Render section name with distinct styling
  - Make section text editable (inline editing)
  - Support section type selection (Verse, Chorus, etc.)

- [ ] **4.2 Create BarChartToolbar Component**
  - Create `src/components/BarChartToolbar.tsx`
  - Create `src/styles/BarChartToolbar.css`
  - Add "Add Section" button
  - Add "Add Measure Line" button
  - Position toolbar appropriately in the editor

- [ ] **4.3 Implement Add Line Functionality**
  - "Add Section" creates a new SectionLine at the end
  - "Add Measure Line" creates a new MeasureLine at the end
  - Option to insert line at specific position (between existing lines)

- [ ] **4.4 Implement Delete Line Functionality**
  - Add delete button/icon for each line
  - Confirmation before deleting (optional)
  - Handle edge case: prevent deleting last line (or allow empty state)

- [ ] **4.5 Implement Line Reordering**
  - Add drag handle to each line
  - Implement drag-and-drop reordering
  - Visual feedback during drag operation
  - Update document data on drop

- [ ] **4.6 Implement Copy/Paste for Lines**
  - Add copy button/icon for each line
  - Store copied line in clipboard state
  - Add paste button to toolbar
  - Paste inserts copied line at current position or end
  - Support copying sections (text lines)
  - Support copying measure lines (with all chords)

- [ ] **4.7 Update BarChartEditor to Render All Line Types**
  - Iterate through lines array
  - Render SectionHeader for section lines
  - Render MeasureLineComponent for measure lines
  - Handle mixed line types correctly

### Acceptance Criteria

- [ ] Section headers display with distinct styling (bold, larger font)
- [ ] Section text can be edited inline
- [ ] "Add Section" button adds a new section line
- [ ] "Add Measure Line" button adds a new measure line
- [ ] Lines can be deleted individually
- [ ] Lines can be reordered via drag-and-drop
- [ ] Copy button copies the line data
- [ ] Paste button inserts the copied line
- [ ] Copying a measure line copies all chord data
- [ ] Copying a section line copies the text
- [ ] Multiple line types (sections and measures) render correctly together
- [ ] Line operations update the document state properly

---

## Phase 5: RTL Support & Direction Toggle

### Objectives
Implement full RTL (Right-to-Left) support for the Bar Chart mode.

### Tasks

- [ ] **5.1 Apply Direction to BarChartEditor**
  - Read direction setting from document state
  - Apply CSS direction property to editor container
  - Ensure existing direction toggle works for Bar Chart mode

- [ ] **5.2 RTL Measure Flow**
  - In RTL mode, measures flow from right to left
  - First measure of a line appears on the right
  - Last measure of a line appears on the left

- [ ] **5.3 RTL Beat Position Order**
  - Within each measure, beats remain in musical order (1-2-3-4)
  - But visually, beat 1 appears on the right in RTL
  - Beat 4 appears on the left in RTL

- [ ] **5.4 RTL Section Headers**
  - Section text aligns to the right in RTL mode
  - Text direction is RTL for Hebrew/Arabic content

- [ ] **5.5 RTL Toolbar and Controls**
  - Ensure toolbar buttons work correctly in RTL
  - Drag handles and action buttons positioned appropriately

- [ ] **5.6 Test All RTL Scenarios**
  - Test chord entry in RTL mode
  - Test line operations in RTL mode
  - Test column layouts (1, 2, 3) in RTL mode

### Acceptance Criteria

- [ ] Direction toggle switches between LTR and RTL
- [ ] In RTL mode, measure lines flow from right to left
- [ ] Beat positions within measures display correctly in RTL
- [ ] Section headers align and read correctly in RTL
- [ ] All interactive elements work correctly in RTL
- [ ] Column layouts display correctly in RTL
- [ ] No visual glitches or overlap issues in RTL mode
- [ ] Direction preference is saved and restored

---

## Phase 6: Persistence & Storage

### Objectives
Implement data persistence for Bar Chart documents, separate from Lyrics mode data.

### Tasks

- [ ] **6.1 Define Storage Keys**
  - Add new localStorage key for Bar Chart data: `barChartDocument`
  - Keep existing `lyricsDocument` key unchanged

- [ ] **6.2 Implement Save Functionality**
  - Auto-save Bar Chart document on changes
  - Debounce saves to avoid excessive writes
  - Use existing storage utility patterns

- [ ] **6.3 Implement Load Functionality**
  - Load Bar Chart document on app initialization
  - Handle case where no saved data exists (initialize with default)
  - Validate loaded data structure

- [ ] **6.4 Update Storage Utility**
  - Add functions to `src/utils/storage.ts` for Bar Chart data
  - `saveBarChartDocument(doc: BarChartDocument)`
  - `loadBarChartDocument(): BarChartDocument | null`

- [ ] **6.5 Mode-Specific Storage**
  - Store current mode preference
  - Load correct mode on app start

- [ ] **6.6 Extend FileDialog for Bar Chart**
  - Add option to export Bar Chart as file
  - Add option to import Bar Chart from file
  - Handle file format (JSON or custom)

### Acceptance Criteria

- [ ] Bar Chart data persists after page refresh
- [ ] Switching to Lyrics mode and back preserves Bar Chart data
- [ ] Lyrics mode data is not affected by Bar Chart operations
- [ ] App loads the correct mode on startup
- [ ] Export/Import works for Bar Chart documents
- [ ] Corrupted data is handled gracefully (fallback to default)
- [ ] Storage operations don't cause performance issues

---

## Phase 7: PDF Export

### Objectives
Extend the PDF export functionality to support Bar Chart mode.

### Tasks

- [ ] **7.1 Ensure Print Styles for Measures**
  - Add print-specific CSS for measure components
  - Ensure bar lines and beat dividers print correctly
  - Handle page breaks appropriately

- [ ] **7.2 Update Export Logic**
  - Detect current mode when exporting
  - Apply correct export settings for Bar Chart
  - Maintain measure alignment in exported PDF

- [ ] **7.3 Test PDF Output**
  - Test single column PDF export
  - Test multi-column PDF export
  - Test RTL PDF export
  - Verify chord names are readable

- [ ] **7.4 Handle Edge Cases**
  - Very long documents (multiple pages)
  - Empty documents
  - Documents with only sections (no measures)

### Acceptance Criteria

- [ ] PDF export button works in Bar Chart mode
- [ ] Exported PDF maintains measure alignment
- [ ] Bar lines and beat positions are clearly visible in PDF
- [ ] Chord names are readable in PDF
- [ ] Column layouts export correctly
- [ ] RTL documents export correctly
- [ ] PDF quality matches Lyrics mode export quality

---

## Phase 8: Polish & Testing

### Objectives
Final refinements, bug fixes, and comprehensive testing.

### Tasks

- [ ] **8.1 Visual Polish**
  - Refine measure styling for professional appearance
  - Ensure consistent spacing and alignment
  - Add hover effects and transitions
  - Refine typography for chord names

- [ ] **8.2 Keyboard Navigation (Enhancement)**
  - Arrow keys to navigate between beat positions
  - Enter to open chord picker on selected position
  - Delete/Backspace to clear selected position
  - Tab to move to next measure

- [ ] **8.3 Error Handling**
  - Handle edge cases gracefully
  - Add error boundaries for component failures
  - Validate user input

- [ ] **8.4 Performance Optimization**
  - Optimize re-renders for large documents
  - Ensure smooth drag-and-drop
  - Profile and fix any performance issues

- [ ] **8.5 Cross-Browser Testing**
  - Test in Chrome, Firefox, Edge, Safari
  - Fix any browser-specific issues

- [ ] **8.6 Accessibility**
  - Add ARIA labels to interactive elements
  - Ensure keyboard navigation works
  - Test with screen reader (if applicable)

- [ ] **8.7 Documentation**
  - Update README with Bar Chart mode instructions
  - Update help guide component with new mode info
  - Add tooltips for new UI elements

### Acceptance Criteria

- [ ] UI is polished and professional looking
- [ ] No visual glitches or alignment issues
- [ ] Keyboard navigation works as expected
- [ ] No console errors or warnings
- [ ] Performance is smooth for typical document sizes
- [ ] Works correctly in all major browsers
- [ ] Help documentation covers Bar Chart mode
- [ ] All features work together harmoniously

---

## Completion Checklist

Before considering the feature complete, verify:

- [ ] All 8 phases are complete with all acceptance criteria met
- [ ] Mode toggle works seamlessly
- [ ] Bar Chart mode has feature parity with Lyrics mode where applicable
- [ ] Copy/Paste works for all line types
- [ ] RTL support is fully functional
- [ ] Data persists correctly
- [ ] PDF export produces quality output
- [ ] No regression in existing Lyrics mode functionality
- [ ] Code is clean and follows project conventions
- [ ] TypeScript strict mode passes
- [ ] ESLint shows no errors
