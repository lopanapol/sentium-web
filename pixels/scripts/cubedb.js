// Core IndexedDB for Cube Data
class CubeDB {
    constructor() {
        this.dbName = 'PixelPetsDB';
        this.version = 1;
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                
                // Create cube data store
                if (!this.db.objectStoreNames.contains('cubes')) {
                    const cubeStore = this.db.createObjectStore('cubes', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    cubeStore.createIndex('name', 'name', { unique: false });
                    cubeStore.createIndex('created', 'created', { unique: false });
                }
            };
        });
    }

    // Save cube data
    async saveCube(cubeData) {
        const transaction = this.db.transaction(['cubes'], 'readwrite');
        const store = transaction.objectStore('cubes');
        return store.add(cubeData);
    }

    // Get cube by ID
    async getCube(id) {
        const transaction = this.db.transaction(['cubes'], 'readonly');
        const store = transaction.objectStore('cubes');
        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get all cubes
    async getAllCubes() {
        const transaction = this.db.transaction(['cubes'], 'readonly');
        const store = transaction.objectStore('cubes');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Update cube data
    async updateCube(cubeData) {
        const transaction = this.db.transaction(['cubes'], 'readwrite');
        const store = transaction.objectStore('cubes');
        return store.put(cubeData);
    }

    // Delete cube
    async deleteCube(id) {
        const transaction = this.db.transaction(['cubes'], 'readwrite');
        const store = transaction.objectStore('cubes');
        return store.delete(id);
    }
}

// Export for use in other files
window.CubeDB = CubeDB;
