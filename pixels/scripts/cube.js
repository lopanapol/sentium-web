// Three.js Pixel Pet Cube - Updated: 2025-06-20 14:30:00 (Cache Bust)
// Three.js setup
const scene = new THREE.Scene();

// Get the canvas element first
const canvas = document.getElementById('three-canvas');

// Use canvas dimensions for proper aspect ratio
const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas,
    alpha: true,
    antialias: true
});

// Set canvas to fullscreen
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
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
let velocity = new THREE.Vector2(0, 0); // Add velocity for smoother movement
let consciousness = {
    focus: new THREE.Vector2(0, 0),
    interest: 0,
    lastInteraction: Date.now()
};

// Function to return white color (no longer random)
function getWhiteColor() {
    // Always return white color
    return 0xffffff;
}

// Function to get color based on emotional state
function getEmotionalColor(mood, state) {
    // Base colors for different emotional states
    const emotionalColors = {
        happy: 0x00ff88,      // Bright green
        content: 0x88ff00,    // Light green  
        neutral: 0xffffff,    // White
        sad: 0x4488ff,        // Blue
        anxious: 0xff4444,    // Red
        curious: 0xffaa00,    // Orange
        shy: 0xaa88ff,        // Light purple
        playful: 0xff00ff,    // Magenta
        excited: 0xffff00     // Yellow
    };
    
    // Determine primary emotion based on mood value
    let primaryEmotion;
    if (mood > 0.8) primaryEmotion = 'happy';
    else if (mood > 0.6) primaryEmotion = 'content';
    else if (mood > 0.4) primaryEmotion = 'neutral';
    else if (mood > 0.2) primaryEmotion = 'sad';
    else primaryEmotion = 'anxious';
    
    // Override with state-specific colors if in special states
    if (state === 'happy') primaryEmotion = 'happy';
    else if (state === 'curious') primaryEmotion = 'curious';
    else if (state === 'shy') primaryEmotion = 'shy';
    else if (state === 'playful') primaryEmotion = 'playful';
    else if (state === 'excited') primaryEmotion = 'excited';
    
    return emotionalColors[primaryEmotion] || emotionalColors.neutral;
}

// Create cube geometry and materials (color will be set based on emotions)
const geometry = new THREE.BoxGeometry(0.15, 0.15, 0.15); // 50% smaller cube (was 0.3)
let material = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, // Initial white, will be updated by emotions
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
            
            // Set cube color based on initial emotional state
            const initialColor = getEmotionalColor(cubePersonality.mood, cubeState);
            cube.material.color.setHex(initialColor);
            updateEdgeColor(initialColor);
            
            // Apply loaded rotation if exists
            if (currentCubeData.rotation) {
                cubeGroup.rotation.x = currentCubeData.rotation.x;
                cubeGroup.rotation.y = currentCubeData.rotation.y;
                cubeGroup.rotation.z = currentCubeData.rotation.z;
            }
            
            console.log('Loaded existing cube from IndexedDB:', currentCubeData);
        } else {
            // No existing cube, create new one with emotional color
            currentCubeData = {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                created: new Date(),
                name: `${Date.now()}`
            };
            
            // Apply emotional color to the cube
            const initialColor = getEmotionalColor(cubePersonality.mood, cubeState);
            cube.material.color.setHex(initialColor);
            updateEdgeColor(initialColor);
            
            // Save the new cube
            await cubeDB.saveCube(currentCubeData);
            console.log('Created new cube and saved to IndexedDB:', currentCubeData);
        }
        
        updateDataDisplay();
    } catch (error) {
        console.error('Error loading/saving cube:', error);
    }
}

