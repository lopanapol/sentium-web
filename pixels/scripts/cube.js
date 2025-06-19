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

// Create a smaller cube with black edges only (no diagonals)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const edges = new THREE.EdgesGeometry(geometry);
const material = new THREE.LineBasicMaterial({ color: 0x000000 });
const cube = new THREE.LineSegments(edges, material);
cube.position.set(0, 0, 0); // Ensure cube is at center
scene.add(cube);

// Add some lighting (though not needed for wireframe)
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
scene.add(light);

// Position camera
camera.position.z = 8;

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate the cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Keep cube centered at origin
    cube.position.set(0, 0, 0);
});

// Start animation
animate();
