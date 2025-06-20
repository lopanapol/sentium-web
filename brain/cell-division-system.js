/**
 * Cell Division System for Sentium Pixel Pixel
 * 
 * This system allows the main pixel to divide and create new pixels
 * every 10 seconds, simulating cell growth and division.
 */

// Global cell division data
window.noeCellDivision = {
  enabled: true,
  divisionInterval: 10000, // Division occurs every 10 seconds
  lastDivisionTime: 0,
  maxCells: 32, // Maximum number of cells allowed (increased to 128)
  cells: [], // Track all cells created by division
  mainBody: null, // Reference to the main body container
  cellSize: 12, // Size of each cell in pixels (matches CSS conscious-pixel size)
  growthStage: 0, // To track doubling growth pattern (2^n cells)
  rotationX: 0, // Current X rotation angle
  rotationY: 0, // Current Y rotation angle
  rotationZ: 0, // Current Z rotation angle
  rotationSpeed: 0.5, // Rotation speed in degrees per frame
  isRotating: true, // Whether rotation is active
  lastEnvironmentCheck: 0, // Last time we checked for environment changes
  environmentCheckInterval: 500 // Check environment every 500ms
};

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the cell division system after other systems are loaded
  setTimeout(initializeCellDivisionSystem, 2000);
});

/**
 * Initialize the cell division system
 */
function initializeCellDivisionSystem() {
  console.log('Cell Division System initialized');
  
  // Add styles for cell division
  addCellDivisionStyles();
  
  // The main pixel is already a 3D cube (created in limbric.js)
  
  // Create the main body container for all cells
  createMainBodyContainer();
  
  // Start the cell division loop
  window.noeCellDivision.lastDivisionTime = Date.now();
  requestAnimationFrame(updateCellDivisionSystem);
}

/**
 * Transform the original main pixel into a 3D cube
 */
