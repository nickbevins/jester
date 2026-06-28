# Jester

A Progressive Web App for generating balanced tennis matches (singles and doubles) from your player roster.

## Features

- **Player Management**: Add, edit, and manage your tennis player roster
- **Singles & Doubles Modes**: Choose between 1v1 singles or 2v2 doubles matches
- **Match Timer**: Countdown timer with mid-match alerts, customizable sounds, and vibration
- **Smart Match Generation**: Create balanced matches with customizable preferences
- **Bench Weighting System**: Fair rotation ensuring recently benched players get priority
- **Multiple Match Types**: Supports doubles, singles, and Canadian doubles (2v1)
- **Flexible Options**: 
  - Match mode (singles or doubles)
  - Gender preferences (mixed, same-gender, or any)
  - Skill balancing (random, individual similarity, or team balance)
  - Fixed teammate pairs (doubles mode only)
  - Bench weighting for fair rotation (configurable)
- **CSV Import/Export & URL Sharing**: Share and backup rosters via CSV or shareable URL
- **Mobile Optimized**: Responsive design with dark theme  
- **PWA Features**: Installable app with offline support

## Quick Start

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Add players to your roster with names, genders, and skill levels (1-5)
4. Select active players and generate matches
5. Optionally install as a PWA on your mobile device

## Usage

### Adding Players
- Navigate to the "Players" tab
- Fill in player name, gender, and skill level (1-5 in 0.5 increments)
- Players are automatically saved to local storage

### Generating Matches
1. Go to the "Matches" tab
2. Choose **Mode**: Singles (1v1) or Doubles (2v2)
3. Set number of courts available
4. Choose preferences:
   - **Gender**: Any, Mixed (male/female pairs - doubles only), or Same gender
   - **Matched Skill**: Random, Individual (similar skills), or Team (balanced teams - doubles only)
5. Use Advanced Settings for fixed teammate pairs (doubles mode only)
6. Click "Generate Matches"

### Using the Timer
1. Go to the **Timer** tab
2. Select a preset duration (10–30m) or enter a custom number of minutes
3. Tap **Start** — the screen wake lock activates to keep the display on and audio running
4. Use **Pause** / **Resume** to hold the timer; **Stop** to cancel
5. Configure alerts in the Alert Settings section below the controls
   - Mid-match warnings (2min, 1min): sound plays 3 times, timer continues
   - Time's up: looping alarm + fullscreen modal — tap **Dismiss** to stop

#### Singles Mode Options
- **Gender**:
  - **Any**: Players can face any opponent regardless of gender
  - **Same**: Males play only males, females play only females
  - Mixed option is disabled (not applicable to 1v1 matches)
- **Skill**:
  - **Random**: Completely random opponent pairing
  - **Individual**: Attempts to match players within 1 skill level
  - Team option is disabled (not applicable to singles)

### Importing a Roster

#### CSV Import
Click **Import** on the Players tab and select a `.csv` file. The first row is treated as a header and skipped. Each subsequent row must have four columns:

```
Name, Gender, Skill Level, Active
Alice Smith, female, 3.5, true
Bob Jones, m, 2, false
```

- **Gender**: accepts `male`, `female`, `m`, or `f` (case-insensitive)
- **Skill Level**: 1.0–5.0 in 0.5 increments
- **Active**: `true` or `false` — whether the player is selected for the next round
- Rows with invalid gender or out-of-range skill are skipped

#### URL Import & Sharing
Jester supports sharing rosters via URL using a highly compact array format. Due to browser URL length limits, Chrome and Edge support approximately 70-80 players per URL (with typical first names), while Firefox and Safari support much larger rosters (2000+ players).

##### Share URL
Click **Share URL** on the Players tab to generate a shareable link. The URL is automatically copied to your clipboard.

##### Import Format
URLs use a compact array format to minimize URL length for sharing large rosters:

```
https://yourjester.app/?import=<base64-encoded-JSON>
```

