class ArcadeAudio {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.isPlaying = false;
        this.currentNote = 0;
        this.tempo = 140; // BPM similar to Donkey Kong
        this.musicMuted = false;
        this.sfxMuted = false;
        this.loadPreferences();
        
        // Donkey Kong style melody pattern
        this.melody = [
            { note: 'C4', duration: 0.25 },
            { note: 'E4', duration: 0.25 },
            { note: 'G4', duration: 0.25 },
            { note: 'E4', duration: 0.25 },
            { note: 'C4', duration: 0.25 },
            { note: 'E4', duration: 0.25 },
            { note: 'G4', duration: 0.25 },
            { note: 'E4', duration: 0.25 },
            
            { note: 'D4', duration: 0.25 },
            { note: 'F4', duration: 0.25 },
            { note: 'A4', duration: 0.25 },
            { note: 'F4', duration: 0.25 },
            { note: 'D4', duration: 0.25 },
            { note: 'F4', duration: 0.25 },
            { note: 'A4', duration: 0.25 },
            { note: 'F4', duration: 0.25 },
            
            { note: 'E4', duration: 0.25 },
            { note: 'G4', duration: 0.25 },
            { note: 'B4', duration: 0.25 },
            { note: 'G4', duration: 0.25 },
            { note: 'E4', duration: 0.25 },
            { note: 'G4', duration: 0.25 },
            { note: 'B4', duration: 0.25 },
            { note: 'G4', duration: 0.25 },
            
            { note: 'C5', duration: 0.5 },
            { note: 'G4', duration: 0.25 },
            { note: 'E4', duration: 0.25 },
            { note: 'C4', duration: 0.5 },
            { note: 'G3', duration: 0.25 },
            { note: 'C4', duration: 0.25 }
        ];
        
        // Bass line pattern
        this.bass = [
            { note: 'C3', duration: 0.5 },
            { note: 'G2', duration: 0.5 },
            { note: 'C3', duration: 0.5 },
            { note: 'G2', duration: 0.5 },
            
            { note: 'D3', duration: 0.5 },
            { note: 'A2', duration: 0.5 },
            { note: 'D3', duration: 0.5 },
            { note: 'A2', duration: 0.5 },
            
            { note: 'E3', duration: 0.5 },
            { note: 'B2', duration: 0.5 },
            { note: 'E3', duration: 0.5 },
            { note: 'B2', duration: 0.5 },
            
            { note: 'C3', duration: 0.5 },
            { note: 'G2', duration: 0.5 },
            { note: 'C3', duration: 0.5 },
            { note: 'C2', duration: 0.5 }
        ];
        