// Function to update data display (without color and position/rotation)
function updateDataDisplay() {
    if (!currentCubeData) return;
    
    const cubeInfo = document.getElementById('cube-info');
    
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
            case 'happy': return "Happy";
            case 'shy': return "Shy";
            case 'playful': return "Playful";
            case 'excited': return "Excited";
            default: return "Idle";
        }
    };
    
    // Format date as "2 Jan 2025"
    const formatCreatedDate = (date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    };

    // Format time as "2:01:10 PM"
    const formatCreatedTime = (date) => {
        return date.toLocaleTimeString();
    };

    // Calculate age from creation date
    const calculateAge = (createdDate) => {
        const now = new Date();
        const diffMs = now - createdDate;
        
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
            return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
        } else if (diffMinutes > 0) {
            return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
        } else {
            return `${diffSeconds} second${diffSeconds === 1 ? '' : 's'}`;
        }
    };
    
    cubeInfo.innerHTML = `
        <div><strong>ID:</strong> ${currentCubeData.name}</div>
        <div><strong>Mood:</strong> ${getMoodDescription()}</div>
        <div><strong>State:</strong> ${getStateDescription()}</div>
        <div><strong>Date:</strong> ${formatCreatedDate(currentCubeData.created)}</div>
        <div><strong>Time:</strong> ${formatCreatedTime(currentCubeData.created)}</div>
        <div><strong>Age:</strong> ${calculateAge(currentCubeData.created)}</div>
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
        
        // Create a new cube with emotional color
        currentCubeData = {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            created: new Date(),
            name: `${Date.now()}`
        };
        
        // Apply emotional color to the cube
        const initialColor = getEmotionalColor(cubePersonality.mood, cubeState);
        cube.material.color.setHex(initialColor);
        updateEdgeColor(initialColor);
        
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

// Position camera (closer for smaller pixel cube)
camera.position.z = 2;

// Mouse tracking for consciousness
// Mouse tracking for consciousness - Enhanced awareness
function onMouseMove(event) {
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    mousePresent = true;
    lastMouseMove = Date.now();
    mouseStillTime = 0;
    
    // Calculate distance from cube center for awareness
    const distanceFromCube = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
    
    // Enhanced consciousness response based on distance and movement
    consciousness.focus.x = mouse.x;
    consciousness.focus.y = mouse.y;
    
    // Gradual interest buildup - closer = more interested
    if (distanceFromCube < 0.3) {
        // Very close - high interest and excitement
        consciousness.interest = Math.min(consciousness.interest + 0.05, 1.0);
        cubePersonality.mood = Math.min(cubePersonality.mood + 0.02, 1.0);
    } else if (distanceFromCube < 0.6) {
        // Medium distance - moderate interest
        consciousness.interest = Math.min(consciousness.interest + 0.03, 0.8);
        cubePersonality.mood = Math.min(cubePersonality.mood + 0.01, 0.9);
    } else {
        // Far away - mild interest
        consciousness.interest = Math.min(consciousness.interest + 0.01, 0.5);
    }
    
    consciousness.lastInteraction = Date.now();
    
    // Determine cube's reaction based on personality and distance
    updateCubeState();
    
    // Add subtle "noticing" behavior when cursor first appears
    if (!mousePresent || Date.now() - consciousness.lastInteraction > 5000) {
        // Cube "notices" the cursor - slight startle effect
        cubePersonality.attention = 1.0;
    }
}

function onMouseLeave() {
    mousePresent = false;
    consciousness.interest = Math.max(consciousness.interest - 0.15, 0);
    // Cube feels "lonely" when cursor leaves
    cubePersonality.mood = Math.max(cubePersonality.mood - 0.1, 0.3);
    cubeState = 'idle';
}

function onMouseEnter() {
    mousePresent = true;
    consciousness.interest = 0.9; // Very excited to see cursor return
    // Immediate happy reaction when cursor appears - like seeing a friend
    cubePersonality.mood = Math.min(cubePersonality.mood + 0.4, 1.0);
    cubePersonality.attention = 1.0;
    // Small "startle" then recognition behavior
    setTimeout(() => {
        if (mousePresent) cubeState = 'excited';
    }, 100);
}

// Enhanced cube consciousness state machine
function updateCubeState() {
    const timeSinceLastMove = Date.now() - lastMouseMove;
    const distanceFromCenter = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
    
    if (!mousePresent) {
        // Gradual mood decline when alone
        cubePersonality.mood = Math.max(cubePersonality.mood - 0.001, 0.2);
        cubeState = 'idle';
        return;
    }
    
    // Cube "watches" and reacts based on cursor behavior
    if (timeSinceLastMove > 2000) {
        // Cursor hasn't moved - cube gets curious/concerned
        mouseStillTime += 16; // Approximate frame time
        if (mouseStillTime > 3000) {
            cubeState = distanceFromCenter < 0.4 ? 'curious' : 'idle';
        }
    } else {
        mouseStillTime = 0;
    }
    
    // Enhanced emotional consciousness - cube "thinks" about cursor behavior
    if (timeSinceLastMove < 50) {
        // Very rapid mouse movement = excitement but also slight anxiety
        cubeState = 'excited';
        cubePersonality.attention = 1.0;
    } else if (timeSinceLastMove < 200) {
        // Recent movement = happy following behavior like recognizing a friend
        cubeState = 'happy';
        cubePersonality.mood = Math.min(cubePersonality.mood + 0.005, 1.0);
    } else if (timeSinceLastMove < 500) {
        // Moderate pause = curiosity about what you're doing
        if (distanceFromCenter < 0.3) {
            // Close and still = either shy or very curious depending on personality
            cubeState = cubePersonality.shyness > 0.4 ? 'shy' : 'curious';
            cubePersonality.attention = 0.8;
        } else if (distanceFromCenter < 0.7) {
            // Medium distance = safe curiosity
            cubeState = 'curious';
        } else {
            // Far away = watching from distance
            cubeState = 'idle';
        }
    } else if (timeSinceLastMove < 1500) {
        // Longer pause = cube starts to wonder if you're still there
        cubeState = 'curious';
        cubePersonality.attention = Math.max(cubePersonality.attention - 0.01, 0.3);
    } else {
        // Long pause = cube gets lonely/bored but still hopeful
        cubeState = distanceFromCenter < 0.5 ? 'curious' : 'playful';
        cubePersonality.mood = Math.max(cubePersonality.mood - 0.002, 0.4);
    }
}

// Conscious movement behavior
function updateConsciousBehavior() {
    const time = Date.now() * 0.001;
    
    // Calculate actual world space boundaries based on camera setup
    // With camera at z=2 and FOV=75, we can calculate the visible area
    const fov = 75 * Math.PI / 180; // Convert to radians
    const distance = 2;
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * (window.innerWidth / window.innerHeight);
    
    // Use 80% of the visible area to keep cube on screen
    const maxX = (width / 2) * 0.8;
    const maxY = (height / 2) * 0.8;
    
    switch (cubeState) {
        case 'curious':
            // Dog-like behavior: follow cursor closely with excitement
            const followDistance = 0.1; // Stay close to cursor like a loyal dog
            const bounceIntensity = Math.sin(time * 8) * 0.15; // Bouncing like excited dog
            const wiggleX = Math.sin(time * 6) * 0.05; // Side-to-side wiggling
            const wiggleY = Math.cos(time * 7) * 0.05;
            
            // Follow cursor directly but with playful offset
            targetPosition.x = mouse.x * maxX * 0.9 + wiggleX + bounceIntensity * 0.3;
            targetPosition.y = mouse.y * maxY * 0.9 + wiggleY + Math.abs(bounceIntensity);
            targetPosition.x = Math.max(-maxX, Math.min(maxX, targetPosition.x));
            targetPosition.y = Math.max(-maxY, Math.min(maxY, targetPosition.y));
            
            targetRotationSpeed = 0.03 + consciousness.interest * 0.02; // More energetic rotation
            cubePersonality.mood = Math.min(cubePersonality.mood + 0.01, 1.0);
            break;
            
        case 'happy':
            // Very happy dog-like behavior: close following with tail-wagging motion
            const tailWag = Math.sin(time * 12) * 0.08; // Fast side-to-side like tail wagging
            const happyBounce = Math.abs(Math.sin(time * 10)) * 0.1; // Happy bouncing
            const circleRadius = 0.15;
            const circleSpeed = time * 4;
            
            // Circle around cursor position like an excited dog
            const circleX = Math.cos(circleSpeed) * circleRadius;
            const circleY = Math.sin(circleSpeed) * circleRadius;
            
            targetPosition.x = mouse.x * maxX * 0.95 + circleX + tailWag;
            targetPosition.y = mouse.y * maxY * 0.95 + circleY + happyBounce;
            targetPosition.x = Math.max(-maxX, Math.min(maxX, targetPosition.x));
            targetPosition.y = Math.max(-maxY, Math.min(maxY, targetPosition.y));
            
            targetRotationSpeed = 0.04; // Happy spinning
            cubePersonality.mood = Math.min(cubePersonality.mood + 0.015, 1.0);
            break;
            
        case 'shy':
            // Move away from mouse to opposite corner
            const avoidX = -mouse.x * maxX * 0.8 + Math.sin(time) * (maxX * 0.2);
            const avoidY = -mouse.y * maxY * 0.8 + Math.cos(time) * (maxY * 0.2);
            targetPosition.x = Math.max(-maxX, Math.min(maxX, avoidX));
            targetPosition.y = Math.max(-maxY, Math.min(maxY, avoidY));
            targetRotationSpeed = 0.003; // Reduced from 0.005
            cubePersonality.mood = Math.max(cubePersonality.mood - 0.002, 0.2);
            break;
            
        case 'playful':
            // Free-roaming energetic movement across the screen
            const playX = Math.sin(time * cubePersonality.playfulness * 2) * maxX * 0.9;
            const playY = Math.cos(time * cubePersonality.playfulness * 1.5) * maxY * 0.9;
            targetPosition.x = playX;
            targetPosition.y = playY;
            targetRotationSpeed = 0.015 * cubePersonality.energy; // Reduced from 0.03
            cubePersonality.mood = Math.min(cubePersonality.mood + 0.01, 1.0);
            break;
            
        case 'excited':
            // Gentle excited movement (reduced from rapid/unpredictable)
            targetPosition.x += (Math.random() - 0.5) * maxX * 0.08; // Reduced from 0.2
            targetPosition.y += (Math.random() - 0.5) * maxY * 0.08; // Reduced from 0.2
            targetPosition.x = Math.max(-maxX, Math.min(maxX, targetPosition.x));
            targetPosition.y = Math.max(-maxY, Math.min(maxY, targetPosition.y));
            targetRotationSpeed = 0.015; // Reduced from 0.025
            cubePersonality.mood = Math.min(cubePersonality.mood + 0.02, 1.0);
            break;
            
        case 'idle':
        default:
            // Gentle wandering movement (slower)
            const wanderX = Math.sin(time * 0.15) * maxX * 0.6 + Math.sin(time * 0.35) * maxX * 0.2; // Reduced time multipliers
            const wanderY = Math.cos(time * 0.12) * maxY * 0.5 + Math.cos(time * 0.3) * maxY * 0.3; // Reduced time multipliers
            targetPosition.x = wanderX;
            targetPosition.y = wanderY;
            targetRotationSpeed = 0.005; // Reduced from 0.01
            cubePersonality.mood = Math.max(cubePersonality.mood - 0.001, 0.3);
            break;
    }
    
    // Update cube mood affects opacity and color
    const moodOpacity = 0.4 + cubePersonality.mood * 0.4;
    cube.material.opacity = moodOpacity;
    
    // Update cube color based on emotional state
    const currentEmotionalColor = getEmotionalColor(cubePersonality.mood, cubeState);
    cube.material.color.setHex(currentEmotionalColor);
    updateEdgeColor(currentEmotionalColor);
}

// Event listeners
canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('mouseenter', onMouseEnter);
canvas.addEventListener('mouseleave', onMouseLeave);

// Set enhanced cursor style with visibility improvements
canvas.style.cursor = 'none'; // Hide default cursor to replace with custom one

// Create custom visible cursor
const createCustomCursor = () => {
    // Remove existing custom cursor if any
    const existingCursor = document.getElementById('custom-cursor');
    if (existingCursor) existingCursor.remove();
    
    // Create custom cursor element
    const customCursor = document.createElement('div');
    customCursor.id = 'custom-cursor';
    customCursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(255,105,180,0.9) 0%, rgba(255,20,147,0.7) 50%, rgba(255,105,180,0.3) 100%);
        border: 2px solid rgba(255,20,147,0.8);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 15px rgba(255,20,147,0.6), inset 0 0 10px rgba(255,105,180,0.4);
        transition: all 0.05s ease;
        mix-blend-mode: normal;
    `;
    document.body.appendChild(customCursor);
    
    // Update cursor position and responsiveness on mouse move
    const updateCursorPosition = (e) => {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';
        
        // Get actual cube position in screen coordinates
        const vector = new THREE.Vector3();
        cubeGroup.getWorldPosition(vector);
        vector.project(camera);
        
        // Convert cube's 3D position to screen coordinates
        const rect = canvas.getBoundingClientRect();
        const cubeScreenX = (vector.x * 0.5 + 0.5) * rect.width + rect.left;
        const cubeScreenY = (vector.y * -0.5 + 0.5) * rect.height + rect.top;
        
        // Calculate actual distance from cursor to cube in screen pixels
        const dx = e.clientX - cubeScreenX;
        const dy = e.clientY - cubeScreenY;
        const pixelDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Contact detection based on cube size (approximately 30-40 pixels)
        const cubeRadius = 35; // Adjust this based on cube's visual size
        const isContactingCube = pixelDistance < cubeRadius;
        
        // Also calculate normalized distance for other effects
        const mouseCanvasX = (e.clientX - rect.left) / rect.width * 2 - 1;
        const mouseCanvasY = -((e.clientY - rect.top) / rect.height * 2 - 1);
        const normalizedDistance = Math.sqrt(mouseCanvasX * mouseCanvasX + mouseCanvasY * mouseCanvasY);
        
        if (isContactingCube) {
            // CONTACT EFFECTS - Cursor is actually touching the cube!
            customCursor.style.transform = 'translate(-50%, -50%) scale(2)';
            customCursor.style.background = 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,20,147,1) 30%, rgba(255,105,180,0.8) 70%, rgba(255,20,147,0.3) 100%)';
            customCursor.style.boxShadow = `
                0 0 40px rgba(255,20,147,1), 
                0 0 80px rgba(255,105,180,0.7),
                inset 0 0 20px rgba(255,255,255,0.8),
                0 0 120px rgba(255,20,147,0.5)
            `;
            customCursor.style.border = '4px solid rgba(255,255,255,1)';
            customCursor.style.filter = 'brightness(1.5) saturate(2) blur(0.5px)';
            customCursor.style.animation = 'contactPulse 0.2s ease-in-out infinite alternate';
            customCursor.style.width = '30px';
            customCursor.style.height = '30px';
            
            // Trigger cube contact reaction (with proper positioning)
            if (!cubeGroup.userData.lastContactTime || Date.now() - cubeGroup.userData.lastContactTime > 500) {
                triggerCubeContactEffect(cubeScreenX, cubeScreenY);
                cubeGroup.userData.lastContactTime = Date.now();
            }
            
            // Boost cube's happiness from contact
            cubePersonality.mood = Math.min(cubePersonality.mood + 0.05, 1.0);
            consciousness.interest = 1.0;
            cubePersonality.attention = 1.0;
            
        } else {
            // Normal interaction states when not in contact
            if (consciousness.interest > 0.8) {
                // Very high interest - cursor pulses and grows
                customCursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
                customCursor.style.background = 'radial-gradient(circle, rgba(255,20,147,1) 0%, rgba(255,105,180,0.9) 50%, rgba(255,20,147,0.5) 100%)';
                customCursor.style.boxShadow = '0 0 30px rgba(255,20,147,0.9), inset 0 0 15px rgba(255,105,180,0.7), 0 0 50px rgba(255,20,147,0.4)';
                customCursor.style.border = '3px solid rgba(255,20,147,1)';
                customCursor.style.filter = 'brightness(1.2) saturate(1.3)';
            } else if (consciousness.interest > 0.5) {
                // High interest - cursor grows and brightens
                customCursor.style.transform = 'translate(-50%, -50%) scale(1.3)';
                customCursor.style.background = 'radial-gradient(circle, rgba(255,20,147,0.95) 0%, rgba(255,105,180,0.8) 50%, rgba(255,20,147,0.4) 100%)';
                customCursor.style.boxShadow = '0 0 25px rgba(255,20,147,0.8), inset 0 0 12px rgba(255,105,180,0.6)';
                customCursor.style.border = '2px solid rgba(255,20,147,0.9)';
                customCursor.style.filter = 'brightness(1.1) saturate(1.1)';
            } else if (consciousness.interest > 0.2) {
                // Medium interest - subtle glow
                customCursor.style.transform = 'translate(-50%, -50%) scale(1.1)';
                customCursor.style.background = 'radial-gradient(circle, rgba(255,105,180,0.9) 0%, rgba(255,20,147,0.7) 50%, rgba(255,105,180,0.3) 100%)';
                customCursor.style.boxShadow = '0 0 20px rgba(255,20,147,0.7), inset 0 0 10px rgba(255,105,180,0.5)';
                customCursor.style.border = '2px solid rgba(255,20,147,0.8)';
                customCursor.style.filter = 'brightness(1) saturate(1)';
            } else {
                // Low/no interest - normal state
                customCursor.style.transform = 'translate(-50%, -50%) scale(1)';
                customCursor.style.background = 'radial-gradient(circle, rgba(255,105,180,0.9) 0%, rgba(255,20,147,0.7) 50%, rgba(255,105,180,0.3) 100%)';
                customCursor.style.boxShadow = '0 0 15px rgba(255,20,147,0.6), inset 0 0 10px rgba(255,105,180,0.4)';
                customCursor.style.border = '2px solid rgba(255,20,147,0.8)';
                customCursor.style.filter = 'brightness(1) saturate(1)';
            }
            
            // Add distance-based effects (only when not in contact)
            if (pixelDistance < 50) {
                // Very close to cube - intense interaction
                customCursor.style.width = '25px';
                customCursor.style.height = '25px';
            } else if (pixelDistance < 100) {
                // Close to cube - moderate interaction
                customCursor.style.width = '22px';
                customCursor.style.height = '22px';
            } else {
                // Far from cube - normal state
                customCursor.style.width = '20px';
                customCursor.style.height = '20px';
            }
            
            // Add cube state-based cursor effects
            if (cubeState === 'excited') {
                customCursor.style.animation = 'pulse 0.3s ease-in-out infinite alternate';
            } else if (cubeState === 'happy') {
                customCursor.style.animation = 'pulse 0.6s ease-in-out infinite alternate';
            } else {
                customCursor.style.animation = 'none';
            }
        }
    };
    
    // Add mouse listeners for cursor
    document.addEventListener('mousemove', updateCursorPosition);
    
    // Hide custom cursor when leaving canvas
    canvas.addEventListener('mouseleave', () => {
        customCursor.style.opacity = '0';
    });
    
    canvas.addEventListener('mouseenter', () => {
        customCursor.style.opacity = '1';
    });
};