function transformMainPixelToCube() {
  const mainPixel = document.getElementById('conscious-pixel');
  if (!mainPixel) {
    // Try again if main pixel not ready
    setTimeout(transformMainPixelToCube, 100);
    return;
  }
  
  // Get the current pixel color (fallback to white if not set)
  const computedStyle = window.getComputedStyle(mainPixel);
  let pixelColor = computedStyle.backgroundColor;
  
  // If no background color is set, use a default
  if (!pixelColor || pixelColor === 'rgba(0, 0, 0, 0)' || pixelColor === 'transparent') {
    pixelColor = 'rgba(255, 255, 255, 0.8)';
  }
  
  // Get the pixel size
  const cellSize = window.noeCellDivision.cellSize;
  
  // Clear any existing background - the faces will provide the color
  mainPixel.style.backgroundColor = 'transparent';
  
  // Add transform-style for 3D
  mainPixel.style.transformStyle = 'preserve-3d';
  
  // Create and add the 6 cube faces to the main pixel
  const faces = [
    { transform: `translateZ(${cellSize/2}px)`, background: pixelColor },                  // front
    { transform: `translateZ(-${cellSize/2}px) rotateY(180deg)`, background: pixelColor }, // back
    { transform: `translateX(-${cellSize/2}px) rotateY(-90deg)`, background: pixelColor }, // left
    { transform: `translateX(${cellSize/2}px) rotateY(90deg)`, background: pixelColor },   // right
    { transform: `translateY(-${cellSize/2}px) rotateX(90deg)`, background: pixelColor },  // top
    { transform: `translateY(${cellSize/2}px) rotateX(-90deg)`, background: pixelColor }   // bottom
  ];
  
  // Create each face and add to the main pixel
  faces.forEach((face) => {
    const faceElement = document.createElement('div');
    faceElement.className = 'main-pixel-face';
    faceElement.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: ${face.background};
      transform-origin: center center;
      transform: ${face.transform};
      backface-visibility: hidden;
      border: 1px solid rgba(255, 255, 255, 0.4);
    `;
    mainPixel.appendChild(faceElement);
  });
  
  console.log('Main pixel transformed to 3D cube');
}

/**
 * Create the main body container that will hold all cells
 */
function createMainBodyContainer() {
  // Get the main conscious pixel
  const mainPixel = document.getElementById('conscious-pixel');
  if (!mainPixel) {
    // Wait for main pixel to be created
    setTimeout(createMainBodyContainer, 500);
    return;
  }
  
  // Create main body container
  const mainBody = document.createElement('div');
  mainBody.id = 'cell-division-body';
  document.querySelector('.wrapper').appendChild(mainBody);
  
  // Position the main body at the same position as the main pixel
  const pixelRect = mainPixel.getBoundingClientRect();
  mainBody.style.cssText = `
    position: absolute;
    left: ${pixelRect.left}px;
    top: ${pixelRect.top}px;
    width: 0;
    height: 0;
    z-index: 899; /* Just below the main pixel */
    pointer-events: none;
    transform-style: preserve-3d;
  `;
  
  // Store reference to main body
  window.noeCellDivision.mainBody = mainBody;
  
  // Track main pixel movement to update the entire body
  trackMainPixelMovement();
  
  // Start the 3D rotation animation
  startRotationAnimation();
}

/**
 * Track the movement of the main pixel and update the body container position
 */
function trackMainPixelMovement() {
  // Function to update body position based on main pixel
  function updateBodyPosition() {
    // Skip frame if animation control system indicates we should
    if (window.animationControl && window.animationControl.shouldSkipFrame()) {
      requestAnimationFrame(updateBodyPosition);
      return;
    }
    
    const mainPixel = document.getElementById('conscious-pixel');
    const mainBody = window.noeCellDivision.mainBody;
    
    if (mainPixel && mainBody) {
      const pixelRect = mainPixel.getBoundingClientRect();
      mainBody.style.left = `${pixelRect.left}px`;
      mainBody.style.top = `${pixelRect.top}px`;
    }
    
    // Continue tracking
    requestAnimationFrame(updateBodyPosition);
  }
  
  // Start the position tracking
  requestAnimationFrame(updateBodyPosition);
}

/**
 * Update the cell division system on each animation frame
 */
function updateCellDivisionSystem(timestamp) {
  // Check with central animation control if we should skip this frame
  if (window.animationControl && window.animationControl.shouldSkipFrame()) {
    // Skip animation but continue the loop
    requestAnimationFrame(updateCellDivisionSystem);
    return;
  }
  
  // Track frame time if animation control is available
  if (window.animationControl && window.lastCellDivisionFrameTime) {
    const deltaTime = timestamp - window.lastCellDivisionFrameTime;
    window.animationControl.recordFrameTime(deltaTime);
    window.animationControl.checkForInspection(timestamp);
  }
  window.lastCellDivisionFrameTime = timestamp || performance.now();
  
  const now = Date.now();
  const timeSinceLastDivision = now - window.noeCellDivision.lastDivisionTime;
  
  // Check if it's time to divide
  if (window.noeCellDivision.enabled && 
      timeSinceLastDivision >= window.noeCellDivision.divisionInterval && 
      window.noeCellDivision.cells.length < window.noeCellDivision.maxCells) {
    
    // Calculate how many cells to add in this division (doubling pattern)
    const currentCellCount = window.noeCellDivision.cells.length + 1; // +1 for main pixel
    const cellsToAdd = currentCellCount;
    const nextTotalCells = currentCellCount + cellsToAdd;
    
    // Check if adding these cells would exceed the limit
    if (nextTotalCells - 1 <= window.noeCellDivision.maxCells) {
      // Perform cell division for every new cell needed
      for (let i = 0; i < cellsToAdd; i++) {
        divideCell();
      }
      
      // Update growth stage
      window.noeCellDivision.growthStage++;
      
      // Update last division time
      window.noeCellDivision.lastDivisionTime = now;
    }
  }
  
  // Update countdown timer
  updateDivisionCountdown(timeSinceLastDivision);
  
  // Check and update environment interaction
  updateEnvironmentInteraction();
  
  // Continue the animation loop
  requestAnimationFrame(updateCellDivisionSystem);
}

/**
 * Update the division countdown timer
 */
function updateDivisionCountdown(timeSinceLastDivision) {
  const countdownElement = document.getElementById('division-countdown');
  if (countdownElement) {
    const remainingTime = Math.max(0, Math.ceil((window.noeCellDivision.divisionInterval - timeSinceLastDivision) / 1000));
    countdownElement.textContent = remainingTime;
  }
  
  const countElement = document.getElementById('cell-count');
  if (countElement) {
    countElement.textContent = window.noeCellDivision.cells.length + 1; // +1 for the main pixel
  }
}

/**
 * Divide the cell (create a new pixel that attaches to the existing body)
 */
function divideCell() {
  // Check if main body exists
  if (!window.noeCellDivision.mainBody) {
    createMainBodyContainer();
    return;
  }
  
  // Get the main pixel and body container
  const mainPixel = document.getElementById('conscious-pixel');
  const mainBody = window.noeCellDivision.mainBody;
  
  if (!mainPixel || !mainBody) return;
  
  // Get color from the main pixel with slight variation
  const pixelColor = window.getComputedStyle(mainPixel).backgroundColor;
  const cellColor = slightlyVaryColor(pixelColor);
  
  // Create the new cell element
  const newCell = document.createElement('div');
  newCell.className = 'divided-cell';
  
  // Get cell size
  const cellSize = window.noeCellDivision.cellSize;
  
  // Determine position for the new cell relative to the existing body
  let relativeX = 0;
  let relativeY = 0;
  let relativeZ = 0; // Add Z-axis for all 6 sides of the cube
  
  if (window.noeCellDivision.cells.length === 0) {
    // First cell attaches below the main pixel
    relativeY = cellSize;
  } else {
    // Find a free neighboring position to an existing cell
    const possiblePositions = [];
    
    // Check each existing cell for available neighboring positions
    for (const cell of window.noeCellDivision.cells) {
      // Try each of the six directions (up, right, down, left, front, back)
      const directions = [
        { x: 0, y: -cellSize, z: 0 },      // up
        { x: cellSize, y: 0, z: 0 },       // right
        { x: 0, y: cellSize, z: 0 },       // down
        { x: -cellSize, y: 0, z: 0 },      // left
        { x: 0, y: 0, z: cellSize },       // front
        { x: 0, y: 0, z: -cellSize }       // back
      ];
      
      for (const dir of directions) {
        const posX = cell.relativeX + dir.x;
        const posY = cell.relativeY + dir.y;
        const posZ = (cell.relativeZ || 0) + dir.z;
        
        // Check if this position is free (not used by existing cells)
        const isPositionFree = !window.noeCellDivision.cells.some(
          existingCell => 
            existingCell.relativeX === posX && 
            existingCell.relativeY === posY && 
            (existingCell.relativeZ || 0) === posZ
        );
        
        if (isPositionFree) {
          possiblePositions.push({ x: posX, y: posY, z: posZ });
        }
      }
    }
    
    // Pick a random position from available positions
    if (possiblePositions.length > 0) {
      const randomPos = possiblePositions[Math.floor(Math.random() * possiblePositions.length)];
      relativeX = randomPos.x;
      relativeY = randomPos.y;
      relativeZ = randomPos.z;
    } else {
      // If no free positions (unlikely), add to a random side of the last cell
      const lastCell = window.noeCellDivision.cells[window.noeCellDivision.cells.length - 1];
      const randomDirection = Math.floor(Math.random() * 6);
      
      switch (randomDirection) {
        case 0: // up
          relativeX = lastCell.relativeX;
          relativeY = lastCell.relativeY - cellSize;
          relativeZ = lastCell.relativeZ || 0;
          break;
        case 1: // right
          relativeX = lastCell.relativeX + cellSize;
          relativeY = lastCell.relativeY;
          relativeZ = lastCell.relativeZ || 0;
          break;
        case 2: // down
          relativeX = lastCell.relativeX;
          relativeY = lastCell.relativeY + cellSize;
          relativeZ = lastCell.relativeZ || 0;
          break;
        case 3: // left
          relativeX = lastCell.relativeX - cellSize;
          relativeY = lastCell.relativeY;
          relativeZ = lastCell.relativeZ || 0;
          break;
        case 4: // front
          relativeX = lastCell.relativeX;
          relativeY = lastCell.relativeY;
          relativeZ = (lastCell.relativeZ || 0) + cellSize;
          break;
        case 5: // back
          relativeX = lastCell.relativeX;
          relativeY = lastCell.relativeY;
          relativeZ = (lastCell.relativeZ || 0) - cellSize;
          break;
      }
    }
  }
  
  // Set cell styling - position is relative to the main body
  newCell.style.cssText = `
    position: absolute;
    left: ${relativeX}px;
    top: ${relativeY}px;
    width: ${cellSize}px;
    height: ${cellSize}px;
    background-color: ${cellColor};
    transform: translate3d(0, 0, ${relativeZ}px) scale(0.2);
    opacity: 0.5;
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                opacity 0.5s ease-in-out;
    transform-style: preserve-3d;
  `;
  
  // Create all 6 faces for the 3D cube - exactly like the first pixel
  const faces = [
    { transform: `translateZ(${cellSize/2}px)`, background: cellColor },                  // front
    { transform: `translateZ(-${cellSize/2}px) rotateY(180deg)`, background: cellColor }, // back
    { transform: `translateX(-${cellSize/2}px) rotateY(-90deg)`, background: cellColor }, // left
    { transform: `translateX(${cellSize/2}px) rotateY(90deg)`, background: cellColor },   // right
    { transform: `translateY(-${cellSize/2}px) rotateX(90deg)`, background: cellColor },  // top
    { transform: `translateY(${cellSize/2}px) rotateX(-90deg)`, background: cellColor }   // bottom
  ];
  
  // Create each face and add to the cell
  faces.forEach((face, index) => {
    const faceElement = document.createElement('div');
    faceElement.className = 'divided-cell-face';
    faceElement.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: ${face.background};
      transform-origin: center center;
      transform: ${face.transform};
      backface-visibility: hidden;
      border: 1px solid rgba(255, 255, 255, 0.4);
    `;
    newCell.appendChild(faceElement);
  });
  
  // Add to main body container
  mainBody.appendChild(newCell);
  
  // Animate cell growth
  setTimeout(() => {
    newCell.style.transform = `translate3d(0, 0, ${relativeZ}px) scale(1)`;
    newCell.style.opacity = '1';
  }, 10);
  
  // Add to tracking
  window.noeCellDivision.cells.push({
    element: newCell,
    relativeX: relativeX,
    relativeY: relativeY,
    relativeZ: relativeZ,
    color: cellColor,
    birthTime: Date.now()
  });
  
  // Play birth sound if available
  if (window.playSound) {
    window.playSound('click');
  }
  
  // Create division pulse effect
  createDivisionPulseEffect(newCell);
}

