import React, { useState, useEffect } from 'react';
import '../styles/HelpGuide.css';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
  direction?: 'ltr' | 'rtl';
}

/**
 * HelpGuide Component
 * 
 * A popup modal that displays a comprehensive user guide for the application.
 * Always opens in English by default, with a toggle to switch to Hebrew.
 */
const HelpGuide: React.FC<HelpGuideProps> = ({ isOpen, onClose }) => {
  // Internal language state - always starts as English
  const [language, setLanguage] = useState<'en' | 'he'>('en');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;

  const isRtl = language === 'he';

  // Inline SVG flags for cross-platform support (Windows doesn't render flag emojis)
  const IsraelFlag = () => (
    <svg viewBox="0 0 220 160" width="22" height="16" style={{ verticalAlign: 'middle', marginRight: '6px', borderRadius: '2px', boxShadow: '0 0 1px rgba(0,0,0,0.3)' }}>
      <rect fill="#fff" width="220" height="160"/>
      <rect fill="#0038b8" y="15" width="220" height="25"/>
      <rect fill="#0038b8" y="120" width="220" height="25"/>
      <g fill="none" stroke="#0038b8" strokeWidth="5">
        <polygon points="110,45 140,97 80,97"/>
        <polygon points="110,115 80,63 140,63"/>
      </g>
    </svg>
  );

  const USAFlag = () => (
    <svg viewBox="0 0 220 160" width="22" height="16" style={{ verticalAlign: 'middle', marginRight: '6px', borderRadius: '2px', boxShadow: '0 0 1px rgba(0,0,0,0.3)' }}>
      <rect fill="#bf0a30" width="220" height="160"/>
      <g fill="#fff">
        <rect y="12.3" width="220" height="12.3"/>
        <rect y="36.9" width="220" height="12.3"/>
        <rect y="61.5" width="220" height="12.3"/>
        <rect y="86.2" width="220" height="12.3"/>
        <rect y="110.8" width="220" height="12.3"/>
        <rect y="135.4" width="220" height="12.3"/>
      </g>
      <rect fill="#002868" width="88" height="86.2"/>
    </svg>
  );

  return (
    <div className="help-guide-overlay" onClick={onClose}>
      <div 
        className={`help-guide-modal ${isRtl ? 'rtl' : 'ltr'}`} 
        onClick={(e) => e.stopPropagation()}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="help-guide-header">
          <h2>{isRtl ? '📖 מדריך למשתמש' : '📖 User Guide'}</h2>
          <div className="help-guide-header-buttons">
            <button 
              className="help-guide-lang-toggle" 
              onClick={() => setLanguage(language === 'en' ? 'he' : 'en')}
              title={language === 'en' ? 'עברית' : 'English'}
            >
              {language === 'en' ? <><IsraelFlag /> עברית</> : <><USAFlag /> English</>}
            </button>
            <button className="help-guide-close" onClick={onClose} title="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="help-guide-content">
          {isRtl ? (
            // Hebrew Guide
            <>
              <section className="help-section">
                <h3>� ברוכים הבאים ל-ChordSheet Studio</h3>
                <p>אפליקציה ליצירת דפי אקורדים עם מילים לשירים. ניתן למקם אקורדים מעל המילים, לארגן בעזרת סקשנים, ולייצא ל-PDF.</p>
              </section>

              <section className="help-section">
                <h3>✏️ עריכה בסיסית</h3>
                <ul>
                  <li><strong>הוספת מילים:</strong> לחצו על השורה והתחילו להקליד</li>
                  <li><strong>שורה חדשה:</strong> הקישו Enter</li>
                  <li><strong>מחיקת שורה ריקה:</strong> הקישו Backspace בשורה ריקה</li>
                  <li><strong>ניווט:</strong> חצים למעלה/למטה לניווט בין שורות</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>🎵 הוספת אקורדים</h3>
                <ul>
                  <li><strong>מצב אקורדים:</strong> לחצו על "Adding Chords ✓" להפעלת מצב הוספת אקורדים</li>
                  <li><strong>הוספת אקורד:</strong> במצב אקורדים, לחצו מעל המילה הרצויה</li>
                  <li><strong>בחירת אקורד:</strong> בחרו מהתפריט או הקלידו לחיפוש</li>
                  <li><strong>גרירת אקורד:</strong> גררו אקורד קיים לשינוי מיקומו</li>
                  <li><strong>עריכת/מחיקת אקורד:</strong> קליק ימני על אקורד לתפריט אפשרויות</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>📋 סקשנים (חלקי שיר)</h3>
                <p>סקשנים עוזרים לארגן את השיר לחלקים כמו פתיחה, בית, פזמון וכו'.</p>
                <ul>
                  <li><strong>יצירת סקשן:</strong> הקלידו את שם הסקשן בסוגריים מרובעים, למשל: <code>[פזמון]</code> או <code>[בית 1]</code></li>
                  <li><strong>העתקת סקשן:</strong> קליק ימני על שורת הסקשן ← "Copy Section"</li>
                  <li><strong>הדבקת סקשן:</strong> קליק ימני על סקשן אחר ← "Paste Section Here"</li>
                  <li><strong>מחיקת סקשן:</strong> קליק ימני על שורת הסקשן ← "Delete Section"</li>
                </ul>
                <p><strong>דוגמאות לשמות סקשנים:</strong> [פתיחה], [בית 1], [בית 2], [פזמון], [גשר], [סיום]</p>
              </section>

              <section className="help-section">
                <h3>📋 העתקה והדבקה</h3>
                <ul>
                  <li><strong>העתקת שורת אקורדים:</strong> העבירו את העכבר מעל שורה עם אקורדים (לא במצב הוספת אקורדים) ← לחצו על כפתור "📋" שמופיע</li>
                  <li><strong>הדבקת אקורדים:</strong> העבירו את העכבר מעל שורה ← לחצו על כפתור "📄" שמופיע</li>
                  <li><strong>העתקה בין עמודות:</strong> ניתן להעתיק ולהדביק בין כל העמודות</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>💾 שמירה ופתיחה</h3>
                <p><strong>Save / Open</strong> - שמירה ופתיחה מהזיכרון המקומי של הדפדפן:</p>
                <ul>
                  <li>השירים נשמרים בדפדפן הנוכחי בלבד</li>
                  <li>מתאים לעבודה שוטפת באותו מחשב</li>
                  <li>שמירה אוטומטית כל 30 שניות</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>📤 ייצוא וייבוא</h3>
                <p><strong>Export / Import</strong> - העברת שירים בין מחשבים:</p>
                <ul>
                  <li><strong>Export:</strong> שומר קובץ JSON למחשב שלכם</li>
                  <li><strong>Import:</strong> טוען קובץ JSON ששמרתם קודם</li>
                  <li>מתאים לגיבוי או העברה למחשב אחר</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>🖨️ הדפסה ל-PDF</h3>
                <ul>
                  <li><strong>Save PDF:</strong> לחצו לשמירת קובץ PDF ישירות למחשב</li>
                  <li><strong>Print:</strong> לחצו לפתיחת חלון ההדפסה (או Ctrl+P)</li>
                  <li>הדף יודפס בפורמט A4</li>
                  <li><strong>קווי הפרדה:</strong> לחצו על "┃ Lines" כדי להציג/להסתיר קווים מפרידים בין העמודות</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>🎹 טרנספוזיציה</h3>
                <ul>
                  <li>השתמשו בלחצני +/- לשינוי הטון</li>
                  <li>טווח: עד 12 חצאי טונים למעלה/למטה</li>
                  <li>לחצו "Reset" לחזרה לטון המקורי</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>⌨️ קיצורי מקלדת</h3>
                <ul>
                  <li><kbd>Ctrl+S</kbd> - שמירה</li>
                  <li><kbd>Ctrl+O</kbd> - פתיחה</li>
                  <li><kbd>Ctrl+N</kbd> - מסמך חדש</li>
                  <li><kbd>Ctrl+P</kbd> - הדפסה</li>
                  <li><kbd>Ctrl+Z</kbd> - ביטול</li>
                  <li><kbd>Ctrl+Y</kbd> - חזרה על ביטול</li>
                  <li><kbd>Ctrl+L</kbd> - החלפת כיוון טקסט</li>
                </ul>
              </section>
            </>
          ) : (
            // English Guide
            <>
              <section className="help-section">
                <h3>� Welcome to ChordSheet Studio</h3>
                <p>An application for creating chord sheets with lyrics for songs. You can position chords above lyrics, organize with sections, and export to PDF.</p>
              </section>

              <section className="help-section">
                <h3>✏️ Basic Editing</h3>
                <ul>
                  <li><strong>Add lyrics:</strong> Click on a line and start typing</li>
                  <li><strong>New line:</strong> Press Enter</li>
                  <li><strong>Delete empty line:</strong> Press Backspace on an empty line</li>
                  <li><strong>Navigation:</strong> Use Up/Down arrows to move between lines</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>🎵 Adding Chords</h3>
                <ul>
                  <li><strong>Chord mode:</strong> Click "Adding Chords ✓" to enable chord adding mode</li>
                  <li><strong>Add a chord:</strong> In chord mode, click above the desired word</li>
                  <li><strong>Select chord:</strong> Choose from the menu or type to search</li>
                  <li><strong>Drag chord:</strong> Drag an existing chord to reposition it</li>
                  <li><strong>Edit/Delete chord:</strong> Right-click on a chord for options menu</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>📋 Sections (Song Parts)</h3>
                <p>Sections help organize the song into parts like Intro, Verse, Chorus, etc.</p>
                <ul>
                  <li><strong>Create section:</strong> Type the section name in square brackets, e.g.: <code>[Chorus]</code> or <code>[Verse 1]</code></li>
                  <li><strong>Copy section:</strong> Right-click on section line → "Copy Section"</li>
                  <li><strong>Paste section:</strong> Right-click on another section → "Paste Section Here"</li>
                  <li><strong>Delete section:</strong> Right-click on section line → "Delete Section"</li>
                </ul>
                <p><strong>Section name examples:</strong> [Intro], [Verse 1], [Verse 2], [Chorus], [Bridge], [Outro]</p>
              </section>

              <section className="help-section">
                <h3>📋 Copy and Paste</h3>
                <ul>
                  <li><strong>Copy chord line:</strong> Hover over a line with chords (not in chord mode) → click the "📋" button that appears</li>
                  <li><strong>Paste chords:</strong> Hover over a line → click the "📄" button that appears</li>
                  <li><strong>Cross-column copy:</strong> You can copy and paste between all columns</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>💾 Save and Open</h3>
                <p><strong>Save / Open</strong> - Save and open from browser's local storage:</p>
                <ul>
                  <li>Songs are saved in the current browser only</li>
                  <li>Suitable for ongoing work on the same computer</li>
                  <li>Auto-save every 30 seconds</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>📤 Export and Import</h3>
                <p><strong>Export / Import</strong> - Transfer songs between computers:</p>
                <ul>
                  <li><strong>Export:</strong> Saves a JSON file to your computer</li>
                  <li><strong>Import:</strong> Loads a JSON file you saved before</li>
                  <li>Suitable for backup or transfer to another computer</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>🖨️ Save to PDF</h3>
                <ul>
                  <li><strong>Save PDF:</strong> Click to save directly as a PDF file to your computer</li>
                  <li><strong>Print:</strong> Click to open print dialog (or Ctrl+P)</li>
                  <li>Page will be exported in A4 format</li>
                  <li><strong>Separator lines:</strong> Click "┃ Lines" to show/hide vertical separator lines between columns</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>🎹 Transposition</h3>
                <ul>
                  <li>Use the +/- buttons to change the key</li>
                  <li>Range: up to 12 semitones up/down</li>
                  <li>Click "Reset" to return to original key</li>
                </ul>
              </section>

              <section className="help-section">
                <h3>⌨️ Keyboard Shortcuts</h3>
                <ul>
                  <li><kbd>Ctrl+S</kbd> - Save</li>
                  <li><kbd>Ctrl+O</kbd> - Open</li>
                  <li><kbd>Ctrl+N</kbd> - New document</li>
                  <li><kbd>Ctrl+P</kbd> - Print</li>
                  <li><kbd>Ctrl+Z</kbd> - Undo</li>
                  <li><kbd>Ctrl+Y</kbd> - Redo</li>
                  <li><kbd>Ctrl+L</kbd> - Toggle text direction</li>
                </ul>
              </section>
            </>
          )}
        </div>

        <div className="help-guide-footer">
          <button className="help-guide-close-btn" onClick={onClose}>
            {isRtl ? 'סגור' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpGuide;
