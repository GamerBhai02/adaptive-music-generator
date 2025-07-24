// Fully Functional Adaptive Music Generator
class AdaptiveMusicGenerator {
    constructor() {
        // Core state
        this.isMonitoring = false;
        this.isPlaying = false;
        this.audioContext = null;
        this.masterGain = null;
        this.currentOscillators = [];
        
        // Theme
        this.currentTheme = 'light';
        
        // Activity data
        this.typingSpeed = 0;
        this.mouseActivity = 'Inactive';
        this.activityState = 'Idle';
        this.lastActivityTime = Date.now();
        this.keystrokeCount = 0;
        this.keystrokeTimes = [];
        this.sessionStartTime = null;
        this.characterCount = 0;
        this.wordCount = 0;
        
        // Music data
        this.currentBPM = 60;
        this.targetBPM = 60;
        this.currentMode = 'focus';
        this.currentInstrument = 'pad';
        this.musicInterval = null;
        this.updateInterval = null;
        
        // Settings
        this.settings = {
            sensitivity: 0.7,
            volumeLevel: 0.6,
            bpmSmoothingFactor: 0.2,
            idleThresholdSeconds: 10,
            activityWindowSize: 30
        };
        
        // Analytics
        this.sessionData = {
            totalKeystrokes: 0,
            adaptationCount: 0,
            productivityScore: 85,
            averageWPM: 0
        };
        
        // Music modes
        this.musicModes = {
            focus: { name: "Focus Mode", bpmRange: [50, 70] },
            break: { name: "Break Mode", bpmRange: [40, 60] },
            deadline: { name: "Deadline Rush", bpmRange: [90, 120] }
        };
        
        // Chord progressions
        this.chordProgressions = [
            [261.63, 392.00, 220.00, 349.23], // C-G-Am-F
            [220.00, 349.23, 261.63, 392.00], // Am-F-C-G
        ];
        this.currentChord = 0;
        this.currentProgression = 0;
        
        // Charts
        this.activityChart = null;
        this.musicChart = null;
        
        // Initialize immediately
        this.init();
    }
    
    init() {
        console.log('Initializing Adaptive Music Generator...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        console.log('Setting up application...');
        
        // Apply initial theme
        this.applyTheme(this.currentTheme);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup charts
        this.setupCharts();
        
        // Start update loop
        this.startUpdateLoop();
        
        // Update initial UI
        this.updateUI();
        this.updateStatus('system', 'Ready', 'success');
        this.updateStatus('theme', 'Light', 'success');
        
        console.log('Setup complete');
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-color-scheme', theme);
        const themeIcon = document.querySelector('.theme-icon');
        if (themeIcon) {
            themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
        this.currentTheme = theme;
        console.log('Theme applied:', theme);
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        console.log('Toggling theme from', this.currentTheme, 'to', newTheme);
        
        const overlay = document.getElementById('themeTransitionOverlay');
        if (overlay) {
            overlay.classList.add('active');
            setTimeout(() => {
                this.applyTheme(newTheme);
                this.updateStatus('theme', newTheme === 'light' ? 'Light' : 'Dark', 'success');
                setTimeout(() => overlay.classList.remove('active'), 100);
            }, 100);
        } else {
            this.applyTheme(newTheme);
            this.updateStatus('theme', newTheme === 'light' ? 'Light' : 'Dark', 'success');
        }
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.onclick = () => {
                console.log('Theme toggle clicked');
                this.toggleTheme();
            };
            console.log('Theme toggle listener attached');
        }
        
        // Start/Stop button
        const startStopBtn = document.getElementById('startStopBtn');
        if (startStopBtn) {
            startStopBtn.onclick = () => {
                console.log('Start/Stop button clicked, current state:', this.isMonitoring);
                this.toggleMonitoring();
            };
            console.log('Start/Stop button listener attached');
        }
        
        // Play/Pause button
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.onclick = () => {
                console.log('Play/Pause button clicked');
                this.toggleMusic();
            };
            console.log('Play/Pause button listener attached');
        }
        
        // Settings controls
        this.setupSettingsControls();
        
        // Activity tracking
        this.setupActivityTracking();
        
        console.log('Event listeners setup complete');
    }
    
