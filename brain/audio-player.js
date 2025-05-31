// Noesis Audio Player
// Plays random music tracks from the sounds folder in an infinite loop

/**
 * Audio player system for Noesis project
 * Features:
 * - Plays music from the sounds folder
 * - Automatically changes to a random song when each song finishes
 * - Creates an infinite random playback loop
 * - Plays a click sound when mouse interacts with the pixel
 */

document.addEventListener('DOMContentLoaded', function() {
  // Volume configuration
  const volumeSettings = {
    music: 1.0,     // Music volume (0.0 to 1.0)
    clickSound: 1.0, // Click sound volume (0.0 to 1.0)
    // Volume adjustments for all tracks to ensure consistent output volume
    // All tracks are normalized to the same perceived loudness level (0.7)
    trackAdjustments: {
      // Music track adjustments - normalized for consistent volume output
      // Format: 'filename.mp3': volumeMultiplier
      'sounds/8-bit-music-1.mp3': 0.7,  // Normalized volume
      'sounds/8-bit-music-2.mp3': 0.7,  // Normalized volume
      'sounds/8-bit-music-3.mp3': 1.4,  // Normalized volume
      'sounds/8-bit-music-4.mp3': 1.4,  // Normalized volume
      'sounds/8-bit-music-5.mp3': 0.7,  // Normalized volume
      'sounds/8-bit-music-6.mp3': 1.4,  // Normalized volume
      'sounds/8-bit-music-7.mp3': 0.7,  // Normalized volume
      'sounds/8-bit-music-8.mp3': 0.7,  // Normalized volume
      'sounds/8-bit-music-9.mp3': 0.7,  // Normalized volume
      'sounds/8-bit-music-10.mp3': 0.3, // Normalized volume
      'sounds/8-bit-music-11.mp3': 1.4, // Normalized volume
      'sounds/8-bit-music-12.mp3': 0.7, // Normalized volume
      'sounds/8-bit-music-13.mp3': 0.7, // Normalized volume
      'sounds/8-bit-music-14.mp3': 0.7, // Normalized volume
      'sounds/8-bit-music-15.mp3': 0.7, // Normalized volume
      'sounds/8-bit-music-16.mp3': 0.7, // Normalized volume
      'sounds/8-bit-music-17.mp3': 0.7, // Normalized volume
      'sounds/8-bit-music-18.mp3': 1.4, // Normalized volume
      'sounds/8-bit-music-19.mp3': 0.3, // Normalized volume
      'sounds/8-bit-music-20.mp3': 0.7, // Normalized volume
      'sounds/8-bit-music-21.mp3': 0.7, // Normalized volume
      'sounds/8-bit-music-22.mp3': 1.4, // Normalized volume
      'sounds/8-bit-music-23.mp3': 1.4, // Normalized volume

      // Click sound adjustments - normalized for consistent volume output
      'sounds/click-1.mp3': 0.7,        // Normalized volume
      'sounds/click-2.mp3': 0.7,        // Normalized volume
      'sounds/click-3.mp3': 1.4,        // Normalized volume
      'sounds/click-4.mp3': 0.7,        // Normalized volume
      'sounds/click-5.mp3': 0.7,        // Normalized volume
      'sounds/click-6.mp3': 0.7,        // Normalized volume
      'sounds/click-7.mp3': 0.7,        // Normalized volume
      'sounds/click-8.mp3': 0.7,        // Normalized volume
      'sounds/click-9.mp3': 0.3,        // Normalized volume
      'sounds/click-10.mp3': 0.7        // Normalized volume
    }
  };

  // Audio tracks configuration
  const audioTracks = [
    'sounds/8-bit-music-1.mp3',
    'sounds/8-bit-music-2.mp3',
    'sounds/8-bit-music-3.mp3',
    'sounds/8-bit-music-4.mp3',
    'sounds/8-bit-music-5.mp3',
    'sounds/8-bit-music-6.mp3',
    'sounds/8-bit-music-7.mp3',
    'sounds/8-bit-music-8.mp3',
    'sounds/8-bit-music-9.mp3',
    'sounds/8-bit-music-10.mp3',
    'sounds/8-bit-music-11.mp3',
    'sounds/8-bit-music-12.mp3',
    'sounds/8-bit-music-13.mp3',
    'sounds/8-bit-music-14.mp3',
    'sounds/8-bit-music-15.mp3',
    'sounds/8-bit-music-16.mp3',
    'sounds/8-bit-music-17.mp3',
    'sounds/8-bit-music-18.mp3',
    'sounds/8-bit-music-19.mp3',
    'sounds/8-bit-music-20.mp3',
    'sounds/8-bit-music-21.mp3',
    'sounds/8-bit-music-22.mp3',
    'sounds/8-bit-music-23.mp3'
  ];
  
  // Sound effects configuration
  const clickSounds = [
    'sounds/click-1.mp3',
    'sounds/click-2.mp3',
    'sounds/click-3.mp3',
    'sounds/click-4.mp3',
    'sounds/click-5.mp3',
    'sounds/click-6.mp3',
    'sounds/click-7.mp3',
    'sounds/click-8.mp3',
    'sounds/click-9.mp3'
  ];
  let clickSoundPlayer = null;
  
  // Audio player variables
  let audioPlayer = null;
  let currentTrackIndex = -1;
  let lastClickSoundIndex = -1;
  let isPlaying = false;
  
  // Create and configure the audio player
  function initAudioPlayer() {
    audioPlayer = new Audio();
    
    // Set up event listeners
    audioPlayer.addEventListener('ended', playNextRandomTrack);
    audioPlayer.addEventListener('error', handleAudioError);
    
    // Initialize click sound player with the first sound in the array
    clickSoundPlayer = new Audio(clickSounds[0]);
    clickSoundPlayer.volume = volumeSettings.clickSound;
    clickSoundPlayer.preload = 'auto';
    
    // Get the toggle switch
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
      // Ensure toggle is UNCHECKED by default (sound off)
      soundToggle.checked = false;
      
      // Set up event listener for toggle changes
      soundToggle.addEventListener('change', function() {
        if (this.checked) {
          // Toggle is ON - play sound
          if (!isPlaying) {
            playNextRandomTrack();
          } else {
            audioPlayer.play();
          }
        } else {
          // Toggle is OFF - pause sound
          if (audioPlayer && isPlaying) {
            audioPlayer.pause();
            isPlaying = false;
          }
        }
      });
    } else {
      console.warn('Sound toggle not found for audio control');
    }
    
    // Set up click sound (now only for toggle clicks)
    setupClickSound();
  }
  
  // Set up click sound for various interactions
  function setupClickSound() {
    // Add click sound to the sound toggle
    const soundToggle = document.getElementById('sound-toggle');
    if (!soundToggle) {
      console.warn('Sound toggle not found for sound effect');
    } else {
      // Play click sound when toggle is clicked AND switched ON
      soundToggle.addEventListener('change', () => {
        if (soundToggle.checked) {
          playClickSound();
        }
      });
    }
    
    // Add click sound to all clickable elements with class 'clickable'
    const clickableElements = document.querySelectorAll('.clickable');
    clickableElements.forEach(element => {
      element.addEventListener('click', () => {
        // Only play if sound is enabled
        if (document.getElementById('sound-toggle')?.checked) {
          playClickSound();
        }
      });
    });
    
    // Add click sound to the main pixel element if it exists
    const pixelElement = document.getElementById('pixel');
    if (pixelElement) {
      pixelElement.addEventListener('click', () => {
        if (document.getElementById('sound-toggle')?.checked) {
          playClickSound();
        }
      });
    }
  }
  
  // Play the click sound when interactive elements are used
  function playClickSound() {
    // First check if toggle is off - if so, don't play sound
    const soundToggle = document.getElementById('sound-toggle');
    if (!soundToggle || !soundToggle.checked) {
      // Toggle is off or not found, don't play sound
      return;
    }
    
    if (!clickSoundPlayer) {
      console.warn('Click sound player not initialized');
      return;
    }
    
    // Randomly select one of the click sounds, but avoid repeating the last sound
    let randomIndex;
    if (clickSounds.length > 1) {
      do {
        randomIndex = Math.floor(Math.random() * clickSounds.length);
      } while (randomIndex === lastClickSoundIndex);
    } else {
      randomIndex = 0;
    }
    
    // Update the last played sound index
    lastClickSoundIndex = randomIndex;
    const randomClickSound = clickSounds[randomIndex];
    
    // Create a new Audio instance each time with a random click sound
    // This ensures sounds can overlap if clicked rapidly
    const soundInstance = new Audio(randomClickSound);
    
    // Apply normalized volume from trackAdjustments to ensure consistent output
    let adjustedVolume = volumeSettings.clickSound;
    if (volumeSettings.trackAdjustments[randomClickSound]) {
      adjustedVolume *= volumeSettings.trackAdjustments[randomClickSound];
    }
    soundInstance.volume = adjustedVolume;
    
    // Log the click sound being played (helpful for debugging)
    console.log(`Playing click sound: ${randomClickSound} (Normalized Volume: ${adjustedVolume.toFixed(2)})`);
    
    // Show click sound status
    showClickSoundIndicator(randomClickSound, adjustedVolume);
    
    soundInstance.play().catch(error => {
      console.warn('Could not play click sound:', error);
    });
  }
  
  // Play a random track, ensuring it's different from the current one if possible
  function playNextRandomTrack() {
    if (audioTracks.length === 0) {
      console.error('No audio tracks available');
      return;
    }
    
    let nextTrackIndex;
    
    // If we have more than one track, make sure we pick a different one
    if (audioTracks.length > 1) {
      do {
        nextTrackIndex = Math.floor(Math.random() * audioTracks.length);
      } while (nextTrackIndex === currentTrackIndex);
    } else {
      nextTrackIndex = 0;
    }
    
    currentTrackIndex = nextTrackIndex;
    playTrack(audioTracks[currentTrackIndex]);
  }
  
  // Play a specific track
  function playTrack(trackSrc) {
    if (!audioPlayer) return;
    
    // Update the audio source and play
    audioPlayer.src = trackSrc;
    
    // Apply normalized volume from trackAdjustments to ensure consistent output
    let adjustedVolume = volumeSettings.music;
    if (volumeSettings.trackAdjustments[trackSrc]) {
      adjustedVolume *= volumeSettings.trackAdjustments[trackSrc];
    }
    audioPlayer.volume = adjustedVolume;
    
    // Play the track and update state
    const playPromise = audioPlayer.play();
    
    // Handle play() promise to catch any autoplay restrictions
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true;
          console.log(`Now playing: ${trackSrc} (Normalized Volume: ${adjustedVolume.toFixed(2)})`);
          // Show a small status indicator that fades out
          showMusicStatusIndicator(trackSrc);
        })
        .catch(error => {
          console.error('Playback prevented due to browser autoplay policy:', error);
          isPlaying = false;
          
          // Create a user interaction notice if autoplay is blocked
          showAutoplayNotice();
        });
    }
  }
  
  // Create a visual status indicator for audio
  function createStatusIndicator(className, top, backgroundColor) {
    const indicator = document.createElement('div');
    indicator.className = className;
    indicator.style.position = 'fixed';
    indicator.style.top = top + 'px';
    indicator.style.right = '10px';
    indicator.style.background = backgroundColor;
    indicator.style.color = 'white';
    indicator.style.padding = '8px 12px';
    indicator.style.borderRadius = '5px';
    indicator.style.fontSize = '12px';
    indicator.style.zIndex = '1000';
    indicator.style.opacity = '1';  // Start visible
    indicator.style.transition = 'opacity 0.5s';
    indicator.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
    return indicator;
  }

  // Show a small status indicator when a new track starts
  function showMusicStatusIndicator(trackSrc) {
    // Create the status indicator element using the helper function
    const statusIndicator = createStatusIndicator('music-status-indicator', 10, 'rgba(25, 118, 210, 0.8)');
    
    // Add music icon and information
    const trackName = trackSrc.split('/').pop();
    const normalizedVolume = volumeSettings.music * (volumeSettings.trackAdjustments[trackSrc] || 1.0);
    statusIndicator.innerHTML = `<strong>Music:</strong> ${trackName}`;
    
    // Add to the page
    document.body.appendChild(statusIndicator);
    
    // Fade out after 3 seconds
    setTimeout(() => {
      statusIndicator.style.opacity = '0';
      // Remove from DOM after fade out
      setTimeout(() => {
        if (document.body.contains(statusIndicator)) {
          document.body.removeChild(statusIndicator);
        }
      }, 500);
    }, 3000);
  }
  
  // Show a small status indicator for click sounds
  function showClickSoundIndicator(soundSrc, volume) {
    // Create the status indicator element using the helper function
    const statusIndicator = createStatusIndicator('click-sound-indicator', 50, 'rgba(76, 175, 80, 0.8)');
    
    // Add click icon and information
    const soundName = soundSrc.split('/').pop();
    statusIndicator.innerHTML = `<strong>Click:</strong> ${soundName}`;
    
    // Add to the page
    document.body.appendChild(statusIndicator);
    
    // Fade out after 1.5 seconds (shorter than music indicator)
    setTimeout(() => {
      statusIndicator.style.opacity = '0';
      // Remove from DOM after fade out
      setTimeout(() => {
        if (document.body.contains(statusIndicator)) {
          document.body.removeChild(statusIndicator);
        }
      }, 500);
    }, 1500);
  }
  
  // Handle audio playback errors
  function handleAudioError(error) {
    console.error('Audio playback error:', error);
    // Try to play the next track if there's an error
    setTimeout(playNextRandomTrack, 1000);
  }
  
  // Show a notice when autoplay is blocked
  function showAutoplayNotice() {
    // Get position of status bar for proper placement
    const statusBar = document.getElementById('pixel-status');
    const statusBarRect = statusBar ? statusBar.getBoundingClientRect() : { bottom: 40, left: 10 };
    
    // Create notice element
    const notice = document.createElement('div');
    notice.className = 'sound-status';
    notice.style.position = 'fixed';
    notice.style.bottom = 8 + 'px'; // Place 5px below status bar
    notice.style.left = statusBarRect.left + 'px'; // Align with left edge of status bar
    notice.style.background = 'rgba(255, 255, 255, 0.5)'; // Match status bar background
    notice.style.color = 'black'; // Match status bar text color
    notice.style.padding = '5px 10px'; // Match status bar padding
    notice.style.borderRadius = '4px'; // Match status bar border radius
    notice.style.zIndex = '999'; // Just below status bar z-index
    notice.style.fontSize = '13px'; // Match status bar font size
    notice.style.fontFamily = 'var(--font-family)'; // Match status bar font
    notice.style.cursor = 'pointer';
    notice.style.display = 'flex';
    notice.style.alignItems = 'center';
    notice.style.gap = '8px';
    
    notice.innerHTML = '<span>Use the "Play Sound" toggle to enable audio</span>';
    
    document.body.appendChild(notice);
    
    // Adjust status bar position
    if (statusBar) {
      statusBar.style.transition = 'transform 0.3s ease';
      statusBar.style.transform = 'translateY(-' + (notice.offsetHeight + 5) + 'px)';
    }
    
    // Function to handle sound toggle and remove notice
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
      const handleSoundToggle = function() {
        if (soundToggle.checked) {
          // Try to play the music
          playTrack(audioTracks[currentTrackIndex]);
          
          // Restore status bar position
          const statusBar = document.getElementById('pixel-status');
          if (statusBar) {
            statusBar.style.transform = 'translateY(0)';
          }
          
          // Remove notice
          if (document.body.contains(notice)) {
            document.body.removeChild(notice);
          }
          
          // Remove event listener
          soundToggle.removeEventListener('change', handleSoundToggle);
        }
      };
      
      // Enable playback on toggle change
      soundToggle.addEventListener('change', handleSoundToggle);
    }
    
    // Auto-hide notice after 10 seconds
    setTimeout(() => {
      if (document.body.contains(notice)) {
        // Restore status bar position
        if (statusBar) {
          statusBar.style.transform = 'translateY(0)';
        }
        
        // Remove notice
        document.body.removeChild(notice);
      }
    }, 10000);
  }
  
  // Initialize the audio player
  initAudioPlayer();
});
