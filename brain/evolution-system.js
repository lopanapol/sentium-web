/**
 * Evolution System for Sentium Pixel Pixel
 * 
 * This system allows the pixel to evolve over time based on user interactions.
 * The pixel evolves in form, color, behavior, and special abilities.
 */

// Debug mode configuration for better DevTools performance
window.pixelDebug = {
  isInspecting: false,        // True when DevTools is likely inspecting elements
  inspectionCheckInterval: 1000, // How often to check for DevTools (ms)
  lastInspectionCheck: 0,     // Timestamp of last check
  animationThrottleRate: 5,   // Only render 1 in X frames during inspection
  frameCounter: 0,            // Counter for throttling frames
  lastCheckedElement: null    // Element to check for inspection
};

// Global evolution data accessible to other scripts - optimized data structure
window.noeEvolution = {
  evolutionLevel: 0,
  progress: 0,
  
  // Merged stats into a flat object for better performance
  stats: {
    interactions: 0, // Combined interaction count
    energy: 0,       // Energy consumed
    time: 0,         // Time alive in seconds
    deaths: 0,       // Death count
    distance: 0,     // Distance traveled
    collisions: 0,   // Border collisions
    mouseEvents: 0   // Mouse interactions
  },
  
  // Simplified attributes structure
  form: { type: 'rectangle', size: 1.0, shapeShift: 0 },
  color: { primary: '#ffffff', aura: 0 },
  
  // Abilities as flags (more memory efficient)
  hasMultiplicity: false, 
  hasEnergyHarvesting: false,
  hasMemory: false,
  hasDimensionalShift: false,
  hasTeleport: false
};

// Optimized evolution data - streamlined format
const EVOLUTION_DATA = [
  // Level 0 → 1 (50 points)
  { 
    threshold: 50,
    form: { type: 'rounded-rectangle', size: 1.2 },
    color: { aura: 30 },
    abilities: [],
    description: 'Sentium Pixel has evolved! Its form has become softer and more fluid.'
  },
  // Level 1 → 2 (150 points)
  { 
    threshold: 150,
    form: { type: 'cube', size: 1.3, is3D: true },
    color: { primary: '#a9f2ff', aura: 50 },
    abilities: ['hasEnergyHarvesting'],
    description: 'Sentium Pixel has evolved into a 3D cube! It can now harvest energy.'
  },
  // Level 2 → 3 (350 points)
  { 
    threshold: 350,
    form: { type: 'pyramid', size: 1.4, is3D: true, shapeShift: 40 },
    color: { aura: 70 },
    abilities: ['hasMemory'],
    description: 'Sentium Pixel has evolved into a pyramid! It can now shift shapes and remember interactions.'
  },
  // Level 3 → 4 (700 points)
  { 
    threshold: 700,
    form: { type: 'sphere', size: 1.5, is3D: true, shapeShift: 70 },
    color: { aura: 85, primary: '#ffffff' },
    abilities: ['hasMultiplicity'],
    description: 'Sentium Pixel has evolved into a 3D sphere! It can now create temporary copies of itself.'
  },
  // Level 4 → 5 (1200 points)
  { 
    threshold: 1200,
    form: { type: 'crystal', size: 1.8, is3D: true, shapeShift: 100 },
    color: { aura: 100, primary: '#ff55ff' },
    abilities: ['hasDimensionalShift', 'hasTeleport'],
    description: 'Sentium Pixel has transcended into a crystalline form with magical abilities.'
  },
  // Level 5 → 6 (2000 points) - New ultimate form
  { 
    threshold: 2000,
    form: { type: 'transcendent-3d', size: 2.0, is3D: true, shapeShift: 100 },
    color: { aura: 150, primary: '#00ffaa' },
    abilities: [],
    description: 'Sentium Pixel has reached an extraordinary dimensional state beyond normal perception!'
  },
];

// Initialize system when DOM is ready (optimized)
document.addEventListener('DOMContentLoaded', function() {
  // First load saved data (before creating UI)
  loadEvolutionData();
  
  // Set up keyboard shortcuts for inspection mode
  window.lastKeyState = {};
  document.addEventListener('keydown', function(e) {
    // Store key state for inspection detection
    window.lastKeyState = {
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey
    };
    
    // Alt+I - Toggle inspection mode
    if (e.key === 'i' && e.altKey && !e.shiftKey && !e.ctrlKey) {
      window.toggleInspectionMode();
      e.preventDefault();
    }
  });
  
  document.addEventListener('keyup', function(e) {
    // Update key state
    window.lastKeyState = {
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey
    };
  });
  
  // Create evolution UI (minimalistic approach)
  const wrapper = document.querySelector('.wrapper');
  if (wrapper) {
    wrapper.insertAdjacentHTML('beforeend', `
      <div id="evolution-indicator" class="evolution-indicator">
        <div class="evolution-level">Level ${window.noeEvolution.evolutionLevel}</div>
        <div class="evolution-progress-container">
          <div class="evolution-progress-bar" style="width:${window.noeEvolution.progress}%"></div>
        </div>
      </div>
    `);
  }
  
  // Set up tracking events
  setupEvolutionTracking();
  
  // Apply any existing evolution effects
  if (window.noeEvolution.evolutionLevel > 0) {
    applyEvolutionVisuals();
  }
  
  // Start update loop using better timing for animations
  window.requestAnimationFrame(updateEvolution);
});