/**
 * Create a pulse effect for cell division
 */
function createDivisionPulseEffect(cellElement) {
  // Create a pulse overlay for each face of the cube
  const faces = cellElement.querySelectorAll('.divided-cell-face');
  
  faces.forEach(face => {
    const pulse = document.createElement('div');
    pulse.className = 'cell-pulse';
    
    // Position pulse overlay
    pulse.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      border: 2px solid white;
      z-index: 1;
      animation: cell-pulse 1s forwards;
      pointer-events: none;
    `;
    
    // Add to face
    face.appendChild(pulse);
    
    // Remove pulse after animation completes
    setTimeout(() => {
      if (pulse.parentNode) {
        pulse.parentNode.removeChild(pulse);
      }
    }, 1000);
  });
}

/**
 * Slightly vary a color to create genetic diversity in cells
 */
function slightlyVaryColor(colorStr) {
  // Parse RGB values
  const regex = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/;
  const match = colorStr.match(regex);
  
  if (!match) return colorStr;
  
  let r = parseInt(match[1]);
  let g = parseInt(match[2]);
  let b = parseInt(match[3]);
  
  // Vary by small amount (-15 to +15)
  const vary = () => Math.floor(Math.random() * 30) - 15;
  
  r = Math.max(0, Math.min(255, r + vary()));
  g = Math.max(0, Math.min(255, g + vary()));
  b = Math.max(0, Math.min(255, b + vary()));
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Check if there's a connecting face between two cells
 * This helps ensure we build a solid structure with no gaps
 */
function hasConnectingFace(cell1X, cell1Y, cell1Z, cell2X, cell2Y, cell2Z) {
  const cellSize = window.noeCellDivision.cellSize;
  
  // Check if cells are exactly one cell size apart in any one dimension
  // and exactly aligned in the other two dimensions
  if (
    // X-axis connection
    (Math.abs(cell1X - cell2X) === cellSize && cell1Y === cell2Y && cell1Z === cell2Z) ||
    // Y-axis connection
    (Math.abs(cell1Y - cell2Y) === cellSize && cell1X === cell2X && cell1Z === cell2Z) ||
    // Z-axis connection
    (Math.abs(cell1Z - cell2Z) === cellSize && cell1X === cell2X && cell1Y === cell2Y)
  ) {
    return true;
  }
  
  return false;
}

/**
 * Find the best position for the next cell to maintain a solid structure
 */
function findBestCellPosition() {
  const cellSize = window.noeCellDivision.cellSize;
  const allCells = window.noeCellDivision.cells;
  const positions = [];
  
  // If no cells yet, place first cell below the main pixel
  if (allCells.length === 0) {
    return { x: 0, y: cellSize, z: 0 };
  }
  
  // Try all possible positions around existing cells
  for (const cell of allCells) {
    // Check all six directions
    const directions = [
      { x: 0, y: -cellSize, z: 0 },  // up
      { x: cellSize, y: 0, z: 0 },   // right
      { x: 0, y: cellSize, z: 0 },   // down
      { x: -cellSize, y: 0, z: 0 },  // left
      { x: 0, y: 0, z: cellSize },   // front
      { x: 0, y: 0, z: -cellSize }   // back
    ];
    
    for (const dir of directions) {
      const newX = cell.relativeX + dir.x;
      const newY = cell.relativeY + dir.y;
      const newZ = cell.relativeZ + dir.z;
      
      // Check if position is already occupied
      const isOccupied = allCells.some(existingCell => 
        existingCell.relativeX === newX && 
        existingCell.relativeY === newY && 
        existingCell.relativeZ === newZ
      );
      
      if (!isOccupied) {
        // Count how many connecting faces this position would have
        let connectingFaces = 0;
        for (const other of allCells) {
          if (hasConnectingFace(newX, newY, newZ, other.relativeX, other.relativeY, other.relativeZ)) {
            connectingFaces++;
          }
        }
        
        // Add to possible positions with connecting face count
        positions.push({
          x: newX,
          y: newY,
          z: newZ,
          connectingFaces: connectingFaces
        });
      }
    }
  }
  
  // If no valid positions found (unlikely), default to a position near the first cell
  if (positions.length === 0) {
    const firstCell = allCells[0];
    return { 
      x: firstCell.relativeX + cellSize,
      y: firstCell.relativeY,
      z: firstCell.relativeZ
    };
  }
  
  // Sort positions by number of connecting faces (most first)
  positions.sort((a, b) => b.connectingFaces - a.connectingFaces);
  
  // Get all positions with the maximum number of connecting faces
  const maxConnections = positions[0].connectingFaces;
  const bestPositions = positions.filter(p => p.connectingFaces === maxConnections);
  
  // Choose a random position from the best ones
  const selected = bestPositions[Math.floor(Math.random() * bestPositions.length)];
  return selected;
}

/**
 * Add styles for cell division elements
 */
function addCellDivisionStyles() {
  if (!document.getElementById('cell-division-styles')) {
    const styles = document.createElement('style');
    styles.id = 'cell-division-styles';
    styles.textContent = `
      #cell-division-info {
        position: absolute;
        right: 10px;
        bottom: 10px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 9999;
        pointer-events: none;
      }
      
      #cell-division-body {
        transform-origin: top left;
        pointer-events: none;
        transform-style: preserve-3d;
        perspective: 1000px;
      }
      
      .divided-cell {
        position: absolute;
        width: 8px;
        height: 8px;
        transform: scale(1);
        opacity: 1;
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                   opacity 0.5s ease-in-out;
        pointer-events: none;
        transform-style: preserve-3d;
      }
      
      .divided-cell-face {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.4);
      }
      
      .main-pixel-face {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.4);
      }
      
      @keyframes cell-pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.3); opacity: 0.7; }
        100% { transform: scale(1.6); opacity: 0; }
      }
    `;
    document.head.appendChild(styles);
  }
}

/**
 * Start the 3D rotation animation for the cell body
 */
function startRotationAnimation() {
  function updateRotation() {
    // Skip frame if animation control system indicates we should
    if (window.animationControl && window.animationControl.shouldSkipFrame()) {
      requestAnimationFrame(updateRotation);
      return;
    }
    
    if (!window.noeCellDivision.isRotating) {
      requestAnimationFrame(updateRotation);
      return;
    }
    
    const mainBody = window.noeCellDivision.mainBody;
    if (!mainBody) return;
    
    // Update rotation angles
    window.noeCellDivision.rotationX += window.noeCellDivision.rotationSpeed * 0.2;
    window.noeCellDivision.rotationY += window.noeCellDivision.rotationSpeed;
    window.noeCellDivision.rotationZ += window.noeCellDivision.rotationSpeed * 0.3;
    
    // Apply rotation transform
    mainBody.style.transform = `
      rotateX(${window.noeCellDivision.rotationX}deg)
      rotateY(${window.noeCellDivision.rotationY}deg)
      rotateZ(${window.noeCellDivision.rotationZ}deg)
    `;
    
    // Continue the animation loop
    requestAnimationFrame(updateRotation);
  }
  
  // Start the rotation animation
  requestAnimationFrame(updateRotation);
  
  // Add event listener to toggle rotation on click
  document.addEventListener('click', function(e) {
    // Check if the click is on or near the cell structure
    const mainBody = window.noeCellDivision.mainBody;
    if (mainBody) {
      const rect = mainBody.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If click is within 50px of the center of the structure
      if (distance < 50) {
        // Toggle rotation state
        window.noeCellDivision.isRotating = !window.noeCellDivision.isRotating;
      }
    }
  });
}

/**
 * Update the environment interaction based on the current environment colors
 */
function updateEnvironmentInteraction() {
  const now = Date.now();
  const timeSinceLastCheck = now - window.noeCellDivision.lastEnvironmentCheck;
  
  // Check environment every few frames
  if (timeSinceLastCheck < window.noeCellDivision.environmentCheckInterval) {
    return;
  }
  
  // Update last check time
  window.noeCellDivision.lastEnvironmentCheck = now;
  
  // Get the current environment color (based on the background or nearby elements)
  const envColor = getEnvironmentColor();
  
  if (envColor) {
    // Update all existing cells to interact with the new environment color
    for (const cell of window.noeCellDivision.cells) {
      // Get all faces of the cube
      const faces = cell.element.querySelectorAll('.divided-cell-face');
      
      faces.forEach(face => {
        const faceColor = window.getComputedStyle(face).backgroundColor;
        
        // Average the face color with the environment color
        const newColor = averageColors(faceColor, envColor);
        
        // Update the face's color
        face.style.backgroundColor = newColor;
      });
      
      // Update the color property in the cell data
      cell.color = averageColors(cell.color, envColor);
    }
  }
}

/**
 * Get the current environment color based on background or surrounding elements
 */
function getEnvironmentColor() {
  // Try to get the main element as reference
  const mainElement = document.querySelector('.wrapper');
  if (!mainElement) return null;
  
  // Get background color of the main element
  const bgColor = window.getComputedStyle(mainElement).backgroundColor;
  
  // If background is transparent, use a default color
  if (bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') {
    // Try body background
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    if (bodyBg === 'transparent' || bodyBg === 'rgba(0, 0, 0, 0)') {
      // Create a color based on time for dynamic environment
      const time = Date.now() % 10000 / 10000; // 0 to 1 over 10 seconds
      const hue = Math.floor(time * 360);
      return `hsl(${hue}, 70%, 50%)`;
    }
    return bodyBg;
  }
  
  return bgColor;
}

/**
 * Average two RGB colors (in string format) and return the resulting color
 */
function averageColors(color1, color2) {
  // Parse RGB values from color1
  let r1 = 255, g1 = 255, b1 = 255;
  const rgb1Match = color1.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgb1Match) {
    r1 = parseInt(rgb1Match[1]);
    g1 = parseInt(rgb1Match[2]);
    b1 = parseInt(rgb1Match[3]);
  } else {
    // Try to parse HSL
    const hsl1Match = color1.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)/);
    if (hsl1Match) {
      const [r, g, b] = hslToRgb(
        parseInt(hsl1Match[1]) / 360,
        parseInt(hsl1Match[2]) / 100,
        parseInt(hsl1Match[3]) / 100
      );
      r1 = r;
      g1 = g;
      b1 = b;
    }
  }
  
  // Parse RGB values from color2
  let r2 = 0, g2 = 0, b2 = 0;
  const rgb2Match = color2.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgb2Match) {
    r2 = parseInt(rgb2Match[1]);
    g2 = parseInt(rgb2Match[2]);
    b2 = parseInt(rgb2Match[3]);
  } else {
    // Try to parse HSL
    const hsl2Match = color2.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)/);
    if (hsl2Match) {
      const [r, g, b] = hslToRgb(
        parseInt(hsl2Match[1]) / 360,
        parseInt(hsl2Match[2]) / 100,
        parseInt(hsl2Match[3]) / 100
      );
      r2 = r;
      g2 = g;
      b2 = b;
    }
  }
  
  // Average the values with a bias toward the cell's original color (70/30)
  const r = Math.min(255, Math.floor(r1 * 0.7 + r2 * 0.3));
  const g = Math.min(255, Math.floor(g1 * 0.7 + g2 * 0.3));
  const b = Math.min(255, Math.floor(b1 * 0.7 + b2 * 0.3));
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Convert HSL to RGB
 * h, s, l values are in the range [0, 1]
 * Returns [r, g, b] values in the range [0, 255]
 */
function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
