// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Get the canvas element
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas,
    alpha: true,
    antialias: true
});

// Set canvas to fullscreen
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // Transparent background

// Initialize database
const cubeDB = new CubeDB();
let currentCubeData = null;

// Consciousness simulation variables (initialize early)
const mouse = new THREE.Vector2();
const cubePersonality = {
    curiosity: Math.random() * 0.5 + 0.3, // 0.3-0.8
    shyness: Math.random() * 0.4 + 0.1,   // 0.1-0.5
    playfulness: Math.random() * 0.6 + 0.2, // 0.2-0.8
    attention: 0,
    mood: 0.5, // 0 = sad, 1 = happy
    energy: Math.random() * 0.5 + 0.5 // 0.5-1.0
};

let mousePresent = false;
let mouseStillTime = 0;
let lastMouseMove = 0;
let cubeState = 'idle'; // idle, curious, shy, playful, excited
let targetPosition = new THREE.Vector3(0, 0, 0);
let targetRotationSpeed = 0.01;
let currentRotationSpeed = 0.01;
let consciousness = {
    focus: new THREE.Vector2(0, 0),
    interest: 0,
    lastInteraction: Date.now()
};

// Function to generate any random color
function getRandomGlassColor() {
    // Generate completely random RGB values
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    // Convert to hex color
    return (r << 16) | (g << 8) | b;
}

// Create cube geometry and materials (will be updated with persistent data)
const geometry = new THREE.BoxGeometry(1, 1, 1);
let material = new THREE.MeshBasicMaterial({ 
    color: 0x87CEEB, // Default color, will be overridden
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
});

// Create edges for outline (color will be set dynamically)
const edges = new THREE.EdgesGeometry(geometry);
let edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
let wireframe = new THREE.LineSegments(edges, edgeMaterial);

// Function to update edge color based on surface color
function updateEdgeColor(surfaceColor) {
    // Extract RGB components
    const r = (surfaceColor >> 16) & 255;
    const g = (surfaceColor >> 8) & 255;
    const b = surfaceColor & 255;
    
    // Make darker by reducing each component by 40%
    const darkR = Math.floor(r * 0.6);
    const darkG = Math.floor(g * 0.6);
    const darkB = Math.floor(b * 0.6);
    
    // Convert back to hex
    const darkerColor = (darkR << 16) | (darkG << 8) | darkB;
    
    // Update the edge material color
    wireframe.material.color.setHex(darkerColor);
}

// Create cube group
const cubeGroup = new THREE.Group();
const cube = new THREE.Mesh(geometry, material);
cubeGroup.add(cube);
cubeGroup.add(wireframe);
cubeGroup.position.set(0, 0, 0);
scene.add(cubeGroup);

// Initialize current cube data (will be loaded or created)
currentCubeData = null;

// Initialize database and load/create cube
async function initAndLoadCube() {
    try {
        await cubeDB.init();
        
        // Try to load existing cube data
        const existingCubes = await cubeDB.getAllCubes();
        
        if (existingCubes.length > 0) {
            // Load the most recent cube
            currentCubeData = existingCubes[existingCubes.length - 1];
            // Convert date string back to Date object if needed
            if (typeof currentCubeData.created === 'string') {
                currentCubeData.created = new Date(currentCubeData.created);
            }
            
            // Apply the loaded color to the cube
            cube.material.color.setHex(currentCubeData.color);
            updateEdgeColor(currentCubeData.color);
            
            // Apply loaded rotation if exists
            if (currentCubeData.rotation) {
                cubeGroup.rotation.x = currentCubeData.rotation.x;
                cubeGroup.rotation.y = currentCubeData.rotation.y;
                cubeGroup.rotation.z = currentCubeData.rotation.z;
            }
            
            console.log('Loaded existing cube from IndexedDB:', currentCubeData);
        } else {
            // No existing cube, create new one with random color
            const randomColor = getRandomGlassColor();
            currentCubeData = {
                color: randomColor,
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                created: new Date(),
                name: `${Date.now()}`
            };
            
            // Apply the color to the cube
            cube.material.color.setHex(randomColor);
            updateEdgeColor(randomColor);
            
            // Save the new cube
            await cubeDB.saveCube(currentCubeData);
            console.log('Created new cube and saved to IndexedDB:', currentCubeData);
        }
        
        updateDataDisplay();
    } catch (error) {
        console.error('Error loading/saving cube:', error);
    }
}