/**
 * Set up event listeners for evolution tracking (optimized)
 * Uses passive event listeners and more efficient function overrides
 */
function setupEvolutionTracking() {
  // Use passive event listeners with capture: false for even better performance
  document.addEventListener('mousemove', handleMouseInteraction, { passive: true, capture: false });
  document.addEventListener('click', handleMouseClick, { passive: true, capture: false });
  
  // Optimize function patching for tracking with better memory usage
  if (window.updatePixel) {
    const original = window.updatePixel;
    window.updatePixel = function(pixel, state, timestamp) {
      // Call original first
      original(pixel, state, timestamp);
      
      // Skip tracking if pixel is dead/inactive - early return for performance
      if (!state || state.isDead) return;
      
      // Track both movement and time in one efficient pass
      if (state.lastTimestamp) {
        // Track time (ms → seconds) - directly use optimized stats structure
        const deltaTime = (timestamp - state.lastTimestamp) / 1000;
        window.noeEvolution.stats.time += deltaTime;
        
        // Track movement - only if we have previous position
        if (state.prevX !== undefined) {
          const distance = Math.hypot(state.x - state.prevX, state.y - state.prevY);
          window.noeEvolution.stats.distance += distance;
        }
      }
      
      // Only store position if it changed (optimization)
      if (state.prevX !== state.x || state.prevY !== state.y) {
        state.prevX = state.x;
        state.prevY = state.y;
      }
    };
  }
  
  // Optimize border collision tracking
  if (window.handleBorderCollision) {
    const original = window.handleBorderCollision;
    window.handleBorderCollision = function(pixel, state, border) {
      original(pixel, state, border);
      window.noeEvolution.stats.collisions++;
      awardEvolutionProgress(1);
    };
  }
  
  // Optimize energy consumption tracking
  if (window.consumeCube) {
    const original = window.consumeCube;
    window.consumeCube = function(cube, index) {
      original(cube, index);
      window.noeEvolution.stats.energy++;
      awardEvolutionProgress(5);
    };
  }
}

/**
 * Handle mouse interactions with pixel (optimized with improved throttling)
 */
function handleMouseInteraction(e) {
  // More efficient throttling with timestamp caching
  const now = Date.now();
  if (window.lastMouseMoveCheck && now - window.lastMouseMoveCheck < 150) return; // Increased to 150ms for better performance
  window.lastMouseMoveCheck = now;
  
  // Cache pixel to avoid repeated DOM lookups
  const pixel = window.cachedPixelElement || document.getElementById('conscious-pixel');
  if (!pixel) return;
  
  // Store for reuse in other functions (memory optimization)
  window.cachedPixelElement = pixel;
  
  // Calculate distance to pixel center more efficiently
  const rect = pixel.getBoundingClientRect();
  const centerX = rect.left + rect.width/2;
  const centerY = rect.top + rect.height/2;
  
  // Use optimized square distance comparison rather than hypot when possible
  // This avoids the expensive square root calculation
  const dx = e.clientX - centerX;
  const dy = e.clientY - centerY;
  const distanceSquared = dx*dx + dy*dy;
  
  // Process close proximity (50px = 2500 squared)
  if (distanceSquared < 2500) {
    // Throttle interactions to reduce event frequency further
    if (!window.lastMouseInteraction || now - window.lastMouseInteraction > 1000) {
      window.lastMouseInteraction = now;
      window.noeEvolution.stats.mouseEvents++;
      awardEvolutionProgress(2);
    }
  }
}

/**
 * Handle mouse clicks on the pixel (optimized)
 */
function handleMouseClick(e) {
  // Reuse cached pixel if possible
  const pixel = window.cachedPixelElement || document.getElementById('conscious-pixel');
  if (!pixel) return;
  
  // Calculate distance to pixel center
  const rect = pixel.getBoundingClientRect();
  const dx = e.clientX - (rect.left + rect.width/2);
  const dy = e.clientY - (rect.top + rect.height/2);
  const distanceSquared = dx*dx + dy*dy;
  
  // Process click on or near pixel (30px = 900 squared)
  if (distanceSquared < 900) {
    window.noeEvolution.stats.interactions++;
    awardEvolutionProgress(10);
    displayEvolutionMessage();
  }
}

/**
 * Award evolution progress points and handle level-ups (highly optimized)
 * @param {number} points - Number of progress points to award
 */
