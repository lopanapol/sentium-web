// Simple Energy Cubes Generator
// Creates energy sources for the conscious pixel to interact with

document.addEventListener('DOMContentLoaded', function() {
  // Wait a moment for limbric.js to initialize
  setTimeout(createEnergyCubes, 1000);
});

/**
 * Creates energy cubes that the main pixel can interact with
 */
function createEnergyCubes() {
  // Initialize global energy tracking object if it doesn't exist
  if (!window.noeEnergy) {
    window.noeEnergy = {
      cubes: [],
      currentLevel: 100,
      needsEnergy: false,
      nearestCube: null
    };
  }
  
  // Create container for energy cubes
  let cubeContainer = document.createElement('div');
  cubeContainer.id = 'energy-cube-container';
  document.querySelector('.wrapper').appendChild(cubeContainer);
  
  // Create initial set of energy cubes
  createNewCube();
  
  // Periodically create new cubes
  setInterval(createNewCube, 15000); // Create a new cube every 15 seconds
  
  // Start update loop
  requestAnimationFrame(updateCubes);
}

/**
 * Creates a new energy cube at a random position
 */
function createNewCube() {
  // Check if noeEnergy exists and has cubes array before accessing length
  if (window.noeEnergy && window.noeEnergy.cubes && window.noeEnergy.cubes.length >= 5) return;
  
  // Create cube element
  let cube = document.createElement('div');
  cube.className = 'energy-cube';
  
  // Random position (avoiding edges) with proper calculation for 3D transformations
  const effectiveSize = 15; // Size of this simple cube
  const margin = effectiveSize + 20; // Add extra margin for box-shadow and transformations
  const x = margin + Math.random() * (window.innerWidth - margin * 2);
  const y = margin + Math.random() * (window.innerHeight - margin * 2);
  
  // Set cube properties
  cube.style.cssText = `
    position: absolute;
    width: 15px;
    height: 15px;
    background-color: #39ffba;
    box-shadow: 0 0 18px #39ffba;
    border-radius: 3px;
    left: ${x}px;
    top: ${y}px;
    z-index: 900;
    transform: rotate(45deg);
    transition: transform 1.5s cubic-bezier(0.34, 1.56, 0.64, 1), left 1.8s cubic-bezier(0.25, 0.1, 0.25, 1), top 1.8s cubic-bezier(0.25, 0.1, 0.25, 1);
    animation: cube-float 8s infinite alternate ease-in-out;
  `;
  
  // Add cube float animation if not already present
  if (!document.querySelector('style#cube-float-style')) {
    const style = document.createElement('style');
    style.id = 'cube-float-style';
    style.textContent = `
      @keyframes cube-float {
        0% { transform: rotate(45deg) translateZ(0); }
        25% { transform: rotate(35deg) translateZ(5px); }
        50% { transform: rotate(55deg) translateZ(10px); }
        75% { transform: rotate(40deg) translateZ(5px); }
        100% { transform: rotate(45deg) translateZ(0); }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Updates all energy cubes (animation, lifetime, etc)
 */
function updateCubes(timestamp) {
  // Get reference to conscious pixel if available
  let pixel = document.getElementById('conscious-pixel');
  let pixelRect = pixel ? pixel.getBoundingClientRect() : null;
  let pixelX = pixelRect ? pixelRect.x + pixelRect.width/2 : 0;
  let pixelY = pixelRect ? pixelRect.y + pixelRect.height/2 : 0;
  
  // Calculate nearest cube to pixel
  let nearestCube = null;
  let nearestDist = Infinity;
  
  // Update nearest cube info for pixel attraction
  window.noeEnergy.nearestCube = nearestCube;
  
  // Check if we need energy (below 50%)
  window.noeEnergy.needsEnergy = window.noeEnergy.currentLevel < 50;
  
  // Continue animation loop
  requestAnimationFrame(updateCubes);
}

/**
 * Updates the glow effect on a cube
 */
function updateCubeGlow(cube) {
  // Pulse glow size up and down
  cube.glowSize += 0.2 * cube.pulseDirection;
  
  if (cube.glowSize > 20) {
    cube.glowSize = 20;
    cube.pulseDirection = -1;
  } else if (cube.glowSize < 10) {
    cube.glowSize = 10;
    cube.pulseDirection = 1;
  }
  
  // Apply updated glow effect
  cube.element.style.boxShadow = `0 0 ${cube.glowSize}px #39ffba`;
}

/**
 * Fades out and removes a cube when expired
 */
function fadeOutAndRemoveCube(cube, index) {
  // Animate fade out
  cube.element.style.transition = 'opacity 1s ease-out';
  cube.element.style.opacity = '0';
  
  // Remove from DOM and array after animation
  setTimeout(() => {
    if (cube.element.parentNode) {
      cube.element.parentNode.removeChild(cube.element);
    }
    
    // Check if the cube is still in the array
    const currentIndex = window.noeEnergy.cubes.indexOf(cube);
    if (currentIndex !== -1) {
      window.noeEnergy.cubes.splice(currentIndex, 1);
    }
  }, 1000);
  
  // Remove from tracking array immediately
  window.noeEnergy.cubes.splice(index, 1);
}

/**
 * When pixel consumes a cube, add energy and remove cube
 */
function consumeCube(cube, index) {
  // Add energy to pixel
  window.noeEnergy.currentLevel = Math.min(100, window.noeEnergy.currentLevel + 25);
  
  // Create satisfaction burst effect
  createEnergyBurst(cube.x, cube.y);
  
  // Remove cube immediately
  cube.element.parentNode.removeChild(cube.element);
  window.noeEnergy.cubes.splice(index, 1);
}

/**
 * Creates a burst effect when energy is consumed
 */
function createEnergyBurst(x, y) {
  const burst = document.createElement('div');
  burst.className = 'energy-burst';
  burst.style.cssText = `
    position: absolute;
    width: 5px;
    height: 5px;
    background-color: transparent;
    border-radius: 50%;
    left: ${x}px;
    top: ${y}px;
    z-index: 899;
    box-shadow: 0 0 30px 20px rgba(57, 255, 186, 0.8);
    animation: burstAnimation 0.5s ease-out forwards;
    pointer-events: none;
  `;
  
  // Add keyframes for burst animation if not already added
  if (!document.getElementById('burst-animation')) {
    const style = document.createElement('style');
    style.id = 'burst-animation';
    style.textContent = `
      @keyframes burstAnimation {
        0% { transform: scale(0.2); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add to document and remove after animation
  document.body.appendChild(burst);
  setTimeout(() => {
    if (burst.parentNode) {
      burst.parentNode.removeChild(burst);
    }
  }, 500);
}