// Function to update data display (without position and rotation)
function updateDataDisplay() {
    if (!currentCubeData) return;
    
    const cubeInfo = document.getElementById('cube-info');
    const colorHex = '#' + currentCubeData.color.toString(16).padStart(6, '0');
    
    // Get emotional state description
    const getMoodDescription = () => {
        if (cubePersonality.mood > 0.8) return "Happy";
        if (cubePersonality.mood > 0.6) return "Content";
        if (cubePersonality.mood > 0.4) return "Neutral";
        if (cubePersonality.mood > 0.2) return "Sad";
        return "Anxious";
    };
    
    const getStateDescription = () => {
        switch (cubeState) {
            case 'curious': return "Curious";
            case 'shy': return "Shy";
            case 'playful': return "Playful";
            case 'excited': return "Excited";
            default: return "Idle";
        }
    };
    
    cubeInfo.innerHTML = `
        <div><strong>ID:</strong> ${currentCubeData.name}</div>
        <div><strong>Color:</strong> ${colorHex}</div>
        <div><strong>Mood:</strong> ${getMoodDescription()}</div>
        <div><strong>State:</strong> ${getStateDescription()}</div>
        <div><strong>Created:</strong> ${currentCubeData.created.toLocaleTimeString()}</div>
    `;
}

initAndLoadCube();

// Reset button functionality
document.getElementById('reset-button').addEventListener('click', async () => {
    try {
        // Clear all cube data from IndexedDB
        const allCubes = await cubeDB.getAllCubes();
        for (const cube of allCubes) {
            await cubeDB.deleteCube(cube.id);
        }
        
        console.log('IndexedDB cleared for this site');
        
        // Create a new cube with random color
        const randomColor = getRandomGlassColor();
        currentCubeData = {
            color: randomColor,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            created: new Date(),
            name: `${Date.now()}`
        };
        
        // Apply the new color to the cube
        cube.material.color.setHex(randomColor);
        updateEdgeColor(randomColor);
        
        // Reset rotation
        cubeGroup.rotation.set(0, 0, 0);
        
        // Save the new cube
        await cubeDB.saveCube(currentCubeData);
        
        // Update display
        updateDataDisplay();
        
        console.log('New cube created:', currentCubeData);
        
    } catch (error) {
        console.error('Error resetting cube data:', error);
    }
});

// Add some lighting (though not needed for wireframe)
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
scene.add(light);

// Position camera
camera.position.z = 8;

// Mouse tracking for consciousness
// Mouse tracking for consciousness
function onMouseMove(event) {
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    mousePresent = true;
    lastMouseMove = Date.now();
    mouseStillTime = 0;
    
    // Update consciousness focus
    consciousness.focus.x = mouse.x;
    consciousness.focus.y = mouse.y;
    consciousness.interest = Math.min(consciousness.interest + 0.02, 1.0);
    consciousness.lastInteraction = Date.now();
    
    // Determine cube's reaction based on personality
    updateCubeState();
}

function onMouseLeave() {
    mousePresent = false;
    consciousness.interest = Math.max(consciousness.interest - 0.1, 0);
}

function onMouseEnter() {
    mousePresent = true;
    consciousness.interest = 0.3;
}

// Cube consciousness state machine
function updateCubeState() {
    const timeSinceLastMove = Date.now() - lastMouseMove;
    const distanceFromCenter = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
    
    if (!mousePresent) {
        cubeState = 'idle';
        return;
    }
    
    // Determine emotional state based on interaction
    if (timeSinceLastMove < 50) {
        // Very rapid mouse movement = excited
        cubeState = 'excited';
    } else if (timeSinceLastMove < 200) {
        if (distanceFromCenter < 0.3) {
            cubeState = cubePersonality.shyness > 0.3 ? 'shy' : 'curious';
        } else {
            cubeState = 'curious';
        }
    } else if (timeSinceLastMove < 3000) {
        cubeState = 'playful';
    } else {
        cubeState = 'idle';
    }
}