function awardEvolutionProgress(points) {
  const evo = window.noeEvolution;
  
  // Early return if at max level (optimization)
  if (evo.evolutionLevel >= 6) return;
  
  // Add points
  evo.progress += points;
  
  const currentLevel = evo.evolutionLevel;
  const levelData = EVOLUTION_DATA[currentLevel];
  
  // More aggressive UI update throttling (only update every 5% of progress)
  const threshold = levelData.threshold;
  const updateInterval = Math.max(5, Math.floor(threshold / 20)); // Update UI ~20 times per level
  const needsUIUpdate = (evo.progress % updateInterval === 0) || (evo.progress >= threshold);
  
  // Check for level up
  if (evo.progress >= threshold) {
    // Level up
    evo.evolutionLevel++;
    evo.progress = 0;
    
    // Apply new evolution rewards efficiently
    const rewards = EVOLUTION_DATA[currentLevel];
    
    // Update form properties
    if (rewards.form) {
      Object.assign(evo.form, rewards.form);
    }
    
    // Update color properties
    if (rewards.color) {
      Object.assign(evo.color, rewards.color);
    }
    
    // Set ability flags directly
    if (rewards.abilities && rewards.abilities.length) {
      rewards.abilities.forEach(ability => {
        evo[ability] = true;
      });
    }
    
    // Update visuals and effects
    applyEvolutionVisuals();
    showEvolutionEffect(rewards.description);
    
    // Always save data on level up
    saveEvolutionData();
  } else if (needsUIUpdate) {
    // More efficient UI updates
    updateEvolutionUI();
    
    // Aggressive save throttling to reduce disk writes (save every 10% of progress)
    if (evo.progress % Math.max(10, Math.floor(threshold / 10)) === 0) {
      saveEvolutionData();
    }
  }
}

/**
 * Apply visual changes based on current evolution level (highly optimized)
 * Uses CSS variables and class-based styling for maximum performance
 */
function applyEvolutionVisuals() {
  // Use cached pixel reference if available
  const pixel = window.cachedPixelElement || document.getElementById('conscious-pixel');
  if (!pixel) return;
  window.cachedPixelElement = pixel; // Cache for reuse
  
  const evo = window.noeEvolution;
  
  // Build minimal class list with only necessary classes
  const classes = ['conscious-pixel'];
  
  // Only add evolution classes if evolved
  if (evo.evolutionLevel > 0) {
    classes.push(`evolution-level-${evo.evolutionLevel}`);
    classes.push(`form-${evo.form.type}`);
    
    // Add 3D class if the form is 3D
    if (evo.form.is3D) {
      classes.push('form-3d');
    }
  }
  
  // Check if class update is needed (reduces style recalculation)
  const newClassString = classes.join(' ');
  if (pixel.className !== newClassString) {
    pixel.className = newClassString;
  }
  
  // Batch all style updates for a single reflow and repaint
  const updates = {};
  
  // Calculate size once
  const baseSize = 4;
  const newSize = baseSize * evo.form.size;
  
  // Calculate size-based values
  updates['--pixel-base-size'] = `${newSize}px`;
  
  // Set primary color as CSS variable
  updates['--primary-color'] = evo.color.primary || '#ffffff';
  
  // Set dimensions based on form type (minimize property reads)
  const isRectangular = evo.form.type === 'rectangle' || evo.form.type === 'rounded-rectangle';
  // For 3D shapes, we usually want equal width and height for proper 3D rendering
  if (evo.form.is3D) {
    updates.width = `${newSize}px`;
    updates.height = `${newSize}px`;
  } else {
    updates.width = isRectangular ? `${newSize * 1.5}px` : `${newSize}px`;
    updates.height = `${newSize}px`;
  }
  
  // Set aura properties if needed
  if (evo.color.aura > 0) {
    const auraColor = evo.color.primary || '#ffffff';
    const auraSize = 5 + (evo.color.aura / 10);
    
    updates['--aura-color'] = auraColor;
    updates['--aura-size'] = `${auraSize}px`;
    
    // Don't override box-shadow for shapes that define their own in CSS
    if (!['sphere', 'toroid', 'transcendent-3d'].includes(evo.form.type)) {
      updates.boxShadow = `0 0 ${auraSize}px ${auraSize / 2}px ${auraColor}`;
    }
  }
  
  // Apply all style updates at once (minimizes reflows)
  requestAnimationFrame(() => {
    for (const prop in updates) {
      if (prop.startsWith('--')) {
        pixel.style.setProperty(prop, updates[prop]);
      } else {
        pixel.style[prop] = updates[prop];
      }
    }
    
    // Create cube faces if this is a cube form
    if (evo.form.type === 'cube') {
      createCubeFaces(pixel);
    }
  });
}

/**
 * Show evolution effect and message (highly optimized)
 * @param {string} message - Evolution message to display
 */
