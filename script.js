/*
 * Jester
 * Copyright (c) 2025 Nick Bevins. All rights reserved.
 */

class Jester {
    constructor() {
        this.players = this.loadPlayers();
        this.editMode = false;
        this.fixedTeams = this.loadFixedTeams();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderPlayers();
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

        // Generate matches
        document.getElementById('generate-matches-btn').addEventListener('click', () => this.generateMatches());
        
        // Advanced settings
        document.getElementById('advanced-toggle-btn').addEventListener('click', () => this.toggleAdvancedPanel());
        document.getElementById('add-fixed-team-btn').addEventListener('click', () => this.addFixedTeam());
        
        // Import/Export
        document.getElementById('export-csv-btn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('import-csv-btn').addEventListener('click', () => this.triggerImportCSV());
        document.getElementById('import-csv-input').addEventListener('change', (e) => this.importFromCSV(e));
    }

    selectOption(button) {
        const option = button.dataset.option;
        
        // Remove active from siblings
        button.parentNode.querySelectorAll('.option-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active to clicked button
        button.classList.add('active');
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
        link.setAttribute('download', `tennis-roster-${new Date().toISOString().split('T')[0]}.csv`);
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

        container.innerHTML = this.players.map(player => {
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
                            <input type="number" class="edit-skill" value="${player.skill}" 
                                   min="1" max="5" step="0.5"
                                   onchange="app.updatePlayer(${player.id}, 'skill', this.value)">
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
                    <button class="delete-btn" onclick="app.deletePlayer(${player.id})">Delete</button>
                </div>
                `;
            }
        }).join('');
    }

    generateMatches() {
        const activePlayers = this.players.filter(p => p.active);
        const courtsCount = parseInt(document.getElementById('courts-count').value);
        
        // Get selected options from button groups
        const genderFilter = document.querySelector('.option-btn[data-option="gender"].active').dataset.value;
        const skillBalance = document.querySelector('.option-btn[data-option="skill"].active').dataset.value;

        if (activePlayers.length < 4) {
            alert('Need at least 4 active players to generate matches');
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

    createMatches(players, courtsCount, genderFilter, skillBalance) {
        // Step 1: Create all doubles teams first
        const result = this.createAllTeams(players, genderFilter, skillBalance);
        const allTeams = result.teams;
        const unmatchedPlayers = result.unmatchedPlayers;
        
        // Step 2: Shuffle teams to randomize matchups (except for Canadian doubles teams)
        const regularTeams = allTeams.filter(team => team.length === 2);
        const canadianTeams = allTeams.filter(team => team.length === 3);
        
        // Shuffle regular teams to avoid fixed teams always playing each other
        for (let i = regularTeams.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [regularTeams[i], regularTeams[j]] = [regularTeams[j], regularTeams[i]];
        }
        
        // Step 3: Assign teams to courts
        const matches = [];
        let sittingPlayers = [...unmatchedPlayers];
        
        // Calculate how many courts we need for regular doubles
        const regularDoublesMatches = Math.floor(regularTeams.length / 2);
        const courtsNeededForRegular = regularDoublesMatches;
        
        // Assign regular doubles matches first
        for (let court = 0; court < Math.min(courtsNeededForRegular, courtsCount); court++) {
            if (regularTeams.length >= 2) {
                const team1 = regularTeams.shift();
                const team2 = regularTeams.shift();
                
                matches.push({
                    court: court + 1,
                    team1: team1,
                    team2: team2,
                    type: 'doubles'
                });
            }
        }
        
        // If we have remaining courts and a single team or unmatched player, try to create special matches
        const remainingCourts = courtsCount - matches.length;
        
        if (remainingCourts > 0) {
            // Handle Canadian doubles teams
            for (const canadianTeam of canadianTeams) {
                if (matches.length < courtsCount) {
                    matches.push({
                        court: matches.length + 1,
                        team1: canadianTeam.slice(0, 2),
                        team2: [canadianTeam[2]],
                        type: 'canadian'
                    });
                } else {
                    sittingPlayers.push(...canadianTeam);
                }
            }
            
            // Prioritize Canadian doubles over singles if we have a single player and a team
            if (matches.length < courtsCount && sittingPlayers.length === 1 && regularTeams.length >= 1) {
                const singlePlayer = sittingPlayers.pop();
                const team = regularTeams.shift();
                
                matches.push({
                    court: matches.length + 1,
                    team1: team,
                    team2: [singlePlayer],
                    type: 'canadian'
                });
            }
            // Only create singles if we have exactly 1 team left and no single players to pair
            else if (matches.length < courtsCount && regularTeams.length === 1 && sittingPlayers.length === 0) {
                const team = regularTeams.shift();
                matches.push({
                    court: matches.length + 1,
                    team1: [team[0]],
                    team2: [team[1]],
                    type: 'singles'
                });
            }
        }
        
        // Step 4: Handle remaining teams
        while (regularTeams.length > 0) {
            const remainingTeam = regularTeams.shift();
            sittingPlayers.push(...remainingTeam);
        }

        return {
            matches: matches,
            sittingPlayers: sittingPlayers
        };
    }

    createAllTeams(players, genderFilter, skillBalance) {
        let availablePlayers = [...players];
        const teams = [];
        
        // Step 1: Add all valid fixed teams first
        const validFixedTeams = this.getValidFixedTeams(availablePlayers);
        
        for (const fixedTeam of validFixedTeams) {
            teams.push(fixedTeam);
            // Remove fixed team players from available pool
            availablePlayers = availablePlayers.filter(p => 
                !fixedTeam.some(fp => fp.id === p.id)
            );
        }
        
        // Step 2: Create teams from remaining players
        while (availablePlayers.length >= 2) {
            let team = null;
            
            if (genderFilter === 'mixed') {
                team = this.createMixedTeam(availablePlayers, skillBalance);
            } else if (genderFilter === 'same') {
                team = this.createSameGenderTeam(availablePlayers, skillBalance);
            } else {
                team = this.createRandomTeam(availablePlayers, skillBalance);
            }
            
            if (team && team.length === 2) {
                teams.push(team);
                // Remove team players from available pool
                availablePlayers = availablePlayers.filter(p => 
                    !team.some(tp => tp.id === p.id)
                );
            } else {
                // If we can't create the preferred team type, create any team
                team = this.createRandomTeam(availablePlayers, skillBalance);
                if (team && team.length === 2) {
                    teams.push(team);
                    availablePlayers = availablePlayers.filter(p => 
                        !team.some(tp => tp.id === p.id)
                    );
                } else {
                    break; // Can't create any more teams
                }
            }
        }
        
        // Step 3: Handle single remaining player (Canadian doubles)
        // Only create Canadian doubles if we have enough courts to accommodate it
        if (availablePlayers.length === 1 && teams.length > 0) {
            // We'll decide whether to create Canadian doubles in the court assignment phase
            // For now, just leave the single player unmatched
        }
        
        return {
            teams: teams,
            unmatchedPlayers: availablePlayers
        };
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

    createRandomTeam(availablePlayers, skillBalance) {
        if (availablePlayers.length >= 2) {
            return this.selectBySkill(availablePlayers, 2, skillBalance);
        }
        return null;
    }

    getValidFixedTeams(availablePlayers) {
        return this.fixedTeams
            .filter(team => team.players && team.players.length === 2)
            .filter(team => team.players.every(playerId => 
                playerId && availablePlayers.some(p => p.id === playerId)
            ))
            .map(team => team.players.map(playerId => 
                availablePlayers.find(p => p.id === playerId)
            ));
    }

    selectMixedDoublesPartners(availablePlayers, fixedTeam, skillBalance) {
        const fixedGenders = fixedTeam.map(p => p.gender);
        const needMale = !fixedGenders.includes('male');
        const needFemale = !fixedGenders.includes('female');
        
        if (needMale && needFemale) {
            // Need one of each gender
            const males = availablePlayers.filter(p => p.gender === 'male');
            const females = availablePlayers.filter(p => p.gender === 'female');
            
            if (males.length > 0 && females.length > 0) {
                return [males[0], females[0]];
            }
        }
        
        // Fallback to any 2 players
        return this.selectBestPartners(availablePlayers, fixedTeam, skillBalance);
    }

    selectSameGenderPartners(availablePlayers, fixedTeam, skillBalance) {
        const fixedGender = fixedTeam[0].gender;
        const sameGenderPlayers = availablePlayers.filter(p => p.gender === fixedGender);
        
        if (sameGenderPlayers.length >= 2) {
            return this.selectBySkill(sameGenderPlayers, 2, skillBalance);
        }
        
        // Fallback to any 2 players
        return this.selectBestPartners(availablePlayers, fixedTeam, skillBalance);
    }

    selectBestPartners(availablePlayers, fixedTeam, skillBalance) {
        return this.selectBySkill(availablePlayers, 2, skillBalance);
    }

    createSpecialMatch(players, courtNumber) {
        if (players.length === 2) {
            // Singles match
            return {
                court: courtNumber,
                team1: [players[0]],
                team2: [players[1]],
                type: 'singles'
            };
        } else if (players.length === 3) {
            // Canadian doubles (2 vs 1)
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
        }
        return null;
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
            } else if (match.team1.length === 3 || match.team2.length === 3) {
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
        
        // Default test players for initial testing
        return [
            { id: 1, name: 'Alex Johnson', gender: 'male', skill: 4.0, active: true },
            { id: 2, name: 'Sarah Williams', gender: 'female', skill: 3.5, active: true },
            { id: 3, name: 'Mike Chen', gender: 'male', skill: 3.0, active: true },
            { id: 4, name: 'Emma Davis', gender: 'female', skill: 4.5, active: true },
            { id: 5, name: 'David Brown', gender: 'male', skill: 2.5, active: true },
            { id: 6, name: 'Lisa Garcia', gender: 'female', skill: 4.0, active: true },
            { id: 7, name: 'Tom Wilson', gender: 'male', skill: 3.5, active: true },
            { id: 8, name: 'Anna Martinez', gender: 'female', skill: 3.0, active: true },
            { id: 9, name: 'Chris Taylor', gender: 'male', skill: 4.5, active: true },
            { id: 10, name: 'Maria Rodriguez', gender: 'female', skill: 2.5, active: true }
        ];
    }

    savePlayers() {
        localStorage.setItem('tennis-players', JSON.stringify(this.players));
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