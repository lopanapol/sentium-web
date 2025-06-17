/**
 * Sentium Network Statistics Aggregation
 * Collects, processes, and aggregates network-wide statistics
 */

class SentiumNetworkStats {
  constructor(discoveryService, healthCheckService) {
    this.discovery = discoveryService;
    this.healthCheck = healthCheckService;
    this.statsHistory = [];
    this.aggregationInterval = 5 * 60 * 1000; // 5 minutes
    this.maxHistorySize = 288; // 24 hours worth of 5-minute intervals
    this.currentStats = this.getEmptyStats();
  }

  /**
   * Initialize statistics aggregation
   */
  init() {
    // Initial statistics calculation
    this.calculateStats();
    
    // Schedule periodic aggregation
    this.intervalId = setInterval(() => {
      this.calculateStats();
    }, this.aggregationInterval);
    
    console.log('Network statistics aggregation initialized');
  }

  /**
   * Stop statistics aggregation
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Calculate comprehensive network statistics
   */
  calculateStats() {
    const timestamp = new Date().toISOString();
    const nodes = this.discovery.nodes;
    
    const stats = {
      timestamp,
      network: this.calculateNetworkStats(nodes),
      nodes: this.calculateNodeStats(nodes),
      brandPixels: this.calculateBrandPixelStats(nodes),
      performance: this.calculatePerformanceStats(nodes),
      geographic: this.calculateGeographicStats(nodes),
      trends: this.calculateTrends()
    };
    
    this.currentStats = stats;
    this.addToHistory(stats);
    
    // Emit statistics update event
    this.discovery.emit('statsUpdated', stats);
    
    return stats;
  }

  /**
   * Calculate overall network statistics
   */
  calculateNetworkStats(nodes) {
    const totalNodes = nodes.length;
    const onlineNodes = nodes.filter(n => n.status === 'online').length;
    const offlineNodes = nodes.filter(n => n.status === 'offline').length;
    const pendingNodes = nodes.filter(n => n.status === 'pending').length;
    
    const healthRatio = totalNodes > 0 ? onlineNodes / totalNodes : 0;
    let healthStatus = 'unknown';
    
    if (healthRatio >= 0.9) healthStatus = 'excellent';
    else if (healthRatio >= 0.75) healthStatus = 'good';
    else if (healthRatio >= 0.5) healthStatus = 'fair';
    else if (healthRatio >= 0.25) healthStatus = 'poor';
    else healthStatus = 'critical';
    
    return {
      totalNodes,
      onlineNodes,
      offlineNodes,
      pendingNodes,
      healthRatio: Math.round(healthRatio * 100),
      healthStatus,
      networkCapacity: this.calculateNetworkCapacity(nodes),
      networkUtilization: this.calculateNetworkUtilization(nodes)
    };
  }

  /**
   * Calculate node-specific statistics
   */
  calculateNodeStats(nodes) {
    const nodesByType = this.groupNodesByType(nodes);
    const nodesByLocation = this.groupNodesByLocation(nodes);
    
    return {
      byType: nodesByType,
      byLocation: nodesByLocation,
      averageUptime: this.calculateAverageUptime(nodes),
      topPerformers: this.getTopPerformingNodes(nodes, 5),
      recentlyJoined: this.getRecentlyJoinedNodes(nodes, 5),
      nodeDistribution: this.calculateNodeDistribution(nodes)
    };
  }

  /**
   * Calculate brand pixel statistics
   */
  calculateBrandPixelStats(nodes) {
    const allBrandPixels = nodes.flatMap(node => node.brandPixels || []);
    const totalBrandPixels = allBrandPixels.length;
    
    const pixelsByBrand = this.groupPixelsByBrand(allBrandPixels);
    const pixelsByStatus = this.groupPixelsByStatus(allBrandPixels);
    
    return {
      totalBrandPixels,
      activeBrandPixels: pixelsByStatus.active || 0,
      inactiveBrandPixels: pixelsByStatus.inactive || 0,
      uniqueBrands: Object.keys(pixelsByBrand).length,
      topBrands: this.getTopBrands(pixelsByBrand, 10),
      averageInteractions: this.calculateAverageInteractions(allBrandPixels),
      evolutionStats: this.calculateEvolutionStats(allBrandPixels)
    };
  }

