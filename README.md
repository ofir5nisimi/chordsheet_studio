# Guitar Chords Sheet (Chordsheet Studio)

A professional web application for creating guitar chord sheets with lyrics. Built with React, TypeScript, and Vite.

**Live Demo:** [https://ofir5nisimi.github.io/chordsheet_studio/](https://ofir5nisimi.github.io/chordsheet_studio/)

## Features

### Core Functionality
- **A4 Format Document Editing** - Professional page layout with accurate print dimensions
- **Two/Three Column Layout** - Toggle between 2 and 3 column layouts for optimal space usage
- **Precise Chord Positioning** - Click anywhere on lyrics to add chords with exact positioning
- **Horizontal Chord Dragging** - Fine-tune chord positions by dragging left/right
- **Comprehensive Chord Database** - All major, minor, 7th, and extended chords with search functionality

### Transposition
- **Chord Transposition** - Transpose all chords up or down by -12 to +12 semitones
- **Smart Accidental Handling** - Automatically uses sharps or flats based on musical context
- **Slash Chord Support** - Correctly transposes slash chords (e.g., Am/G → Bm/A)

### Language Support
- **RTL/LTR Toggle** - Full support for right-to-left languages (Hebrew, Arabic)
- **Bidirectional Text** - Proper handling of mixed direction content
- **Interface Mirroring** - UI adapts to selected text direction

### File Management
- **Save/Load Documents** - Save chord sheets locally and load them later
- **Export to JSON** - Export documents for backup or sharing
- **Import from JSON** - Import previously exported documents
- **Auto-save** - Automatic saving to prevent data loss

### Editing Features
- **Undo/Redo** - Full history support with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
- **Copy/Paste** - Standard clipboard operations for lyrics
- **Multi-line Editing** - Per-line chord and lyrics editing
- **Chord Deletion** - Easy removal of individual chords

### Output
- **Print Support** - Clean print output matching A4 format
- **PDF Export** - Export chord sheets as PDF documents

## Technology Stack

- **Frontend:** React 19 with TypeScript
- **Build Tool:** Vite 7
- **Styling:** CSS with A4 page layout simulation
- **Deployment:** GitHub Pages

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Opens the app at http://localhost:5173/chordsheet_studio/

### Build
```bash
npm run build
```

### Deploy to GitHub Pages
```bash
npm run deploy
```

## Project Structure

```
src/
├── components/          # React components
│   ├── A4Page.tsx       # A4 document page component
│   ├── ChordDropdown.tsx # Chord selection dropdown
│   ├── FileDialog.tsx   # File operations dialog
│   └── LyricsEditor.tsx # Lyrics text editor with chord support
├── data/
│   └── chords.ts        # Comprehensive chord database
├── styles/              # CSS stylesheets
├── types/               # TypeScript type definitions
├── utils/
│   ├── storage.ts       # Local storage utilities
│   └── transpose.ts     # Chord transposition logic
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+S | Save document |
| Ctrl+P | Print |

## Author

**Ofir Nisimi**

## License

MIT License - see [LICENSE](LICENSE) for details