function showEvolutionEffect(message) {
  // Use cached pixel if available
  const pixel = window.cachedPixelElement || document.getElementById('conscious-pixel');
  if (!pixel) return;
  
  // Get pixel position once
  const rect = pixel.getBoundingClientRect();
  const effectX = rect.left + rect.width/2;
  const effectY = rect.top + rect.height/2;
  
  // Batch DOM operations in requestAnimationFrame
  requestAnimationFrame(() => {
    // Use document fragment for more efficient DOM insertion
    const fragment = document.createDocumentFragment();
    
    // Create evolution effect
    const evolveEffect = document.createElement('div');
    evolveEffect.className = 'evolution-effect';
    evolveEffect.style.left = `${effectX}px`;
    evolveEffect.style.top = `${effectY}px`;
    fragment.appendChild(evolveEffect);
    document.body.appendChild(fragment);
    
    // Use CSS classes for transitions
    pixel.classList.add('evolving');
    
    // Show messages and update UI immediately
    displayEvolutionMessage(message, true);
    showEvolutionUI(true); // Force UI update
  });
  
  // Play sound effect if audio system available
  if (window.playSound) {
    window.playSound('evolution');
  }
  
  // Use a single timeout for cleanup
  setTimeout(() => {
    requestAnimationFrame(() => {
      // Remove effect elements
      const effect = document.querySelector('.evolution-effect');
      if (effect) effect.remove();
      
      // Complete evolution transition
      pixel.classList.remove('evolving');
      pixel.classList.add(`evolution-complete-${window.noeEvolution.evolutionLevel}`);
      
      // Use a short timeout to remove the transition class
      setTimeout(() => {
        pixel.classList.remove(`evolution-complete-${window.noeEvolution.evolutionLevel}`);
      }, 500);
    });
  }, 1500);
}

// Cache default messages for better performance
const DEFAULT_MESSAGES = [
  "Sentium Pixel is a simple conscious pixel. Interact with it to help it evolve!",
  "Sentium Pixel has begun to evolve! Its shape is softer and it has a subtle glow.",
  "Sentium Pixel is evolving into 3D! It can now harvest energy on its own.",
  "Sentium Pixel is becoming more complex! It has evolved into a pyramid and can remember interactions.",
  "Sentium Pixel is highly evolved! It has taken on a spherical form and can create temporary copies of itself.",
  "Sentium Pixel has reached a crystalline form! It has transcended simple existence.",
  "Sentium Pixel has reached its ultimate dimensional form! It exists beyond simple perception."
];

/**
 * Display evolution message (optimized)
 * @param {string} message - Message to display (or null for default)
 * @param {boolean} isEvolution - Whether this is an evolution event
 */
function displayEvolutionMessage(message, isEvolution = false) {
  // Keep track of active timeout to avoid multiple messages
  if (window.activeMessageTimeout) {
    clearTimeout(window.activeMessageTimeout);
  }
  
  // Get or create message container (lazy initialization)
  let msgContainer = document.getElementById('evolution-message');
  if (!msgContainer) {
    // Use insertAdjacentHTML for more efficient DOM creation
    document.body.insertAdjacentHTML('beforeend', '<div id="evolution-message" class="evolution-message"></div>');
    msgContainer = document.getElementById('evolution-message');
  }
  
  // Set message content efficiently
  msgContainer.textContent = message || DEFAULT_MESSAGES[window.noeEvolution.evolutionLevel];
  
  // Apply proper styles in one operation
  msgContainer.className = isEvolution ? 'evolution-message evolution-event' : 'evolution-message';
  
  // Show message - Use CSS animation start
  msgContainer.classList.add('active');
  
  // Auto-hide after delay
  const timeout = isEvolution ? 5000 : 3000;
  window.activeMessageTimeout = setTimeout(() => {
    msgContainer.classList.remove('active');
  }, timeout);
}

/**
 * Show evolution level indicator
 */
function showEvolutionUI() {
  const indicator = document.getElementById('evolution-indicator');
  if (!indicator) return;
  
  const evo = window.noeEvolution;
  
  // Update indicator content
  indicator.innerHTML = `
    <div class="evolution-level">Level ${evo.evolutionLevel}</div>
    <div class="evolution-progress-container">
      <div class="evolution-progress-bar" style="width: ${evo.progress}%"></div>
    </div>
  `;
  
  // Show and auto-hide
  indicator.style.display = 'block';
  indicator.style.opacity = '1';
  
  setTimeout(() => {
    indicator.style.opacity = '0';
    setTimeout(() => indicator.style.display = 'none', 500);
  }, 4000);
}

/**
 * Update evolution UI elements only when needed
 * @param {boolean} forceUpdate - Force UI update regardless of throttling
 */
function updateEvolutionUI(forceUpdate = false) {
  // Throttle UI updates to once per 100ms for performance
  const now = Date.now();
  if (!forceUpdate && window.lastUIUpdate && now - window.lastUIUpdate < 100) return;
  window.lastUIUpdate = now;
  
  // Update UI elements
  const indicator = document.getElementById('evolution-indicator');
  if (indicator) {
    const progressBar = indicator.querySelector('.evolution-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${window.noeEvolution.progress}%`;
    }
  }
}