  /**
   * Calculate performance statistics
   */
  calculatePerformanceStats(nodes) {
    const onlineNodes = nodes.filter(n => n.status === 'online');
    
    if (onlineNodes.length === 0) {
      return {
        averageResponseTime: 0,
        medianResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        totalInteractions: 0,
        interactionsPerHour: 0
      };
    }
    
    const responseTimes = onlineNodes
      .map(n => parseInt(n.performance?.avgResponseTime) || 0)
      .filter(rt => rt > 0);
    
    const totalInteractions = onlineNodes.reduce(
      (sum, node) => sum + (node.performance?.totalInteractions || 0), 0
    );
    
    return {
      averageResponseTime: this.calculateAverage(responseTimes),
      medianResponseTime: this.calculateMedian(responseTimes),
      minResponseTime: Math.min(...responseTimes) || 0,
      maxResponseTime: Math.max(...responseTimes) || 0,
      totalInteractions,
      interactionsPerHour: this.calculateInteractionsPerHour(nodes)
    };
  }

  /**
   * Calculate geographic distribution statistics
   */
  calculateGeographicStats(nodes) {
    const countries = {};
    const cities = {};
    
    nodes.forEach(node => {
      const location = node.location || {};
      const country = location.country || 'Unknown';
      const city = location.city || 'Unknown';
      
      countries[country] = (countries[country] || 0) + 1;
      
      const cityKey = `${city}, ${country}`;
      cities[cityKey] = (cities[cityKey] || 0) + 1;
    });
    
    return {
      totalCountries: Object.keys(countries).length,
      totalCities: Object.keys(cities).length,
      topCountries: this.getTopEntries(countries, 10),
      topCities: this.getTopEntries(cities, 10),
      distribution: countries
    };
  }

  /**
   * Calculate trend statistics
   */
  calculateTrends() {
    if (this.statsHistory.length < 2) {
      return {
        nodeGrowthRate: 0,
        pixelGrowthRate: 0,
        interactionGrowthRate: 0,
        performanceTrend: 'stable'
      };
    }
    
    const current = this.currentStats;
    const previous = this.statsHistory[this.statsHistory.length - 2];
    
    const nodeGrowthRate = this.calculateGrowthRate(
      previous.network?.totalNodes || 0,
      current.network?.totalNodes || 0
    );
    
    const pixelGrowthRate = this.calculateGrowthRate(
      previous.brandPixels?.totalBrandPixels || 0,
      current.brandPixels?.totalBrandPixels || 0
    );
    
    const interactionGrowthRate = this.calculateGrowthRate(
      previous.performance?.totalInteractions || 0,
      current.performance?.totalInteractions || 0
    );
    
    return {
      nodeGrowthRate,
      pixelGrowthRate,
      interactionGrowthRate,
      performanceTrend: this.calculatePerformanceTrend()
    };
  }

  /**
   * Helper: Calculate network capacity
   */
  calculateNetworkCapacity(nodes) {
    return nodes.reduce((total, node) => {
      return total + (node.capabilities?.maxBrandPixels || 0);
    }, 0);
  }

  /**
   * Helper: Calculate network utilization
   */
  calculateNetworkUtilization(nodes) {
    const capacity = this.calculateNetworkCapacity(nodes);
    const used = nodes.reduce((total, node) => {
      return total + (node.brandPixels?.length || 0);
    }, 0);
    
    return capacity > 0 ? Math.round((used / capacity) * 100) : 0;
  }

  /**
   * Helper: Group nodes by type
   */
  groupNodesByType(nodes) {
    const groups = { static: 0, dynamic: 0, unknown: 0 };
    
    nodes.forEach(node => {
      if (node.url?.includes('github.io') || node.url?.includes('sentium.dev')) {
        groups.static++;
      } else if (node.url?.startsWith('http://localhost') || node.url?.includes(':')) {
        groups.dynamic++;
      } else {
        groups.unknown++;
      }
    });
    
    return groups;
  }

  /**
   * Helper: Group nodes by location
   */
  groupNodesByLocation(nodes) {
    const locations = {};
    
    nodes.forEach(node => {
      const country = node.location?.country || 'Unknown';
      locations[country] = (locations[country] || 0) + 1;
    });
    
    return locations;
  }

  /**
   * Helper: Calculate average uptime
   */
  calculateAverageUptime(nodes) {
    const uptimes = nodes
      .map(n => parseFloat(n.performance?.uptime) || 0)
      .filter(u => u > 0);
    
    return uptimes.length > 0 ? 
      Math.round(uptimes.reduce((sum, u) => sum + u, 0) / uptimes.length) : 0;
  }

