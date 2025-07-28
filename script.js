/*
 * Jester
 * Copyright (c) 2025 Nick Bevins. All rights reserved.
 */

class Jester {
    constructor() {
        this.players = this.loadPlayers();
        this.editMode = false;
        this.fixedTeams = this.loadFixedTeams();
        this.timer = {
            duration: 0,
            remaining: 0,
            isRunning: false,
            isPaused: false,
            intervalId: null,
            alerts: {
                twoMin: false,
                oneMin: false
            }
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderPlayers();
        this.initializeCourtSelection();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Add player form
        document.getElementById('add-player-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPlayer();
        });

        // Roster controls
        document.getElementById('select-all-btn').addEventListener('click', () => this.selectAllPlayers());
        document.getElementById('clear-all-btn').addEventListener('click', () => this.clearAllPlayers());
        document.getElementById('edit-mode-btn').addEventListener('click', () => this.toggleEditMode());

        // Option button groups
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectOption(e.target));
        });

        // Court button selection
        document.querySelectorAll('.court-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectCourt(e.target));
        });

        // Court text input
        document.getElementById('courts-count').addEventListener('input', () => this.onCourtInputChange());
        document.getElementById('courts-count').addEventListener('focus', () => this.onCourtInputChange());

        // Generate matches
        document.getElementById('generate-matches-btn').addEventListener('click', () => this.generateMatches());
        
        // Advanced settings
        document.getElementById('advanced-toggle-btn').addEventListener('click', () => this.toggleAdvancedPanel());
        document.getElementById('add-fixed-team-btn').addEventListener('click', () => this.addFixedTeam());
        
        // Import/Export
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('import-csv-btn').addEventListener('click', () => this.triggerImportCSV());
        document.getElementById('import-csv-input').addEventListener('change', (e) => this.importFromCSV(e));
        
        // Timer controls
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setTimerPreset(parseInt(e.target.dataset.minutes)));
        });
        document.getElementById('start-timer-btn').addEventListener('click', () => this.startTimer());
        document.getElementById('pause-timer-btn').addEventListener('click', () => this.pauseTimer());
        document.getElementById('stop-timer-btn').addEventListener('click', () => this.stopTimer());
        
        // Alert customization controls
        document.getElementById('alert-volume').addEventListener('input', (e) => this.updateVolumeDisplay(e.target.value));
        document.getElementById('test-sound-btn').addEventListener('click', () => this.testSound());
        document.getElementById('test-vibration-btn').addEventListener('click', () => this.testVibration());
    }

    selectOption(button) {
        const option = button.dataset.option;
        const value = button.dataset.value;
        
        // Remove active from siblings
        button.parentNode.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active to clicked button
        button.classList.add('active');
        
        // Handle mode changes
        if (option === 'mode') {
            this.handleModeChange(value);
        }
    }

    handleModeChange(mode) {
        const genderButtons = document.querySelectorAll('.option-btn[data-option="gender"]');
        const skillButtons = document.querySelectorAll('.option-btn[data-option="skill"]');
        
        if (mode === 'singles') {
            // Disable mixed gender and team skill options for singles
            genderButtons.forEach(btn => {
                if (btn.dataset.value === 'mixed') {
                    btn.disabled = true;
                    btn.classList.add('disabled');
                    if (btn.classList.contains('active')) {
                        btn.classList.remove('active');
                        // Default to 'same' for singles
                        const sameBtn = document.querySelector('.option-btn[data-option="gender"][data-value="same"]');
                        if (sameBtn) sameBtn.classList.add('active');
                    }
                }
            });
            
            skillButtons.forEach(btn => {
                if (btn.dataset.value === 'balanced') {
                    btn.disabled = true;
                    btn.classList.add('disabled');
                    if (btn.classList.contains('active')) {
                        btn.classList.remove('active');
                        // Default to 'similar' for singles
                        const similarBtn = document.querySelector('.option-btn[data-option="skill"][data-value="similar"]');
                        if (similarBtn) similarBtn.classList.add('active');
                    }
                }
            });
        } else {
            // Re-enable all options for doubles
            genderButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('disabled');
            });
            
            skillButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('disabled');
            });
        }
    }

    selectCourt(button) {
        const courtNumber = button.dataset.court;
        
        // Remove active from all court buttons
        document.querySelectorAll('.court-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active to clicked button
        button.classList.add('active');
        
        // Clear the custom input when a button is selected
        document.getElementById('courts-count').value = '';
    }

    onCourtInputChange() {
        // Clear all button selections when text input is used
        document.querySelectorAll('.court-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    initializeCourtSelection() {
        // Check if text input has a value on page load
        const textInput = document.getElementById('courts-count');
        if (textInput.value) {
            // Clear any active buttons since text input has priority
            document.querySelectorAll('.court-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
    }

    getCourtsCount() {
        // Prioritize text input if it has a value
        const customValue = document.getElementById('courts-count').value;
        if (customValue && customValue.trim() !== '') {
            return parseInt(customValue);
        }
        
        // Otherwise check if a court button is active
        const activeCourtBtn = document.querySelector('.court-btn.active');
        if (activeCourtBtn) {
            return parseInt(activeCourtBtn.dataset.court);
        }
        
        // Default to 1 if nothing is selected
        return 1;
    }

    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    addPlayer() {
        const name = document.getElementById('player-name').value.trim();
        const gender = document.getElementById('player-gender').value;
        const skill = parseFloat(document.getElementById('player-skill').value);

        if (!name || !gender || !skill) {
            alert('Please fill in all fields');
            return;
        }

        const player = {
            id: Date.now(),
            name,
            gender,
            skill,
            active: true
        };

        this.players.push(player);
        this.savePlayers();
        this.renderPlayers();

        // Clear form
        document.getElementById('add-player-form').reset();
    }

    deletePlayer(playerId) {
        if (confirm('Are you sure you want to delete this player?')) {
            this.players = this.players.filter(p => p.id !== playerId);
            this.savePlayers();
            this.renderPlayers();
        }
    }

    togglePlayerActive(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.active = !player.active;
            this.savePlayers();
            this.renderPlayers();
        }
    }

    selectAllPlayers() {
        this.players.forEach(player => player.active = true);
        this.savePlayers();
        this.renderPlayers();
    }

    clearAllPlayers() {
        this.players.forEach(player => player.active = false);
        this.savePlayers();
        this.renderPlayers();
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        const btn = document.getElementById('edit-mode-btn');
        btn.textContent = this.editMode ? 'View Mode' : 'Edit Mode';
        btn.style.background = this.editMode ? '#ff9800' : '';
        this.renderPlayers();
    }

    updatePlayer(playerId, field, value) {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            if (field === 'skill') {
                player[field] = parseFloat(value);
            } else {
                player[field] = value;
            }
            this.savePlayers();
        }
    }

    toggleAdvancedPanel() {
        const panel = document.getElementById('advanced-panel');
        const btn = document.getElementById('advanced-toggle-btn');
        const isVisible = panel.style.display !== 'none';
        
        panel.style.display = isVisible ? 'none' : 'block';
        btn.textContent = isVisible ? '⚙️ Advanced Settings' : '⚙️ Hide Advanced';
        
        if (!isVisible) {
            this.renderFixedTeams();
        }
    }

    addFixedTeam() {
        const activePlayers = this.players.filter(p => p.active);
        if (activePlayers.length < 2) {
            alert('Need at least 2 active players to create a fixed team');
            return;
        }

        const newTeam = {
            id: Date.now(),
            players: []
        };
        
        this.fixedTeams.push(newTeam);
        this.saveFixedTeams();
        this.renderFixedTeams();
    }

    removeFixedTeam(teamId) {
        this.fixedTeams = this.fixedTeams.filter(t => t.id !== teamId);
        this.saveFixedTeams();
        this.renderFixedTeams();
    }

    updateFixedTeam(teamId, playerIds) {
        const team = this.fixedTeams.find(t => t.id === teamId);
        if (team) {
            team.players = playerIds;
            this.saveFixedTeams();
        }
    }

    renderFixedTeams() {
        const container = document.getElementById('fixed-teams-list');
        const activePlayers = this.players.filter(p => p.active);
        
        if (this.fixedTeams.length === 0) {
            container.innerHTML = '<div class="empty-state">No fixed teams created</div>';
            return;
        }

        container.innerHTML = this.fixedTeams.map(team => `
            <div class="fixed-team">
                <div class="fixed-team-header">
                    <span>Fixed Team ${this.fixedTeams.indexOf(team) + 1}</span>
                    <button class="remove-team-btn" onclick="app.removeFixedTeam(${team.id})">×</button>
                </div>
                <div class="player-selectors">
                    <select onchange="app.updateFixedTeamPlayer(${team.id}, 0, this.value)">
                        <option value="">Select Player 1</option>
                        ${activePlayers.map(p => `
                            <option value="${p.id}" ${team.players[0] == p.id ? 'selected' : ''}>${p.name}</option>
                        `).join('')}
                    </select>
                    <select onchange="app.updateFixedTeamPlayer(${team.id}, 1, this.value)">
                        <option value="">Select Player 2</option>
                        ${activePlayers.map(p => `
                            <option value="${p.id}" ${team.players[1] == p.id ? 'selected' : ''}>${p.name}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
        `).join('');
    }

    updateFixedTeamPlayer(teamId, index, playerId) {
        const team = this.fixedTeams.find(t => t.id === teamId);
        if (team) {
            if (!team.players) team.players = [];
            team.players[index] = playerId ? parseInt(playerId) : null;
            this.saveFixedTeams();
        }
    }

    loadFixedTeams() {
        const saved = localStorage.getItem('tennis-fixed-teams');
        return saved ? JSON.parse(saved) : [];
    }

    saveFixedTeams() {
        localStorage.setItem('tennis-fixed-teams', JSON.stringify(this.fixedTeams));
    }

    exportToCSV() {
        if (this.players.length === 0) {
            alert('No players to export');
            return;
        }

        // Create CSV content
        const headers = ['Name', 'Gender', 'Skill Level', 'Active'];
        const csvContent = [
            headers.join(','),
            ...this.players.map(player => [
                `"${player.name}"`,
                player.gender,
                player.skill,
                player.active ? 'true' : 'false'
            ].join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5); // YYYY-MM-DDTHH-MM-SS
        link.setAttribute('download', `tennis-roster-${timestamp}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    triggerImportCSV() {
        document.getElementById('import-csv-input').click();
    }

    importFromCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csvContent = e.target.result;
                const lines = csvContent.split('\n');
                
                // Skip header row
                const dataLines = lines.slice(1).filter(line => line.trim());
                
                if (dataLines.length === 0) {
                    alert('No player data found in CSV file');
                    return;
                }

                // Ask user if they want to replace or merge
                const replace = confirm(
                    `Import ${dataLines.length} players from CSV?\n\n` +
                    'OK = Replace current roster\n' +
                    'Cancel = Merge with current roster'
                );

                const importedPlayers = [];
                let errorCount = 0;

                dataLines.forEach((line, index) => {
                    try {
                        const values = this.parseCSVLine(line);
                        if (values.length >= 4) {
                            const player = {
                                id: Date.now() + index,
                                name: values[0].replace(/^"(.*)"$/, '$1'), // Remove quotes
                                gender: values[1].toLowerCase(),
                                skill: parseFloat(values[2]),
                                active: values[3].toLowerCase() === 'true'
                            };

                            // Validate data
                            if (player.name && 
                                (player.gender === 'male' || player.gender === 'female') && 
                                player.skill >= 1 && player.skill <= 5) {
                                importedPlayers.push(player);
                            } else {
                                errorCount++;
                            }
                        } else {
                            errorCount++;
                        }
                    } catch (error) {
                        errorCount++;
                    }
                });

                if (importedPlayers.length === 0) {
                    alert('No valid players found in CSV file');
                    return;
                }

                // Update roster
                if (replace) {
                    this.players = importedPlayers;
                } else {
                    this.players.push(...importedPlayers);
                }

                this.savePlayers();
                this.renderPlayers();

                let message = `Successfully imported ${importedPlayers.length} players`;
                if (errorCount > 0) {
                    message += `\n${errorCount} rows had errors and were skipped`;
                }
                alert(message);

            } catch (error) {
                alert('Error reading CSV file. Please check the format.');
                console.error('CSV import error:', error);
            }
        };

        reader.readAsText(file);
        
        // Clear the input so the same file can be selected again
        event.target.value = '';
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
                current += char;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current.trim());
        return values;
    }


    renderPlayers() {
        const container = document.getElementById('players-list');
        
        // Update player count display
        const activeCount = this.players.filter(p => p.active).length;
        const totalCount = this.players.length;
        document.getElementById('player-count').textContent = `${activeCount}/${totalCount} selected`;
        
        if (this.players.length === 0) {
            container.innerHTML = '<div class="empty-state">No players added yet</div>';
            return;
        }

        // Sort players alphabetically by name
        const sortedPlayers = [...this.players].sort((a, b) => a.name.localeCompare(b.name));
        
        container.innerHTML = sortedPlayers.map(player => {
            if (this.editMode) {
                return `
                <div class="player-item ${player.active ? 'active' : ''}">
                    <input type="checkbox" class="player-checkbox" 
                           ${player.active ? 'checked' : ''} 
                           onchange="app.togglePlayerActive(${player.id})">
                    <div class="player-info">
                        <input type="text" class="edit-name" value="${player.name}" 
                               onchange="app.updatePlayer(${player.id}, 'name', this.value)">
                        <div class="player-edit-controls">
                            <select class="edit-gender" onchange="app.updatePlayer(${player.id}, 'gender', this.value)">
                                <option value="male" ${player.gender === 'male' ? 'selected' : ''}>Male</option>
                                <option value="female" ${player.gender === 'female' ? 'selected' : ''}>Female</option>
                            </select>
                            <select class="edit-skill" onchange="app.updatePlayer(${player.id}, 'skill', this.value)">
                                <option value="1" ${player.skill == 1 ? 'selected' : ''}>1.0</option>
                                <option value="1.5" ${player.skill == 1.5 ? 'selected' : ''}>1.5</option>
                                <option value="2" ${player.skill == 2 ? 'selected' : ''}>2.0</option>
                                <option value="2.5" ${player.skill == 2.5 ? 'selected' : ''}>2.5</option>
                                <option value="3" ${player.skill == 3 ? 'selected' : ''}>3.0</option>
                                <option value="3.5" ${player.skill == 3.5 ? 'selected' : ''}>3.5</option>
                                <option value="4" ${player.skill == 4 ? 'selected' : ''}>4.0</option>
                                <option value="4.5" ${player.skill == 4.5 ? 'selected' : ''}>4.5</option>
                                <option value="5" ${player.skill == 5 ? 'selected' : ''}>5.0</option>
                            </select>
                        </div>
                    </div>
                    <button class="delete-btn" onclick="app.deletePlayer(${player.id})">Delete</button>
                </div>
                `;
            } else {
                return `
                <div class="player-item ${player.active ? 'active' : ''}">
                    <input type="checkbox" class="player-checkbox" 
                           ${player.active ? 'checked' : ''} 
                           onchange="app.togglePlayerActive(${player.id})">
                    <div class="player-info">
                        <div class="player-name">${player.name}</div>
                        <div class="player-details">
                            <span class="skill-badge">Skill: ${player.skill}</span>
                            <span class="gender-badge">${player.gender}</span>
                        </div>
                    </div>
                </div>
                `;
            }
        }).join('');
    }

    generateMatches() {
        const activePlayers = this.players.filter(p => p.active);
        const courtsCount = this.getCourtsCount();
        
        // Get selected options from button groups
        const modeElement = document.querySelector('.option-btn[data-option="mode"].active');
        const genderElement = document.querySelector('.option-btn[data-option="gender"].active');
        const skillElement = document.querySelector('.option-btn[data-option="skill"].active');
        
        if (!modeElement || !genderElement || !skillElement) {
            alert('Please make sure all options are selected');
            return;
        }
        
        const mode = modeElement.dataset.value;
        const genderFilter = genderElement.dataset.value;
        const skillBalance = skillElement.dataset.value;

        if (mode === 'singles') {
            if (activePlayers.length < 2) {
                alert('Need at least 2 active players for singles matches');
                return;
            }
            const result = this.createSinglesMatches(activePlayers, courtsCount, genderFilter, skillBalance);
            this.renderMatches(result.matches, result.sittingPlayers);
        } else {
            if (activePlayers.length < 4) {
                alert('Need at least 4 active players to generate doubles matches');
                return;
            }
            // Calculate max courts we can use (allowing for special matches with 2-3 players)
            const maxRegularMatches = Math.floor(activePlayers.length / 4);
            const remainingPlayers = activePlayers.length % 4;
            
            // If we have 2-3 remaining players, we can use one more court for special match
            const canUseExtraCourt = remainingPlayers >= 2;
            const maxPossibleCourts = maxRegularMatches + (canUseExtraCourt ? 1 : 0);
            
            const actualCourts = Math.min(courtsCount, maxPossibleCourts);

            if (actualCourts === 0) {
                alert('Not enough players for any matches');
                return;
            }

            const result = this.createMatches(activePlayers, actualCourts, genderFilter, skillBalance);
            this.renderMatches(result.matches, result.sittingPlayers);
        }
    }

    createMatches(players, courtsCount, genderFilter, skillBalance) {
        const matches = [];
        let sittingPlayers = [];
        
        if (courtsCount * 4 >= players.length) {
            // We have enough court capacity for everyone
            if (players.length % 4 === 0) {
                // Perfect for doubles only
                matches.push(...this.createAllDoublesMatches(players, courtsCount, genderFilter, skillBalance));
            } else {
                // Need special court for leftover players
                const doublesPlayerCount = Math.floor(players.length / 4) * 4;
                const doublesPlayers = this.randomSelectPlayers(players, doublesPlayerCount);
                const specialPlayers = players.filter(p => !doublesPlayers.some(dp => dp.id === p.id));
                
                // Create doubles matches
                matches.push(...this.createAllDoublesMatches(doublesPlayers, Math.floor(doublesPlayerCount / 4), genderFilter, skillBalance));
                
                // Handle special court
                if (specialPlayers.length >= 2) {
                    matches.push(this.createSpecialMatch(specialPlayers, matches.length + 1));
                } else if (specialPlayers.length === 1) {
                    sittingPlayers.push(...specialPlayers);
                }
            }
        } else {
            // Not enough court capacity - randomly select players
            const selectedPlayers = this.randomSelectPlayers(players, courtsCount * 4);
            sittingPlayers = players.filter(p => !selectedPlayers.some(sp => sp.id === p.id));
            matches.push(...this.createAllDoublesMatches(selectedPlayers, courtsCount, genderFilter, skillBalance));
        }
        
        return { matches, sittingPlayers };
    }

    createSinglesMatches(players, courtsCount, genderFilter, skillBalance) {
        const matches = [];
        let sittingPlayers = [];
        
        const maxPlayersNeeded = courtsCount * 2;
        
        if (maxPlayersNeeded >= players.length) {
            // Enough court capacity for all or most players
            if (players.length % 2 === 0) {
                // Even number of players - create matches from all players
                const playingPlayers = [...players];
                matches.push(...this.createSinglesMatchesFromPlayers(playingPlayers, courtsCount, genderFilter, skillBalance));
            } else {
                // Odd number of players - randomly exclude one to sit
                const shuffled = this.shuffleArray([...players]);
                sittingPlayers.push(shuffled.pop());
                const playingPlayers = shuffled;
                matches.push(...this.createSinglesMatchesFromPlayers(playingPlayers, courtsCount, genderFilter, skillBalance));
            }
        } else {
            // Not enough court capacity - randomly select players
            const selectedPlayers = this.randomSelectPlayers(players, maxPlayersNeeded);
            sittingPlayers = players.filter(p => !selectedPlayers.some(sp => sp.id === p.id));
            matches.push(...this.createSinglesMatchesFromPlayers(selectedPlayers, courtsCount, genderFilter, skillBalance));
        }
        
        return { matches, sittingPlayers };
    }

    createSinglesMatchesFromPlayers(players, courtsCount, genderFilter, skillBalance) {
        const matches = [];
        let remainingPlayers = [...players];
        
        if (genderFilter === 'same') {
            // Try to create same-gender matches first, then be flexible
            const males = remainingPlayers.filter(p => p.gender === 'male');
            const females = remainingPlayers.filter(p => p.gender === 'female');
            
            // Create matches from each gender pool
            matches.push(...this.createMatchesFromPool(males, skillBalance));
            matches.push(...this.createMatchesFromPool(females, skillBalance));
            
            // If we haven't filled all courts and have leftover players from different genders,
            // loosen the rules and create mixed matches to utilize courts
            if (matches.length < courtsCount) {
                const usedPlayerIds = new Set();
                matches.forEach(match => {
                    usedPlayerIds.add(match.team1[0].id);
                    usedPlayerIds.add(match.team2[0].id);
                });
                
                const unusedPlayers = remainingPlayers.filter(p => !usedPlayerIds.has(p.id));
                
                // Create additional matches from unused players (loosening gender rules)
                const additionalMatches = this.createMatchesFromPool(unusedPlayers, skillBalance);
                matches.push(...additionalMatches);
            }
        } else {
            // 'any' gender - create matches from all players
            matches.push(...this.createMatchesFromPool(remainingPlayers, skillBalance));
        }
        
        // Limit to available courts and randomize court assignments
        const finalMatches = matches.slice(0, courtsCount);
        const shuffledMatches = this.shuffleArray(finalMatches);
        shuffledMatches.forEach((match, index) => {
            match.court = index + 1;
        });
        
        return shuffledMatches;
    }

    createMatchesFromPool(poolPlayers, skillBalance) {
        const matches = [];
        let players = [...poolPlayers];
        
        // Create matches from this pool
        while (players.length >= 2) {
            let player1, player2;
            
            if (skillBalance === 'similar') {
                // Match players with similar skills
                const matchPair = this.findBestSkillPair(players);
                if (matchPair) {
                    [player1, player2] = matchPair;
                } else {
                    // Fallback to random if no similar match found
                    const shuffled = this.shuffleArray(players);
                    player1 = shuffled[0];
                    player2 = shuffled[1];
                }
            } else {
                // Random skill - just randomly pair players
                const shuffled = this.shuffleArray(players);
                player1 = shuffled[0];
                player2 = shuffled[1];
            }
            
            matches.push({
                team1: [player1],
                team2: [player2],
                type: 'singles'
            });
            
            // Remove both players from the pool
            players = players.filter(p => p.id !== player1.id && p.id !== player2.id);
        }
        
        return matches;
    }

    findBestSkillPair(players) {
        if (players.length < 2) return null;
        
        // Shuffle players first to add variety, then sort by skill
        const shuffled = this.shuffleArray(players);
        const sorted = shuffled.sort((a, b) => a.skill - b.skill);
        
        // Randomly pick a starting player from the first few to add variety
        const startIndex = Math.floor(Math.random() * Math.min(3, sorted.length));
        const player1 = sorted[startIndex];
        
        // Find all players within 1 skill level
        const validMatches = sorted.filter(p => 
            p.id !== player1.id && Math.abs(p.skill - player1.skill) <= 1.0
        );
        
        if (validMatches.length > 0) {
            // Randomly pick from valid matches to add variety
            const randomIndex = Math.floor(Math.random() * validMatches.length);
            return [player1, validMatches[randomIndex]];
        } else {
            // Fallback: find the closest skill match
            let bestMatch = sorted.find(p => p.id !== player1.id);
            let bestSkillDiff = Math.abs(player1.skill - bestMatch.skill);
            
            for (const player of sorted) {
                if (player.id === player1.id) continue;
                const skillDiff = Math.abs(player1.skill - player.skill);
                if (skillDiff < bestSkillDiff) {
                    bestMatch = player;
                    bestSkillDiff = skillDiff;
                }
            }
            
            return [player1, bestMatch];
        }
    }



    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createAllDoublesMatches(players, courtsCount, genderFilter, skillBalance) {
        const allTeams = [];
        
        // Get valid fixed teams first
        const fixedTeams = this.getValidFixedTeams(players);
        
        // Remove fixed team players from available pool
        let availablePlayers = [...players];
        for (const fixedTeam of fixedTeams) {
            availablePlayers = availablePlayers.filter(p => 
                !fixedTeam.some(fp => fp.id === p.id)
            );
        }
        
        // Create teams from remaining players following gender and skill rules
        const generatedTeams = this.createTeamsFromPlayers(availablePlayers, genderFilter, skillBalance);
        
        // Combine fixed and generated teams, distributing fixed teams to avoid clustering
        const combinedTeams = this.distributeFixedTeams(fixedTeams, generatedTeams);
        
        // Create matches based on skill balance setting
        const matches = this.pairTeamsIntoMatches(combinedTeams, skillBalance);
        
        // Randomize court assignments
        return this.randomizeCourtAssignments(matches);
    }

    createTeamsFromPlayers(availablePlayers, genderFilter, skillBalance) {
        const teams = [];
        let players = [...availablePlayers];
        
        while (players.length >= 2) {
            let team = null;
            
            if (genderFilter === 'mixed') {
                team = this.createMixedTeam(players, skillBalance);
            } else if (genderFilter === 'same') {
                team = this.createSameGenderTeam(players, skillBalance);
            }
            
            // Fallback to random if preferred gender filter fails
            if (!team || team.length !== 2) {
                team = this.createRandomTeam(players, skillBalance);
            }
            
            if (team && team.length === 2) {
                teams.push(team);
                players = players.filter(p => !team.some(tp => tp.id === p.id));
            } else {
                break;
            }
        }
        
        return teams;
    }

    distributeFixedTeams(fixedTeams, generatedTeams) {
        const allTeams = [];
        const fixedCount = fixedTeams.length;
        const generatedCount = generatedTeams.length;
        const totalTeams = fixedCount + generatedCount;
        
        // If no fixed teams, just return generated teams
        if (fixedCount === 0) {
            return generatedTeams;
        }
        
        // Distribute fixed teams evenly throughout the list
        let fixedIndex = 0;
        let generatedIndex = 0;
        
        for (let i = 0; i < totalTeams; i++) {
            const shouldPlaceFixed = fixedIndex < fixedCount && 
                (generatedIndex >= generatedCount || 
                 (i * fixedCount / totalTeams) >= fixedIndex);
            
            if (shouldPlaceFixed) {
                allTeams.push(fixedTeams[fixedIndex]);
                fixedIndex++;
            } else {
                allTeams.push(generatedTeams[generatedIndex]);
                generatedIndex++;
            }
        }
        
        return allTeams;
    }

    pairTeamsIntoMatches(teams, skillBalance) {
        const matches = [];
        
        if (skillBalance === 'balanced') {
            // For balanced skill, pair teams with similar total skill
            const teamsWithSkill = teams.map(team => ({
                team: team,
                totalSkill: team.reduce((sum, player) => sum + player.skill, 0)
            }));
            
            // Sort by skill
            teamsWithSkill.sort((a, b) => a.totalSkill - b.totalSkill);
            
            // Pair adjacent teams (similar skill levels)
            for (let i = 0; i < teamsWithSkill.length - 1; i += 2) {
                matches.push({
                    court: matches.length + 1,
                    team1: teamsWithSkill[i].team,
                    team2: teamsWithSkill[i + 1].team,
                    type: 'doubles'
                });
            }
        } else {
            // For random, shuffle teams first then pair sequentially
            const shuffledTeams = [...teams];
            for (let i = shuffledTeams.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
            }
            
            // Pair shuffled teams
            for (let i = 0; i < shuffledTeams.length - 1; i += 2) {
                matches.push({
                    court: matches.length + 1,
                    team1: shuffledTeams[i],
                    team2: shuffledTeams[i + 1],
                    type: 'doubles'
                });
            }
        }
        
        return matches;
    }

    randomizeCourtAssignments(matches) {
        const shuffledMatches = [...matches];
        for (let i = shuffledMatches.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledMatches[i], shuffledMatches[j]] = [shuffledMatches[j], shuffledMatches[i]];
        }
        
        // Reassign court numbers sequentially
        shuffledMatches.forEach((match, index) => {
            match.court = index + 1;
        });
        
        return shuffledMatches;
    }

    createSpecialMatch(players, courtNumber) {
        if (players.length === 3) {
            // Canadian doubles - 2 vs 1
            const shuffled = [...players];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return {
                court: courtNumber,
                team1: shuffled.slice(0, 2),
                team2: [shuffled[2]],
                type: 'canadian'
            };
        } else if (players.length === 2) {
            // Singles
            return {
                court: courtNumber,
                team1: [players[0]],
                team2: [players[1]],
                type: 'singles'
            };
        }
        return null;
    }

    selectPlayingPlayers(players, maxPlayers, genderFilter, skillBalance) {
        if (players.length <= maxPlayers) {
            // Everyone can play
            return [...players];
        }
        
        // Always use random selection for fairness - skill preferences only apply to team formation
        const shuffled = [...players];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, maxPlayers);
    }

    randomSelectPlayers(players, count) {
        if (players.length <= count) {
            return [...players];
        }
        
        // Random selection using Fisher-Yates shuffle
        const shuffled = [...players];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }

    createRandomTeam(availablePlayers, skillBalance) {
        if (availablePlayers.length >= 2) {
            return this.selectBySkill(availablePlayers, 2, skillBalance);
        }
        return null;
    }

    createMixedTeam(availablePlayers, skillBalance) {
        const males = availablePlayers.filter(p => p.gender === 'male');
        const females = availablePlayers.filter(p => p.gender === 'female');
        
        if (males.length > 0 && females.length > 0) {
            const selectedMale = this.selectBySkill(males, 1, skillBalance)[0];
            const selectedFemale = this.selectBySkill(females, 1, skillBalance)[0];
            return [selectedMale, selectedFemale];
        }
        
        return null;
    }

    createSameGenderTeam(availablePlayers, skillBalance) {
        const males = availablePlayers.filter(p => p.gender === 'male');
        const females = availablePlayers.filter(p => p.gender === 'female');
        
        if (males.length >= 2) {
            return this.selectBySkill(males, 2, skillBalance);
        } else if (females.length >= 2) {
            return this.selectBySkill(females, 2, skillBalance);
        }
        
        return null;
    }

    createBalancedMatches(teams) {
        const matches = [];
        const availableTeams = [...teams];
        
        // Calculate team totals and sort by skill
        const teamsWithSkills = availableTeams.map(team => ({
            team: team,
            totalSkill: team.reduce((sum, player) => sum + player.skill, 0)
        })).sort((a, b) => a.totalSkill - b.totalSkill);
        
        // Pair teams to minimize skill difference
        while (teamsWithSkills.length >= 2) {
            const team1Data = teamsWithSkills.shift();
            
            // Find the best match for team1 (closest skill total)
            let bestMatchIndex = 0;
            let smallestDiff = Infinity;
            
            for (let i = 0; i < teamsWithSkills.length; i++) {
                const diff = Math.abs(team1Data.totalSkill - teamsWithSkills[i].totalSkill);
                if (diff < smallestDiff) {
                    smallestDiff = diff;
                    bestMatchIndex = i;
                }
            }
            
            const team2Data = teamsWithSkills.splice(bestMatchIndex, 1)[0];
            
            matches.push({
                team1: team1Data.team,
                team2: team2Data.team,
                type: 'doubles'
            });
        }
        
        return matches;
    }

    calculateMaxCapacity(playerCount, courtsCount) {
        // Calculate the maximum players that can be accommodated
        const maxDoublesCourts = courtsCount;
        const maxDoublesPlayers = maxDoublesCourts * 4;
        
        // If we have fewer players than max doubles capacity, everyone can play
        if (playerCount <= maxDoublesPlayers) {
            return playerCount;
        }
        
        // If we have more players, we need to optimize court usage
        // Try different combinations of doubles and special matches
        for (let doubleCourts = courtsCount; doubleCourts >= 0; doubleCourts--) {
            const specialCourts = courtsCount - doubleCourts;
            const doublesPlayers = doubleCourts * 4;
            
            // Special courts can handle 2-3 players each
            const maxSpecialPlayers = specialCourts * 3; // Maximum case
            const minSpecialPlayers = specialCourts * 2; // Minimum case
            
            const maxCapacity = doublesPlayers + maxSpecialPlayers;
            const minCapacity = doublesPlayers + minSpecialPlayers;
            
            if (playerCount >= minCapacity && playerCount <= maxCapacity) {
                return playerCount; // Everyone can play
            }
        }
        
        // Fallback to maximum possible
        return maxDoublesPlayers + (courtsCount - maxDoublesCourts) * 3;
    }

    createDoublesMatches(playingPlayers, fixedTeams, courtsCount, genderFilter, skillBalance, sittingPlayers) {
        const allMatches = [];
        
        // Create a combined pool of all teams (fixed + generated)
        const allTeams = [];
        
        // Add fixed teams to the pool
        allTeams.push(...fixedTeams);
        
        // Remove fixed team players from available pool
        let availablePlayers = [...playingPlayers];
        for (const fixedTeam of fixedTeams) {
            availablePlayers = availablePlayers.filter(p => 
                !fixedTeam.some(fp => fp.id === p.id)
            );
        }
        
        // Generate teams from remaining players and add to pool
        while (availablePlayers.length >= 2) {
            let team = null;
            
            if (genderFilter === 'mixed') {
                team = this.createMixedTeam(availablePlayers, skillBalance);
            } else if (genderFilter === 'same') {
                team = this.createSameGenderTeam(availablePlayers, skillBalance);
            } else {
                team = this.createRandomTeam(availablePlayers, skillBalance);
            }
            
            // If preferred team type fails, fall back to random
            if (!team || team.length !== 2) {
                team = this.createRandomTeam(availablePlayers, skillBalance);
            }
            
            // If we successfully created a team, add it and remove players
            if (team && team.length === 2) {
                allTeams.push(team);
                availablePlayers = availablePlayers.filter(p => 
                    !team.some(tp => tp.id === p.id)
                );
            } else {
                // Can't create any more teams, exit loop
                break;
            }
        }
        
        // Create matches using appropriate pairing method based on skill balance
        if (skillBalance === 'balanced') {
            // For balanced teams, try to match teams with similar total skill
            allMatches.push(...this.createBalancedMatches(allTeams));
        } else {
            // For random/similar individual skills, just randomly pair teams
            const shuffledTeams = [...allTeams];
            for (let i = shuffledTeams.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
            }
            
            // Create matches by pairing shuffled teams
            for (let i = 0; i < shuffledTeams.length - 1; i += 2) {
                const team1 = shuffledTeams[i];
                const team2 = shuffledTeams[i + 1];
                
                allMatches.push({
                    team1: team1,
                    team2: team2,
                    type: 'doubles'
                });
            }
        }
        
        // Randomly shuffle matches before assigning courts
        const shuffledMatches = [...allMatches];
        for (let i = shuffledMatches.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledMatches[i], shuffledMatches[j]] = [shuffledMatches[j], shuffledMatches[i]];
        }
        
        // Assign court numbers to matches
        const finalMatches = shuffledMatches.slice(0, courtsCount).map((match, index) => ({
            court: index + 1,
            team1: match.team1,
            team2: match.team2,
            type: match.type
        }));
        
        // Add any remaining players to sitting list
        sittingPlayers.push(...availablePlayers);
        
        // Add any leftover teams to sitting list
        if (shuffledTeams.length % 2 !== 0) {
            const leftoverTeam = shuffledTeams[shuffledTeams.length - 1];
            sittingPlayers.push(...leftoverTeam);
        }
        
        return {
            matches: finalMatches,
            sittingPlayers: sittingPlayers
        };
    }

    createMixedMatchesSimple(doublesPlayers, specialPlayers, courtsCount, genderFilter, skillBalance, sittingPlayers) {
        const matches = [];
        
        // Create doubles matches from doubles players
        if (doublesPlayers.length >= 4) {
            const selectedFixedTeams = this.getValidFixedTeams(doublesPlayers);
            const doublesResult = this.createDoublesMatches(
                doublesPlayers, 
                selectedFixedTeams, 
                Math.floor(doublesPlayers.length / 4), 
                genderFilter, 
                skillBalance, 
                []
            );
            matches.push(...doublesResult.matches);
        }
        
        // Create special match from special players
        if (specialPlayers.length >= 2) {
            const courtNumber = matches.length + 1;
            const specialFixedTeams = this.getValidFixedTeams(specialPlayers);
            
            if (specialPlayers.length === 3) {
                // Canadian doubles
                if (specialFixedTeams.length > 0) {
                    // Use fixed team as one side
                    const fixedTeam = specialFixedTeams[0];
                    const singlePlayer = specialPlayers.find(p => !fixedTeam.some(fp => fp.id === p.id));
                    matches.push({
                        court: courtNumber,
                        team1: fixedTeam,
                        team2: [singlePlayer],
                        type: 'canadian'
                    });
                } else {
                    // Random assignment
                    const shuffled = [...specialPlayers];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }
                    matches.push({
                        court: courtNumber,
                        team1: shuffled.slice(0, 2),
                        team2: [shuffled[2]],
                        type: 'canadian'
                    });
                }
            } else if (specialPlayers.length === 2) {
                // Singles (split fixed team if they ended up here)
                matches.push({
                    court: courtNumber,
                    team1: [specialPlayers[0]],
                    team2: [specialPlayers[1]],
                    type: 'singles'
                });
            }
        }
        
        return {
            matches: matches,
            sittingPlayers: sittingPlayers
        };
    }



    createOpponentTeam(availablePlayers, fixedTeam, genderFilter, skillBalance) {
        if (availablePlayers.length < 2) return null;
        
        // Try to create an appropriate opponent based on gender filter
        if (genderFilter === 'mixed') {
            return this.createMixedOpponent(availablePlayers, fixedTeam, skillBalance);
        } else if (genderFilter === 'same') {
            return this.createSameGenderOpponent(availablePlayers, fixedTeam, skillBalance);
        } else {
            // Random - just pick any 2 players
            return this.selectBySkill(availablePlayers, 2, skillBalance);
        }
    }

    createMixedOpponent(availablePlayers, fixedTeam, skillBalance) {
        const males = availablePlayers.filter(p => p.gender === 'male');
        const females = availablePlayers.filter(p => p.gender === 'female');
        
        // Try to create a mixed opponent team (1 male + 1 female)
        if (males.length > 0 && females.length > 0) {
            const selectedMale = this.selectBySkill(males, 1, skillBalance)[0];
            const selectedFemale = this.selectBySkill(females, 1, skillBalance)[0];
            return [selectedMale, selectedFemale];
        }
        
        // Fallback to any 2 players
        return this.selectBySkill(availablePlayers, 2, skillBalance);
    }

    createSameGenderOpponent(availablePlayers, fixedTeam, skillBalance) {
        const fixedGenders = fixedTeam.map(p => p.gender);
        const fixedGender = fixedGenders[0]; // Assume fixed team has consistent gender for same-gender mode
        
        // Try to find players of the same gender as the fixed team
        const sameGenderPlayers = availablePlayers.filter(p => p.gender === fixedGender);
        
        if (sameGenderPlayers.length >= 2) {
            return this.selectBySkill(sameGenderPlayers, 2, skillBalance);
        }
        
        // Fallback to any 2 players
        return this.selectBySkill(availablePlayers, 2, skillBalance);
    }

    createSingleMatch(availablePlayers, genderFilter, skillBalance) {
        if (availablePlayers.length < 4) return null;
        
        let selectedPlayers = null;
        
        // First try to select 4 players based on gender preference
        if (genderFilter === 'mixed') {
            selectedPlayers = this.selectMixedDoublesPlayers(availablePlayers, skillBalance);
        } else if (genderFilter === 'same') {
            selectedPlayers = this.selectSameGenderPlayers(availablePlayers, skillBalance);
        }
        
        // Fallback to random selection if preferred method fails
        if (!selectedPlayers) {
            selectedPlayers = this.selectBestAvailablePlayers(availablePlayers, skillBalance);
        }
        
        if (!selectedPlayers || selectedPlayers.length !== 4) return null;
        
        // Now form teams based on skill balance preference
        if (skillBalance === 'balanced') {
            return this.formTeams(selectedPlayers, skillBalance);
        } else {
            // For random or similar skills, create teams based on gender preference
            if (genderFilter === 'mixed') {
                return this.formMixedTeams(selectedPlayers, skillBalance);
            } else if (genderFilter === 'same') {
                return this.formSameGenderTeams(selectedPlayers, skillBalance);
            } else {
                return this.formTeams(selectedPlayers, skillBalance);
            }
        }
    }



    getValidFixedTeams(availablePlayers) {
        if (!this.fixedTeams || this.fixedTeams.length === 0) {
            return [];
        }
        
        const validTeams = [];
        for (const team of this.fixedTeams) {
            // Safety checks
            if (!team || !team.players || !Array.isArray(team.players)) {
                continue;
            }
            
            if (team.players.length !== 2) {
                continue;
            }
            
            // Check if both players are available
            const player1Id = team.players[0];
            const player2Id = team.players[1];
            
            if (!player1Id || !player2Id) {
                continue;
            }
            
            const player1 = availablePlayers.find(p => p.id === player1Id);
            const player2 = availablePlayers.find(p => p.id === player2Id);
            
            if (!player1 || !player2) {
                continue;
            }
            
            validTeams.push([player1, player2]);
        }
        
        return validTeams;
    }


    selectMixedDoublesPlayers(players, skillBalance) {
        const males = players.filter(p => p.gender === 'male');
        const females = players.filter(p => p.gender === 'female');

        if (males.length < 2 || females.length < 2) {
            return null;
        }

        const selectedMales = this.selectBySkill(males, 2, skillBalance);
        const selectedFemales = this.selectBySkill(females, 2, skillBalance);

        return [...selectedMales, ...selectedFemales];
    }

    selectSameGenderPlayers(players, skillBalance) {
        const males = players.filter(p => p.gender === 'male');
        const females = players.filter(p => p.gender === 'female');

        if (males.length >= 4) {
            return this.selectBySkill(males, 4, skillBalance);
        } else if (females.length >= 4) {
            return this.selectBySkill(females, 4, skillBalance);
        }

        return null;
    }

    selectBestAvailablePlayers(players, skillBalance) {
        // Just select any 4 players using skill preference if possible
        return this.selectBySkill(players, 4, skillBalance);
    }

    selectBySkill(players, count, skillBalance) {
        if (players.length < count) return null;

        if (skillBalance === 'similar') {
            // Try to find similar skill players, but be flexible
            const sorted = [...players].sort((a, b) => a.skill - b.skill);
            
            // Try to find the best consecutive group, but if not enough variety, take what we can
            if (sorted.length <= count) {
                return sorted;
            }
            
            // Look for the tightest skill range possible
            let bestGroup = null;
            let smallestRange = Infinity;
            
            for (let i = 0; i <= sorted.length - count; i++) {
                const group = sorted.slice(i, i + count);
                const range = group[group.length - 1].skill - group[0].skill;
                if (range < smallestRange) {
                    smallestRange = range;
                    bestGroup = group;
                }
            }
            
            return bestGroup || sorted.slice(0, count);
        } else {
            // Truly random selection using Fisher-Yates shuffle
            const shuffled = [...players];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled.slice(0, count);
        }
    }

    formTeams(players, skillBalance) {
        if (skillBalance === 'balanced') {
            // Try to balance teams by skill, but always form teams
            const sorted = [...players].sort((a, b) => b.skill - a.skill);
            
            // Calculate different pairing options and pick the most balanced
            const option1 = {
                team1: [sorted[0], sorted[3]],
                team2: [sorted[1], sorted[2]]
            };
            const option2 = {
                team1: [sorted[0], sorted[2]],
                team2: [sorted[1], sorted[3]]
            };
            
            // Calculate team skill differences for each option
            const diff1 = Math.abs(
                (option1.team1[0].skill + option1.team1[1].skill) - 
                (option1.team2[0].skill + option1.team2[1].skill)
            );
            const diff2 = Math.abs(
                (option2.team1[0].skill + option2.team1[1].skill) - 
                (option2.team2[0].skill + option2.team2[1].skill)
            );
            
            return diff1 <= diff2 ? option1 : option2;
        } else {
            // Random team formation using proper shuffle
            const shuffled = [...players];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return {
                team1: shuffled.slice(0, 2),
                team2: shuffled.slice(2, 4)
            };
        }
    }

    formMixedTeams(players, skillBalance) {
        const males = players.filter(p => p.gender === 'male');
        const females = players.filter(p => p.gender === 'female');
        
        if (males.length >= 2 && females.length >= 2) {
            // Ideal case: 2 males, 2 females - create M+F vs M+F
            if (skillBalance === 'balanced') {
                // Balance by combining male and female skills
                const sortedMales = males.sort((a, b) => b.skill - a.skill);
                const sortedFemales = females.sort((a, b) => b.skill - a.skill);
                
                // Try different combinations to balance team totals
                const option1 = {
                    team1: [sortedMales[0], sortedFemales[1]],
                    team2: [sortedMales[1], sortedFemales[0]]
                };
                const option2 = {
                    team1: [sortedMales[0], sortedFemales[0]],
                    team2: [sortedMales[1], sortedFemales[1]]
                };
                
                const diff1 = Math.abs(
                    (option1.team1[0].skill + option1.team1[1].skill) - 
                    (option1.team2[0].skill + option1.team2[1].skill)
                );
                const diff2 = Math.abs(
                    (option2.team1[0].skill + option2.team1[1].skill) - 
                    (option2.team2[0].skill + option2.team2[1].skill)
                );
                
                return diff1 <= diff2 ? option1 : option2;
            } else {
                // Random pairing
                const shuffledMales = [...males];
                const shuffledFemales = [...females];
                
                for (let i = shuffledMales.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledMales[i], shuffledMales[j]] = [shuffledMales[j], shuffledMales[i]];
                }
                for (let i = shuffledFemales.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledFemales[i], shuffledFemales[j]] = [shuffledFemales[j], shuffledFemales[i]];
                }
                
                return {
                    team1: [shuffledMales[0], shuffledFemales[0]],
                    team2: [shuffledMales[1], shuffledFemales[1]]
                };
            }
        } else {
            // Fallback to regular team formation if not enough of each gender
            return this.formTeams(players, skillBalance);
        }
    }

    formSameGenderTeams(players, skillBalance) {
        const males = players.filter(p => p.gender === 'male');
        const females = players.filter(p => p.gender === 'female');
        
        // Try to create same-gender matchups
        if (males.length >= 4) {
            // All males - create M+M vs M+M
            return this.formTeams(males.slice(0, 4), skillBalance);
        } else if (females.length >= 4) {
            // All females - create F+F vs F+F  
            return this.formTeams(females.slice(0, 4), skillBalance);
        } else if (males.length >= 2 && females.length >= 2) {
            // Mixed genders but try to keep teams same-gender: M+M vs F+F
            const maleTeam = males.slice(0, 2);
            const femaleTeam = females.slice(0, 2);
            
            return {
                team1: maleTeam,
                team2: femaleTeam
            };
        } else {
            // Fallback to regular team formation
            return this.formTeams(players, skillBalance);
        }
    }

    renderMatches(matches, sittingPlayers = []) {
        const container = document.getElementById('matches-display');
        const sittingContainer = document.getElementById('sitting-players');

        if (matches.length === 0) {
            container.innerHTML = '<div class="empty-state">No matches generated</div>';
            sittingContainer.innerHTML = '';
            return;
        }

        container.innerHTML = matches.map(match => {
            // Determine match type and label
            let matchTypeLabel = 'Doubles';
            if (match.type === 'singles') {
                matchTypeLabel = 'Singles';
            } else if (match.type === 'canadian') {
                matchTypeLabel = 'Canadian';
            }
            
            return `
            <div class="court">
                <div class="court-info">
                    <div class="court-number">${match.court}</div>
                    <div class="match-type-label">${matchTypeLabel}</div>
                </div>
                <div class="match">
                    <div class="team">
                        <div class="team-players">
                            ${match.team1.map(p => p.name).join(' & ')} (${match.type === 'doubles' && match.team1.length === 2 ? match.team1.reduce((sum, p) => sum + p.skill, 0) : (match.team1.reduce((sum, p) => sum + p.skill, 0) / match.team1.length).toFixed(1)})
                        </div>
                    </div>
                    <div class="vs">vs</div>
                    <div class="team">
                        <div class="team-players">
                            ${match.team2.map(p => p.name).join(' & ')} (${match.type === 'doubles' && match.team2.length === 2 ? match.team2.reduce((sum, p) => sum + p.skill, 0) : (match.team2.reduce((sum, p) => sum + p.skill, 0) / match.team2.length).toFixed(1)})
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');

        // Render sitting players
        if (sittingPlayers.length > 0) {
            sittingContainer.innerHTML = `
                <div class="sitting-header">Sitting Out (${sittingPlayers.length})</div>
                <div class="sitting-list">
                    ${sittingPlayers.map(player => `
                        <span class="sitting-player">${player.name} (${player.skill})</span>
                    `).join('')}
                </div>
            `;
        } else {
            sittingContainer.innerHTML = '';
        }
    }

    loadPlayers() {
        const saved = localStorage.getItem('tennis-players');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return [];
    }

    savePlayers() {
        localStorage.setItem('tennis-players', JSON.stringify(this.players));
    }

    // Timer functionality
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }

    setTimerPreset(minutes) {
        document.getElementById('custom-minutes').value = minutes;
        // Visual feedback for preset selection
        document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-minutes="${minutes}"]`).classList.add('active');
    }

    startTimer() {
        const customMinutes = document.getElementById('custom-minutes').value;
        if (!customMinutes || customMinutes <= 0) {
            alert('Please enter a valid timer duration');
            return;
        }

        // Request notification permission when starting timer
        this.requestNotificationPermission();

        // Set up timer
        this.timer.duration = parseInt(customMinutes) * 60; // Convert to seconds
        this.timer.remaining = this.timer.duration;
        this.timer.isRunning = true;
        this.timer.isPaused = false;
        this.timer.alerts.twoMin = false;
        this.timer.alerts.oneMin = false;

        // Update UI
        this.updateTimerButtons(true);
        document.getElementById('timer-label').textContent = `${customMinutes} min timer running`;

        // Start countdown
        this.timer.intervalId = setInterval(() => {
            this.tick();
        }, 1000);

        this.updateTimerDisplay();
    }

    pauseTimer() {
        if (this.timer.isRunning) {
            this.timer.isPaused = !this.timer.isPaused;
            
            if (this.timer.isPaused) {
                clearInterval(this.timer.intervalId);
                document.getElementById('pause-timer-btn').textContent = 'Resume';
                document.getElementById('timer-label').textContent = 'Paused';
            } else {
                this.timer.intervalId = setInterval(() => {
                    this.tick();
                }, 1000);
                document.getElementById('pause-timer-btn').textContent = 'Pause';
                const minutes = Math.ceil(this.timer.remaining / 60);
                document.getElementById('timer-label').textContent = `${minutes} min timer running`;
            }
        }
    }

    stopTimer() {
        if (this.timer.intervalId) {
            clearInterval(this.timer.intervalId);
        }
        
        this.timer.isRunning = false;
        this.timer.isPaused = false;
        this.timer.remaining = 0;
        
        this.updateTimerButtons(false);
        document.getElementById('time-display').textContent = '00:00';
        document.getElementById('timer-label').textContent = 'Ready';
        document.getElementById('pause-timer-btn').textContent = 'Pause';
    }

    tick() {
        if (this.timer.isPaused) return;
        
        this.timer.remaining--;
        this.updateTimerDisplay();

        // Check for alerts
        const alert2Min = document.getElementById('alert-2min').checked;
        const alert1Min = document.getElementById('alert-1min').checked;

        if (alert2Min && this.timer.remaining === 120 && !this.timer.alerts.twoMin) {
            this.timer.alerts.twoMin = true;
            this.showAlert('2 minutes remaining!', 'Get ready to rotate courts');
        }

        if (alert1Min && this.timer.remaining === 60 && !this.timer.alerts.oneMin) {
            this.timer.alerts.oneMin = true;
            this.showAlert('1 minute remaining!', 'Finish your current point');
        }

        if (this.timer.remaining <= 0) {
            this.onTimerComplete();
        }
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timer.remaining / 60);
        const seconds = this.timer.remaining % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('time-display').textContent = display;
    }

    updateTimerButtons(running) {
        document.getElementById('start-timer-btn').disabled = running;
        document.getElementById('pause-timer-btn').disabled = !running;
        document.getElementById('stop-timer-btn').disabled = !running;
    }

    onTimerComplete() {
        this.stopTimer();
        this.showAlert('Time\'s up!', 'Round complete - time to rotate courts');
        document.getElementById('timer-label').textContent = 'Time\'s up!';
    }

    updateVolumeDisplay(value) {
        document.getElementById('volume-display').textContent = `${value}%`;
    }

    testSound() {
        this.playCustomSound();
    }

    testVibration() {
        this.playCustomVibration();
    }

    showAlert(title, body) {
        // Play custom sound
        this.playCustomSound();
        
        // Play custom vibration
        this.playCustomVibration();
        
        // Show notification
        if (Notification.permission === 'granted') {
            const vibrationPattern = this.getVibrationPattern();
            const notification = new Notification(title, {
                body: body,
                icon: '/manifest.json',
                badge: '/manifest.json',
                vibrate: vibrationPattern,
                requireInteraction: true
            });
            
            // Auto-close notification after 10 seconds
            setTimeout(() => {
                notification.close();
            }, 10000);
        }
    }

    playCustomSound() {
        const soundType = document.getElementById('alert-sound').value;
        const volume = document.getElementById('alert-volume').value / 100;

        if (soundType === 'none') return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            switch (soundType) {
                case 'beep':
                    this.playBeepSound(audioContext, volume);
                    break;
                case 'chime':
                    this.playChimeSound(audioContext, volume);
                    break;
                case 'bell':
                    this.playBellSound(audioContext, volume);
                    break;
                case 'buzzer':
                    this.playBuzzerSound(audioContext, volume);
                    break;
            }
        } catch (error) {
            console.log('Audio context not available:', error);
        }
    }

    playBeepSound(audioContext, volume) {
        // Original double beep
        const oscillator1 = audioContext.createOscillator();
        const gainNode1 = audioContext.createGain();
        
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioContext.destination);
        
        oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode1.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.3);
        
        // Second beep
        setTimeout(() => {
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            
            oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
            gainNode2.gain.setValueAtTime(volume, audioContext.currentTime);
            gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator2.start(audioContext.currentTime);
            oscillator2.stop(audioContext.currentTime + 0.3);
        }, 400);
    }

    playChimeSound(audioContext, volume) {
        // Pleasant ascending chime
        const frequencies = [523, 659, 784]; // C, E, G
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            }, index * 150);
        });
    }

    playBellSound(audioContext, volume) {
        // Bell-like sound with harmonics
        const fundamental = 440;
        const harmonics = [1, 2, 3, 4];
        
        harmonics.forEach(harmonic => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(fundamental * harmonic, audioContext.currentTime);
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(volume / (harmonic * 2), audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1.5);
        });
    }

    playBuzzerSound(audioContext, volume) {
        // Urgent buzzer sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
    }

    playCustomVibration() {
        if ('vibrate' in navigator) {
            const pattern = this.getVibrationPattern();
            navigator.vibrate(pattern);
        }
    }

    getVibrationPattern() {
        const patternType = document.getElementById('vibration-pattern').value;
        
        switch (patternType) {
            case 'short':
                return [200];
            case 'long':
                return [800];
            case 'double':
                return [200, 100, 200];
            case 'pulse':
                return [300, 100, 300, 100, 300];
            case 'none':
                return [];
            default:
                return [300, 100, 300, 100, 300];
        }
    }
}

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Initialize the app
const app = new Jester();