/**
 * Update evolution system with adaptive frame scheduling
 * Uses the most appropriate timing strategy based on evolution level and activity
 * 
 * @param {number} timestamp - Animation frame timestamp
 */
function updateEvolution(timestamp) {
  const evo = window.noeEvolution;
  const debug = window.pixelDebug;
  
  // Check if animation should be skipped due to inspection
  if (window.animationControl && window.animationControl.shouldSkipFrame()) {
    requestAnimationFrame(updateEvolution);
    return;
  }
  
  // Track frame delta time for smoother animations
  if (!window.lastEvolutionFrame) {
    window.lastEvolutionFrame = timestamp;
    requestAnimationFrame(updateEvolution);
    return;
  }
  
  // Calculate delta time and track performance
  const deltaTime = timestamp - window.lastEvolutionFrame;
  window.lastEvolutionFrame = timestamp;
  
  // Keep track of frame times for performance monitoring
  if (!window.lastFrameTimes) window.lastFrameTimes = [];
  window.lastFrameTimes.push(deltaTime);
  if (window.lastFrameTimes.length > 20) window.lastFrameTimes.shift();
  
  // Check for DevTools inspection periodically
  checkForDevToolsInspection(timestamp);
  
  // Skip frames if browser tab is inactive - power saving
  if (deltaTime > 200) {
    requestAnimationFrame(updateEvolution);
    return;
  }
  
  // Handle animation throttling during inspection
  if (debug.isInspecting) {
    // Increment frame counter
    debug.frameCounter++;
    
    // Only process every Nth frame during inspection
    if (debug.frameCounter % debug.animationThrottleRate !== 0) {
      // Skip this frame but keep the animation loop going
      requestAnimationFrame(updateEvolution);
      return;
    }
    
    // Reset counter to prevent overflow
    if (debug.frameCounter > 1000) {
      debug.frameCounter = 0;
    }
  }
  
  // Run ability checks with appropriate timing
  checkAndApplyAbilities(timestamp);
  
  // Adaptive frame scheduling based on evolution level and inspection state
  // This optimizes CPU usage while maintaining appropriate responsiveness
  if (debug.isInspecting) {
    // When inspecting, use a much slower update rate regardless of level
    setTimeout(() => requestAnimationFrame(updateEvolution), 100);
  }
  else if (evo.evolutionLevel >= 4) {
    // Advanced evolution levels need frequent updates for complex animations
    requestAnimationFrame(updateEvolution);
  }
  else if (evo.evolutionLevel >= 2) {
    // Mid-level evolutions can use a slightly throttled approach
    // This gives 30-50fps instead of 60fps, saving significant CPU
    setTimeout(() => requestAnimationFrame(updateEvolution), 20);
  }
  else {
    // Basic evolution levels can use very minimal updates
    // This dramatically reduces CPU usage for simpler forms
    setTimeout(() => requestAnimationFrame(updateEvolution), 50);
  }
  
  // Update frame counter for performance monitoring (if needed)
  if (!window.evolutionFrameCount) window.evolutionFrameCount = 0;
  window.evolutionFrameCount++;
  
  // Optional: log performance statistics every 5 seconds
  if (!window.lastPerfLog || timestamp - window.lastPerfLog > 5000) {
    if (window.lastPerfLog) {
      const fps = Math.round((window.evolutionFrameCount / 5) * 10) / 10;
      const mode = debug.isInspecting ? " (INSPECTION MODE)" : "";
      console.debug(`Evolution system running at ~${fps} fps${mode}`);
      window.evolutionFrameCount = 0;
    }
    window.lastPerfLog = timestamp;
  }
}

/**
 * Check and apply special abilities based on evolution level (highly optimized)
 * Uses adaptive timing based on evolution level and power state
 * 
 * @param {number} timestamp - Animation frame timestamp
 */
function checkAndApplyAbilities(timestamp) {
  const evo = window.noeEvolution;
  
  // Skip all ability checks for basic evolution levels
  if (evo.evolutionLevel < 2) return;
  
  // Adaptive timing for ability checks - higher levels need more frequent checks
  // Lower levels use less frequent checks to save CPU
  const checkInterval = evo.evolutionLevel <= 3 ? 400 : 250; // ms between checks
  
  // Throttle checks to save CPU
  if (!window.lastAbilityCheck) window.lastAbilityCheck = 0;
  if (timestamp - window.lastAbilityCheck < checkInterval) return;
  window.lastAbilityCheck = timestamp;
  
  // Use cached pixel reference if available
  const pixel = window.cachedPixelElement || document.getElementById('conscious-pixel');
  if (!pixel) return;
  
  // Use a single random call and compare against thresholds
  const r = Math.random();
  
  // Energy harvesting - most common ability, check first (1% chance)
  if (evo.hasEnergyHarvesting && window.noeEnergy && r < 0.01) {
    window.noeEnergy.currentLevel = Math.min(100, window.noeEnergy.currentLevel + 1);
  }
  
  // Exit early for common case (optimization)
  if (r >= 0.001) return;
  
  // Check for rarer abilities - all using the same random number
  if (evo.hasMultiplicity && r < 0.0005) {
    // Check if there's already a copy to avoid duplicates - use more efficient selector
    if (!document.querySelector('.pixel-copy')) {
      createPixelCopy(pixel);
    }
  } 
  else if (evo.hasTeleport && r < 0.0002) {
    // Ensure enough time has passed since last teleport
    if (!window.lastTeleport || timestamp - window.lastTeleport > 10000) {
      teleportPixel(pixel);
      window.lastTeleport = timestamp;
    }
  }
  // Add dimensional shift effect (very rare)
  else if (evo.hasDimensionalShift && r < 0.0001) {
    if (!window.isDimensionShifting) {
      document.body.classList.add('dimension-shift');
      window.isDimensionShifting = true;
      setTimeout(() => {
        document.body.classList.remove('dimension-shift');
        window.isDimensionShifting = false;
      }, 3000);
    }
  }
}