        this.noteFrequencies = {
            'C2': 65.41, 'D2': 73.42, 'E2': 82.41, 'F2': 87.31, 'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77
        };
    }
    
    init() {
        if (this.audioContext) return;
        
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create gain nodes
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.audioContext.destination);
        
        this.musicGain = this.audioContext.createGain();
        this.musicGain.gain.value = 0.5;
        this.musicGain.connect(this.masterGain);
        
        this.sfxGain = this.audioContext.createGain();
        this.sfxGain.gain.value = 0.7;
        this.sfxGain.connect(this.masterGain);
    }
    
    createOscillator(frequency, type = 'square') {
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        return oscillator;
    }
    
    playNote(frequency, duration, gain, type = 'square', startTime = 0) {
        const oscillator = this.createOscillator(frequency, type);
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(gain);
        
        const now = this.audioContext.currentTime + startTime;
        
        // Retro envelope
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(1, now + 0.01);
        gainNode.gain.setValueAtTime(1, now + duration - 0.01);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    startMusic() {
        if (!this.audioContext) this.init();
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.applyPreferences();
        if (!this.musicMuted) {
            this.playMusicLoop();
        }
    }
    
    playMusicLoop() {
        if (!this.isPlaying || this.musicMuted) return;
        
        const beatDuration = 60 / this.tempo;
        let currentTime = 0;
        
        // Play melody
        this.melody.forEach((note, index) => {
            const frequency = this.noteFrequencies[note.note];
            if (frequency) {
                this.playNote(frequency, note.duration * beatDuration, this.musicGain, 'square', currentTime);
            }
            currentTime += note.duration * beatDuration;
        });
        
        // Play bass
        currentTime = 0;
        this.bass.forEach((note, index) => {
            const frequency = this.noteFrequencies[note.note];
            if (frequency) {
                this.playNote(frequency, note.duration * beatDuration, this.musicGain, 'triangle', currentTime);
            }
            currentTime += note.duration * beatDuration;
        });
        
        // Loop the music
        setTimeout(() => {
            if (this.isPlaying) {
                this.playMusicLoop();
            }
        }, currentTime * 1000);
    }
    
    stopMusic() {
        this.isPlaying = false;
    }
    
    // Sound effects
    playHitSound() {
        if (!this.audioContext || this.sfxMuted) return;
        this.init();
        
        // Quick ascending blip
        const oscillator = this.createOscillator(200, 'square');
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        const now = this.audioContext.currentTime;
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        
        gainNode.gain.setValueAtTime(1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }
    
    playScoreSound() {
        if (!this.audioContext || this.sfxMuted) return;
        this.init();
        
        // Descending sound for scoring
        const notes = [800, 600, 400, 200];
        notes.forEach((freq, index) => {
            this.playNote(freq, 0.1, this.sfxGain, 'square', index * 0.1);
        });
    }
    
    playShootSound() {
        if (!this.audioContext || this.sfxMuted) return;
        this.init();
        
        // Laser-like sound
        const oscillator = this.createOscillator(1000, 'sawtooth');
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        const now = this.audioContext.currentTime;
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        oscillator.start(now);
        oscillator.stop(now + 0.15);
    }
    
    playImmobilizeSound() {
        if (!this.audioContext || this.sfxMuted) return;
        this.init();
        
        // Buzzing sound for immobilization
        const oscillator = this.createOscillator(50, 'square');
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        const now = this.audioContext.currentTime;
        
        // Create vibrato effect
        const lfo = this.audioContext.createOscillator();
        lfo.frequency.value = 10;
        const lfoGain = this.audioContext.createGain();
        lfoGain.gain.value = 20;
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        oscillator.start(now);
        lfo.start(now);
        oscillator.stop(now + 0.3);
        lfo.stop(now + 0.3);
    }
    
    playGameStartSound() {
        if (!this.audioContext || this.sfxMuted) return;
        this.init();
        
        // Rising fanfare
        const notes = [200, 300, 400, 500, 600];
        notes.forEach((freq, index) => {
            this.playNote(freq, 0.1, this.sfxGain, 'square', index * 0.05);
        });
    }
    
    playGameOverSound() {
        if (!this.audioContext || this.sfxMuted) return;
        this.init();
        
        // Victory fanfare
        const notes = [
            { freq: 523.25, delay: 0 },     // C5
            { freq: 523.25, delay: 0.15 },  // C5
            { freq: 523.25, delay: 0.3 },   // C5
            { freq: 659.25, delay: 0.45 },  // E5
            { freq: 783.99, delay: 0.75 },  // G5
            { freq: 659.25, delay: 0.9 },   // E5
            { freq: 783.99, delay: 1.05 }   // G5
        ];
        
        notes.forEach(note => {
            this.playNote(note.freq, 0.2, this.sfxGain, 'square', note.delay);
        });
    }
    
    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicMuted ? 0 : 0.5;
        }
        this.savePreferences();
        return !this.musicMuted;
    }
    
    toggleSFX() {
        this.sfxMuted = !this.sfxMuted;
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxMuted ? 0 : 0.7;
        }
        this.savePreferences();
        return !this.sfxMuted;
    }
    
    savePreferences() {
        localStorage.setItem('battlePongMusicMuted', this.musicMuted);
        localStorage.setItem('battlePongSFXMuted', this.sfxMuted);
    }
    
    loadPreferences() {
        this.musicMuted = localStorage.getItem('battlePongMusicMuted') === 'true';
        this.sfxMuted = localStorage.getItem('battlePongSFXMuted') === 'true';
    }
    
    applyPreferences() {
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicMuted ? 0 : 0.5;
        }
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.sfxMuted ? 0 : 0.7;
        }
    }
}

// Create global audio instance
const arcadeAudio = new ArcadeAudio();