    setupSettingsControls() {
        // Volume slider
        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.oninput = (e) => this.updateVolume(e.target.value);
        }
        
        // Music mode selector
        const musicMode = document.getElementById('musicMode');
        if (musicMode) {
            musicMode.onchange = (e) => {
                console.log('Music mode changed to:', e.target.value);
                this.changeMusicMode(e.target.value);
            };
        }
        
        // Instrument selector
        const instrumentType = document.getElementById('instrumentType');
        if (instrumentType) {
            instrumentType.onchange = (e) => this.changeInstrument(e.target.value);
        }
        
        // Settings sliders
        const sensitivitySlider = document.getElementById('sensitivitySlider');
        if (sensitivitySlider) {
            sensitivitySlider.oninput = (e) => this.updateSetting('sensitivity', e.target.value);
        }
        
        const idleThreshold = document.getElementById('idleThreshold');
        if (idleThreshold) {
            idleThreshold.oninput = (e) => this.updateSetting('idleThresholdSeconds', e.target.value);
        }
        
        const bpmSmoothing = document.getElementById('bpmSmoothing');
        if (bpmSmoothing) {
            bpmSmoothing.oninput = (e) => this.updateSetting('bpmSmoothingFactor', e.target.value);
        }
        
        const activityWindow = document.getElementById('activityWindow');
        if (activityWindow) {
            activityWindow.oninput = (e) => this.updateSetting('activityWindowSize', e.target.value);
        }
    }
    
    setupActivityTracking() {
        const demoTextArea = document.getElementById('demoTextArea');
        if (demoTextArea) {
            console.log('Setting up activity tracking...');
            
            // Keystroke tracking
            demoTextArea.onkeydown = (e) => {
                if (this.isMonitoring && !e.repeat) {
                    this.handleKeystroke();
                }
            };
            
            demoTextArea.oninput = (e) => {
                if (this.isMonitoring) {
                    this.handleInput(e);
                }
            };
            
            console.log('Activity tracking setup complete');
        } else {
            console.error('Demo text area not found!');
        }
        
        // Mouse tracking
        document.onmousemove = () => {
            if (this.isMonitoring) {
                this.trackMouseActivity();
            }
        };
    }
    
    async toggleMonitoring() {
        console.log('toggleMonitoring called, current state:', this.isMonitoring);
        
        if (!this.isMonitoring) {
            await this.startMonitoring();
        } else {
            this.stopMonitoring();
        }
    }
    
    async startMonitoring() {
        console.log('Starting monitoring...');
        
        try {
            // Initialize Web Audio
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                this.masterGain = this.audioContext.createGain();
                this.masterGain.connect(this.audioContext.destination);
                this.masterGain.gain.value = this.settings.volumeLevel;
            }
            
            // Set monitoring state
            this.isMonitoring = true;
            this.sessionStartTime = Date.now();
            this.lastActivityTime = Date.now();
            this.keystrokeCount = 0;
            this.keystrokeTimes = [];
            this.typingSpeed = 0;
            this.sessionData.totalKeystrokes = 0;
            this.sessionData.adaptationCount = 0;
            
            // Update UI
            const startStopBtn = document.getElementById('startStopBtn');
            if (startStopBtn) {
                startStopBtn.textContent = 'Stop Monitoring';
                startStopBtn.classList.add('btn--active');
            }
            
            const playPauseBtn = document.getElementById('playPauseBtn');
            if (playPauseBtn) {
                playPauseBtn.disabled = false;
            }
            
            // Update status
            this.updateStatus('monitoring', 'Active', 'success');
            this.updateStatus('audio', 'Ready', 'success');
            
            // Auto-start music
            setTimeout(() => {
                if (this.isMonitoring) {
                    this.startMusic();
                }
            }, 500);
            
            console.log('Monitoring started successfully');
            
        } catch (error) {
            console.error('Failed to start monitoring:', error);
            this.updateStatus('system', 'Error', 'error');
        }
    }
    
    stopMonitoring() {
        console.log('Stopping monitoring...');
        
        this.isMonitoring = false;
        this.stopMusic();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        // Reset UI
        const startStopBtn = document.getElementById('startStopBtn');
        if (startStopBtn) {
            startStopBtn.textContent = 'Start Monitoring';
            startStopBtn.classList.remove('btn--active');
        }
        
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.disabled = true;
            playPauseBtn.textContent = '▶ Play';
            playPauseBtn.classList.remove('btn--active');
        }
        
        this.updateStatus('monitoring', 'Stopped', 'error');
        this.updateStatus('audio', 'Inactive', 'error');
        
        console.log('Monitoring stopped');
    }
    
    handleKeystroke() {
        const now = Date.now();
        this.lastActivityTime = now;
        this.keystrokeCount++;
        this.keystrokeTimes.push(now);
        this.sessionData.totalKeystrokes++;
        
        console.log('Keystroke detected, total:', this.keystrokeCount);
        
        // Calculate typing speed
        this.calculateTypingSpeed();
        
        // Update activity indicators
        this.updateActivityIndicators(true);
        
        // Adapt music
        this.adaptMusic();
    }
    
    handleInput(event) {
        const text = event.target.value;
        this.characterCount = text.length;
        this.wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        this.updateTextStats();
    }
    
    calculateTypingSpeed() {
        const now = Date.now();
        const windowMs = this.settings.activityWindowSize * 1000;
        
        // Filter recent keystrokes
        this.keystrokeTimes = this.keystrokeTimes.filter(time => now - time < windowMs);
        
        if (this.keystrokeTimes.length === 0) {
            this.typingSpeed = 0;
            return;
        }
        
        // Calculate WPM
        const timeSpanMinutes = Math.min(windowMs, now - this.keystrokeTimes[0]) / 60000;
        if (timeSpanMinutes > 0.01) {
            this.typingSpeed = Math.round((this.keystrokeTimes.length / 5) / timeSpanMinutes);
        }
        
        // Ensure minimum speed for active typing
        if (this.keystrokeTimes.length > 0 && this.typingSpeed < 5) {
            this.typingSpeed = Math.max(5, Math.round(this.keystrokeTimes.length));
        }
        
        console.log('Typing speed:', this.typingSpeed, 'WPM');
    }
    
    adaptMusic() {
        const timeSinceActivity = (Date.now() - this.lastActivityTime) / 1000;
        const range = this.musicModes[this.currentMode].bpmRange;
        
        // Determine activity state and target BPM
        let newState = 'Idle';
        let targetBPM = range[1];
        
        if (timeSinceActivity < 3) {
            if (this.typingSpeed > 60) {
                newState = 'High Productivity';
                targetBPM = range[0];
            } else if (this.typingSpeed > 30) {
                newState = 'Moderate Productivity';
                targetBPM = range[0] + (range[1] - range[0]) * 0.5;
            } else if (this.typingSpeed > 0) {
                newState = 'Low Productivity';
                targetBPM = range[0] + (range[1] - range[0]) * 0.7;
            }
        }
        
        // Update state
        if (newState !== this.activityState) {
            this.activityState = newState;
            console.log('Activity state changed to:', newState);
        }
        
        // Smooth BPM transition
        const bpmDiff = targetBPM - this.currentBPM;
        if (Math.abs(bpmDiff) > 1) {
            this.currentBPM += bpmDiff * this.settings.bpmSmoothingFactor;
            this.sessionData.adaptationCount++;
            
            console.log('BPM adapted to:', Math.round(this.currentBPM));
            
            // Update BPM indicator
            this.updateBPMIndicator();
            
            // Update music adaptation status
            this.updateMusicAdaptationStatus('Adapting');
            setTimeout(() => this.updateMusicAdaptationStatus('Stable'), 1500);
        }
        
        // Regenerate music if significant change
        if (this.isPlaying && Math.abs(bpmDiff) > 5) {
            this.generateMusic();
        }
    }
    
    updateBPMIndicator() {
        const bpmBar = document.getElementById('bpmBar');
        if (bpmBar) {
            const range = this.musicModes[this.currentMode].bpmRange;
            const percentage = Math.min(100, Math.max(0, 
                ((this.currentBPM - range[0]) / (range[1] - range[0])) * 100
            ));
            bpmBar.style.width = percentage + '%';
        }
    }
    
    updateActivityIndicators(isActive = false) {
        const keyboardIndicator = document.getElementById('keyboardIndicator');
        const musicIndicator = document.getElementById('musicIndicator');
        
        if (keyboardIndicator) {
            const statusEl = keyboardIndicator.querySelector('.indicator-status');
            if (isActive) {
                keyboardIndicator.classList.add('active');
                if (statusEl) statusEl.textContent = 'Active';
            } else {
                keyboardIndicator.classList.remove('active');
                if (statusEl) statusEl.textContent = 'Inactive';
            }
        }
        
        if (musicIndicator) {
            const statusEl = musicIndicator.querySelector('.indicator-status');
            const isAdapting = Math.abs(this.currentBPM - this.targetBPM) > 2;
            if (isAdapting && this.isPlaying) {
                musicIndicator.classList.add('active');
                if (statusEl) statusEl.textContent = 'Yes';
            } else {
                musicIndicator.classList.remove('active');
                if (statusEl) statusEl.textContent = this.isPlaying ? 'Stable' : 'No';
            }
        }
    }
    
    updateMusicAdaptationStatus(status) {
        const element = document.getElementById('musicAdaptationStatus');
        if (element) {
            element.textContent = status;
        }
    }
    
    updateTextStats() {
        const elements = [
            { id: 'charCount', value: this.characterCount },
            { id: 'wordCount', value: this.wordCount },
            { id: 'lastActivity', value: this.formatLastActivity() }
        ];
        
        elements.forEach(({ id, value }) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
    
    formatLastActivity() {
        if (!this.isMonitoring) return 'Not monitoring';
        
        const timeSince = (Date.now() - this.lastActivityTime) / 1000;
        if (timeSince < 1) return 'Now';
        if (timeSince < 60) return `${Math.floor(timeSince)}s ago`;
        return `${Math.floor(timeSince / 60)}m ago`;
    }
    
    trackMouseActivity() {
        this.lastActivityTime = Date.now();
        this.mouseActivity = 'Active';
    }
    
    toggleMusic() {
        if (this.isPlaying) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
    }
    
    startMusic() {
        if (!this.audioContext || this.isPlaying) return;
        
        console.log('Starting music...');
        
        this.isPlaying = true;
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.textContent = '⏸ Pause';
            playPauseBtn.classList.add('btn--active');
        }
        
        this.updateStatus('audio', 'Playing', 'success');
        
        // Generate music
        this.generateMusic();
        
        // Set up interval
        this.musicInterval = setInterval(() => {
            if (this.isPlaying) {
                this.generateMusic();
            }
        }, 3000);
    }
    
    stopMusic() {
        console.log('Stopping music...');
        
        this.isPlaying = false;
        const playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) {
            playPauseBtn.textContent = '▶ Play';
            playPauseBtn.classList.remove('btn--active');
        }
        
        this.updateStatus('audio', this.isMonitoring ? 'Ready' : 'Inactive', 'warning');
        
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        
        // Stop oscillators
        this.currentOscillators.forEach(osc => {
            try { osc.stop(); } catch (e) {}
        });
        this.currentOscillators = [];
    }
    
    generateMusic() {
        if (!this.audioContext || !this.isPlaying) return;
        
        try {
            // Clear old oscillators
            this.currentOscillators.forEach(osc => {
                try { osc.stop(); } catch (e) {}
            });
            this.currentOscillators = [];
            
            const progression = this.chordProgressions[this.currentProgression];
            const baseFreq = progression[this.currentChord];
            
            // Create bass
            this.createOscillator(baseFreq / 2, 'sine', 0.1, 0.1);
            
            // Create chord
            const chordTones = [baseFreq, baseFreq * 1.25, baseFreq * 1.5];
            chordTones.forEach((freq, index) => {
                this.createOscillator(freq, this.getWaveform(), 0.06, 0.1 + index * 0.05);
            });
            
            // Move to next chord
            this.currentChord = (this.currentChord + 1) % progression.length;
            if (this.currentChord === 0) {
                this.currentProgression = (this.currentProgression + 1) % this.chordProgressions.length;
            }
            
        } catch (error) {
            console.error('Music generation error:', error);
        }
    }
    
    createOscillator(frequency, waveform, volume, delay) {
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = waveform;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // Envelope
            const startTime = this.audioContext.currentTime + delay;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 2.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 3);
            
            this.currentOscillators.push(oscillator);
            
        } catch (error) {
            console.error('Oscillator creation error:', error);
        }
    }
    
    getWaveform() {
        const waveforms = {
            pad: 'sine',
            piano: 'triangle',
            synth: 'sawtooth',
            bass: 'square',
            strings: 'sine'
        };
        return waveforms[this.currentInstrument] || 'sine';
    }
    
    updateVolume(value) {
        this.settings.volumeLevel = parseFloat(value);
        if (this.masterGain) {
            this.masterGain.gain.value = this.settings.volumeLevel;
        }
        const volumeValue = document.getElementById('volumeValue');
        if (volumeValue) {
            volumeValue.textContent = Math.round(value * 100) + '%';
        }
    }
    
    changeMusicMode(mode) {
        console.log('Changing music mode to:', mode);
        this.currentMode = mode;
        
        const currentModeEl = document.getElementById('currentMode');
        if (currentModeEl) {
            currentModeEl.textContent = this.musicModes[mode].name;
        }
        
        // Immediately adapt to new mode
        this.adaptMusic();
    }
    
    changeInstrument(instrument) {
        this.currentInstrument = instrument;
        if (this.isPlaying) {
            this.generateMusic();
        }
    }
    
    updateSetting(key, value) {
        this.settings[key] = parseFloat(value);
        
        const mappings = {
            'sensitivity': { id: 'sensitivityValue', format: (v) => Math.round(v * 100) + '%' },
            'idleThresholdSeconds': { id: 'idleValue', format: (v) => v + 's' },
            'bpmSmoothingFactor': { id: 'smoothingValue', format: (v) => Math.round(v * 100) + '%' },
            'activityWindowSize': { id: 'windowValue', format: (v) => v + 's' }
        };
        
        const mapping = mappings[key];
        if (mapping) {
            const element = document.getElementById(mapping.id);
            if (element) {
                element.textContent = mapping.format(value);
            }
        }
    }
    
    setupCharts() {
        // Activity Chart
        const activityCtx = document.getElementById('activityChart');
        if (activityCtx) {
            this.activityChart = new Chart(activityCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Typing Speed (WPM)',
                        data: [],
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, max: 100 } },
                    animation: false
                }
            });
        }
        
        // Music Chart
        const musicCtx = document.getElementById('musicChart');
        if (musicCtx) {
            this.musicChart = new Chart(musicCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'BPM',
                        data: [],
                        borderColor: '#FFC185',
                        backgroundColor: 'rgba(255, 193, 133, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true, max: 150 } },
                    animation: false
                }
            });
        }
    }
    
    updateCharts() {
        if (!this.isMonitoring) return;
        
        const timeLabel = new Date().toLocaleTimeString().substring(0, 5);
        
        // Update activity chart
        if (this.activityChart) {
            this.activityChart.data.labels.push(timeLabel);
            this.activityChart.data.datasets[0].data.push(this.typingSpeed);
            
            if (this.activityChart.data.labels.length > 15) {
                this.activityChart.data.labels.shift();
                this.activityChart.data.datasets[0].data.shift();
            }
            
            this.activityChart.update('none');
        }
        
        // Update music chart
        if (this.musicChart) {
            this.musicChart.data.labels.push(timeLabel);
            this.musicChart.data.datasets[0].data.push(Math.round(this.currentBPM));
            
            if (this.musicChart.data.labels.length > 15) {
                this.musicChart.data.labels.shift();
                this.musicChart.data.datasets[0].data.shift();
            }
            
            this.musicChart.update('none');
        }
    }
    
    updateUI() {
        // Update main metrics
        this.updateMetricValue('typingSpeed', this.typingSpeed);
        this.updateMetricValue('mouseActivity', this.mouseActivity);
        this.updateMetricValue('activityState', this.activityState);
        this.updateMetricValue('currentBPM', Math.round(this.currentBPM));
        
        // Update session time
        if (this.sessionStartTime && this.isMonitoring) {
            const elapsed = Date.now() - this.sessionStartTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            this.updateMetricValue('sessionTime', timeString);
        }
        
        // Update analytics
        this.updateAnalytics();
        this.updateTextStats();
        
        // Update activity indicators
        const timeSinceActivity = (Date.now() - this.lastActivityTime) / 1000;
        this.updateActivityIndicators(timeSinceActivity < 2);
    }
    
    updateMetricValue(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (element && element.textContent !== newValue.toString()) {
            element.textContent = newValue;
            element.classList.add('updated');
            setTimeout(() => element.classList.remove('updated'), 300);
        }
    }
    
    updateAnalytics() {
        if (this.sessionStartTime && this.isMonitoring) {
            const sessionMinutes = (Date.now() - this.sessionStartTime) / 60000;
            if (sessionMinutes > 0.1) {
                this.sessionData.averageWPM = Math.round((this.sessionData.totalKeystrokes / 5) / sessionMinutes);
            }
            
            const activityRatio = Math.min(this.sessionData.totalKeystrokes / Math.max(1, sessionMinutes * 10), 1);
            this.sessionData.productivityScore = Math.round(30 + (activityRatio * 70));
        }
        
        // Update display elements
        this.updateMetricValue('productivityScore', this.sessionData.productivityScore + '%');
        this.updateMetricValue('averageWPM', Math.max(this.sessionData.averageWPM, this.typingSpeed));
        this.updateMetricValue('adaptationCount', this.sessionData.adaptationCount);
        
        // Update active time
        if (this.sessionStartTime && this.isMonitoring) {
            const totalTime = Date.now() - this.sessionStartTime;
            const minutes = Math.floor(totalTime / 60000);
            const seconds = Math.floor((totalTime % 60000) / 1000);
            const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            this.updateMetricValue('activeTime', timeString);
        }
    }
    
    updateStatus(type, status, state) {
        const element = document.getElementById(type + 'Status');
        if (element) {
            element.textContent = status;
            element.className = `status-value ${state}`;
        }
    }
    
    startUpdateLoop() {
        this.updateInterval = setInterval(() => {
            this.updateUI();
            this.updateCharts();
            
            // Check for idle state
            if (this.isMonitoring) {
                const timeSinceActivity = (Date.now() - this.lastActivityTime) / 1000;
                if (timeSinceActivity > this.settings.idleThresholdSeconds) {
                    if (this.mouseActivity !== 'Inactive') {
                        this.mouseActivity = 'Inactive';
                    }
                }
            }
        }, 1000); // Update every second
    }
}

// Initialize the application
const musicGenerator = new AdaptiveMusicGenerator();

// Global error handling
window.onerror = function(error) {
    console.error('Global error:', error);
    return false;
};