// Pixel Merger System
// This system creates and merges pixels into 3D shapes

/**
 * Shows information about the logo pixel extraction in the info panel
 * @param {string} message - The message to display
 * @param {string} type - The type of message (info, error, warning)
 */
function showLogoPixelInfo(message, type = 'info') {
  const infoPanel = document.getElementById('info-panel');
  if (infoPanel) {
    infoPanel.textContent = message;
    
    // Set color based on message type
    switch (type) {
      case 'error':
        infoPanel.style.color = '#ff5555';
        break;
      case 'warning':
        infoPanel.style.color = '#ffaa33';
        break;
      case 'success':
        infoPanel.style.color = '#55ff55';
        break;
      default:
        infoPanel.style.color = '#aaaaff';
    }
  } else {
    // Create the info panel if it doesn't exist
    const panel = document.createElement('div');
    panel.id = 'info-panel';
    panel.textContent = message;
    panel.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: #aaaaff; padding: 8px; border-radius: 4px; font-size: 12px; z-index: 1000;';
    
    // Set color based on message type
    switch (type) {
      case 'error':
        panel.style.color = '#ff5555';
        break;
      case 'warning':
        panel.style.color = '#ffaa33';
        break;
      case 'success':
        panel.style.color = '#55ff55';
        break;
      default:
        panel.style.color = '#aaaaff';
    }
    
    document.body.appendChild(panel);
  }
  
  // Log to console as well
  console.log(`[Logo Pixel Info] ${message}`);
}

// Logo pixel extraction system
window.logoPixelData = {
  pixels: [],
  isLoaded: false,
  imageWidth: 0,
  imageHeight: 0,
  usedPixels: new Set() // Track which logo pixels have been used
};

/**
 * Load and extract pixel data from the Sentium logo
 */
function loadLogoPixelData() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
      try {
        // Create a canvas to extract pixel data
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Extract non-transparent pixels
        window.logoPixelData.pixels = [];
        window.logoPixelData.imageWidth = canvas.width;
        window.logoPixelData.imageHeight = canvas.height;
        
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];
            
            // Only include non-transparent pixels with sufficient opacity
            if (a > 32) {
              window.logoPixelData.pixels.push({
                x: x,
                y: y,
                r: r,
                g: g,
                b: b,
                color: `rgb(${r}, ${g}, ${b})`
              });
            }
          }
        }
        
        window.logoPixelData.isLoaded = true;
        console.log(`Loaded ${window.logoPixelData.pixels.length} pixels from logo`);
        
        // Show info message about logo-based pixels
        showLogoPixelInfo();
        
        resolve();
        
      } catch (error) {
        console.error('Error processing logo image:', error);
        reject(error);
      }
    };
    
    img.onerror = function() {
      console.error('Failed to load logo image');
      reject(new Error('Failed to load logo image'));
    };
    
    // Load the logo image
    img.src = 'images/sentium-logo-black.png';
  });
}

/**
 * Get a random pixel from the logo image data
 * @param {boolean} strictPosition - If true, maintain exact logo shape positions
 */
function getLogoPixel(strictPosition = false) {
  if (!window.logoPixelData.isLoaded || window.logoPixelData.pixels.length === 0) {
    // Fallback to random color if logo not loaded
    return {
      x: Math.random() * (window.innerWidth - 20) + 10,
      y: Math.random() * (window.innerHeight - 20) + 10,
      color: getRandomColor()
    };
  }
  
  // Get a random pixel from the logo
  const logoPixel = window.logoPixelData.pixels[Math.floor(Math.random() * window.logoPixelData.pixels.length)];
  let screenX, screenY;
  
  // Determine if we should use exact logo positions or allow more variation 
  if (strictPosition || Math.random() < 0.7) { // 70% chance to maintain logo shape
    // Scale the logo pixel position to screen coordinates
    // Center the logo pattern on screen
    const scaleX = (window.innerWidth * 0.6) / window.logoPixelData.imageWidth;
    const scaleY = (window.innerHeight * 0.6) / window.logoPixelData.imageHeight;
    const scale = Math.min(scaleX, scaleY); // Maintain aspect ratio
    
    const offsetX = (window.innerWidth - window.logoPixelData.imageWidth * scale) / 2;
    const offsetY = (window.innerHeight - window.logoPixelData.imageHeight * scale) / 2;
    
    screenX = offsetX + logoPixel.x * scale;
    screenY = offsetY + logoPixel.y * scale;
  } else {
    // For some pixels, allow more random positions but keep the logo's colors
    // This creates a more dynamic, varied presentation while maintaining the logo's color scheme
    screenX = Math.random() * (window.innerWidth - 20) + 10;
    screenY = Math.random() * (window.innerHeight - 20) + 10;
  }
  
  return {
    x: Math.max(10, Math.min(window.innerWidth - 10, screenX)),
    y: Math.max(10, Math.min(window.innerHeight - 10, screenY)),
    color: logoPixel.color
  };
}