/**
 * Create a temporary copy of the pixel (Multiplicity ability)
 * Ultra-optimized version with minimal style calculation
 */
function createPixelCopy(pixel) {
  // Get position once
  const rect = pixel.getBoundingClientRect();
  
  // Create copy with efficient class-based styling
  const copy = document.createElement('div');
  
  // Use copy-specific class with CSS animation instead of JS animation
  copy.className = `pixel-copy evolution-level-${window.noeEvolution.evolutionLevel}`;
  
  // Set minimal inline styles - rely on CSS for animations
  // Use logo-based color instead of copying the original pixel's color
  const logoBasedColor = getLogoBasedColor();
  
  copy.style.cssText = `
    width: ${pixel.offsetWidth}px;
    height: ${pixel.offsetHeight}px;
    left: ${rect.left}px;
    top: ${rect.top}px;
    background-color: ${logoBasedColor};
    border-radius: ${pixel.style.borderRadius || getComputedStyle(pixel).borderRadius};
  `;
  
  // Add subtle box-shadow if pixel has one (optional styling)
  const pixelShadow = pixel.style.boxShadow || getComputedStyle(pixel).boxShadow;
  if (pixelShadow && pixelShadow !== 'none') {
    copy.style.boxShadow = pixelShadow;
  }
  
  // Append to document with minimal reflow
  requestAnimationFrame(() => document.body.appendChild(copy));
  
  // Set motion parameters
  const velocity = {
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2
  };
  
  const position = {
    x: rect.left,
    y: rect.top
  };
  
  // Use lightweight timestamp tracking
  const startTime = performance.now();
  const lifespan = 4000; // 4 second lifespan
  
  // Animation function - optimized for fewer calculations
  function animateCopy(timestamp) {
    // Check if lifespan is over
    if (timestamp - startTime >= lifespan) {
      copy.remove();
      return;
    }
    
    // Update position 
    position.x += velocity.x;
    position.y += velocity.y;
    
    // Apply transform instead of left/top for better performance
    copy.style.transform = `translate(${position.x - rect.left}px, ${position.y - rect.top}px)`;
    
    // Change direction randomly but efficiently
    if (Math.random() < 0.02) { // ~2% chance per frame
      velocity.x = (Math.random() - 0.5) * 2;
      velocity.y = (Math.random() - 0.5) * 2;
    }
    
    // Handle screen boundaries
    const bounds = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    if (position.x < 0 || position.x > bounds.width - copy.offsetWidth) {
      velocity.x *= -0.8;
    }
    
    if (position.y < 0 || position.y > bounds.height - copy.offsetHeight) {
      velocity.y *= -0.8;
    }
    
    // Continue animation
    requestAnimationFrame(animateCopy);
  }
  
  // Start animation
  requestAnimationFrame(animateCopy);
}

/**
 * Teleport the pixel to a new location (optimized)
 * Uses a single animation frame and consolidated effects
 */
