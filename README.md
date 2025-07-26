# 🎾 Jester

A Progressive Web App for generating balanced tennis doubles matches from your player roster.

## Features

- **Player Management**: Add, edit, and manage your tennis player roster
- **Smart Match Generation**: Create balanced doubles matches with customizable preferences
- **Multiple Match Types**: Supports doubles, singles, and Canadian doubles (2v1)
- **Flexible Options**: 
  - Gender preferences (mixed, same-gender, or any)
  - Skill balancing (random, individual similarity, or team balance)
  - Fixed teammate pairs
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
2. Set number of courts available
3. Choose preferences:
   - **Gender**: Any, Mixed (male/female pairs), or Same gender
   - **Matched Skill**: Random, Individual (similar skills), or Team (balanced teams)
4. Use Advanced Settings for fixed teammate pairs
5. Click "Generate Matches"

### Advanced Features
- **Fixed Teams**: Create permanent partnerships in Advanced Settings
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

## Match Generation Algorithm

The app uses sophisticated algorithms to create balanced matches following this logic:

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
   - **Random**: Any gender combination
3. **Skill Balancing**:
   - **Similar**: Groups players with similar individual skill levels
   - **Random**: Completely random team selection
   - **Balanced**: Used for match pairing (see below)

### Match Pairing
- **Random Skill**: Teams are randomly shuffled before pairing into matches
- **Balanced Skill**: Teams are sorted by total team skill and paired with similar skill opponents
- **Court Assignment**: All matches get randomized court numbers (fixed teams don't cluster)

### Special Matches
- **3 Players**: Canadian doubles (2 vs 1)
- **2 Players**: Singles match
- **1 Player**: Sits out

### Key Features
- **True Randomization**: Fisher-Yates shuffle algorithm
- **Fixed Team Distribution**: Prevents clustering on early courts
- **Fallback Logic**: Graceful handling when preferred gender combinations aren't possible
- **Smart Court Usage**: Maximizes player participation within court constraints

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