JSON payload structure (array of arrays):
```json
[
  ["Alice", 1, 3.5],
  ["Bob", 0, 4.0],
  ["Charlie", 0, 2.5, 0]
]
```

Each player is an array with 3-4 elements:
- **Index 0**: Player name (string)
- **Index 1**: Gender (number: `1` = female, `0` = male)
- **Index 2**: Skill level (number: 1.0–5.0, decimals supported)
- **Index 3**: Active status (optional - omit for active players, include `0` for inactive)

To generate an import link in JavaScript:
```js
const players = [
  ["Alice", 1, 3.5],      // female, active (default)
  ["Bob", 0, 4.0],        // male, active (default)
  ["Charlie", 0, 2.5, 0]  // male, inactive
];
const url = `https://yourjester.app/?import=${btoa(JSON.stringify(players))}`;
```

When Jester opens an import link, it prompts whether to replace or merge with the existing roster, then cleans the URL so a page refresh doesn't re-trigger the import.

### Advanced Features
- **Bench Weighting**: Configurable fair rotation system in Advanced Settings
  - Automatically tracks players who sit out or play Canadian doubles/singles
  - Prioritizes recently benched players for future matches
  - Uses exponential weighting (recent rounds weighted more heavily)
  - Resets after 2 hours of inactivity
  - Can be disabled for pure random selection
- **Fixed Teams**: Create permanent partnerships in Advanced Settings (doubles mode only)
- **Bulk Operations**: Select/clear all players quickly
- **CSV Export/Import**: Share rosters between devices or backup data
- **URL Sharing**: Share rosters via compact URL (70-80 players in Chrome/Edge, 2000+ in Firefox/Safari)
- **Timer Alerts**: Mid-match warnings at 2 and 1 minute remaining (sound plays 3 times); time's up triggers a looping alarm with a fullscreen modal requiring dismissal
- **Alert Customization**: Choose from beep, chime, bell, or buzzer sounds with adjustable volume; choose vibration pattern (Android)

## Technical Details

- **Technology**: Vanilla HTML5, CSS3, JavaScript (no dependencies)
- **Storage**: Browser localStorage for offline data persistence
- **PWA Features**: Service worker for offline functionality, installable

### Platform Notes

| Feature | iOS (Safari / any browser) | Android (Chrome) | Desktop |
|---|---|---|---|
| Match generation | ✅ | ✅ | ✅ |
| Timer & audio alerts | ✅ | ✅ | ✅ |
| Screen Wake Lock | ✅ iOS 16.4+ | ✅ | ✅ most browsers |
| Vibration alerts | ❌ Not supported in iOS | ✅ | ❌ |
| PWA install | ✅ via Safari Share → Add to Home Screen | ✅ via browser menu | ✅ most browsers |
| Offline support | ✅ | ✅ | ✅ |

**Note on timer audio**: iOS suspends JavaScript when the screen locks. The Screen Wake Lock keeps the display on while the timer is running, ensuring audio alerts fire on schedule. Pause or stop the timer if you want the screen to sleep.

## Installation as PWA

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen" or look for the install prompt

## File Structure

```
jester/
├── index.html          # Main app interface
├── styles.css          # Dark theme styling
├── script.js           # Core app logic and match generation
├── manifest.json       # PWA configuration
├── sw.js              # Service worker for offline support
└── README.md          # This file
```

## Match Generation Algorithms

The app uses sophisticated algorithms to create balanced matches in both singles and doubles modes:

## Singles Mode Algorithm

### Court Capacity Logic
- **Sufficient Courts** (`courts × 2 ≥ active players`):
  - Even player count: Create matches for all players
  - Odd player count: Randomly exclude one player, create matches with remaining
- **Limited Courts** (`courts × 2 < active players`):
  - Randomly select `courts × 2` players for matches
  - Remaining players sit out

### Match Creation
1. **Gender Filtering**:
   - **Same**: Separate players by gender, create matches within each gender group
   - **Any**: Create matches from the entire player pool
2. **Skill Matching**:
   - **Individual**: Prefer opponents within 1 skill level, sort by skill for optimal pairing
   - **Random**: Completely random opponent pairing using Fisher-Yates shuffle
3. **Court Assignment**: All matches get randomized court numbers

## Doubles Mode Algorithm

### Court Capacity Logic
- **Sufficient Courts** (`courts × 4 ≥ active players`):
  - If player count is divisible by 4: Create all doubles matches
  - If remainder exists: Create doubles + special court (singles/Canadian doubles)
- **Limited Courts** (`courts × 4 < active players`):
  - Randomly select `courts × 4` players for matches
  - Remaining players sit out

### Team Formation
1. **Fixed Teams**: Pre-defined partnerships are included first and distributed evenly
2. **Gender Rules**:
   - **Mixed**: Creates male/female pairs when possible
   - **Same**: Creates all-male or all-female teams
   - **Any**: Any gender combination
3. **Skill Balancing** (team formation):
   - **Individual**: Partners are selected to have similar individual skill levels
   - **Random** and **Team**: Partners are selected randomly (same behavior at this stage)

### Match Pairing
- **Individual** and **Team**: Teams sorted by total skill, then each team is paired with an opponent within 2.0 total skill points (randomly chosen among eligible opponents for variety)
- **Random**: Teams are randomly shuffled before pairing — skill is ignored entirely
- **Court Assignment**: All matches get randomized court numbers (fixed teams don't cluster)

### Special Matches (Doubles Mode Only)
- **3 Players**: Canadian doubles (2 vs 1)
- **2 Players**: Singles match
- **1 Player**: Sits out

## Bench Weighting Algorithm

The bench weighting system ensures fair rotation by tracking and prioritizing players who have recently been benched (sitting out or playing non-regular matches).

### How It Works
1. **Tracking**: Monitors players who:
   - Sit out completely
   - Play Canadian doubles (2v1) 
   - Play singles when others play doubles
2. **Weighting**: Recent bench rounds weighted exponentially using `Math.pow(1.5, rounds)` with random jitter to prevent predictable patterns
3. **Selection**: Uses weighted random selection where players with higher bench scores have proportionally better odds (not strict priority)
4. **History Management**:
   - Tracks last 10 rounds of bench history
   - Auto-resets after 2 hours of inactivity
   - Persists across browser sessions

### Configuration
- **Default**: Enabled for fair play
- **Toggle**: Can be disabled in Advanced Settings
- **Fallback**: When disabled, uses pure random Fisher-Yates shuffle
- **Persistent**: Setting saved in browser localStorage

### Example
With bench history tracking last 10 rounds:
- Alice benched 2 rounds ago: weight = 1.5¹ + jitter = ~1.8
- Bob benched 1 round ago: weight = 1.5² + jitter = ~2.5
- Charlie never benched: weight = 1.0 (base weight)
- **Selection odds**: Bob has ~2.5x better odds than Charlie, Alice has ~1.8x better odds

## Key Algorithm Features
- **Bench Weighting System**: Fair rotation with exponential weighting plus randomization to prevent predictable patterns
- **True Randomization**: Fisher-Yates shuffle algorithm (when bench weighting disabled)
- **Optimal Skill Matching**: Sophisticated pairing logic for individual skill preferences
- **Fixed Team Distribution**: Prevents clustering on early courts (doubles only)
- **Fallback Logic**: Graceful handling when preferred gender combinations aren't possible
- **Smart Court Usage**: Maximizes player participation within court constraints
- **Gender Balance**: Intelligent distribution when using "same gender" filtering
- **Configurable Fairness**: Toggle between weighted selection and pure randomization

## Contributing

This is a personal project, but suggestions and improvements are welcome through GitHub issues.

## License

Copyright (c) 2025 Nick Bevins. All rights reserved.

## Deployment

The app can be deployed to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- Or any web server

Simply upload all files to your hosting provider's web root directory.