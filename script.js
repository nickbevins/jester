/*
 * Jester
 * Copyright (c) 2025 Nick Bevins. All rights reserved.
 */

class Jester {
    constructor() {
        this.players = this.loadPlayers();
        this.editMode = false;
        this.fixedTeams = this.loadFixedTeams();
        this.benchHistory = this.loadBenchHistory();
        this.benchWeightingEnabled = this.loadBenchWeightingSetting();
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
        this.wakeLock = null;
        this.alarmIntervalId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderPlayers();
        this.initializeCourtSelection();
        this.updateOptionHelperText('gender', 'any');
        this.updateOptionHelperText('skill', 'random');
        this.checkUrlImport();
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
        document.getElementById('bench-weighting-enabled').addEventListener('change', (e) => this.updateBenchWeightingSetting(e.target.checked));
        
        // Import/Export
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('import-csv-btn').addEventListener('click', () => this.triggerImportCSV());
        document.getElementById('import-csv-input').addEventListener('change', (e) => this.importFromCSV(e));

        // URL sharing
        document.getElementById('share-url-btn').addEventListener('click', () => this.shareURL());
        
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
        document.getElementById('alarm-dismiss-btn').addEventListener('click', () => this.dismissAlarm());

        // Re-acquire wake lock when returning to foreground while timer is running
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && this.timer.isRunning && !this.timer.isPaused) {
                await this.acquireWakeLock();
            }
        });
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

        if (option === 'gender' || option === 'skill') {
            this.updateOptionHelperText(option, value);
        }
    }

    updateOptionHelperText(option, value) {
        const descriptions = {
            gender: {
                any:   'No restriction — random pairings',
                mixed: 'Prefer mixed gender teams',
                same:  'Prefer same gender teams',
            },
            skill: {
                random:   'Teams and opponents are chosen at random',
                similar:  'Partners have similar skill levels; opponent teams are matched by combined skill',
                balanced: 'Partners are random; opponent teams are matched by combined skill',
            },
        };
        const el = document.getElementById(`${option}-helper`);
        if (el) el.textContent = descriptions[option][value] ?? '';
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
                        this.updateOptionHelperText('skill', 'similar');
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
            this.updateBenchWeightingUI();
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

    loadBenchHistory() {
        const saved = localStorage.getItem('tennis-bench-history');
        if (!saved) return { lastMatchTime: null, history: [] };
        
        const data = JSON.parse(saved);
        const now = Date.now();
        const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        
        // Reset if more than 2 hours since last match
        if (!data.lastMatchTime || (now - data.lastMatchTime) > twoHours) {
            return { lastMatchTime: null, history: [] };
        }
        
        return data;
    }

    saveBenchHistory() {
        localStorage.setItem('tennis-bench-history', JSON.stringify(this.benchHistory));
    }

    getBenchScore(playerName, courtsCount) {
        if (!this.benchHistory.history.length) return 0;
        
        const maxHistoryRounds = 10; // Track last 10 rounds for better fairness
        let score = 0;
        
        // Check recent rounds (newest first)
        for (let i = 0; i < Math.min(this.benchHistory.history.length, maxHistoryRounds); i++) {
            const round = this.benchHistory.history[i];
            if (round.includes(playerName)) {
                // Exponential weighting with slight jitter to break ties
                const baseWeight = Math.pow(1.5, maxHistoryRounds - i);
                const jitter = Math.random() * 0.3; // Small random component
                score += baseWeight + jitter;
            }
        }
        
        return score;
    }

    updateBenchHistory(benchedPlayers, courtsCount) {
        const maxHistoryRounds = 10; // Track last 10 rounds for better fairness
        
        // Add current round to front of history
        this.benchHistory.history.unshift(benchedPlayers);
        
        // Keep only the recent rounds we care about
        if (this.benchHistory.history.length > maxHistoryRounds) {
            this.benchHistory.history = this.benchHistory.history.slice(0, maxHistoryRounds);
        }
        
        // Update timestamp
        this.benchHistory.lastMatchTime = Date.now();
        
        // Save to localStorage
        this.saveBenchHistory();
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
        link.setAttribute('download', `jester-roster-${timestamp}.csv`);
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
                                gender: this.normalizeGender(values[1]),
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


    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    normalizeGender(value) {
        const v = String(value).trim().toLowerCase();
        if (v === 'm' || v === 'male') return 'male';
        if (v === 'f' || v === 'female') return 'female';
        return null; // invalid
    }

    checkUrlImport() {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get('import');
        if (!raw) return;

        let parsed;
        try {
            // Try parsing as raw JSON first (URLSearchParams already decodes it)
            parsed = JSON.parse(raw);
        } catch {
            // If that fails, try base64 decoding (backward compatibility)
            try {
                parsed = JSON.parse(atob(raw));
            } catch {
                alert('Invalid import link — could not read player data.');
                return;
            }
        }

        // Support both new array format and old object format
        let playersList;

        if (Array.isArray(parsed)) {
            // New format: direct array of players
            playersList = parsed;
        } else if (parsed.p && Array.isArray(parsed.p)) {
            // Old format: {p:[...]}
            playersList = parsed.p;
        } else {
            alert('Import link contained no players.');
            return;
        }

        if (playersList.length === 0) {
            alert('Import link contained no players.');
            return;
        }

        const imported = [];
        let errorCount = 0;

        playersList.forEach((p, index) => {
            const player = this.fromCompactPlayer(p, index);

            if (player.name && player.gender && player.skill >= 1 && player.skill <= 5) {
                imported.push(player);
            } else {
                errorCount++;
            }
        });

        if (imported.length === 0) {
            alert('Import link contained no valid players.');
            return;
        }

        const replace = confirm(
            `Import ${imported.length} player${imported.length !== 1 ? 's' : ''} from link?\n\n` +
            'OK = Replace current roster\n' +
            'Cancel = Merge with current roster'
        );

        if (replace) {
            this.players = imported;
        } else {
            this.players.push(...imported);
        }

        this.savePlayers();
        this.renderPlayers();

        let message = `Imported ${imported.length} player${imported.length !== 1 ? 's' : ''}`;
        if (errorCount > 0) message += `\n${errorCount} entries were skipped (invalid data)`;
        alert(message);

        // Clean the URL so a refresh doesn't re-trigger the import
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, '', cleanUrl);
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
                        <input type="text" class="edit-name" value="${this.escapeHtml(player.name)}"
                               onchange="app.updatePlayer(${player.id}, 'name', this.value)">
                        <div class="player-edit-controls">
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
                            <select class="edit-gender" onchange="app.updatePlayer(${player.id}, 'gender', this.value)">
                                <option value="male" ${player.gender === 'male' ? 'selected' : ''}>Male</option>
                                <option value="female" ${player.gender === 'female' ? 'selected' : ''}>Female</option>
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
                        <div class="player-name">${this.escapeHtml(player.name)}</div>
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
            this.updateBenchHistory(result.sittingPlayers.map(p => p.name), courtsCount);
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
            
            // For doubles, track players who didn't get regular doubles matches
            const benchedPlayers = [];
            const allPlayingPlayers = new Set();
            
            result.matches.forEach(match => {
                if (match.type === 'doubles') {
                    // Regular doubles players don't get benched
                    match.team1.forEach(p => allPlayingPlayers.add(p.name));
                    match.team2.forEach(p => allPlayingPlayers.add(p.name));
                } else {
                    // Canadian doubles and singles players get benched priority
                    match.team1.forEach(p => benchedPlayers.push(p.name));
                    match.team2.forEach(p => benchedPlayers.push(p.name));
                }
            });
            
            // Add sitting players to benched list
            result.sittingPlayers.forEach(p => benchedPlayers.push(p.name));
            
            this.updateBenchHistory(benchedPlayers, actualCourts);
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
                const doublesPlayers = this.randomSelectPlayers(players, doublesPlayerCount, courtsCount);
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
            const selectedPlayers = this.randomSelectPlayers(players, courtsCount * 4, courtsCount);
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
                // Odd number of players - prioritize recently benched players for play if weighting enabled
                if (this.benchWeightingEnabled) {
                    const weightedPlayers = players.map(player => ({
                        player,
                        weight: this.getBenchScore(player.name, courtsCount)
                    }));
                    
                    // Sort by bench score (highest priority to play)
                    weightedPlayers.sort((a, b) => b.weight - a.weight);
                    
                    // Player with lowest bench score sits out
                    sittingPlayers.push(weightedPlayers[weightedPlayers.length - 1].player);
                    const playingPlayers = weightedPlayers.slice(0, -1).map(wp => wp.player);
                    matches.push(...this.createSinglesMatchesFromPlayers(playingPlayers, courtsCount, genderFilter, skillBalance));
                } else {
                    // Random selection when weighting disabled
                    const shuffled = [...players];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }
                    sittingPlayers.push(shuffled[shuffled.length - 1]);
                    const playingPlayers = shuffled.slice(0, -1);
                    matches.push(...this.createSinglesMatchesFromPlayers(playingPlayers, courtsCount, genderFilter, skillBalance));
                }
            }
        } else {
            // Not enough court capacity - select players with bench weighting
            const selectedPlayers = this.randomSelectPlayers(players, maxPlayersNeeded, courtsCount);
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
        
        if (skillBalance === 'balanced' || skillBalance === 'similar') {
            // Pair teams so opponents have similar total skill.
            // 'balanced': teams were formed randomly, pairing makes the match itself fair.
            // 'similar': teams were formed with similar-skill partners, pairing also matches similar totals.
            const teamsWithSkill = teams.map(team => ({
                team: team,
                totalSkill: team.reduce((sum, player) => sum + player.skill, 0)
            }));
            
            // Sort by skill
            teamsWithSkill.sort((a, b) => a.totalSkill - b.totalSkill);
            
            // Add flexibility to prevent repetitive matches by introducing controlled randomness
            const flexiblePairs = this.createFlexibleSkillPairs(teamsWithSkill);
            
            // Create matches from flexible pairs
            flexiblePairs.forEach((pair, index) => {
                matches.push({
                    court: index + 1,
                    team1: pair.team1,
                    team2: pair.team2,
                    type: 'doubles'
                });
            });
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

    createFlexibleSkillPairs(teamsWithSkill) {
        const pairs = [];
        const used = new Set();
        
        for (let i = 0; i < teamsWithSkill.length; i++) {
            if (used.has(i)) continue;
            
            const currentTeam = teamsWithSkill[i];
            let bestMatch = null;
            let bestMatchIndex = -1;
            let smallestDiff = Infinity;
            
            // Find potential matches within reasonable skill range
            const candidates = [];
            for (let j = i + 1; j < teamsWithSkill.length; j++) {
                if (used.has(j)) continue;
                
                const skillDiff = Math.abs(currentTeam.totalSkill - teamsWithSkill[j].totalSkill);
                
                // Accept matches within 2.0 skill points for flexibility
                if (skillDiff <= 2.0) {
                    candidates.push({ index: j, team: teamsWithSkill[j], skillDiff });
                }
                
                // Track the absolute best match as fallback
                if (skillDiff < smallestDiff) {
                    smallestDiff = skillDiff;
                    bestMatch = teamsWithSkill[j];
                    bestMatchIndex = j;
                }
            }
            
            let selectedMatch, selectedIndex;
            
            if (candidates.length > 0) {
                // Randomly select from good candidates for variety
                const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
                selectedMatch = randomCandidate.team;
                selectedIndex = randomCandidate.index;
            } else if (bestMatch) {
                // Fallback to best available match
                selectedMatch = bestMatch;
                selectedIndex = bestMatchIndex;
            } else {
                // No valid matches remaining, skip this team
                continue;
            }
            
            pairs.push({
                team1: currentTeam.team,
                team2: selectedMatch.team
            });
            
            used.add(i);
            used.add(selectedIndex);
        }
        
        return pairs;
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

    randomSelectPlayers(players, count, courtsCount) {
        if (players.length <= count) {
            return [...players];
        }
        
        // Use bench weighting if enabled and courtsCount is provided
        if (this.benchWeightingEnabled && courtsCount) {
            return this.weightedSelectPlayers(players, count, courtsCount);
        }
        
        // Fallback to random selection using Fisher-Yates shuffle
        const shuffled = [...players];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }

    weightedSelectPlayers(players, count, courtsCount) {
        // Create weighted array with bench scores
        const weightedPlayers = players.map(player => ({
            player,
            weight: this.getBenchScore(player.name, courtsCount) + 1 // +1 base weight for everyone
        }));
        
        // Use weighted random selection instead of strict priority
        const selected = [];
        const playerPool = [...weightedPlayers];
        
        while (selected.length < count && playerPool.length > 0) {
            // Calculate total weight for probability distribution
            const totalWeight = playerPool.reduce((sum, p) => sum + p.weight, 0);
            
            // Generate random number for weighted selection
            const randomValue = Math.random() * totalWeight;
            let cumulativeWeight = 0;
            
            // Find the selected player using cumulative weights
            for (let i = 0; i < playerPool.length; i++) {
                cumulativeWeight += playerPool[i].weight;
                if (randomValue <= cumulativeWeight) {
                    selected.push(playerPool[i].player);
                    playerPool.splice(i, 1); // Remove selected player
                    break;
                }
            }
        }
        
        return selected;
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
                            ${match.team1.map(p => this.escapeHtml(p.name)).join(' & ')} (${match.type === 'doubles' && match.team1.length === 2 ? match.team1.reduce((sum, p) => sum + p.skill, 0) : (match.team1.reduce((sum, p) => sum + p.skill, 0) / match.team1.length).toFixed(1)})
                        </div>
                    </div>
                    <div class="vs">vs</div>
                    <div class="team">
                        <div class="team-players">
                            ${match.team2.map(p => this.escapeHtml(p.name)).join(' & ')} (${match.type === 'doubles' && match.team2.length === 2 ? match.team2.reduce((sum, p) => sum + p.skill, 0) : (match.team2.reduce((sum, p) => sum + p.skill, 0) / match.team2.length).toFixed(1)})
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
                        <span class="sitting-player">${this.escapeHtml(player.name)} (${player.skill})</span>
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

    loadBenchWeightingSetting() {
        const saved = localStorage.getItem('tennis-bench-weighting');
        return saved ? JSON.parse(saved) : true; // Default to enabled
    }

    saveBenchWeightingSetting() {
        localStorage.setItem('tennis-bench-weighting', JSON.stringify(this.benchWeightingEnabled));
    }

    updateBenchWeightingSetting(enabled) {
        this.benchWeightingEnabled = enabled;
        this.saveBenchWeightingSetting();
    }

    updateBenchWeightingUI() {
        document.getElementById('bench-weighting-enabled').checked = this.benchWeightingEnabled;
    }

    // Timer functionality
    setTimerPreset(minutes) {
        document.getElementById('custom-minutes').value = minutes;
        // Visual feedback for preset selection
        document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-minutes="${minutes}"]`).classList.add('active');
    }

    async startTimer() {
        const customMinutes = document.getElementById('custom-minutes').value;
        if (!customMinutes || customMinutes <= 0) {
            alert('Please enter a valid timer duration');
            return;
        }

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
        await this.acquireWakeLock();
    }

    async pauseTimer() {
        if (this.timer.isRunning) {
            this.timer.isPaused = !this.timer.isPaused;

            if (this.timer.isPaused) {
                clearInterval(this.timer.intervalId);
                document.getElementById('pause-timer-btn').textContent = 'Resume';
                document.getElementById('timer-label').textContent = 'Paused';
                await this.releaseWakeLock();
            } else {
                this.timer.intervalId = setInterval(() => {
                    this.tick();
                }, 1000);
                document.getElementById('pause-timer-btn').textContent = 'Pause';
                const minutes = Math.ceil(this.timer.remaining / 60);
                document.getElementById('timer-label').textContent = `${minutes} min timer running`;
                await this.acquireWakeLock();
            }
        }
    }

    async stopTimer() {
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
        this.dismissAlarm();
        await this.releaseWakeLock();
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
            this.playMidMatchAlert();
        }

        if (alert1Min && this.timer.remaining === 60 && !this.timer.alerts.oneMin) {
            this.timer.alerts.oneMin = true;
            this.playMidMatchAlert();
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
        this.showFinalAlarm();
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

    playMidMatchAlert() {
        // Play the chosen sound 3 times with 1.5s gaps
        let count = 0;
        this.playCustomSound();
        this.playCustomVibration();
        const interval = setInterval(() => {
            count++;
            if (count >= 2) {
                clearInterval(interval);
                return;
            }
            this.playCustomSound();
            this.playCustomVibration();
        }, 1500);
    }

    showFinalAlarm() {
        document.getElementById('alarm-modal').style.display = 'flex';
        document.getElementById('timer-label').textContent = 'Time\'s up!';
        this.playCustomSound();
        this.playCustomVibration();
        this.alarmIntervalId = setInterval(() => {
            this.playCustomSound();
            this.playCustomVibration();
        }, 2000);
    }

    dismissAlarm() {
        if (this.alarmIntervalId) {
            clearInterval(this.alarmIntervalId);
            this.alarmIntervalId = null;
        }
        document.getElementById('alarm-modal').style.display = 'none';
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

    async acquireWakeLock() {
        if (!('wakeLock' in navigator)) return;
        try {
            this.wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.log('Wake lock request failed:', err);
        }
    }

    async releaseWakeLock() {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
            } catch (err) {
                console.log('Wake lock release failed:', err);
            }
            this.wakeLock = null;
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

    // URL Sharing Methods
    toCompactPlayer(player) {
        // Array format: [name, gender, skill, active?]
        // gender: 1=female, 0=male
        // active: omit if true (1), only include if false (0)
        const arr = [
            player.name,
            player.gender === 'female' ? 1 : 0,
            player.skill
        ];
        if (!player.active) {
            arr.push(0);
        }
        return arr;
    }

    fromCompactPlayer(compact, index) {
        // Support both array format and old object format for backward compatibility
        if (Array.isArray(compact)) {
            // New array format: [name, gender, skill, active?]
            return {
                id: Date.now() + index,
                name: compact[0],
                gender: compact[1] === 1 ? 'female' : 'male',
                skill: parseFloat(compact[2]),
                active: compact[3] === 0 ? false : true  // default true if omitted
            };
        } else {
            // Old object format: {n, g, s, a}
            return {
                id: Date.now() + index,
                name: compact.n,
                gender: compact.g === 'm' || compact.g === 'male' ? 'male' : 'female',
                skill: parseFloat(compact.s),
                active: compact.a !== 0
            };
        }
    }
    
    shareURL() {
        if (this.players.length === 0) {
            alert('No players to share');
            return;
        }

        try {
            const compactPlayers = this.players.map(p => this.toCompactPlayer(p));
            const jsonStr = JSON.stringify(compactPlayers);
            const base64 = btoa(jsonStr);
            const url = window.location.origin + window.location.pathname + '?import=' + base64;
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    alert('Share URL copied to clipboard!\n\nURL length: ' + url.length + ' characters\nPlayers: ' + this.players.length);
                }).catch(() => {
                    this.showURLPrompt(url);
                });
            } else {
                this.showURLPrompt(url);
            }
        } catch (error) {
            console.error('Share URL error:', error);
            alert('Error generating share URL');
        }
    }
    
    showURLPrompt(url) {
        prompt('Copy this URL to share the roster:', url);
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