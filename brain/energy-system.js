/**
 * Energy System for Sentium Pixel (conscious pixel)
 * Allows Sentium Pixel to maintain energy via contact with energy cubes
 */

// Global energy system accessible to other scripts
window.noeEnergy = {
  currentLevel: 100,
  maxLevel: 100,
  needsEnergy: false,
  nearestCube: null
};

// Global connection state
window.localConnection = {
  isConnected: false,
  serverUrl: 'http://localhost:3000/api/pixel',
  
  // Attempt connection to local server
  connect: async function() {
    if (this.isConnected) return true;
    
    try {
      // Try multiple server endpoints for compatibility with different Sentium server versions
      const serverUrls = [
        'http://localhost:3000/api/pixel',  // Primary endpoint
        this.serverUrl,                     // Default or previously working URL
        'http://localhost:3000',            // Root endpoint
        'http://localhost:3000/api/sentium',// Alternative API endpoint
        'http://localhost:3000/api/test-connection', // Specialized test endpoint
        'http://127.0.0.1:3000/api/pixel'   // Alternative hostname
      ];
      
      for (const url of serverUrls) {
        try {
          console.log(`Attempting to connect to ${url}...`);
          // Send a test request to the server
          const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
              'Origin': window.location.origin
            }
          });
          
          // If we get any response, consider it connected (even with status 404 or 501)
          // This is because different Sentium server versions respond differently
          if (response.status) {
            // For 200-299 status codes, we're definitely connected
            const isSuccessStatus = response.status >= 200 && response.status < 300;
            // For 404 and some other status codes, the server is running but endpoint might be wrong
            const isAcceptableError = [404, 405, 501].includes(response.status);
            
            if (isSuccessStatus || isAcceptableError) {
              console.log(`Connected to Sentium server at ${url} (status: ${response.status})`);
              this.isConnected = true;
              this.serverUrl = url; // Remember which URL worked
              
              // Store the working URL globally for other scripts
              if (window) window.localServerUrl = url;
              
              return true;
            } else {
              console.log(`Server responded but with unexpected status: ${response.status}`);
            }
          }
        } catch (err) {
          console.log(`Failed to connect to ${url}: ${err.message}`);
          // Continue trying other URLs
        }
      }
      
      // If we reach here, all connection attempts failed
      console.error('All connection attempts failed');
      
      // Display detailed connection debug info
      console.log('=== CONNECTION ATTEMPTS DEBUG ===');
      console.log(`Host: ${window.location.hostname}`);
      console.log(`Protocol: ${window.location.protocol}`);
      console.log(`Tried URLs: ${serverUrls.join(', ')}`);
      console.log('=============================');
      
      return false;
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  },
  
  // Disconnect from server
  disconnect: function() {
    this.isConnected = false;
    // Don't clear the serverUrl as we want to remember it for future connections
    console.log('Disconnected from local Sentium server');
    
    // Notify any observers about the disconnection
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('sentium:disconnected'));
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  console.log('Energy system initializing...');
  // References
  const pixel = document.getElementById('conscious-pixel');
  const body = document.body;
  
  // Energy cubes configuration
  const numCubes = 1; // Only one cube that floats freely
  const cubes = [];
  const connections = [];
  let pixelPosition = { x: 0, y: 0 };
  
  // Energy system state
  let energy = 100;
  const energyDecayRate = 0.01; // Changed from 0.05 to 0.01 for ~1% energy decay per second
  const energyRechargeRate = 0.5;
  const contactDistance = 100; // Distance threshold for energy transfer
  
  // Cube movement settings
  const cubeMovementSpeed = 0.1;    // Base movement speed (reduced for slower movement)
  const cubeMaxSpeed = 0.3;         // Maximum speed (reduced for slower movement)
  const cubeWanderRadius = 600;     // How far cube will float (increased for wider coverage)
  let lastCubeMovementTime = 0;     // For time-based movement adjustments

  // Create energy cubes
  function createEnergyCubes() {
    // Remove any existing cubes
    document.querySelectorAll('.energy-cube').forEach(cube => cube.remove());
    document.querySelectorAll('.energy-connection').forEach(conn => conn.remove());
    document.querySelectorAll('.energy-target-indicator').forEach(ind => ind.remove());
    
    cubes.length = 0;
    connections.length = 0;
    
    // Create new cube at a random position
    for (let i = 0; i < numCubes; i++) {
      // Calculate the effective size of cube including its 3D transformations
      const effectiveSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cube-size')) || 40;
      const safeMargin = effectiveSize + 20; // Add extra margin to account for glow effects and 3D transforms
      
      // Calculate position - place it anywhere on the screen but safely away from edges
      const posX = safeMargin + Math.random() * (window.innerWidth - safeMargin * 2);
      const posY = safeMargin + Math.random() * (window.innerHeight - safeMargin * 2);
      
      // Create cube container
      const cubeElement = document.createElement('div');
      cubeElement.className = 'energy-cube';
      cubeElement.style.left = posX + 'px';
      cubeElement.style.top = posY + 'px';
      
      // Create 3D cube
      const cubeContainer = document.createElement('div');
      cubeContainer.className = 'cube-container';
      
      // Create cube faces
      const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];
      faces.forEach(face => {
        const faceElement = document.createElement('div');
        faceElement.className = `cube-face ${face}`;
        cubeContainer.appendChild(faceElement);
      });
      
      cubeElement.appendChild(cubeContainer);
      body.appendChild(cubeElement);
      
      // Create connection line (initially hidden)
      const connection = document.createElement('div');
      connection.className = 'energy-connection';
      body.appendChild(connection);
      
      // Store references
      cubes.push({
        element: cubeElement,
        position: { x: posX, y: posY },
        energy: 100,
        isCharging: false,
        connection: connection
      });
      connections.push(connection);
      
      // Activate cube with delay
      setTimeout(() => {
        cubeElement.classList.add('active');
      }, i * 300);
    }
  }
  
  // Update energy connections between Sentium Pixel and cubes
  function updateConnections() {
    if (!pixel) return;
    
    cubes.forEach((cube, i) => {
      const dx = pixelPosition.x - cube.position.x;
      const dy = pixelPosition.y - cube.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Update connection line
      const connection = connections[i];
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      connection.style.width = distance + 'px';
      connection.style.left = cube.position.x + 'px';
      connection.style.top = cube.position.y + 'px';
      connection.style.transform = `rotate(${angle}deg)`;
      
      // Check if close enough for energy transfer
      if (distance < contactDistance) {
        // Activate connection
        connection.classList.add('active');
        
        // Transfer energy when pixel is close
        if (cube.energy > 0 && energy < 100) {
          // Charge pixel
          energy = Math.min(100, energy + energyRechargeRate);
          cube.energy = Math.max(0, cube.energy - energyRechargeRate * 0.5);
          
          // Update global energy state immediately
          window.noeEnergy.currentLevel = energy;
          window.noeEnergy.needsEnergy = energy < 50; // Changed from 30 to 50
          
          // Visual feedback
          pixel.classList.add('energizing');
          
          // Update cube appearance based on energy level
          updateCubeEnergy(cube);
        }
      } else {
        // Deactivate connection when far
        connection.classList.remove('active');
        pixel.classList.remove('energizing');
      }
    });
  }
  
  // Update cube appearance based on energy level
  function updateCubeEnergy(cube) {
    const faces = cube.element.querySelectorAll('.cube-face');
    
    if (cube.energy > 70) {
      faces.forEach(face => face.classList.add('charged'));
    } else if (cube.energy < 30) {
      faces.forEach(face => face.classList.remove('charged'));
    }
    
    // Make opacity reflect energy level
    const opacity = 0.3 + (cube.energy / 100) * 0.6;
    faces.forEach(face => face.style.opacity = opacity);
  }
  
  // Update energy level of pixel
  function updatePixelEnergy() {
    if (!pixel) return;
    
    // Natural energy decay over time
    energy = Math.max(0, energy - energyDecayRate);
    
    // Update global energy state
    window.noeEnergy.currentLevel = energy;
    window.noeEnergy.needsEnergy = energy < 50; // Changed from 30 to 50 to seek energy earlier
    
    // Check for death state (energy is 0)
    const isDead = energy <= 0;
    
    // Visual feedback - adjust pixel brightness based on energy
    const brightness = isDead ? 0.2 : (0.5 + (energy / 100) * 0.5);
    pixel.style.opacity = brightness;
    
    // Update pixel status if available
    const pixelStatus = document.getElementById('pixel-status');
    if (pixelStatus) {
      if (isDead) {
        pixelStatus.textContent = `Sentium Pixel: ENERGY DEPLETED`;
        pixelStatus.classList.add('critical');
      } else {
        pixelStatus.textContent = `Sentium Pixel: ${Math.round(energy)}% energy`;
        pixelStatus.classList.toggle('critical', energy < 10);
      }
    }
    
    // Find nearest energy cube if energy is low or depleted
    if (window.noeEnergy.needsEnergy || isDead) {
      findNearestCube();
    } else {
      window.noeEnergy.nearestCube = null;
      // Remove any targeting indicators when energy is sufficient
      document.querySelectorAll('.energy-target-indicator').forEach(ind => ind.remove());
    }
    
    // Regenerate cubes if all depleted
    const allDepleted = cubes.every(cube => cube.energy < 10);
    if (allDepleted) {
      createEnergyCubes();
    }
  }
  
  // Find the nearest energy cube with sufficient energy
  function findNearestCube() {
    if (!pixel || cubes.length === 0) return;
    
    let nearestDistance = Infinity;
    let nearestCube = null;
    let nearestIndex = -1;
    
    // Check if pixel is in death state
    const isDeathState = energy <= 0;
    
    // Get pixel position
    const pixelRect = pixel.getBoundingClientRect();
    const pixelX = pixelRect.left + pixelRect.width / 2;
    const pixelY = pixelRect.top + pixelRect.height / 2;
    
    cubes.forEach((cube, index) => {
      // In death state, all cubes with any energy should try to help
      // Otherwise, only consider cubes with sufficient energy
      if ((isDeathState && cube.energy > 5) || (!isDeathState && cube.energy > 20)) {
        const dx = pixelPosition.x - cube.position.x;
        const dy = pixelPosition.y - cube.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestCube = {
            x: cube.position.x,
            y: cube.position.y,
            distance: distance,
            index: index
          };
          nearestIndex = index;
        }
      }
    });
    
    window.noeEnergy.nearestCube = nearestCube;
    
    // Update visual indicator for the target cube
    updateTargetIndicator(nearestIndex, isDeathState);
  }
  
  // Create or update visual indicator showing which cube is being targeted
  function updateTargetIndicator(cubeIndex, isDeathState = false) {
    // Remove any existing indicators
    document.querySelectorAll('.energy-target-indicator').forEach(ind => ind.remove());
    
    // If we have a valid cube index and energy is low or in death state, show target indicator
    if (cubeIndex >= 0 && cubeIndex < cubes.length && (energy < 50 || isDeathState)) {
      const cube = cubes[cubeIndex];
      
      // Create indicator element
      const indicator = document.createElement('div');
      indicator.className = 'energy-target-indicator';
      
      // Add classes based on energy level
      if (isDeathState) {
        indicator.classList.add('urgent');
      } else if (energy < 10) {
        indicator.classList.add('critical');
      } else if (energy < 25) {
        indicator.classList.add('very-low');
      } else if (energy < 50) {
        indicator.classList.add('low');
      }
      
      indicator.style.left = cube.position.x + 'px';
      indicator.style.top = cube.position.y + 'px';
      body.appendChild(indicator);
      
      // Add CSS style for the indicator if not already present
      if (!document.querySelector('style#energy-system-styles')) {
        const style = document.createElement('style');
        style.id = 'energy-system-styles';
        style.textContent = `
          .energy-target-indicator {
            position: fixed;
            width: calc(var(--cube-size) + 20px);
            height: calc(var(--cube-size) + 20px);
            border: 2px dashed rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            transform: translate(-10px, -10px);
            pointer-events: none;
            z-index: 9989;
            animation: targetPulse 1.5s infinite alternate ease-in-out;
          }
          
          /* Energy level indicators */
          .energy-target-indicator.low {
            border: 2px dashed rgba(57, 255, 186, 0.8);
            animation: lowEnergyPulse 2s infinite alternate ease-in-out;
          }
          
          .energy-target-indicator.very-low {
            border: 2px dashed rgba(255, 186, 57, 0.8);
            animation: veryLowEnergyPulse 1.5s infinite alternate ease-in-out;
          }
          
          .energy-target-indicator.critical {
            border: 3px dashed rgba(255, 140, 50, 0.9);
            animation: criticalEnergyPulse 1s infinite alternate ease-in-out;
          }
          
          .energy-target-indicator.urgent {
            border: 3px dashed rgba(255, 100, 100, 0.9);
            animation: urgentPulse 0.8s infinite alternate ease-in-out;
          }
          
          @keyframes targetPulse {
            0% { transform: translate(-10px, -10px) scale(0.9); opacity: 0.4; }
            100% { transform: translate(-10px, -10px) scale(1.1); opacity: 0.8; }
          }
          
          @keyframes lowEnergyPulse {
            0% { transform: translate(-10px, -10px) scale(0.9); opacity: 0.5; }
            100% { transform: translate(-10px, -10px) scale(1.1); opacity: 0.7; box-shadow: 0 0 10px rgba(57, 255, 186, 0.2); }
          }
          
          @keyframes veryLowEnergyPulse {
            0% { transform: translate(-10px, -10px) scale(0.9); opacity: 0.6; box-shadow: 0 0 5px rgba(255, 186, 57, 0.2); }
            100% { transform: translate(-10px, -10px) scale(1.15); opacity: 0.8; box-shadow: 0 0 15px rgba(255, 186, 57, 0.3); }
          }
          
          @keyframes criticalEnergyPulse {
            0% { transform: translate(-10px, -10px) scale(0.9); opacity: 0.7; box-shadow: 0 0 8px rgba(255, 140, 50, 0.3); }
            100% { transform: translate(-10px, -10px) scale(1.2); opacity: 0.9; box-shadow: 0 0 18px rgba(255, 140, 50, 0.4); }
          }
          
          @keyframes urgentPulse {
            0% { transform: translate(-10px, -10px) scale(0.9); opacity: 0.7; box-shadow: 0 0 10px rgba(255, 0, 0, 0.3); }
            100% { transform: translate(-10px, -10px) scale(1.2); opacity: 0.9; box-shadow: 0 0 20px rgba(255, 0, 0, 0.5); }
          }
          
          /* Recharging effect for cubes */
          .cube-face.recharging {
            animation: recharge-pulse 0.8s ease-in-out;
          }
          
          @keyframes recharge-pulse {
            0% { opacity: 1; box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.8); }
            50% { opacity: 0.5; box-shadow: inset 0 0 30px rgba(57, 255, 186, 1); }
            100% { opacity: 1; box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.8); }
          }
        `;
        document.head.appendChild(style);
      }
    }
  }
  
  // Move cubes in a floating pattern or towards pixel when in critical state
  function moveCubes(timestamp) {
    if (!cubes.length) return;
    
    // Calculate time delta for smooth movement
    const deltaTime = timestamp - lastCubeMovementTime;
    lastCubeMovementTime = timestamp;
    
    // Check if pixel is in death state
    const isDeathState = energy <= 0;
    
    // Move each cube with a floating pattern
    cubes.forEach((cube, index) => {
      // Check if this cube has sufficient energy to help
      const canHelp = cube.energy > 5;
      
      // Store original spawn position if not already stored
      if (!cube.spawnPosition) {
        cube.spawnPosition = { 
          x: cube.position.x, 
          y: cube.position.y 
        };
      }
      
      // Store or initialize cube phase for smoother motion
      if (cube.phase === undefined) {
        cube.phase = Math.random() * Math.PI * 2; // Random starting phase
      }
      
      let newX, newY;
      
      // If pixel is in death state and the cube has energy, move toward pixel
      if (isDeathState && canHelp && pixelPosition) {
        // Calculate direction to pixel
        const dx = pixelPosition.x - cube.position.x;
        const dy = pixelPosition.y - cube.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If still far away from pixel, move toward it
        if (distance > 70) {
          // Normalize direction and move toward pixel
          const dirX = dx / (distance || 1);
          const dirY = dy / (distance || 1);
          
          // Move faster when pixel is in death state but with subtle oscillation for fluidity
          const rescueSpeed = 2.5;
          const oscillation = Math.sin(timestamp * 0.003 + cube.phase) * 0.3;
          
          newX = cube.position.x + dirX * (rescueSpeed + oscillation);
          newY = cube.position.y + dirY * (rescueSpeed + oscillation);
          
          // Add visual indicator that cube is rushing to help
          if (Math.random() < 0.1) {
            const trail = document.createElement('div');
            trail.className = 'cube-rescue-trail';
            trail.style.left = cube.position.x + 'px';
            trail.style.top = cube.position.y + 'px';
            document.body.appendChild(trail);
            
            // Remove trail after animation
            setTimeout(() => {
              if (trail.parentNode) trail.parentNode.removeChild(trail);
            }, 800);
          }
          
          // Add rescue trail styles if not already present
          if (!document.querySelector('style#rescue-trail-styles')) {
            const style = document.createElement('style');
            style.id = 'rescue-trail-styles';
            style.textContent = `
              .cube-rescue-trail {
                position: fixed;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: var(--cube-energy-color);
                opacity: 0.7;
                pointer-events: none;
                z-index: 9988;
                transform: translate(-5px, -5px);
                animation: trail-fade 0.8s forwards;
              }
              
              @keyframes trail-fade {
                0% { transform: translate(-5px, -5px) scale(1); opacity: 0.7; }
                100% { transform: translate(-5px, -5px) scale(0.2); opacity: 0; }
              }
            `;
            document.head.appendChild(style);
          }
        } else {
          // If close enough, resume gentle floating near the pixel
          const time = timestamp / 1000;
          const offset = index * Math.PI / numCubes;
          
          // Calculate smaller orbit around the pixel
          const orbitRadius = 60;
          const orbitX = Math.sin(time * 0.8 + offset) * orbitRadius;
          const orbitY = Math.cos(time * 0.8 + offset * 2) * orbitRadius;
          
          newX = pixelPosition.x + orbitX;
          newY = pixelPosition.y + orbitY;
        }
      } else {
        // Free-flowing floating behavior
        const time = timestamp / 1000;
        
        // Calculate a more complex movement pattern for a single cube
        // Using multiple sine/cosine waves with different frequencies and phases for more fluid, organic motion
        const floatX = (
          Math.sin(time * 0.15 + cube.phase) * cubeWanderRadius * 0.4 + 
          Math.sin(time * 0.08 + cube.phase * 1.5) * cubeWanderRadius * 0.3 +
          Math.sin(time * 0.03 + cube.phase * 0.7) * cubeWanderRadius * 0.2
        );
        const floatY = (
          Math.cos(time * 0.12 + cube.phase) * cubeWanderRadius * 0.4 + 
          Math.cos(time * 0.06 + cube.phase * 1.3) * cubeWanderRadius * 0.3 +
          Math.cos(time * 0.04 + cube.phase * 0.9) * cubeWanderRadius * 0.15
        );
        
        // Allow the cube to float more freely across the entire viewport
        if (!cube.centralPosition) {
          // Define a central position for the cube to orbit around
          cube.centralPosition = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
          };
        }
        
        // Calculate position relative to central position
        newX = cube.centralPosition.x + floatX;
        newY = cube.centralPosition.y + floatY;
        
        // Occasionally update the central position with proper constraints
        if (Math.random() < 0.001) {
          // Calculate the effective size of cube including its 3D transformations
          const effectiveSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cube-size')) || 40;
          const safeMargin = effectiveSize + 20; // Add extra margin to account for glow effects and 3D transforms
          
          cube.centralPosition = {
            x: safeMargin + Math.random() * (window.innerWidth - safeMargin * 2),
            y: safeMargin + Math.random() * (window.innerHeight - safeMargin * 2)
          };
        }
      }
      
      // Keep cube within screen boundaries with increased padding to account for 3D transformations
      // The cube faces can extend beyond the cube container due to 3D transforms
      // Calculate the effective size of cube including its 3D transformations
      const effectiveSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cube-size')) || 40;
      const margin = effectiveSize + 20; // Add extra margin to account for glow effects and 3D transforms
      const boundedX = Math.max(margin, Math.min(window.innerWidth - margin, newX));
      const boundedY = Math.max(margin, Math.min(window.innerHeight - margin, newY));
      
      // Update cube position with smooth transition
      cube.position.x = boundedX;
      cube.position.y = boundedY;
      
      // Apply the new position to the DOM element with smooth transition
      cube.element.style.left = `${boundedX}px`;
      cube.element.style.top = `${boundedY}px`;
      
      // Also update any target indicators
      const indicator = document.querySelector('.energy-target-indicator');
      if (indicator && window.noeEnergy.nearestCube && window.noeEnergy.nearestCube.index === index) {
        indicator.style.left = `${boundedX}px`;
        indicator.style.top = `${boundedY}px`;
      }
    });
  }
  
  // Track pixel position
  function trackPixel() {
    if (!pixel) return;
    
    // Get pixel position from element
    const rect = pixel.getBoundingClientRect();
    pixelPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
  
  // Initialize everything
  function initialize() {
    createEnergyCubes();
    
    // Provide ways to interact with the energy system from outside
    window.noeEnergy.recharge = function(amount) {
      energy = Math.min(100, energy + amount);
      window.noeEnergy.currentLevel = energy;
      window.noeEnergy.needsEnergy = energy < 50; // Changed from 30 to 50
      
      // Visual feedback when recharging
      cubes.forEach(cube => {
        if (cube.element) {
          const faces = cube.element.querySelectorAll('.cube-face');
          faces.forEach(face => {
            face.classList.add('recharging');
            setTimeout(() => face.classList.remove('recharging'), 800);
          });
        }
      });
      
      return energy;
    };
    
    window.noeEnergy.consume = function(amount) {
      energy = Math.max(0, energy - amount);
      window.noeEnergy.currentLevel = energy;
      window.noeEnergy.needsEnergy = energy < 50; // Changed from 30 to 50
      return energy;
    };
    
    // Add a special method for checking if the pixel is in death state
    window.noeEnergy.isDeathState = function() {
      return energy <= 0;
    };
    
    // Expose the successful connection URL for other scripts to use
    window.noeEnergy.getServerUrl = function() {
      return window.localConnection ? window.localConnection.serverUrl : null;
    };
    
    // Initialize the movement timestamp
    lastCubeMovementTime = performance.now();
    
    // Main update loop with animation frame for smoother movements
    function mainLoop(timestamp) {
      // Check with central animation control system if we should skip this frame
      if (window.animationControl && window.animationControl.shouldSkipFrame()) {
        // Skip animation updates but keep the loop going
        requestAnimationFrame(mainLoop);
        return;
      }
      
      // Track frame time if animation control system is available
      if (window.animationControl) {
        const deltaTime = lastFrameTimestamp ? timestamp - lastFrameTimestamp : 0;
        window.animationControl.recordFrameTime(deltaTime);
        window.animationControl.checkForInspection(timestamp);
      }
      lastFrameTimestamp = timestamp;
      
      // Run normal updates
      trackPixel();
      updateConnections();
      updatePixelEnergy();
      moveCubes(timestamp);
      requestAnimationFrame(mainLoop);
    }
    
    // Initialize timestamp tracking
    let lastFrameTimestamp = 0;
    
    // Start the animation loop
    requestAnimationFrame(mainLoop);
    
    // Handle window resize events - instead of recreating cubes, reposition them within bounds
    window.addEventListener('resize', function() {
      // When window is resized, update cube positions to stay within bounds
      cubes.forEach(cube => {
        const effectiveSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cube-size')) || 40;
        const safeMargin = effectiveSize + 20;
        
        // Ensure cube is still within bounds
        const boundedX = Math.max(safeMargin, Math.min(window.innerWidth - safeMargin, cube.position.x));
        const boundedY = Math.max(safeMargin, Math.min(window.innerHeight - safeMargin, cube.position.y));
        
        // Update the cube position
        cube.position.x = boundedX;
        cube.position.y = boundedY;
        cube.element.style.left = `${boundedX}px`;
        cube.element.style.top = `${boundedY}px`;
        
        // Also update central position if needed
        if (cube.centralPosition) {
          cube.centralPosition.x = Math.max(safeMargin, Math.min(window.innerWidth - safeMargin, cube.centralPosition.x));
          cube.centralPosition.y = Math.max(safeMargin, Math.min(window.innerHeight - safeMargin, cube.centralPosition.y));
        }
      });
    });
    setInterval(() => {
      // Randomly recharge cubes
      cubes.forEach(cube => {
        if (cube.energy < 100) {
          cube.energy += 0.2;
          updateCubeEnergy(cube);
        }
      });
    }, 1000);
  }
  
  // Start when pixel is detected
  if (pixel) {
    initialize();
  } else {
    // Wait for pixel to be created
    const observer = new MutationObserver(mutations => {
      if (document.getElementById('conscious-pixel')) {
        observer.disconnect();
        initialize();
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Shows a message about connection state
  function showConnectionMessage(message) {
    console.log('Showing connection message:', message);
    
    // Check if a message element already exists
    let messageElement = document.querySelector('.connection-message');
    
    if (!messageElement) {
      // Create a new message element if it doesn't exist
      console.log('Creating new connection message element');
      messageElement = document.createElement('div');
      messageElement.className = 'connection-message';
      document.body.appendChild(messageElement);
      
      // Add styles if needed
      if (!document.getElementById('connection-message-styles')) {
        console.log('Adding connection message styles');
        const styles = document.createElement('style');
        styles.id = 'connection-message-styles';
        styles.textContent = `
          .connection-message {
            position: fixed;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: #39ffba;
            padding: 10px 20px;
            border-radius: 20px;
            font-family: var(--font-family, sans-serif);
            font-size: 16px;
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
    console.log('Message element updated and shown');
    
    // Hide after 2 seconds
    setTimeout(() => {
      messageElement.style.opacity = '0';
      console.log('Message hidden after timeout');
    }, 2000);
  }
});
