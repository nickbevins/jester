# 🎾 Jester

A Progressive Web App for generating balanced tennis matches (singles and doubles) from your player roster.

## Features

- **Player Management**: Add, edit, and manage your tennis player roster
- **Singles & Doubles Modes**: Choose between 1v1 singles or 2v2 doubles matches
- **Smart Match Generation**: Create balanced matches with customizable preferences
- **Multiple Match Types**: Supports doubles, singles, and Canadian doubles (2v1)
- **Flexible Options**: 
  - Match mode (singles or doubles)
  - Gender preferences (mixed, same-gender, or any)
  - Skill balancing (random, individual similarity, or team balance)
  - Fixed teammate pairs (doubles mode only)
- **CSV Import/Export**: Share and backup your player rosters
- **Mobile Optimized**: Responsive design with dark theme
- **Offline Support**: Works without internet connection (PWA)

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

#### Singles Mode Options
- **Gender**:
  - **Any**: Players can face any opponent regardless of gender
  - **Same**: Males play only males, females play only females
  - Mixed option is disabled (not applicable to 1v1 matches)
- **Skill**:
  - **Random**: Completely random opponent pairing
  - **Individual**: Attempts to match players within 1 skill level
  - Team option is disabled (not applicable to singles)

### Advanced Features
- **Fixed Teams**: Create permanent partnerships in Advanced Settings (doubles mode only)
- **Bulk Operations**: Select/clear all players quickly
- **CSV Export/Import**: Share rosters between devices or backup data

## Technical Details

- **Technology**: Vanilla HTML5, CSS3, JavaScript (no dependencies)
- **Storage**: Browser localStorage for offline data persistence
- **PWA Features**: Service worker for offline functionality, installable
- **Compatibility**: Works on iOS, Android, and desktop browsers

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
3. **Skill Balancing**:
   - **Individual**: Groups players with similar individual skill levels
   - **Random**: Completely random team selection
   - **Team**: Used for match pairing (see below)

### Match Pairing
- **Random/Individual Skill**: Teams are randomly shuffled before pairing into matches
- **Team Skill**: Teams are sorted by total team skill and paired with similar skill opponents
- **Court Assignment**: All matches get randomized court numbers (fixed teams don't cluster)

### Special Matches (Doubles Mode Only)
- **3 Players**: Canadian doubles (2 vs 1)
- **2 Players**: Singles match
- **1 Player**: Sits out

## Key Algorithm Features
- **True Randomization**: Fisher-Yates shuffle algorithm
- **Optimal Skill Matching**: Sophisticated pairing logic for individual skill preferences
- **Fixed Team Distribution**: Prevents clustering on early courts (doubles only)
- **Fallback Logic**: Graceful handling when preferred gender combinations aren't possible
- **Smart Court Usage**: Maximizes player participation within court constraints
- **Gender Balance**: Intelligent distribution when using "same gender" filtering

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