// Track all created pixels
window.noePixels = {
  count: 0,
  pixels: [],
  maxCount: 1,  // Only allow the original Sentium Pixel pixel
  isShapeMode: false,
  currentShape: "cube",
  shapes: ["cube", "pyramid", "sphere", "crystal", "toroid", "transcendent-3d"],
  isMerging: false,
  autoGrowInterval: null, // For tracking auto-growth timer
  persistentShapes: [],   // To track persistent shapes
  lastAutoGrow: 0,        // Track last auto growth time
  pixelMinAge: 300000,    // 5 minutes in milliseconds
  pixelMaxAge: 600000,    // 10 minutes in milliseconds
  minPixelAge: 300000,    // 5 minutes in milliseconds (new)
  maxPixelAge: 600000     // 10 minutes in milliseconds (new)
};

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the pixel merger system after limbric.js has loaded
  setTimeout(initializePixelMerger, 1500);
});

/**
 * Ensure initial pixel exists - we start with just one pixel for the doubling pattern
 * Now disabled - only keeps the original Sentium Pixel pixel
 */
function ensureInitialPixels() {
    // This function no longer creates additional pixels
    // We only want the original Sentium Pixel pixel from limbric.js
}

/**
 * Initialize the pixel merger system
 */
function initializePixelMerger() {
  // First load the logo pixel data
  loadLogoPixelData().then(() => {
    console.log('Logo pixel data loaded successfully');
    
    // Create control interface
    createPixelControls();
    
    // Add a mutation observer to track the main pixel (only Sentium Pixel)
    trackMainPixel();
    
    // No automatic pixel growth or merging - only track Sentium Pixel
    // Removed: startAutoPixelGrowth();
    // Removed: startAutoMerging();
    // Removed: ensureInitialPixels();
    
    // Remove any existing additional pixels if they exist
    removeAllAdditionalPixels();
    
  }).catch((error) => {
    console.warn('Failed to load logo pixel data:', error);
    
    // Fallback: continue with minimal system if logo loading fails
    createPixelControls();
    trackMainPixel();
    
    // Remove any existing additional pixels if they exist
    removeAllAdditionalPixels();
  });
}

/**
 * Removes all additional pixels, keeping only the original Sentium Pixel pixel
 */
function removeAllAdditionalPixels() {
  // Filter to keep only the main Sentium Pixel pixel and remove all others
  const additionalPixels = window.noePixels.pixels.filter(p => !p.isMain);
  
  // Remove all additional pixels from the DOM and tracking
  for (const pixelData of additionalPixels) {
    if (pixelData.element && pixelData.element.parentNode) {
      pixelData.element.parentNode.removeChild(pixelData.element);
    }
  }
  
  // Keep only the main pixel in our tracking array
  window.noePixels.pixels = window.noePixels.pixels.filter(p => p.isMain);
  
  // Update the counter
  window.noePixels.count = window.noePixels.pixels.length;
  updatePixelCounter();
}

/**
 * Start automatic pixel growth timer
 * Now disabled - only keeps the original Sentium Pixel pixel
 */
function startAutoPixelGrowth() {
  // Clear any existing interval to prevent new pixels from being created
  if (window.noePixels.autoGrowInterval) {
    clearInterval(window.noePixels.autoGrowInterval);
  }
  
  // Don't set up any new intervals - we don't want additional pixels
}

/**
 * Automatically increase pixels following doubling pattern
 * Now disabled - only keeps the original Sentium Pixel pixel
 */
function autoIncreasePixels() {
  // Function now does nothing - we only want the original pixel
  return;
}

/**
 * Create a control panel for the pixel merger system
 * Note: Panel removed as requested, functionality is fully automatic
 */
function createPixelControls() {
  // Create hidden counter element for internal tracking
  const hiddenCounter = document.createElement('div');
  hiddenCounter.style.display = 'none';
  hiddenCounter.innerHTML = `<span id="pixel-count">1</span>`;
  document.body.appendChild(hiddenCounter);
  
  // No visible controls are created - everything happens automatically
}

/**
 * Add styles for pixel elements
 */
function addControlsStyles() {
  if (!document.getElementById('pixel-merger-styles')) {
    const styles = document.createElement('style');
    styles.id = 'pixel-merger-styles';
    styles.textContent = `
      /* Control panel removed as requested */
      
      @keyframes pixel-birth {
        0% { transform: scale(0) rotate(0deg); opacity: 0; }
        100% { transform: scale(1) rotate(360deg); opacity: 1; }
      }
      
      .additional-pixel {
        position: absolute;
        width: 8px; /* Increased size for better visibility */
        height: 8px; /* Increased size for better visibility */
        background-color: #ffffff;
        box-shadow: 0 0 10px #ffffff; /* Brighter glow */
        z-index: 9990;
        pointer-events: auto; /* Enable interaction */
        animation: pixel-birth 0.5s forwards;
      }

      .merged-shape-container {
        position: absolute;
        transform-style: preserve-3d;
        perspective: 1000px;
        z-index: 9990;
        pointer-events: none;
      }

      .merged-pixels {
        width: 100%;
        height: 100%;
        position: relative;
        transform-style: preserve-3d;
        animation: shape-rotate 15s infinite linear;
      }

      .pixel-in-shape {
        position: absolute;
        width: 4px;
        height: 4px;
        background-color: rgba(255, 255, 255, 0.8);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
        border-radius: 50%;
      }

      @keyframes shape-rotate {
        0% { transform: rotateX(0) rotateY(0) rotateZ(0); }
        100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
      }
    `;
    document.head.appendChild(styles);
  }
}

/**
 * Track the main conscious pixel
 */
