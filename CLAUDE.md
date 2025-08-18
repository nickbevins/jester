# Jester Tennis App - Development Notes

## Project Overview
Jester is a Progressive Web App for generating balanced tennis matches (singles and doubles) with an integrated timer system. Built with vanilla HTML, CSS, and JavaScript with no external dependencies.

## Key Features Implemented
- **Player Management**: Add, edit, import/export player rosters
- **Match Generation**: 
  - Singles mode (1v1) with gender/skill preferences
  - Doubles mode (2v2) with fixed teams, gender mixing, skill balancing
  - Special matches: Canadian doubles (2v1), singles fallbacks
- **Bench Weighting System**: Fair rotation prioritizing recently benched players
- **Timer System**: Countdown timer with customizable alerts
- **PWA Features**: Offline support, installable, notifications

## Current Architecture

### File Structure
```
jester/
├── index.html          # Single-page app with 3 tabs (Players, Matches, Timer)
├── styles.css          # Dark theme CSS with responsive design
├── script.js           # Main Jester class with all functionality
├── manifest.json       # PWA configuration
├── sw.js              # Service worker for offline support
├── README.md          # User documentation
└── CLAUDE.md          # This development reference
```

### Main JavaScript Class: `Jester`
- **Constructor**: Initializes players, fixed teams, bench history, timer state
- **Player Management**: CRUD operations, CSV import/export, edit mode
- **Match Generation**: Complex algorithms for singles/doubles matching with bench weighting
- **Bench Weighting**: Fair rotation system tracking recently benched players
- **Timer System**: Countdown with customizable sound/vibration alerts
- **Data Persistence**: localStorage for players, fixed teams, bench history, and settings

## Match Generation Algorithms

### Singles Mode Logic
1. **Player Selection**: 
   - If `courts*2 >= players`: Use all (or all-1 if odd)
   - If `courts*2 < players`: Randomly select `courts*2` players
2. **Gender Filtering**:
   - "Same": Create matches within gender groups, fallback to mixed if needed
   - "Any": Single pool matching
3. **Skill Matching**:
   - "Individual": Find opponents within 1 skill level, with variety via randomization
   - "Random": Completely random pairing
4. **Court Assignment**: Randomized to prevent predictable patterns

### Doubles Mode Logic
1. **Fixed Teams**: Pre-defined partnerships distributed evenly
2. **Team Formation**: Based on gender (mixed/same/any) and skill preferences
3. **Match Pairing**: Teams paired by skill balance or randomly
4. **Special Matches**: Handle leftover players with Canadian doubles or singles

## Bench Weighting System

### Core Functionality
- **Bench History Tracking**: Maintains rolling history of players who didn't get regular doubles matches
- **Exponential Weighting**: Recent bench rounds weighted more heavily using `Math.pow(1.5, rounds)` with random jitter
- **Time-based Reset**: History clears after 2 hours of inactivity to prevent stale data
- **Court-aware Logic**: History length adapts to court count (`courtsCount - 1` rounds)

### Implementation Details
```javascript
// Bench score calculation with exponential weighting plus jitter
getBenchScore(playerName, courtsCount) {
    for (let i = 0; i < maxHistoryRounds; i++) {
        if (round.includes(playerName)) {
            const baseWeight = Math.pow(1.5, maxHistoryRounds - i);
            const jitter = Math.random() * 0.3; // Small random component
            score += baseWeight + jitter;
        }
    }
}
```

### Player Selection Logic
- **Weighted Random Selection**: Players with higher bench scores have proportionally better odds of selection
- **Probability-based**: Uses cumulative weight distribution for fair randomized selection
- **Natural Variation**: Prevents predictable rotation patterns while maintaining fairness
- **Configurable**: Can be disabled in Advanced Settings for pure random selection

### Advanced Settings Integration
- **Default Enabled**: Bench weighting enabled by default for fair play
- **User Configurable**: Toggle in Advanced Settings panel
- **Persistent Setting**: Choice saved in localStorage across sessions
- **Fallback Behavior**: When disabled, uses pure random Fisher-Yates shuffle

## Timer Implementation

### Core Timer Features
- **Presets**: 15, 18, 20, 30 minute buttons + custom input
- **Early Alerts**: Configurable 1 and 2 minute warnings
- **Controls**: Start, Pause/Resume, Stop with proper state management
- **Background Operation**: Uses browser notifications when minimized

### Customizable Alerts
- **Sound Types**: 
  - Double Beep (800Hz + 1000Hz)
  - Chime (C-E-G ascending)
  - Bell (440Hz with harmonics)
  - Buzzer (200Hz sawtooth)
  - Silent