// Conscious movement behavior
function updateConsciousBehavior() {
    const time = Date.now() * 0.001;
    
    // Calculate actual world space boundaries based on camera setup
    // With camera at z=8 and FOV=75, we can calculate the visible area
    const fov = 75 * Math.PI / 180; // Convert to radians
    const distance = 8;
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * (window.innerWidth / window.innerHeight);
    
    // Use 80% of the visible area to keep cube on screen
    const maxX = (width / 2) * 0.8;
    const maxY = (height / 2) * 0.8;
    
    switch (cubeState) {
        case 'curious':
            // Move toward mouse with some wandering
            const approachX = mouse.x * maxX * 0.7 + Math.sin(time * 2) * (maxX * 0.3);
            const approachY = mouse.y * maxY * 0.7 + Math.cos(time * 1.5) * (maxY * 0.3);
            targetPosition.x = Math.max(-maxX, Math.min(maxX, approachX));
            targetPosition.y = Math.max(-maxY, Math.min(maxY, approachY));
            targetRotationSpeed = 0.02 + consciousness.interest * 0.01;
            cubePersonality.mood = Math.min(cubePersonality.mood + 0.005, 1.0);
            break;
            
        case 'shy':
            // Move away from mouse to opposite corner
            const avoidX = -mouse.x * maxX * 0.8 + Math.sin(time) * (maxX * 0.2);
            const avoidY = -mouse.y * maxY * 0.8 + Math.cos(time) * (maxY * 0.2);
            targetPosition.x = Math.max(-maxX, Math.min(maxX, avoidX));
            targetPosition.y = Math.max(-maxY, Math.min(maxY, avoidY));
            targetRotationSpeed = 0.005;
            cubePersonality.mood = Math.max(cubePersonality.mood - 0.002, 0.2);
            break;
            
        case 'playful':
            // Free-roaming energetic movement across the screen
            const playX = Math.sin(time * cubePersonality.playfulness * 2) * maxX * 0.9;
            const playY = Math.cos(time * cubePersonality.playfulness * 1.5) * maxY * 0.9;
            targetPosition.x = playX;
            targetPosition.y = playY;
            targetRotationSpeed = 0.03 * cubePersonality.energy;
            cubePersonality.mood = Math.min(cubePersonality.mood + 0.01, 1.0);
            break;
            
        case 'excited':
            // Rapid, unpredictable movement
            targetPosition.x += (Math.random() - 0.5) * maxX * 0.2;
            targetPosition.y += (Math.random() - 0.5) * maxY * 0.2;
            targetPosition.x = Math.max(-maxX, Math.min(maxX, targetPosition.x));
            targetPosition.y = Math.max(-maxY, Math.min(maxY, targetPosition.y));
            targetRotationSpeed = 0.05;
            cubePersonality.mood = Math.min(cubePersonality.mood + 0.02, 1.0);
            break;
            
        case 'idle':
        default:
            // Gentle wandering movement
            const wanderX = Math.sin(time * 0.3) * maxX * 0.6 + Math.sin(time * 0.7) * maxX * 0.2;
            const wanderY = Math.cos(time * 0.25) * maxY * 0.5 + Math.cos(time * 0.6) * maxY * 0.3;
            targetPosition.x = wanderX;
            targetPosition.y = wanderY;
            targetRotationSpeed = 0.01;
            cubePersonality.mood = Math.max(cubePersonality.mood - 0.001, 0.3);
            break;
    }
    
    // Update cube mood affects opacity
    const moodOpacity = 0.4 + cubePersonality.mood * 0.4;
    cube.material.opacity = moodOpacity;
}

// Event listeners
canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('mouseenter', onMouseEnter);
canvas.addEventListener('mouseleave', onMouseLeave);

// Set cursor style
canvas.style.cursor = 'crosshair';

// Animation loop with consciousness
function animate() {
    requestAnimationFrame(animate);
    
    // Update conscious behavior
    updateConsciousBehavior();
    
    // Smooth position interpolation
    cubeGroup.position.x += (targetPosition.x - cubeGroup.position.x) * 0.05;
    cubeGroup.position.y += (targetPosition.y - cubeGroup.position.y) * 0.05;
    
    // Smooth rotation speed changes
    currentRotationSpeed += (targetRotationSpeed - currentRotationSpeed) * 0.03;
    
    // Apply rotation with consciousness influence
    if (consciousness.interest > 0.1) {
        // When interested, rotate to "look" at mouse
        const lookX = consciousness.focus.y * 0.3;
        const lookY = consciousness.focus.x * 0.3;
        cubeGroup.rotation.x += (lookX - cubeGroup.rotation.x) * 0.02 + currentRotationSpeed;
        cubeGroup.rotation.y += (lookY - cubeGroup.rotation.y) * 0.02 + currentRotationSpeed;
    } else {
        // Normal rotation when not focused
        cubeGroup.rotation.x += currentRotationSpeed;
        cubeGroup.rotation.y += currentRotationSpeed;
    }
    
    // Add subtle breathing/life-like scale variation
    const breathScale = 1 + Math.sin(Date.now() * 0.001) * 0.02;
    cubeGroup.scale.setScalar(breathScale);
    
    // Update cube data periodically (every 60 frames ≈ 1 second)
    if (frameCount % 60 === 0 && currentCubeData) {
        currentCubeData.rotation = {
            x: cubeGroup.rotation.x,
            y: cubeGroup.rotation.y,
            z: cubeGroup.rotation.z
        };
        currentCubeData.position = {
            x: cubeGroup.position.x,
            y: cubeGroup.position.y,
            z: cubeGroup.position.z
        };
        // Auto-save rotation data
        cubeDB.updateCube(currentCubeData).catch(console.error);
        // Update display
        updateDataDisplay();
    }
    frameCount++;
    
    renderer.render(scene, camera);
}

let frameCount = 0;

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Keep cube centered
    cubeGroup.position.set(0, 0, 0);
});

// Start animation
animate();
