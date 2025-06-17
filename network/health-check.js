/**
 * Sentium Network Health Check Service
 * Monitors node status, performance, and availability
 */

class SentiumHealthCheck {
  constructor(discoveryService) {
    this.discovery = discoveryService;
    this.checkInterval = 2 * 60 * 1000; // 2 minutes
    this.timeout = 10000; // 10 seconds
    this.retryAttempts = 3;
    this.healthHistory = new Map();
    this.isRunning = false;
  }

  /**
   * Start health checking service
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting Sentium Health Check service');
    
    // Initial health check
    this.performHealthCheck();
    
    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.performHealthCheck();
    }, this.checkInterval);
  }

  /**
   * Stop health checking service
   */
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('Stopped Sentium Health Check service');
  }

  /**
   * Perform health check on all registered nodes
   */
  async performHealthCheck() {
    const nodes = this.discovery.nodes;
    console.log(`Performing health check on ${nodes.length} nodes`);
    
    const healthPromises = nodes.map(node => this.checkNodeHealth(node));
    const results = await Promise.allSettled(healthPromises);
    
    let healthyCount = 0;
    let unhealthyCount = 0;
    
    results.forEach((result, index) => {
      const node = nodes[index];
      if (result.status === 'fulfilled') {
        const healthData = result.value;
        this.updateNodeHealth(node, healthData);
        
        if (healthData.status === 'online') {
          healthyCount++;
        } else {
          unhealthyCount++;
        }
      } else {
        // Health check failed
        this.updateNodeHealth(node, {
          status: 'offline',
          error: result.reason.message,
          responseTime: null,
          lastCheck: new Date().toISOString()
        });
        unhealthyCount++;
      }
    });
    
    // Update network statistics
    this.discovery.updateNetworkStats();
    
    // Emit health check complete event
    this.discovery.emit('healthCheckComplete', {
      totalNodes: nodes.length,
      healthyNodes: healthyCount,
      unhealthyNodes: unhealthyCount,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Health check complete: ${healthyCount} healthy, ${unhealthyCount} unhealthy`);
  }

  /**
   * Check health of a specific node
   */
  async checkNodeHealth(node) {
    const startTime = Date.now();
    let attempt = 0;
    
    while (attempt < this.retryAttempts) {
      try {
        const healthData = await this.pingNode(node);
        const responseTime = Date.now() - startTime;
        
        return {
          status: 'online',
          responseTime: responseTime,
          nodeInfo: healthData,
          lastCheck: new Date().toISOString(),
          attempt: attempt + 1
        };
        
      } catch (error) {
        attempt++;
        if (attempt >= this.retryAttempts) {
          return {
            status: 'offline',
            error: error.message,
            responseTime: null,
            lastCheck: new Date().toISOString(),
            attempts: attempt
          };
        }
        
        // Wait before retry
        await this.sleep(1000 * attempt);
      }
    }
  }

  /**
   * Ping a node to check if it's responsive
   */
  async pingNode(node) {
    // For GitHub Pages nodes, we'll check if they're accessible
    if (node.url.includes('github.io') || node.url.includes('sentium.dev')) {
      return await this.checkStaticNode(node);
    } else {
      return await this.checkDynamicNode(node);
    }
  }

  /**
   * Check health of static nodes (GitHub Pages)
   */
  async checkStaticNode(node) {
    try {
      const response = await fetch(node.url + '/health', {
        method: 'GET',
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          type: 'static',
          version: data.version || '1.0.0',
          brandPixels: data.brandPixels || [],
          capabilities: data.capabilities || node.capabilities
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Fallback: try to fetch main page
      try {
        const response = await fetch(node.url, {
          method: 'HEAD',
          timeout: this.timeout
        });
        
        if (response.ok) {
          return {
            type: 'static-fallback',
            status: 'accessible',
            fallback: true
          };
        }
      } catch (fallbackError) {
        throw new Error(`Node unreachable: ${error.message}`);
      }
    }
  }

  /**
   * Check health of dynamic nodes (local servers)
   */
  async checkDynamicNode(node) {
    try {
      const response = await fetch(node.url + '/api/health', {
        method: 'GET',
        timeout: this.timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Sentium-HealthCheck/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        type: 'dynamic',
        version: data.version,
        uptime: data.uptime,
        brandPixels: data.brandPixels || [],
        performance: data.performance || {},
        capabilities: data.capabilities || node.capabilities
      };
      
    } catch (error) {
      throw new Error(`Dynamic node check failed: ${error.message}`);
    }
  }

  /**
   * Update node health information
   */
  updateNodeHealth(node, healthData) {
    // Update node status
    node.status = healthData.status;
    node.lastSeen = healthData.lastCheck;
    
    if (healthData.responseTime) {
      // Update performance metrics
      if (!node.performance) node.performance = {};
      
      // Update average response time (simple moving average)
      const currentAvg = parseInt(node.performance.avgResponseTime) || 0;
      const newAvg = currentAvg === 0 ? healthData.responseTime : 
        Math.round((currentAvg + healthData.responseTime) / 2);
      
      node.performance.avgResponseTime = newAvg + 'ms';
      
      // Update uptime calculation
      this.updateUptimeMetric(node, healthData.status === 'online');
    }
    
    // Store health history
    const nodeHistory = this.healthHistory.get(node.id) || [];
    nodeHistory.push({
      timestamp: healthData.lastCheck,
      status: healthData.status,
      responseTime: healthData.responseTime,
      error: healthData.error
    });
    
    // Keep only last 100 entries
    if (nodeHistory.length > 100) {
      nodeHistory.splice(0, nodeHistory.length - 100);
    }
    
    this.healthHistory.set(node.id, nodeHistory);
    
    // Update brand pixels if provided
    if (healthData.nodeInfo && healthData.nodeInfo.brandPixels) {
      node.brandPixels = healthData.nodeInfo.brandPixels;
    }
  }

  /**
   * Update uptime metric for a node
   */
  updateUptimeMetric(node, isOnline) {
    const history = this.healthHistory.get(node.id) || [];
    if (history.length === 0) return;
    
    const recentHistory = history.slice(-20); // Last 20 checks
    const onlineCount = recentHistory.filter(h => h.status === 'online').length;
    const uptime = (onlineCount / recentHistory.length) * 100;
    
    if (!node.performance) node.performance = {};
    node.performance.uptime = uptime.toFixed(1) + '%';
  }

  /**
   * Get health history for a specific node
   */
  getNodeHealthHistory(nodeId, limit = 50) {
    const history = this.healthHistory.get(nodeId) || [];
    return history.slice(-limit);
  }

  /**
   * Get overall network health metrics
   */
  getNetworkHealthMetrics() {
    const nodes = this.discovery.nodes;
    const totalNodes = nodes.length;
    
    if (totalNodes === 0) {
      return {
        overallHealth: 'unknown',
        averageResponseTime: 0,
        averageUptime: 0,
        nodesOnline: 0,
        nodesOffline: 0
      };
    }
    
    const onlineNodes = nodes.filter(n => n.status === 'online');
    const avgResponseTime = onlineNodes.reduce((sum, node) => {
      return sum + (parseInt(node.performance?.avgResponseTime) || 0);
    }, 0) / Math.max(onlineNodes.length, 1);
    
    const avgUptime = nodes.reduce((sum, node) => {
      return sum + (parseFloat(node.performance?.uptime) || 0);
    }, 0) / totalNodes;
    
    let overallHealth = 'poor';
    if (avgUptime >= 95) overallHealth = 'excellent';
    else if (avgUptime >= 85) overallHealth = 'good';
    else if (avgUptime >= 70) overallHealth = 'fair';
    
    return {
      overallHealth,
      averageResponseTime: Math.round(avgResponseTime),
      averageUptime: avgUptime.toFixed(1),
      nodesOnline: onlineNodes.length,
      nodesOffline: totalNodes - onlineNodes.length,
      totalNodes
    };
  }

  /**
   * Utility function for delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use with discovery service
window.SentiumHealthCheck = SentiumHealthCheck;

// Auto-initialize with discovery service when available
if (typeof window !== 'undefined' && window.sentiumNetwork) {
  window.sentiumHealthCheck = new SentiumHealthCheck(window.sentiumNetwork);
  
  // Start health checking after network discovery is initialized
  window.sentiumNetwork.on('networkUpdated', () => {
    if (!window.sentiumHealthCheck.isRunning) {
      window.sentiumHealthCheck.start();
    }
  });
}