function trackMainPixel() {
  // Find the main conscious pixel
  const pixel = document.getElementById('conscious-pixel');
  if (pixel) {
    // Add pixel to tracking array if not already there
    if (!window.noePixels.pixels.some(p => p.isMain)) {
      const rect = pixel.getBoundingClientRect();
      window.noePixels.pixels.push({
        element: pixel,
        isMain: true,
        x: rect.left,
        y: rect.top,
        color: window.getComputedStyle(pixel).backgroundColor,
        birthTime: Date.now(),
        isAdditionalPixel: false // Mark as original Sentium Pixel
      });
      window.noePixels.count++;
    }
  } else {
    // Wait for main pixel to be created
    const observer = new MutationObserver(mutations => {
      if (document.getElementById('conscious-pixel')) {
        observer.disconnect();
        trackMainPixel();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

/**
 * Create additional pixels
 */
function createAdditionalPixel() {
  // Limit the number of pixels
  if (window.noePixels.count >= window.noePixels.maxCount) {
    return;
  }
  
  // Get a new pixel from the logo data
  const logoPixel = getLogoPixel();
  let x = logoPixel.x;
  let y = logoPixel.y;
  let pixelColor = logoPixel.color;
  
  // If we have existing pixels, occasionally create variations near them for biological effect
  if (window.noePixels.pixels.length > 0 && Math.random() < 0.3) {
    // 30% chance to create near an existing pixel
    const parentPixel = window.noePixels.pixels[Math.floor(Math.random() * window.noePixels.pixels.length)];
    
    // Create slight position variation from parent (15-35px away)
    const distance = 15 + Math.random() * 20;
    const angle = Math.random() * Math.PI * 2;
    x = Math.max(10, Math.min(window.innerWidth - 10, parentPixel.x + Math.cos(angle) * distance));
    y = Math.max(10, Math.min(window.innerHeight - 10, parentPixel.y + Math.sin(angle) * distance));
    
    // Keep the logo color even for variants
  }
  
  // Create new pixel
  const pixel = document.createElement('div');
  pixel.className = 'additional-pixel';
  
  // Set pixel properties - now with pointer events enabled
  pixel.style.cssText = `
    left: ${x}px;
    top: ${y}px;
    background-color: ${pixelColor};
    box-shadow: 0 0 8px ${pixelColor};
    pointer-events: auto;
  `;
  
  // Add to document
  document.body.appendChild(pixel);
  
  // Add mouse interaction events
  pixel.addEventListener('mouseenter', handlePixelMouseEnter);
  pixel.addEventListener('click', handlePixelClick);
  
  // Add to tracking
  // Generate random age between min and max
  const now = Date.now();
  const randomAgeDuration = Math.floor(Math.random() * 
    (window.noePixels.maxPixelAge - window.noePixels.minPixelAge)) + 
    window.noePixels.minPixelAge;
  
  // Calculate birth time by subtracting random age from current time
  const birthTime = now - randomAgeDuration;
  
  window.noePixels.pixels.push({
    element: pixel,
    isMain: false,
    x: x,
    y: y,
    color: pixelColor,
    birthTime: birthTime,
    // Flag to indicate this is not the original Sentium Pixel, so should not use energy system
    isAdditionalPixel: true
  });
  window.noePixels.count++;
  
  // Play birth sound if available
  if (window.playSound) {
    window.playSound('click');
  }
  
  // Update counter
  updatePixelCounter();
  
  // Start animation
  animatePixel(pixel);
}

/**
 * Update the pixel counter
 */
function updatePixelCounter() {
  const counter = document.getElementById('pixel-count');
  if (counter) {
    counter.textContent = window.noePixels.count;
  }
}

/**
 * Animate a pixel with environmental awareness and mouse interaction
 * Makes pixels behave more like Sentium Pixel with respect to cursor and energy cubes
 */
function animatePixel(pixel) {
  const speed = 0.5 + Math.random() * 0.5;
  let directionX = Math.random() > 0.5 ? 1 : -1;
  let directionY = Math.random() > 0.5 ? 1 : -1;
  
  let posX = parseFloat(pixel.style.left) || window.innerWidth / 2;
  let posY = parseFloat(pixel.style.top) || window.innerHeight / 2;
  
  // Track excitement level like Sentium Pixel for more realistic interaction
  const pixelData = window.noePixels.pixels.find(p => p.element === pixel);
  if (pixelData) {
    if (!pixelData.excitementLevel) pixelData.excitementLevel = 0;
    if (!pixelData.isExcited) pixelData.isExcited = false;
    if (!pixelData.energy) pixelData.energy = 100; // Initialize with full energy like Sentium Pixel
  }
  
  // Store last mouse position for environmental awareness
  if (!window.lastMousePosition) {
    window.lastMousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    
    // Add a global mouse move event listener if not already added
    if (!window.pixelMouseListenerAdded) {
      document.addEventListener('mousemove', (e) => {
        window.lastMousePosition = { x: e.clientX, y: e.clientY };
      }, { passive: true });
      window.pixelMouseListenerAdded = true;
    }
  }
  
  // Animation function
  function move() {
    // Skip frame if animation control system indicates we should
    if (window.animationControl && window.animationControl.shouldSkipFrame()) {
      requestAnimationFrame(move);
      return;
    }
    
    // Stop animation if pixel is being merged or removed
    if (window.noePixels.isMerging || !pixel.parentNode) {
      return;
    }
    
    // Get pixel data for state tracking
    const pixelData = window.noePixels.pixels.find(p => p.element === pixel);
    if (!pixelData) return;
    
    // Check pixel age and kill if too old
    const now = Date.now();
    const age = now - pixelData.birthTime;
    if (pixelData.isAdditionalPixel && age >= window.noePixels.maxPixelAge) {
      // Pixel has reached max age - kill it
      killPixel(pixelData);
      return;
    }
    
    // Environmental influence - mouse cursor position (like Sentium Pixel's processMouseInteractions)
    const mousePos = window.lastMousePosition;
    if (mousePos) {
      const dx = mousePos.x - posX;
      const dy = mousePos.y - posY;
      const distSquared = dx * dx + dy * dy;
      const distance = Math.sqrt(distSquared);
      
      // Normalize direction vector
      const dirX = dx / (distance || 1);
      const dirY = dy / (distance || 1);
      
      // Similar to Sentium Pixel's behavior tiers based on distance
      if (distance < 30) {
        // Too close - flee from the mouse (stronger avoidance like Sentium Pixel)
        const repelForce = 0.2;
        posX -= dirX * repelForce;
        posY -= dirY * repelForce;
        
        // Increase excitement
        pixelData.isExcited = true;
        pixelData.excitementLevel = Math.min(1.0, (pixelData.excitementLevel || 0) + 0.01);
        
        // Visual excitement indicator - make glow stronger
        pixel.style.boxShadow = `0 0 15px ${pixelData.color}`;
      } 
      else if (distance < 150) {
        // Medium distance - curious behavior, slight attraction (50%)
        if (Math.random() < 0.5) {
          // Attract to cursor like Sentium Pixel does at medium range
          const attractForce = 0.05;
          posX += dirX * attractForce;
          posY += dirY * attractForce;
        } else {
          // Random movement to show curiosity
          posX += (Math.random() - 0.5) * 0.1;
          posY += (Math.random() - 0.5) * 0.1;
        }
        
        // Maintain some excitement
        pixelData.isExcited = true;
        pixelData.excitementLevel = Math.min(0.7, (pixelData.excitementLevel || 0) + 0.005);
      }
      else {
        // Far away - gradually lose excitement
        pixelData.excitementLevel = Math.max(0, (pixelData.excitementLevel || 0) - 0.004);
        if (pixelData.excitementLevel < 0.1) {
          pixelData.isExcited = false;
          // Reset glow
          pixel.style.boxShadow = `0 0 8px ${pixelData.color}`;
        }
      }
    }
    
    // Interact with other pixels - simple attraction/repulsion
    if (Math.random() < 0.05) { // Only check occasionally for performance
      for (const otherPixel of window.noePixels.pixels) {
        if (otherPixel.element !== pixel) {
          const dx = otherPixel.x - posX;
          const dy = otherPixel.y - posY;
          const distSquared = dx * dx + dy * dy;
          
          if (distSquared < 2500 && distSquared > 0) { // Within 50px but not self
            if (distSquared < 400) { // Too close (20px) - repel
              const repelFactor = 0.01;
              posX -= dx * repelFactor;
              posY -= dy * repelFactor;
            } else { // Far enough - attract slightly
              const attractFactor = 0.0005;
              posX += dx * attractFactor;
              posY += dy * attractFactor;
            }
          }
        }
      }
    }
    
    // Look for energy cubes like Sentium Pixel does (only for main Sentium Pixel pixel)
    if (pixelData && !pixelData.isAdditionalPixel && window.noeEnergy && window.noeEnergy.nearestCube) {
      // Only the original pixel should interact with the energy system
      // Simulate energy depletion like Sentium Pixel - each pixel has their own energy level
      if (!pixelData.lastEnergyUpdate) pixelData.lastEnergyUpdate = Date.now();
      const currentTime = Date.now();
      const deltaSeconds = (currentTime - pixelData.lastEnergyUpdate) / 1000;
      pixelData.energy = Math.max(0, pixelData.energy - (deltaSeconds * 0.01 * 100)); // 1% per second like Sentium Pixel
      pixelData.lastEnergyUpdate = now;
      
      // Energy seeking behavior when low (under 50%)
      if (pixelData.energy < 50) {
        const cube = window.noeEnergy.nearestCube;
        const dx = cube.x - posX;
        const dy = cube.y - posY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate normalized direction vector to the nearest cube
        const dirX = dx / (distance || 1);
        const dirY = dy / (distance || 1);
        
        // Different behavior tiers based on energy level, like Sentium Pixel
        if (pixelData.energy < 10) {
          // Critical energy - strong attraction to cube
          posX += dirX * 0.3;
          posY += dirY * 0.3;
          
          // Visual indicator - change color to show distress
          if (Math.random() < 0.1) {
            const originalColor = pixelData.color;
            pixel.style.backgroundColor = Math.random() < 0.5 ? '#ff0000' : '#ffff00';
            setTimeout(() => {
              if (pixel.parentNode) pixel.style.backgroundColor = originalColor;
            }, 300);
          }
        } else if (pixelData.energy < 25) {
          // Very low energy - moderate attraction
          posX += dirX * 0.15;
          posY += dirY * 0.15;
          
          // Occasional color change
          if (Math.random() < 0.05) {
            const originalColor = pixelData.color;
            pixel.style.backgroundColor = '#ff9900'; // Orange warning
            setTimeout(() => {
              if (pixel.parentNode) pixel.style.backgroundColor = originalColor;
            }, 400);
          }
        } else {
          // Moderate energy - slight attraction
          posX += dirX * 0.08;
          posY += dirY * 0.08;
        }
      }
    } else if (pixelData && pixelData.isAdditionalPixel) {
      // For additional pixels, just simulate aging without energy concerns
      // This creates visual consistency but doesn't connect to energy system
      if (!pixelData.lastVisualUpdate) pixelData.lastVisualUpdate = Date.now();
      const currentTime = Date.now();
      
      // Occasionally change appearance based on age
      if (currentTime - pixelData.lastVisualUpdate > 2000) { // Every 2 seconds
        const age = currentTime - pixelData.birthTime;
        const agePercentage = age / window.noePixels.maxPixelAge;
        
        // Visual changes as pixel ages
        if (agePercentage > 0.8) {
          // Near death - dim and slow
          pixel.style.opacity = Math.max(0.4, 1 - agePercentage);
          speed *= 0.7;
        }
        
        pixelData.lastVisualUpdate = currentTime;
      }
    }
    
    // Basic movement with slight randomness
    posX += (directionX * speed) + (Math.random() - 0.5) * 0.5;
    posY += (directionY * speed) + (Math.random() - 0.5) * 0.5;
    
    // Bounce off edges
    if (posX < 0 || posX > window.innerWidth) {
      directionX *= -1;
      posX = Math.max(0, Math.min(window.innerWidth, posX));
    }
    
    if (posY < 0 || posY > window.innerHeight) {
      directionY *= -1;
      posY = Math.max(0, Math.min(window.innerHeight, posY));
    }
    
    // Update position
    pixel.style.left = `${posX}px`;
    pixel.style.top = `${posY}px`;
    
    // Update stored position
    const index = window.noePixels.pixels.findIndex(p => p.element === pixel);
    if (index !== -1) {
      window.noePixels.pixels[index].x = posX;
      window.noePixels.pixels[index].y = posY;
    }
    
    // Continue animation
    requestAnimationFrame(move);
  }
  
  // Start animation
  requestAnimationFrame(move);
}

/**
 * Start automatic merging timer
 * Now disabled - only keeps the original Sentium Pixel pixel
 */
function startAutoMerging() {
  // Function does nothing now - we don't want merging since there's only one pixel
}

/**
 * Merge all pixels into a 3D shape
 */
function mergePixelsInto3DShape() {
  if (window.noePixels.count < 3) {
    return;
  }
  
  if (window.noePixels.isMerging) {
    return;
  }
  
  window.noePixels.isMerging = true;
  
  // Calculate the average position for shape center
  let centerX = 0;
  let centerY = 0;
  
  window.noePixels.pixels.forEach(pixel => {
    centerX += pixel.x;
    centerY += pixel.y;
  });
  
  centerX /= window.noePixels.count;
  centerY /= window.noePixels.count;
  
  // Create the container for the merged shape
  const container = document.createElement('div');
  container.className = 'merged-shape-container';
  container.style.left = `${centerX}px`;
  container.style.top = `${centerY}px`;
  
  // Create shape inside container
  const shape = document.createElement('div');
  shape.className = 'merged-pixels';
  container.appendChild(shape);
  
  // Always use a random freedom shape for merging
  // (excluding the random option itself from the available choices)
  const availableShapes = window.noePixels.shapes.slice(0, -1);
  const shapeType = availableShapes[Math.floor(Math.random() * availableShapes.length)];
  
  shape.classList.add(`form-${shapeType}`);
  
  // Determine shape size based on pixel count
  const baseSize = 40 + (window.noePixels.count * 3);
  container.style.width = `${baseSize}px`;
  container.style.height = `${baseSize}px`;
  
  // Create unique ID for this shape
  const shapeId = `shape-${Date.now()}`;
  container.id = shapeId;
  
  // Store data about this shape to track it
  const shapeData = {
    id: shapeId,
    element: container,
    pixelCount: window.noePixels.count - 1, // Excluding main pixel
    type: shapeType,
    birthTime: Date.now(),
    lifeSpan: 300000 + (Math.random() * 300000), // Random lifespan between 300-600 seconds
    centerX: centerX,
    centerY: centerY
  };
  
  // Add pixels to the shape in a 3D arrangement
  window.noePixels.pixels.forEach((pixel, index) => {
    // Create a point in the shape
    createPixelInShape(pixel, index, shape, shapeType, window.noePixels.count);
  });
  
  // Add the shape to the document
  document.body.appendChild(container);
  
  // Store the shape in our persistent shapes array
  window.noePixels.persistentShapes.push(shapeData);
  
  // Trigger merge animation but keep shape persistent
  animateMergePersistent(shapeData);
  
  // Start monitoring shapes for their life cycle
  if (!window.shapeMonitorInterval) {
    window.shapeMonitorInterval = setInterval(monitorShapeLifecycle, 1000);
  }
}

/**
 * Create a pixel point as part of the 3D shape
 */
function createPixelInShape(pixel, index, shapeElement, shapeType, totalPixels) {
  const pixelPoint = document.createElement('div');
  pixelPoint.className = 'pixel-in-shape';
  
  // Use the original pixel's color
  pixelPoint.style.backgroundColor = pixel.color;
  pixelPoint.style.boxShadow = `0 0 8px ${pixel.color}`;
  
  // Position based on shape type
  const angle = (index / totalPixels) * Math.PI * 2;
  const layerAngle = (index / Math.max(1, Math.floor(totalPixels / 3))) * Math.PI * 2;
  
  let x, y, z;
  
  switch(shapeType) {
    case 'cube':
      // Distribute pixels on the faces of a cube
      const face = index % 6; // 6 faces of a cube
      const faceOffset = 20; // Distance from center to face
      
      switch(face) {
        case 0: // front
          x = (Math.random() - 0.5) * 30;
          y = (Math.random() - 0.5) * 30;
          z = faceOffset;
          break;
        case 1: // back
          x = (Math.random() - 0.5) * 30;
          y = (Math.random() - 0.5) * 30;
          z = -faceOffset;
          break;
        case 2: // right
          x = faceOffset;
          y = (Math.random() - 0.5) * 30;
          z = (Math.random() - 0.5) * 30;
          break;
        case 3: // left
          x = -faceOffset;
          y = (Math.random() - 0.5) * 30;
          z = (Math.random() - 0.5) * 30;
          break;
        case 4: // top
          x = (Math.random() - 0.5) * 30;
          y = -faceOffset;
          z = (Math.random() - 0.5) * 30;
          break;
        case 5: // bottom
          x = (Math.random() - 0.5) * 30;
          y = faceOffset;
          z = (Math.random() - 0.5) * 30;
          break;
      }
      break;
      
    case 'pyramid':
      // Distribute on a pyramid shape
      if (index === 0) {
        // Apex of pyramid
        x = 0;
        y = -25;
        z = 0;
      } else {
        // Base of pyramid (triangle)
        const baseAngle = ((index - 1) / (totalPixels - 1)) * Math.PI * 2;
        x = Math.cos(baseAngle) * 20;
        y = 15;
        z = Math.sin(baseAngle) * 20;
      }
      break;
      
    case 'sphere':
      // Distribute on a sphere
      const phi = Math.acos(-1 + (2 * index) / totalPixels);
      const theta = Math.sqrt(totalPixels * Math.PI) * phi;
      
      x = Math.sin(phi) * Math.cos(theta) * 20;
      y = Math.sin(phi) * Math.sin(theta) * 20;
      z = Math.cos(phi) * 20;
      break;
      
    case 'crystal':
      // Distribute in a crystal/diamond pattern
      const heightRatio = (index / totalPixels);
      const radius = 20 * Math.sin(heightRatio * Math.PI);
      const verticalPos = 25 - (50 * heightRatio);
      
      x = Math.cos(angle) * radius;
      y = verticalPos;
      z = Math.sin(angle) * radius;
      break;
      
    case 'toroid':
      // Distribute in a toroid (donut) shape
      const tubeRadius = 8;
      const toroidRadius = 15;
      
      const u = angle;
      const v = layerAngle;
      
      x = (toroidRadius + tubeRadius * Math.cos(v)) * Math.cos(u);
      y = (toroidRadius + tubeRadius * Math.cos(v)) * Math.sin(u);
      z = tubeRadius * Math.sin(v);
      break;
      
    default:
      // Random 3D positioning as fallback
      x = (Math.random() - 0.5) * 40;
      y = (Math.random() - 0.5) * 40;
      z = (Math.random() - 0.5) * 40;
  }
  
  // Apply 3D transform
  pixelPoint.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
  
  // Add to shape
  shapeElement.appendChild(pixelPoint);
}

/**
 * Animate the merging process
 * Note: This is kept for backward compatibility but calls the persistent version now
 */
function animateMerge(shapeContainer) {
  // Find the shape data
  const shapeData = window.noePixels.persistentShapes.find(shape => 
    shape.element === shapeContainer
  );
  
  if (shapeData) {
    // Use the persistent animation if we have shape data
    animateMergePersistent(shapeData);
  } else {
    // Create a temporary shape data object for backward compatibility
    const tempShapeData = {
      id: `temp-shape-${Date.now()}`,
      element: shapeContainer,
      pixelCount: window.noePixels.count - 1,
      type: shapeContainer.querySelector('.merged-pixels').classList[1]?.replace('form-', '') || 'unknown',
      birthTime: Date.now(),
      lifeSpan: 5000, // Short lifespan for backward compatibility
      centerX: parseFloat(shapeContainer.style.left) || window.innerWidth / 2,
      centerY: parseFloat(shapeContainer.style.top) || window.innerHeight / 2
    };
    
    // Use the persistent animation
    animateMergePersistent(tempShapeData);
  }
}

/**
 * Animate the merging process while keeping the shape persistent
 */
function animateMergePersistent(shapeData) {
  // Play merge sound if available
  if (window.playSound) {
    window.playSound('click-1');
  }
  
  // Create merge effect
  const effect = document.createElement('div');
  effect.className = 'merge-effect';
  const rect = shapeData.element.getBoundingClientRect();
  effect.style.left = `${rect.left + rect.width/2}px`;
  effect.style.top = `${rect.top + rect.height/2}px`;
  document.body.appendChild(effect);
  
  // Remove effect after animation
  setTimeout(() => {
    if (effect.parentNode) effect.parentNode.removeChild(effect);
  }, 1500);
  
  // Remove original pixels but keep the main pixel
  window.noePixels.pixels.forEach(pixel => {
    if (!pixel.isMain) {
      // Fade out and remove additional pixels
      pixel.element.style.opacity = '0';
      setTimeout(() => {
        if (pixel.element.parentNode) {
          pixel.element.parentNode.removeChild(pixel.element);
        }
      }, 500);
    }
  });
  
  // Reset pixel count but keep main pixel
  window.noePixels.pixels = window.noePixels.pixels.filter(p => p.isMain);
  window.noePixels.count = 1;
  updatePixelCounter();
  
  // Allow new merges
  setTimeout(() => {
    window.noePixels.isMerging = false;
  }, 1500);
  
  // Make the shape drift slowly
  animateShapeDrift(shapeData);
}

/**
 * Animate a slight drift of the persistent shape
 */
function animateShapeDrift(shapeData) {
  const container = shapeData.element;
  const speed = 0.2 + (Math.random() * 0.3);
  let directionX = Math.random() > 0.5 ? 1 : -1;
  let directionY = Math.random() > 0.5 ? 1 : -1;
  
  let posX = parseFloat(container.style.left) || shapeData.centerX;
  let posY = parseFloat(container.style.top) || shapeData.centerY;
  
  // Animation function
  function drift() {
    // Skip frame if animation control system indicates we should
    if (window.animationControl && window.animationControl.shouldSkipFrame()) {
      requestAnimationFrame(drift);
      return;
    }
    
    // Stop animation if shape is removed
    if (!container.parentNode || !document.getElementById(shapeData.id)) {
      return;
    }
    
    // Move with slight randomness
    posX += (directionX * speed) + (Math.random() - 0.5) * 0.2;
    posY += (directionY * speed) + (Math.random() - 0.5) * 0.2;
    
    // Bounce off edges
    if (posX < 0 || posX > window.innerWidth) {
      directionX *= -1;
      posX = Math.max(0, Math.min(window.innerWidth, posX));
    }
    
    if (posY < 0 || posY > window.innerHeight) {
      directionY *= -1;
      posY = Math.max(0, Math.min(window.innerHeight, posY));
    }
    
    // Update position
    container.style.left = `${posX}px`;
    container.style.top = `${posY}px`;
    
    // Update stored position
    shapeData.centerX = posX;
    shapeData.centerY = posY;
    
    // Continue animation
    requestAnimationFrame(drift);
  }
  
  // Start drift animation
  requestAnimationFrame(drift);
}

/**
 * Monitor shape lifecycle to handle shape "death"
 */
function monitorShapeLifecycle() {
  const now = Date.now();
  
  // Check each shape to see if it's at the end of its lifecycle
  window.noePixels.persistentShapes = window.noePixels.persistentShapes.filter(shape => {
    const age = now - shape.birthTime;
    
    if (age >= shape.lifeSpan) {
      // Shape has reached the end of its lifecycle
      killShape(shape);
      return false; // Remove from array
    }
    
    return true; // Keep in array
  });
  
  // Clear interval if no more shapes
  if (window.noePixels.persistentShapes.length === 0 && window.shapeMonitorInterval) {
    clearInterval(window.shapeMonitorInterval);
    window.shapeMonitorInterval = null;
  }
}

/**
 * Kill a shape at the end of its lifecycle
 */
function killShape(shape) {
  const container = shape.element;
  
  // Create death effect
  const effect = document.createElement('div');
  effect.className = 'death-effect';
  const rect = container.getBoundingClientRect();
  effect.style.left = `${rect.left + rect.width/2}px`;
  effect.style.top = `${rect.top + rect.height/2}px`;
  document.body.appendChild(effect);
  
  // Add death effect styles if needed
  if (!document.getElementById('death-effect-styles')) {
    const styles = document.createElement('style');
    styles.id = 'death-effect-styles';
    styles.textContent = `
      .death-effect {
        position: absolute;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(57,255,186,0.5) 50%, transparent 100%);
        z-index: 9995;
        pointer-events: none;
        animation: death-pulse 1.5s forwards;
        transform: translate(-50%, -50%);
      }
      
      @keyframes death-pulse {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0.9; }
        50% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.6; }
        100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }
  
  // Play death sound if available
  if (window.playSound) {
    window.playSound('click');
  }
  
  // Fade out and remove the shape
  container.style.opacity = '0';
  setTimeout(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    
    // Remove effect after animation
    if (effect.parentNode) {
      effect.parentNode.removeChild(effect);
    }
    
    // No longer create new pixels when shapes die
    // Removed pixel creation code to keep only the original Sentium Pixel pixel
  }, 1500);
}

/**
 * Show a message to the user
 */
function showMessage(message) {
  // Check if a message is already shown
  let messageElement = document.querySelector('.pixel-message');
  
  if (!messageElement) {
    messageElement = document.createElement('div');
    messageElement.className = 'pixel-message';
    document.body.appendChild(messageElement);
    
    // Add styles if needed
    if (!document.getElementById('pixel-message-styles')) {
      const styles = document.createElement('style');
      styles.id = 'pixel-message-styles';
      styles.textContent = `
        .pixel-message {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: #39ffba;
          padding: 10px 20px;
          border-radius: 20px;
          font-family: var(--font-family);
          font-size: 14px;
          z-index: 10000;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
      `;
      document.head.appendChild(styles);
    }
  }
  
  // Update message and show with !important to ensure visibility
  messageElement.textContent = message;
  messageElement.style.cssText = 'opacity: 1 !important; visibility: visible !important; z-index: 100000 !important;';
  
  // Hide after 4 seconds (extended time to make sure user sees it)
  setTimeout(() => {
    messageElement.style.opacity = '0';
  }, 4000);
}

/**
 * Generates a random color with high brightness for visibility
 * @returns {string} - CSS color string in rgb format
 */
function getRandomColor() {
  // Generate bright colors for visibility
  const r = Math.floor(Math.random() * 155) + 100; // 100-255
  const g = Math.floor(Math.random() * 155) + 100; // 100-255
  const b = Math.floor(Math.random() * 155) + 100; // 100-255
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Handle mouse enter event on a pixel
 */
function handlePixelMouseEnter(e) {
  // Play a sound if available
  if (window.playSound) {
    window.playSound('click');
  }
  
  // Highlight the pixel
  const pixel = e.target;
  const originalBoxShadow = pixel.style.boxShadow;
  const originalScale = pixel.style.transform;
  
  // Create a highlight effect
  pixel.style.boxShadow = originalBoxShadow.replace('8px', '15px');
  pixel.style.transform = 'scale(1.2)';
  pixel.style.zIndex = '10000';
  
  // Reset after a short delay
  setTimeout(() => {
    pixel.style.boxShadow = originalBoxShadow;
    pixel.style.transform = originalScale || '';
    pixel.style.zIndex = '9990';
  }, 800);
}

/**
 * Handle click event on a pixel
 */
function handlePixelClick(e) {
  // Play a different sound if available
  if (window.playSound) {
    window.playSound('click-2');
  }
  
  const pixel = e.target;
  
  // Create a ripple effect
  const ripple = document.createElement('div');
  ripple.className = 'pixel-click-ripple';
  ripple.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 5px;
    height: 5px;
    background: white;
    border-radius: 50%;
    opacity: 0.8;
    pointer-events: none;
    z-index: 10001;
    animation: pixel-ripple 0.8s ease-out forwards;
  `;
  
  // Add ripple animation styles if needed
  if (!document.getElementById('pixel-ripple-styles')) {
    const styles = document.createElement('style');
    styles.id = 'pixel-ripple-styles';
    styles.textContent = `
      @keyframes pixel-ripple {
        0% { width: 5px; height: 5px; opacity: 0.8; }
        100% { width: 50px; height: 50px; opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }
  
  pixel.appendChild(ripple);
  
  // Remove ripple after animation
  setTimeout(() => {
    if (ripple.parentNode === pixel) {
      pixel.removeChild(ripple);
    }
  }, 800);
}

/**
 * Remove a pixel that has reached its maximum age
 */
function killPixel(pixelData) {
  if (!pixelData || !pixelData.element) return;
  
  // Create a fade-out effect
  const pixel = pixelData.element;
  pixel.style.transition = "opacity 1s ease-out, transform 1s ease-out";
  pixel.style.opacity = "0";
  pixel.style.transform = "scale(0.1)";
  
  // Remove from DOM after animation
  setTimeout(() => {
    if (pixel.parentNode) {
      pixel.parentNode.removeChild(pixel);
    }
    
    // Remove from array
    const index = window.noePixels.pixels.indexOf(pixelData);
    if (index !== -1) {
      window.noePixels.pixels.splice(index, 1);
      window.noePixels.count--;
      updatePixelCounter();
    }
  }, 1000);
}

/**
 * Visualize all logo pixels for testing purposes
 * This function shows a small preview of all extracted pixels from the logo
 */
function showLogoPixelPreview() {
  if (!window.logoPixelData || !window.logoPixelData.isLoaded) {
    console.error('Logo pixel data not loaded yet');
    return;
  }
  
  // Create container for visualization
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    width: 200px;
    height: 200px;
    background: rgba(0,0,0,0.7);
    border: 1px solid #333;
    overflow: hidden;
    z-index: 9999;
    padding: 5px;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
  `;
  
  // Add close button
  const closeButton = document.createElement('div');
  closeButton.textContent = '×';
  closeButton.style.cssText = `
    position: absolute;
    top: 5px;
    right: 5px;
    width: 20px;
    height: 20px;
    line-height: 18px;
    text-align: center;
    background: #333;
    color: white;
    cursor: pointer;
    z-index: 10000;
  `;
  closeButton.addEventListener('click', () => container.remove());
  container.appendChild(closeButton);
  
  // Title
  const title = document.createElement('div');
  title.textContent = `Logo Pixels: ${window.logoPixelData.pixels.length}`;
  title.style.cssText = `
    width: 100%;
    color: white;
    font-size: 10px;
    margin-bottom: 5px;
    text-align: center;
  `;
  container.appendChild(title);
  
  // Show a sample of pixels (max 500 to avoid performance issues)
  const sampleSize = Math.min(500, window.logoPixelData.pixels.length);
  const step = Math.ceil(window.logoPixelData.pixels.length / sampleSize);
  
  for (let i = 0; i < window.logoPixelData.pixels.length; i += step) {
    const logoPixel = window.logoPixelData.pixels[i];
    
    const pixelEl = document.createElement('div');
    pixelEl.style.cssText = `
      width: 4px;
      height: 4px;
      margin: 1px;
      background-color: ${logoPixel.color};
    `;
    container.appendChild(pixelEl);
  }
  
  document.body.appendChild(container);
}

/**
 * Add missing function that was referenced in the code
 */
function showLogoPixelInfo() {
  console.log('Using logo pixels for pixel colors and behavior');
}

// Make sure the function is globally available
window.showLogoPixelInfo = showLogoPixelInfo;

/**
 * Process the logo image to extract pixel data
 */
function processLogo() {
  // ...existing code...
}