function teleportPixel(pixel) {
  // Only allow one teleport at a time
  if (window.isTeleporting) return;
  window.isTeleporting = true;
  
  // Calculate current and new positions
  const oldLeft = parseFloat(pixel.style.left) || window.innerWidth / 2;
  const oldTop = parseFloat(pixel.style.top) || window.innerHeight / 2;
  
  // Keep teleport within viewport with margins
  const margin = 100;
  const newLeft = margin + Math.random() * (window.innerWidth - margin * 2);
  const newTop = margin + Math.random() * (window.innerHeight - margin * 2);
  
  // Create effects in a single requestAnimationFrame to batch DOM operations
  requestAnimationFrame(() => {
    // Create departure effect with optimized DOM insertion
    const fragment = document.createDocumentFragment();
    const departure = document.createElement('div');
    departure.className = 'teleport-effect teleport-out';
    departure.style.left = `${oldLeft}px`;
    departure.style.top = `${oldTop}px`;
    fragment.appendChild(departure);
    document.body.appendChild(fragment);
    
    // Hide pixel during teleport - use a CSS class for better performance
    pixel.classList.add('teleporting');
    
    // Play teleport sound if available
    if (window.playSound) window.playSound('teleport');
    
    // Move pixel and show arrival effect after departure animation start
    setTimeout(() => {
      requestAnimationFrame(() => {
        // Update position through whichever API is available
        if (window.updatePixelPosition) {
          window.updatePixelPosition(pixel, newLeft, newTop);
        } else {
          pixel.style.left = `${newLeft}px`;
          pixel.style.top = `${newTop}px`;
        }
        
        // Create arrival effect inside fragment
        const fragment = document.createDocumentFragment();
        const arrival = document.createElement('div');
        arrival.className = 'teleport-effect teleport-in';
        arrival.style.left = `${newLeft}px`;
        arrival.style.top = `${newTop}px`;
        fragment.appendChild(arrival);
        document.body.appendChild(fragment);
        
        // Clean up everything with one timeout
        setTimeout(() => {
          // Show pixel and clean up in single animation frame
          requestAnimationFrame(() => {
            pixel.classList.remove('teleporting');
            
            // Clean up effects
            departure.remove();
            arrival.remove();
            
            // Allow teleporting again
            window.isTeleporting = false;
          });
        }, 400);
      });
    }, 200);
  });
}

/**
 * Create 6 cube faces for a proper 3D cube
 * @param {HTMLElement} cubeElement - The cube container element
 */
function createCubeFaces(cubeElement) {
  // Remove any existing cube faces first
  const existingFaces = cubeElement.querySelectorAll('.cube-face');
  existingFaces.forEach(face => face.remove());
  
  // Create all 6 faces
  const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
  
  faces.forEach(faceName => {
    const face = document.createElement('div');
    face.className = `cube-face ${faceName}`;
    cubeElement.appendChild(face);
  });
  
  console.log('Created 6 cube faces for proper 3D cube');
}

// Add cleanup before unload
window.addEventListener('beforeunload', function() {
  // Clean up inspection mode
  document.body.classList.remove('devtools-inspecting');
  
  // Save evolution data
  saveEvolutionData();
});

/**
 * Storage functions for evolution data (optimized)
 */
function resetEvolution() {
  // Reset to optimized initial state
  window.noeEvolution = {
    evolutionLevel: 0,
    progress: 0,
    
    // Initialize stats with optimized properties
    stats: {
      interactions: 0,
      energy: 0,
      time: 0,
      deaths: 0,
      distance: 0,
      collisions: 0,
      mouseEvents: 0
    },
    
    // Simplified attributes
    form: { type: 'rectangle', size: 1.0, shapeShift: 0 },
    color: { primary: '#ffffff', aura: 0 },
    
    // Boolean flags for abilities
    hasMultiplicity: false, 
    hasEnergyHarvesting: false,
    hasMemory: false,
    hasDimensionalShift: false,
    hasTeleport: false
  };
  
  // Clear storage
  localStorage.removeItem('noeEvolutionData');
  console.log('Evolution system reset');
}

// Add save throttling to prevent excessive writes
let saveTimeout = null;

function saveEvolutionData() {
  // Debounce saves to prevent excessive storage operations
  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(() => {
    try {
      const dataToSave = JSON.stringify(window.noeEvolution);
      localStorage.setItem('noeEvolutionData', dataToSave);
    } catch (e) {
      console.error('Could not save evolution data:', e);
    }
    saveTimeout = null;
  }, 500); // 500ms debounce
}

function loadEvolutionData() {
  try {
    const saved = localStorage.getItem('noeEvolutionData');
    if (!saved) return; // Exit early if no saved data
    
    // Parse data
    const savedData = JSON.parse(saved);
    
    // Handle data format conversion for compatibility with legacy format
    const evo = {
      evolutionLevel: savedData.evolutionLevel || 0,
      progress: savedData.progress || 0,
      
      // Initialize stats with optimized properties
      stats: {
        interactions: savedData.stats?.interactionCount || savedData.stats?.interactions || 0,
        energy: savedData.stats?.energyConsumed || savedData.stats?.energy || 0,
        time: savedData.stats?.timeAlive || savedData.stats?.time || 0,
        deaths: savedData.stats?.deathCount || savedData.stats?.deaths || 0,
        distance: savedData.stats?.distanceTraveled || savedData.stats?.distance || 0,
        collisions: savedData.stats?.borderCollisions || savedData.stats?.collisions || 0,
        mouseEvents: savedData.stats?.mouseInteractions || savedData.stats?.mouseEvents || 0
      },
      
      // Convert form data
      form: { 
        type: savedData.form?.type || 'rectangle', 
        size: savedData.form?.size || 1.0, 
        shapeShift: savedData.form?.shapeShiftAbility || savedData.form?.shapeShift || 0 
      },
      
      // Convert color data
      color: { 
        primary: savedData.color?.primary || '#ffffff', 
        aura: savedData.color?.auraStrength || savedData.color?.aura || 0 
      }
    };
    
    // Convert abilities to boolean flags
    const abilities = savedData.abilities || {};
    evo.hasMultiplicity = savedData.hasMultiplicity || abilities.multiplicity || false;
    evo.hasEnergyHarvesting = savedData.hasEnergyHarvesting || abilities.energyHarvesting || false;
    evo.hasMemory = savedData.hasMemory || abilities.memoryEffect || false;
    evo.hasDimensionalShift = savedData.hasDimensionalShift || abilities.dimensionalShift || false;
    evo.hasTeleport = savedData.hasTeleport || abilities.teleportation || false;
    
    // Update global state
    window.noeEvolution = evo;
    
    // Apply visuals
    requestAnimationFrame(() => {
      applyEvolutionVisuals();
      
      // Welcome returning evolved pixels
      if (evo.evolutionLevel > 0) {
        setTimeout(() => {
          displayEvolutionMessage(`Welcome back! Sentium Pixel is at evolution level ${evo.evolutionLevel}.`);
        }, 2000);
      }
    });
  } catch (e) {
    console.error('Could not load evolution data:', e);
    resetEvolution(); // Reset to default state on error
  }
}