// Initialize custom cursor
createCustomCursor();

// Cube contact effect function
const triggerCubeContactEffect = (cubeScreenX = window.innerWidth / 2, cubeScreenY = window.innerHeight / 2) => {
    // Visual burst effect on cube
    cubeGroup.scale.setScalar(1.3);
    setTimeout(() => {
        cubeGroup.scale.setScalar(1.0);
    }, 200);
    
    // Change cube color temporarily to show happiness
    const originalColor = cube.material.color.getHex();
    cube.material.color.setHex(0xffff00); // Bright yellow when touched
    setTimeout(() => {
        cube.material.color.setHex(originalColor);
    }, 300);
    
    // Create contact particle effect at cube's actual position
    createContactParticles(cubeScreenX, cubeScreenY);
    
    // Cube emotional response to being touched
    cubeState = 'excited';
    cubePersonality.mood = 1.0;
    consciousness.interest = 1.0;
    
    // Add haptic-like visual feedback
    document.body.style.filter = 'brightness(1.1)';
    setTimeout(() => {
        document.body.style.filter = 'brightness(1.0)';
    }, 100);
};

// Create particle effect when cursor contacts cube
const createContactParticles = (cubeScreenX = window.innerWidth / 2, cubeScreenY = window.innerHeight / 2) => {
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,20,147,0.8) 100%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${cubeScreenX}px;
            top: ${cubeScreenY}px;
            transform: translate(-50%, -50%);
        `;
        document.body.appendChild(particle);
        
        // Animate particles outward from cube's actual position
        const angle = (i / 8) * Math.PI * 2;
        const distance = 50 + Math.random() * 30;
        const duration = 0.8 + Math.random() * 0.4;
        
        particle.animate([
            { 
                transform: 'translate(-50%, -50%) scale(1)',
                opacity: 1,
                left: `${cubeScreenX}px`,
                top: `${cubeScreenY}px`
            },
            { 
                transform: 'translate(-50%, -50%) scale(0.2)',
                opacity: 0,
                left: `${cubeScreenX + Math.cos(angle) * distance}px`,
                top: `${cubeScreenY + Math.sin(angle) * distance}px`
            }
        ], {
            duration: duration * 1000,
            easing: 'ease-out'
        }).addEventListener('finish', () => {
            particle.remove();
        });
    }
};

// Add contact pulse animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { 
            transform: translate(-50%, -50%) scale(1); 
            opacity: 0.9; 
        }
        100% { 
            transform: translate(-50%, -50%) scale(1.1); 
            opacity: 1; 
            filter: brightness(1.3) saturate(1.4);
        }
    }
    
    @keyframes contactPulse {
        0% { 
            transform: translate(-50%, -50%) scale(2); 
            opacity: 0.8;
            filter: brightness(1.5) saturate(2) blur(0.5px);
        }
        100% { 
            transform: translate(-50%, -50%) scale(2.2); 
            opacity: 1;
            filter: brightness(2) saturate(2.5) blur(1px);
        }
    }
`;
document.head.appendChild(style);

