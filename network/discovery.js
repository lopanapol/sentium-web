/**
 * Sentium Network Discovery Service
 * Handles node discovery, registration, and network statistics
 */

class SentiumNetworkDiscovery {
  constructor() {
    this.registryUrl = '/network/registry.json';
    this.nodes = [];
    this.networkStats = {
      totalNodes: 0,
      onlineNodes: 0,
      totalBrandPixels: 0,
      networkHealth: 'unknown'
    };
    this.updateInterval = 5 * 60 * 1000; // 5 minutes
    this.healthCheckTimeout = 10000; // 10 seconds
  }

  /**
   * Initialize the discovery service
   */
  async init() {
    try {
      await this.loadRegistry();
      this.startPeriodicUpdates();
      console.log('Sentium Network Discovery initialized');
    } catch (error) {
      console.error('Failed to initialize network discovery:', error);
    }
  }

  /**
   * Load node registry from GitHub Pages
   */
  async loadRegistry() {
    try {
      const response = await fetch(this.registryUrl);
      if (!response.ok) {
        throw new Error(`Registry fetch failed: ${response.status}`);
      }
      
      const data = await response.json();
      this.nodes = data.nodes || [];
      this.updateNetworkStats(data.network);
      
      console.log(`Loaded ${this.nodes.length} nodes from registry`);
      return data;
    } catch (error) {
      console.error('Error loading registry:', error);
      // Fallback to sample data for development
      this.loadSampleData();
      throw error;
    }
  }

  /**
   * Load sample data for development/testing
   */
  loadSampleData() {
    // This would typically load from registry.json sampleNodes
    this.nodes = [];
    this.updateNetworkStats({
      totalNodes: 0,
      totalBrandPixels: 0,
      networkStatus: 'development'
    });
  }

  /**
   * Register a new node with the network
   */
  async registerNode(nodeInfo) {
    const nodeData = {
      id: nodeInfo.id || this.generateNodeId(),
      name: nodeInfo.name || 'Unnamed Node',
      url: nodeInfo.url,
      status: 'pending',
      location: nodeInfo.location || {},
      capabilities: nodeInfo.capabilities || {},
      brandPixels: [],
      performance: {
        uptime: '0%',
        avgResponseTime: '0ms',
        totalInteractions: 0
      },
      registered: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };

    // In a real implementation, this would submit to a registration endpoint
    console.log('Node registration request:', nodeData);
    
    // For now, add to local nodes array for testing
    this.nodes.push(nodeData);
    this.updateNetworkStats();
    
    return nodeData;
  }

  /**
   * Discover available nodes in the network
   */
  async discoverNodes(filters = {}) {
    let availableNodes = [...this.nodes];

    // Apply filters
    if (filters.status) {
      availableNodes = availableNodes.filter(node => node.status === filters.status);
    }
    
    if (filters.location) {
      availableNodes = availableNodes.filter(node => 
        node.location.country === filters.location.country
      );
    }
    
    if (filters.capabilities) {
      availableNodes = availableNodes.filter(node =>
        filters.capabilities.every(cap => 
          node.capabilities.supportedFeatures?.includes(cap)
        )
      );
    }

    return availableNodes;
  }

  /**
   * Get network statistics
   */
  getNetworkStats() {
    return {
      ...this.networkStats,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Find optimal nodes for brand pixel placement
   */
  async findOptimalNodes(requirements = {}) {
    const availableNodes = await this.discoverNodes({ status: 'online' });
    
    return availableNodes
      .filter(node => {
        // Check capacity
        if (requirements.capacity && 
            node.brandPixels.length >= node.capabilities.maxBrandPixels) {
          return false;
        }
        
        // Check location preference
        if (requirements.location && 
            node.location.country !== requirements.location) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by performance metrics
        const scoreA = this.calculateNodeScore(a);
        const scoreB = this.calculateNodeScore(b);
        return scoreB - scoreA;
      })
      .slice(0, requirements.maxNodes || 10);
  }

  /**
   * Calculate node performance score
   */
  calculateNodeScore(node) {
    let score = 0;
    
    // Uptime score (0-40 points)
    const uptime = parseFloat(node.performance.uptime) || 0;
    score += uptime * 0.4;
    
    // Response time score (0-30 points)
    const responseTime = parseInt(node.performance.avgResponseTime) || 1000;
    score += Math.max(0, 30 - (responseTime / 100));
    
    // Interaction history score (0-20 points)
    score += Math.min(20, node.performance.totalInteractions / 100);
    
    // Capacity score (0-10 points)
    const capacity = node.capabilities.maxBrandPixels || 1;
    const usage = node.brandPixels.length / capacity;
    score += (1 - usage) * 10;
    
    return score;
  }

  /**
   * Update network statistics
   */
  updateNetworkStats(networkData = null) {
    if (networkData) {
      this.networkStats = { ...this.networkStats, ...networkData };
    } else {
      this.networkStats.totalNodes = this.nodes.length;
      this.networkStats.onlineNodes = this.nodes.filter(n => n.status === 'online').length;
      this.networkStats.totalBrandPixels = this.nodes.reduce(
        (total, node) => total + node.brandPixels.length, 0
      );
      
      // Calculate network health
      const healthRatio = this.networkStats.totalNodes > 0 ? 
        this.networkStats.onlineNodes / this.networkStats.totalNodes : 0;
      
      if (healthRatio >= 0.8) this.networkStats.networkHealth = 'excellent';
      else if (healthRatio >= 0.6) this.networkStats.networkHealth = 'good';
      else if (healthRatio >= 0.4) this.networkStats.networkHealth = 'fair';
      else this.networkStats.networkHealth = 'poor';
    }
  }

  /**
   * Start periodic network updates
   */
  startPeriodicUpdates() {
    setInterval(async () => {
      try {
        await this.loadRegistry();
        this.emit('networkUpdated', this.getNetworkStats());
      } catch (error) {
        console.error('Periodic network update failed:', error);
      }
    }, this.updateInterval);
  }

  /**
   * Generate unique node ID
   */
  generateNodeId() {
    return 'node-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  }

  /**
   * Simple event emitter for network events
   */
  emit(event, data) {
    if (this.listeners && this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners) this.listeners = {};
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }
}

// Global instance for easy access
window.SentiumNetworkDiscovery = SentiumNetworkDiscovery;

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  window.sentiumNetwork = new SentiumNetworkDiscovery();
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.sentiumNetwork.init();
    });
  } else {
    window.sentiumNetwork.init();
  }
}
