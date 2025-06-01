/**
 * Animation Control System
 * 
 * Centralizes animation throttling and performance optimization
 * across all animation systems in the Sentium Pixel application.
 * 
 * This allows for consistent behavior when inspecting elements,
 * debugging, or when the browser tab is in the background.
 */

// Create a global animation controller
window.animationControl = {
  // Performance and inspection settings
  isInspecting: false,        // True when element inspection is detected
  isTabActive: true,          // Whether the tab is currently visible/active
  isPaused: false,            // Manual pause flag
  
  // Throttling configuration
  frameThrottleRate: 5,       // Only process 1 in X frames when throttling
  frameCounter: 0,            // Counter for throttling frames
  inspectionInterval: 1000,   // How often to check for inspection (ms)
  lastInspectionCheck: 0,     // Last time inspection was checked
  
  // Performance tracking
  lastFrameTimes: [],         // Recent frame durations for performance monitoring
  maxFrameTimes: 20,          // How many frame times to track
  fpsUpdateInterval: 5000,    // How often to update FPS display (ms)
  lastFpsUpdate: 0,           // Last time FPS was calculated
  frameCount: 0,              // Frames since last FPS update
  
  // State tracking
  lastKeyState: {},           // Stores keyboard state for shortcuts
  lastCheckedLayout: null,    // Previously checked element layout
  defaultTargetFps: 60,       // Default target framerate
  
  // Manual controls
  toggleInspectionMode: function(force) {
    if (force === undefined) {
      this.isInspecting = !this.isInspecting;
    } else {
      this.isInspecting = !!force;
    }
    this.updateInspectionIndicator();
    return this.isInspecting ? "Inspection mode enabled" : "Inspection mode disabled";
  },
  
  pause: function() {
    this.isPaused = true;
    document.body.classList.add('animations-paused');
    return "Animations paused";
  },
  
  resume: function() {
    this.isPaused = false;
    document.body.classList.remove('animations-paused');
    return "Animations resumed";
  },
  
  togglePause: function() {
    return this.isPaused ? this.resume() : this.pause();
  },
  
  // Animation frame management
  shouldSkipFrame: function() {
    // Always process when not throttling or pausing
    if (!this.isInspecting && !this.isPaused) return false;
    
    // Always skip when paused
    if (this.isPaused) return true;
    
    // Completely stop animations when inspection mode is active (no throttling)
    if (this.isInspecting) {
      return true; // Skip ALL frames during inspection
    }
    
    // Process this frame
    return false;
  },
  
  // Records frame time for performance tracking
  recordFrameTime: function(deltaTime) {
    // Track frame times for performance monitoring
    this.lastFrameTimes.push(deltaTime);
    if (this.lastFrameTimes.length > this.maxFrameTimes) {
      this.lastFrameTimes.shift();
    }
    
    // Count frames for FPS calculation
    this.frameCount++;
  },
  
  // Detection for inspection mode
  checkForInspection: function(timestamp) {
    // Only check periodically to reduce overhead
    if (timestamp - this.lastInspectionCheck < this.inspectionInterval) return;
    this.lastInspectionCheck = timestamp;
    
    try {
      // Get a core element to check
      const pixel = document.getElementById('conscious-pixel');
      if (!pixel) return;
      
      // Multiple detection methods for different browsers
      
      // Method 1: Check for DevTools attributes
      const hasDevToolsAttributes = 
        pixel.hasAttribute('data-devtools-highlighted') || 
        pixel.hasAttribute('data-selected') ||
        pixel.hasAttribute('data-dev-tools') ||
        document.body.classList.contains('debug-hover');
      
      // Method 2: Check for keyboard modifier keys
      const isKeyboardInspecting = this.lastKeyState && 
                               (this.lastKeyState.shiftKey || 
                                this.lastKeyState.ctrlKey);
      
      // Method 3: Check for subtle layout changes
      let styleDiff = false;
      const currentLayout = pixel.getBoundingClientRect();
      if (this.lastCheckedLayout) {
        // Look for tiny non-rendering changes that might be DevTools
        const epsilon = 0.001;
        styleDiff = 
          Math.abs(currentLayout.width - this.lastCheckedLayout.width) < epsilon ||
          Math.abs(currentLayout.height - this.lastCheckedLayout.height) < epsilon;
      }
      this.lastCheckedLayout = currentLayout;
      
      // Method 4: Performance-based detection
      const performanceDrop = this.lastFrameTimes.length > 10 &&
                            this.lastFrameTimes.reduce((a,b)=>a+b,0)/this.lastFrameTimes.length > 20;
      
      // Method 5: URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const inspectMode = urlParams.get('inspect') === 'true';
      
      // Determine inspection state
      const wasInspecting = this.isInspecting;
      this.isInspecting = 
        hasDevToolsAttributes || 
        styleDiff || 
        isKeyboardInspecting || 
        performanceDrop || 
        inspectMode ||
        document.documentElement.classList.contains('devtools-open');
      
      // Update UI if state changed
      if (wasInspecting !== this.isInspecting) {
        this.updateInspectionIndicator();
      }
    } catch (e) {
      // Ignore errors that might be caused by DevTools itself
      console.debug("Error in inspection detection:", e);
    }
  },
  
  // Update inspection state without visual indicators
  updateInspectionIndicator: function() {
    // No visual indicators as requested - just log to console
    if (this.isInspecting) {
      console.debug('DevTools inspection detected - stopping animations');
    }
  },
  
  // FPS tracking and reporting
  updateFps: function(timestamp) {
    if (timestamp - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      if (this.lastFpsUpdate) {
        const seconds = (timestamp - this.lastFpsUpdate) / 1000;
        const fps = Math.round((this.frameCount / seconds) * 10) / 10;
        const mode = this.isInspecting ? " (INSPECTION MODE)" : 
                    this.isPaused ? " (PAUSED)" : "";
        console.debug(`Animation running at ~${fps} fps${mode}`);
        this.frameCount = 0;
      }
      this.lastFpsUpdate = timestamp;
    }
  },
  
  // Tab visibility handling
  handleVisibilityChange: function() {
    this.isTabActive = document.visibilityState === 'visible';
    // When tab becomes visible again, reset timing to avoid huge delta times
    if (this.isTabActive) {
      this.lastFrameTimes = [];
    }
  }
};

// Set up visibility change handler
document.addEventListener('visibilitychange', () => {
  window.animationControl.handleVisibilityChange();
});

// Set up keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Track key state
  window.animationControl.lastKeyState = {
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    altKey: e.altKey
  };
  
  // Alt+I - Toggle inspection mode
  if (e.key === 'i' && e.altKey && !e.shiftKey && !e.ctrlKey) {
    window.animationControl.toggleInspectionMode();
    e.preventDefault();
  }
  
  // Alt+P - Toggle pause
  if (e.key === 'p' && e.altKey && !e.shiftKey && !e.ctrlKey) {
    window.animationControl.togglePause();
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  // Update key state
  window.animationControl.lastKeyState = {
    shiftKey: e.shiftKey,
    ctrlKey: e.ctrlKey,
    altKey: e.altKey
  };
});

// Add cleanup before unload
window.addEventListener('beforeunload', () => {
  document.body.classList.remove('devtools-inspecting');
  document.body.classList.remove('animations-paused');
});

// Log initialization
console.debug('Animation Control System initialized');

// No additional CSS needed for pause indicator as we don't want visual indicators
document.addEventListener('DOMContentLoaded', () => {
  // Initialize any necessary DOM elements without visual indicators
});