  /**
   * Helper: Get top performing nodes
   */
  getTopPerformingNodes(nodes, limit) {
    return nodes
      .filter(n => n.status === 'online')
      .sort((a, b) => {
        const scoreA = this.calculateNodePerformanceScore(a);
        const scoreB = this.calculateNodePerformanceScore(b);
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(n => ({
        id: n.id,
        name: n.name,
        score: this.calculateNodePerformanceScore(n)
      }));
  }

  /**
   * Helper: Calculate node performance score
   */
  calculateNodePerformanceScore(node) {
    let score = 0;
    
    // Uptime score (0-40)
    const uptime = parseFloat(node.performance?.uptime) || 0;
    score += uptime * 0.4;
    
    // Response time score (0-30)
    const responseTime = parseInt(node.performance?.avgResponseTime) || 1000;
    score += Math.max(0, 30 - (responseTime / 100));
    
    // Interaction score (0-20)
    const interactions = node.performance?.totalInteractions || 0;
    score += Math.min(20, interactions / 100);
    
    // Capacity utilization score (0-10)
    const capacity = node.capabilities?.maxBrandPixels || 1;
    const usage = (node.brandPixels?.length || 0) / capacity;
    score += usage * 10;
    
    return Math.round(score);
  }

  /**
   * Helper: Get recently joined nodes
   */
  getRecentlyJoinedNodes(nodes, limit) {
    return nodes
      .sort((a, b) => new Date(b.registered) - new Date(a.registered))
      .slice(0, limit)
      .map(n => ({
        id: n.id,
        name: n.name,
        registered: n.registered
      }));
  }

  /**
   * Helper: Calculate growth rate percentage
   */
  calculateGrowthRate(previous, current) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Helper: Calculate average of array
   */
  calculateAverage(arr) {
    return arr.length > 0 ? Math.round(arr.reduce((sum, val) => sum + val, 0) / arr.length) : 0;
  }

  /**
   * Helper: Calculate median of array
   */
  calculateMedian(arr) {
    if (arr.length === 0) return 0;
    
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    return sorted.length % 2 === 0 ?
      Math.round((sorted[mid - 1] + sorted[mid]) / 2) :
      sorted[mid];
  }

  /**
   * Helper: Get top entries from object
   */
  getTopEntries(obj, limit) {
    return Object.entries(obj)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([key, value]) => ({ name: key, count: value }));
  }

  /**
   * Helper: Add statistics to history
   */
  addToHistory(stats) {
    this.statsHistory.push(stats);
    
    // Keep only recent history
    if (this.statsHistory.length > this.maxHistorySize) {
      this.statsHistory = this.statsHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Helper: Get empty statistics structure
   */
  getEmptyStats() {
    return {
      timestamp: new Date().toISOString(),
      network: { totalNodes: 0, onlineNodes: 0, healthStatus: 'unknown' },
      nodes: { byType: {}, byLocation: {}, averageUptime: 0 },
      brandPixels: { totalBrandPixels: 0, uniqueBrands: 0 },
      performance: { averageResponseTime: 0, totalInteractions: 0 },
      geographic: { totalCountries: 0, totalCities: 0 },
      trends: { nodeGrowthRate: 0, pixelGrowthRate: 0 }
    };
  }

  /**
   * Get current statistics
   */
  getCurrentStats() {
    return this.currentStats;
  }

  /**
   * Get statistics history
   */
  getStatsHistory(hours = 24) {
    const pointsNeeded = Math.ceil(hours * 60 / 5); // 5-minute intervals
    return this.statsHistory.slice(-pointsNeeded);
  }

  /**
   * Export statistics for external use
   */
  exportStats(format = 'json') {
    const data = {
      current: this.currentStats,
      history: this.statsHistory,
      exported: new Date().toISOString()
    };
    
    if (format === 'csv') {
      return this.convertToCSV(data);
    }
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Helper: Convert data to CSV format
   */
  convertToCSV(data) {
    const headers = ['timestamp', 'totalNodes', 'onlineNodes', 'totalBrandPixels', 'avgResponseTime'];
    const rows = data.history.map(stat => [
      stat.timestamp,
      stat.network.totalNodes,
      stat.network.onlineNodes,
      stat.brandPixels.totalBrandPixels,
      stat.performance.averageResponseTime
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

// Export for global use
window.SentiumNetworkStats = SentiumNetworkStats;

// Auto-initialize with discovery and health check services
if (typeof window !== 'undefined') {
  // Wait for both services to be available
  const initStats = () => {
    if (window.sentiumNetwork && window.sentiumHealthCheck) {
      window.sentiumStats = new SentiumNetworkStats(
        window.sentiumNetwork,
        window.sentiumHealthCheck
      );
      window.sentiumStats.init();
    }
  };
  
  // Try to initialize immediately or wait for services
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStats);
  } else {
    setTimeout(initStats, 1000); // Give services time to initialize
  }
}