- **Volume Control**: 0-100% slider affecting all sound types
- **Vibration Patterns**:
  - Pulse: `[300, 100, 300, 100, 300]`
  - Short: `[200]`
  - Long: `[800]`
  - Double: `[200, 100, 200]`
  - Off
- **Test Functions**: Preview sound/vibration settings

### Technical Implementation
- **Web Audio API**: Generated tones for cross-platform compatibility
- **Vibration API**: Custom patterns for mobile haptic feedback
- **Notification API**: System-level alerts with permission handling
- **Error Handling**: Graceful fallbacks for unsupported features

## Key Algorithms & Logic

### Singles Skill Matching (with Variety)
```javascript
// Finds similar skill opponents while adding randomness for variety
findBestSkillPair(players) {
    // 1. Shuffle first for variety
    // 2. Sort by skill for matching
    // 3. Random starting player from top 3
    // 4. Find all within 1 skill level
    // 5. Random selection from valid matches
}
```

### Court Utilization Fix
- **Original Issue**: Gender pools processed sequentially could waste courts
- **Solution**: Process all pools, then use flexible fallback matching
- **Result**: Maximizes court usage even with uneven gender distributions

### Variety in Repeated Sessions
- **Problem**: Deterministic matching produced same pairings every round
- **Solution**: Multiple randomization points while preserving skill preferences
- **Implementation**: Shuffle before sorting, random starting positions, random selection from valid matches

## Development Notes

### Recent Major Changes
1. **Added Singles Mode**: Complete 1v1 matching system with gender/skill preferences
2. **Improved Doubles Algorithm**: Fixed team distribution, better skill balancing
3. **Added Timer Page**: Full-featured countdown with customizable alerts
4. **Enhanced Skill Matching**: Added variety while maintaining skill consciousness
5. **Implemented Bench Weighting**: Fair rotation system with configurable priority
6. **Improved Bench Weighting**: Added weighted random selection with exponential decay and jitter to prevent predictable patterns
7. **Mobile Optimization**: Touch-friendly controls, responsive design

### Code Quality Improvements
- **Modular Functions**: Separated matching logic into reusable components
- **Error Handling**: Graceful fallbacks for audio, notifications, edge cases
- **State Management**: Proper timer state with pause/resume functionality
- **User Experience**: Visual feedback, loading states, clear messaging

### Testing Considerations
- **Browser Compatibility**: Test audio/vibration across Chrome, Safari, Firefox
- **Mobile Testing**: iOS/Android notification permissions, audio autoplay policies
- **Edge Cases**: Odd player counts, uneven gender distributions, skill gaps
- **PWA Features**: Offline functionality, installation flow, background notifications

## Common Development Patterns

### Event Listener Setup
```javascript
// Centralized in setupEventListeners()
document.getElementById('element').addEventListener('event', () => this.method());
```

### Data Persistence
```javascript
// localStorage pattern used throughout
loadData() { return JSON.parse(localStorage.getItem('key')) || defaultValue; }
saveData() { localStorage.setItem('key', JSON.stringify(this.data)); }
```

### Audio Generation
```javascript
// Web Audio API pattern for cross-platform sounds
const oscillator = audioContext.createOscillator();
const gainNode = audioContext.createGain();
// Configure frequency, volume, duration, then start/stop
```

### Random Selection with Fairness
```javascript
// Fisher-Yates shuffle used throughout for true randomness
shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
```

## Future Enhancement Ideas
- **Multi-round Tournament Mode**: Sequential timers with automatic match generation
- **Player Statistics**: Track wins/losses, playing time, partner frequency
- **Custom Sound Upload**: Allow users to upload their own alert sounds
- **Match History**: Save and review past match configurations
- **Social Features**: Share match results, export to social media
- **Advanced Scheduling**: Time-based court rotations, break management

## Deployment Notes
- **Static Hosting**: Works on any static host (GitHub Pages, Netlify, Vercel)
- **PWA Requirements**: HTTPS required for service worker and notifications
- **Mobile Considerations**: Test notification permissions on actual devices
- **Performance**: No dependencies means fast loading, good offline experience

## Known Limitations
- **Audio Autoplay**: Mobile browsers require user interaction before playing sounds
- **Background Timers**: Browser may throttle when app backgrounded (notifications help)
- **Notification Permissions**: Users can deny, limiting background functionality
- **Vibration Support**: Limited to mobile devices, not available on desktop