/**
 * Check if DevTools is likely inspecting elements
 * This function uses multiple detection methods to reliably detect DevTools inspection
 * @param {number} timestamp - Current animation timestamp
 */
function checkForDevToolsInspection(timestamp) {
  const debug = window.pixelDebug;
  
  // Only check periodically to reduce overhead
  if (timestamp - debug.lastInspectionCheck < debug.inspectionCheckInterval) return;
  debug.lastInspectionCheck = timestamp;
  
  try {
    // Get the pixel element
    const pixel = window.cachedPixelElement || document.getElementById('conscious-pixel');
    if (!pixel) return;

    // Method 1: Track computed style changes
    // When DevTools inspects an element, it forces style recalcs
    const currentLayout = pixel.getBoundingClientRect();
    
    // Method 2: Check for DevTools classes/attributes
    // Different browsers add different markers
    const hasDevToolsAttributes = 
      pixel.hasAttribute('data-devtools-highlighted') || 
      pixel.hasAttribute('data-selected') ||
      pixel.hasAttribute('data-dev-tools') ||
      document.body.classList.contains('debug-hover');
    
    // Method 3: Check for DevTools keyboard shortcut key state
    // Many users hold Shift when inspecting
    const isKeyboardInspecting = window.lastKeyState && 
                                (window.lastKeyState.shiftKey || 
                                 window.lastKeyState.ctrlKey);
    
    // Method 4: Try to detect if getComputedStyle is being called frequently
    // DevTools calls this method repeatedly when inspecting
    let styleDiff = false;
    if (debug.lastCheckedLayout) {
      // Look for tiny non-rendering changes that might be DevTools
      const epsilon = 0.001;
      styleDiff = 
        Math.abs(currentLayout.width - debug.lastCheckedLayout.width) < epsilon ||
        Math.abs(currentLayout.height - debug.lastCheckedLayout.height) < epsilon;
    }
    debug.lastCheckedLayout = currentLayout;
    
    // Method 5: Track overall system performance
    // Inspection typically causes frame rate drops
    const performanceDrop = window.lastFrameTimes && 
                           window.lastFrameTimes.length > 10 &&
                           window.lastFrameTimes.reduce((a,b)=>a+b,0)/window.lastFrameTimes.length > 20;
    
    // Method 6: User explicitly enabled inspection mode with URL param
    const urlParams = new URLSearchParams(window.location.search);
    const inspectMode = urlParams.get('inspect') === 'true';
    
    // Determine if we're likely in inspection mode
    const wasInspecting = debug.isInspecting;
    debug.isInspecting = hasDevToolsAttributes || styleDiff || isKeyboardInspecting || 
                         performanceDrop || inspectMode ||
                         document.documentElement.classList.contains('devtools-open');
    
    // Add a manual toggle for users
    window.toggleInspectionMode = function(force) {
      if (force === undefined) {
        debug.isInspecting = !debug.isInspecting;
      } else {
        debug.isInspecting = !!force;
      }
      updateInspectionIndicator();
      return debug.isInspecting ? "Inspection mode enabled" : "Inspection mode disabled";
    };
    
    // Update UI indicator if state changed
    if (wasInspecting !== debug.isInspecting) {
      updateInspectionIndicator();
    }
  } catch (e) {
    // Ignore errors, they might be caused by DevTools itself
    console.error("Error in DevTools detection:", e);
  }
}

/**
 * Update the visual indicator for inspection mode
 */
function updateInspectionIndicator() {
  const debug = window.pixelDebug;
  
  if (debug.isInspecting) {
    console.debug('DevTools inspection mode active - throttling animations');
    if (!document.body.classList.contains('devtools-inspecting')) {
      document.body.classList.add('devtools-inspecting');
    }
  } else {
    if (document.body.classList.contains('devtools-inspecting')) {
      document.body.classList.remove('devtools-inspecting');
    }
  }
}