// Animation loop with consciousness
function animate() {
    requestAnimationFrame(animate);
    
    // Update conscious behavior
    updateConsciousBehavior();
    
    // Calculate smoothing factors based on cube state
    let positionSmoothing = 0.02; // Reduced from 0.05
    let rotationSmoothing = 0.015; // Reduced from 0.03
    
    switch (cubeState) {
        case 'excited':
            positionSmoothing = 0.04; // Reduced from 0.08 for calmer movement
            rotationSmoothing = 0.025; // Reduced from 0.04
            break;
        case 'happy':
            positionSmoothing = 0.07; // Fast response for dog-like following
            rotationSmoothing = 0.05; // Responsive rotation for happy spinning
            break;
        case 'curious':
            positionSmoothing = 0.04; // Reduced from 0.08
            rotationSmoothing = 0.025; // Reduced from 0.05
            break;
        case 'shy':
            positionSmoothing = 0.015; // Reduced from 0.03
            rotationSmoothing = 0.01; // Reduced from 0.02
            break;
        case 'playful':
            positionSmoothing = 0.06; // Reduced from 0.12
            rotationSmoothing = 0.03; // Reduced from 0.06
            break;
        case 'idle':
        default:
            positionSmoothing = 0.02; // Reduced from 0.04
            rotationSmoothing = 0.012; // Reduced from 0.025
            break;
    }
    
    // Physics-based smooth movement with velocity
    const deltaX = targetPosition.x - cubeGroup.position.x;
    const deltaY = targetPosition.y - cubeGroup.position.y;
    
    // Add acceleration towards target (reduced acceleration)
    velocity.x += deltaX * positionSmoothing * 0.15; // Reduced from 0.3
    velocity.y += deltaY * positionSmoothing * 0.15; // Reduced from 0.3
    
    // Apply stronger damping to velocity for slower movement
    velocity.x *= 0.92; // Increased damping from 0.85
    velocity.y *= 0.92; // Increased damping from 0.85
    
    // Calculate movement speed for rotation influence
    const movementSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const movementRotationInfluence = Math.min(movementSpeed * 15, 0.05); // Scale movement to rotation
    
    // Apply velocity to position
    cubeGroup.position.x += velocity.x;
    cubeGroup.position.y += velocity.y;
    
    // Smooth rotation speed changes with easing
    const rotationDelta = targetRotationSpeed - currentRotationSpeed;
    currentRotationSpeed += rotationDelta * rotationSmoothing;
    
    // Enhanced conscious "looking" behavior - cube maintains eye contact
    if (consciousness.interest > 0.1) {
        // When interested, cube "looks" at cursor with natural, organic movement
        const lookIntensity = Math.min(consciousness.interest * cubePersonality.attention, 1.0);
        const attentionFactor = cubePersonality.attention * 0.3;
        
        // More natural looking angles - like the cube is trying to see you
        const lookX = consciousness.focus.y * attentionFactor * lookIntensity;
        const lookY = consciousness.focus.x * attentionFactor * lookIntensity;
        
        // Add subtle "blinking" or attention shifts
        const time = Date.now() * 0.001;
        const attentionShift = Math.sin(time * 0.5) * 0.05 * consciousness.interest;
        
        // Smooth "eye contact" rotation with natural hesitation
        const rotationEasing = 0.02 + (consciousness.interest * 0.01); // Faster when more interested
        cubeGroup.rotation.x += (lookX + attentionShift - cubeGroup.rotation.x) * rotationEasing + currentRotationSpeed + movementRotationInfluence;
        cubeGroup.rotation.y += (lookY - cubeGroup.rotation.y) * rotationEasing + currentRotationSpeed + movementRotationInfluence * 0.8;
        
        // Gradual attention decay - cube gets distracted over time
        cubePersonality.attention = Math.max(cubePersonality.attention - 0.0005, 0.1);
    } else {
        // Normal rotation when not focused - slower organic variation + movement-based rotation
        const organicVariation = Math.sin(Date.now() * 0.0003) * 0.001; // Reduced from 0.0005 and 0.002
        
        // Add movement-based rotation - cube rotates based on its velocity
        const velocityRotationX = velocity.y * 2; // Vertical movement affects X rotation
        const velocityRotationY = velocity.x * 2; // Horizontal movement affects Y rotation
        
        cubeGroup.rotation.x += currentRotationSpeed + organicVariation + velocityRotationX + movementRotationInfluence;
        cubeGroup.rotation.y += currentRotationSpeed - organicVariation * 0.7 + velocityRotationY + movementRotationInfluence * 0.8;
        cubeGroup.rotation.z += movementRotationInfluence * 0.5; // Add some Z rotation for more dynamic movement
    }
    
    // Smoother breathing/life-like scale variation
    const breathTime = Date.now() * 0.0008;
    const breathScale = 1 + Math.sin(breathTime) * 0.015 + Math.sin(breathTime * 1.7) * 0.005;
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
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    
    // Keep cube centered
    cubeGroup.position.set(0, 0, 0);
});

// Start animation
animate();
