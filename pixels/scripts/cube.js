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
    const cubeInfo = document.getElementById('cube-info');
    const colorHex = '#' + currentCubeData.color.toString(16).padStart(6, '0');
    
    cubeInfo.innerHTML = `
        <div><strong>ID:</strong> ${currentCubeData.name}</div>
        <div><strong>Color:</strong> ${colorHex}</div>
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

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate the cube group
    cubeGroup.rotation.x += 0.01;
    cubeGroup.rotation.y += 0.01;
    
    // Update cube data periodically (every 60 frames ≈ 1 second)
    if (frameCount % 60 === 0) {
        currentCubeData.rotation = {
            x: cubeGroup.rotation.x,
            y: cubeGroup.rotation.y,
            z: cubeGroup.rotation.z
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
