/**
 * 8-Bit Retro Audio Manager for Sentium Pixels
 * Uses Web Audio API to generate CC0 8-bit style sounds
 * Automatic playback - no user settings required
 */

class RetroAudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.3;
        this.isInitialized = false;
        this.soundQueue = [];
        
        // Initialize on first user interaction
        this.initializeOnFirstInteraction();
    }

    initializeOnFirstInteraction() {
        const initAudio = () => {
            if (!this.isInitialized) {
                this.initializeAudioContext();
                document.removeEventListener('click', initAudio);
                document.removeEventListener('touchstart', initAudio);
                document.removeEventListener('mousemove', initAudio);
            }
        };

        document.addEventListener('click', initAudio);
        document.addEventListener('touchstart', initAudio);
        document.addEventListener('mousemove', initAudio);
    }

    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isInitialized = true;
            
            // Process any queued sounds
            this.soundQueue.forEach(sound => this.playSound(sound.type, sound.params));
            this.soundQueue = [];
            
            console.log('Retro Audio Manager initialized');
        } catch (error) {
            console.warn('Audio not supported:', error);
        }
    }

    // Generate 8-bit style oscillator with envelope
    createOscillator(frequency, type = 'square', duration = 0.1) {
        if (!this.audioContext) return null;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // 8-bit envelope: quick attack, sustain, quick release
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.masterVolume, now + 0.01); // Quick attack
        gainNode.gain.setValueAtTime(this.masterVolume, now + duration * 0.7); // Sustain
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Quick release
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        return { oscillator, gainNode, duration };
    }

    // Play cube interaction sound (upward arpeggio)
    playCubeInteraction() {
        if (!this.isInitialized) {
            this.soundQueue.push({ type: 'cubeInteraction' });
            return;
        }

        const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const sound = this.createOscillator(freq, 'square', 0.08);
                if (sound) {
                    sound.oscillator.start();
                    sound.oscillator.stop(this.audioContext.currentTime + sound.duration);
                }
            }, index * 40);
        });
    }

    // Play cube growth sound (rising tone)
    playCubeGrowth() {
        if (!this.isInitialized) {
            this.soundQueue.push({ type: 'cubeGrowth' });
            return;
        }

        const sound = this.createOscillator(220, 'sawtooth', 0.3);
        if (sound) {
            // Rising frequency for growth feeling
            sound.oscillator.frequency.exponentialRampToValueAtTime(
                440, 
                this.audioContext.currentTime + 0.3
            );
            sound.oscillator.start();
            sound.oscillator.stop(this.audioContext.currentTime + sound.duration);
        }
    }

    // Play cube spawn sound (sparkle)
    playCubeSpawn() {
        if (!this.isInitialized) {
            this.soundQueue.push({ type: 'cubeSpawn' });
            return;
        }

        // Multiple quick tones for sparkle effect
        const frequencies = [880, 1108, 1396, 1760];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const sound = this.createOscillator(freq, 'triangle', 0.06);
                if (sound) {
                    sound.oscillator.start();
                    sound.oscillator.stop(this.audioContext.currentTime + sound.duration);
                }
            }, index * 20);
        });
    }

    // Play hover/proximity sound (soft beep)
    playHover() {
        if (!this.isInitialized) {
            this.soundQueue.push({ type: 'hover' });
            return;
        }

        const sound = this.createOscillator(440, 'sine', 0.05);
        if (sound) {
            // Lower volume for hover
            sound.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            sound.gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.audioContext.currentTime + 0.005);
            sound.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + sound.duration);
            
            sound.oscillator.start();
            sound.oscillator.stop(this.audioContext.currentTime + sound.duration);
        }
    }

    // Play cluster formation sound (chord)
    playClusterFormation() {
        if (!this.isInitialized) {
            this.soundQueue.push({ type: 'clusterFormation' });
            return;
        }

        // Play a major chord
        const frequencies = [261.63, 329.63, 392.00]; // C4, E4, G4
        frequencies.forEach(freq => {
            const sound = this.createOscillator(freq, 'square', 0.4);
            if (sound) {
                // Slightly lower volume for chord
                sound.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                sound.gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.6, this.audioContext.currentTime + 0.02);
                sound.gainNode.gain.setValueAtTime(this.masterVolume * 0.6, this.audioContext.currentTime + 0.3);
                sound.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + sound.duration);
                
                sound.oscillator.start();
                sound.oscillator.stop(this.audioContext.currentTime + sound.duration);
            }
        });
    }

    // Play ambient background pulse (very subtle)
    playAmbientPulse() {
        if (!this.isInitialized) return;

        const sound = this.createOscillator(55, 'sine', 1.0); // Low A
        if (sound) {
            // Very low volume for ambient
            sound.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            sound.gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.05, this.audioContext.currentTime + 0.5);
            sound.gainNode.gain.linearRampToValueAtTime(0.001, this.audioContext.currentTime + 1.0);
            
            sound.oscillator.start();
            sound.oscillator.stop(this.audioContext.currentTime + sound.duration);
        }
    }

    // Play mouse movement sound (very subtle tick)
    playMouseMove() {
        if (!this.isInitialized) return;
        
        // Throttle mouse move sounds
        if (this.lastMouseSound && Date.now() - this.lastMouseSound < 100) return;
        this.lastMouseSound = Date.now();

        const sound = this.createOscillator(1760, 'square', 0.02);
        if (sound) {
            // Very quiet for mouse movement
            sound.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            sound.gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.1, this.audioContext.currentTime + 0.005);
            sound.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + sound.duration);
            
            sound.oscillator.start();
            sound.oscillator.stop(this.audioContext.currentTime + sound.duration);
        }
    }

    // Generic method to play any sound
    playSound(type, params = {}) {
        if (!this.isInitialized) {
            this.soundQueue.push({ type, params });
            return;
        }
    }
}

// Initialize global audio manager
window.retroAudio = new RetroAudioManager();

// Auto-play ambient sounds every 10 seconds
setInterval(() => {
    if (window.retroAudio && window.retroAudio.isInitialized) {
        window.retroAudio.playAmbientPulse();
    }
}, 10000);
