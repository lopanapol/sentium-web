/**
 * Sentium Network Widget Controller
 * Manages the network status widget on the main page
 */

class NetworkWidget {
  constructor() {
    this.widget = null;
    this.isCollapsed = true;
    this.updateInterval = 30000; // 30 seconds
    this.lastStats = null;
  }

  /**
   * Initialize the network widget
   */
  init() {
    this.widget = document.getElementById('network-widget');
    if (!this.widget) {
      console.warn('Network widget element not found');
      return;
    }

    this.setupEventListeners();
    this.setupNetworkEventListeners();
    this.startPeriodicUpdates();
    
    console.log('Network widget initialized');
  }

  /**
   * Setup widget event listeners
   */
  setupEventListeners() {
    // Toggle widget on click
    const header = this.widget.querySelector('.network-widget-header');
    if (header) {
      header.addEventListener('click', () => this.toggleWidget());
    }

    // Keyboard accessibility
    this.widget.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleWidget();
      }
    });

    // Make widget focusable
    this.widget.setAttribute('tabindex', '0');
    this.widget.setAttribute('role', 'button');
    this.widget.setAttribute('aria-expanded', 'false');
    this.widget.setAttribute('aria-label', 'Network status widget');
  }

  /**
   * Setup network service event listeners
   */
  setupNetworkEventListeners() {
    // Listen for network updates
    if (window.sentiumNetwork) {
      window.sentiumNetwork.on('networkUpdated', (data) => {
        this.updateWidgetData(data);
      });
    }

    // Listen for stats updates
    if (window.sentiumStats) {
      window.sentiumStats.discovery.on('statsUpdated', (stats) => {
        this.updateWidgetStats(stats);
      });
    }

    // Listen for health check updates
    if (window.sentiumHealthCheck) {
      window.sentiumHealthCheck.discovery.on('healthCheckComplete', (data) => {
        this.updateHealthStatus(data);
      });
    }

    // If services aren't ready yet, set up a delayed initialization
    if (!window.sentiumNetwork || !window.sentiumStats) {
      setTimeout(() => this.setupNetworkEventListeners(), 2000);
    }
  }

  /**
   * Toggle widget collapsed/expanded state
   */
  toggleWidget() {
    this.isCollapsed = !this.isCollapsed;
    
    const stats = this.widget.querySelector('.network-stats');
    const toggle = this.widget.querySelector('.network-toggle');
    
    if (this.isCollapsed) {
      this.widget.classList.add('collapsed');
      stats.style.display = 'none';
      toggle.textContent = '▼';
      this.widget.setAttribute('aria-expanded', 'false');
    } else {
      this.widget.classList.remove('collapsed');
      stats.style.display = 'block';
      toggle.textContent = '▲';
      this.widget.setAttribute('aria-expanded', 'true');
      
      // Update data when expanding
      this.refreshWidgetData();
    }
  }

  /**
   * Update widget with network data
   */
  updateWidgetData(networkData) {
    if (!this.widget) return;

    const stats = networkData || window.sentiumNetwork?.getNetworkStats();
    if (!stats) return;

    // Update basic stats
    this.updateElement('stats-nodes', stats.totalNodes || 0);
    this.updateElement('stats-online', stats.onlineNodes || 0);
    
    // Update health indicator
    this.updateHealthIndicator(stats.networkHealth || 'unknown');
  }

  /**
   * Update widget with detailed statistics
   */
  updateWidgetStats(statsData) {
    if (!this.widget || !statsData) return;

    this.lastStats = statsData;

    // Update comprehensive stats
    this.updateElement('stats-nodes', statsData.network?.totalNodes || 0);
    this.updateElement('stats-online', statsData.network?.onlineNodes || 0);
    this.updateElement('stats-pixels', statsData.brandPixels?.totalBrandPixels || 0);
    this.updateElement('stats-health', 
      this.formatHealthStatus(statsData.network?.healthStatus || 'unknown')
    );

    // Update health indicator
    this.updateHealthIndicator(statsData.network?.healthStatus || 'unknown');

    // Add activity indicator if there's recent activity
    if (this.hasRecentActivity(statsData)) {
      this.addActivityIndicator();
    }
  }

  /**
   * Update health status from health check
   */
  updateHealthStatus(healthData) {
    if (!this.widget || !healthData) return;

    const healthRatio = healthData.totalNodes > 0 ? 
      healthData.healthyNodes / healthData.totalNodes : 0;
    
    let healthStatus = 'unknown';
    if (healthRatio >= 0.9) healthStatus = 'excellent';
    else if (healthRatio >= 0.75) healthStatus = 'good';
    else if (healthRatio >= 0.5) healthStatus = 'fair';
    else healthStatus = 'poor';

    this.updateHealthIndicator(healthStatus);
  }

  /**
   * Update health indicator visual state
   */
  updateHealthIndicator(healthStatus) {
    const indicator = this.widget.querySelector('.network-status-indicator');
    if (!indicator) return;

    // Remove all health classes
    indicator.classList.remove('excellent', 'good', 'fair', 'poor', 'unknown');
    
    // Add current health class
    indicator.classList.add(healthStatus);

    // Update tooltip
    const tooltips = {
      excellent: 'Network health: Excellent (90%+ nodes online)',
      good: 'Network health: Good (75%+ nodes online)', 
      fair: 'Network health: Fair (50%+ nodes online)',
      poor: 'Network health: Poor (<50% nodes online)',
      unknown: 'Network health: Unknown (checking...)'
    };

    this.widget.setAttribute('title', tooltips[healthStatus] || tooltips.unknown);
  }

  /**
   * Update individual widget element
   */
  updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      // Add animation if value changed
      const currentValue = element.textContent;
      if (currentValue !== value.toString()) {
        element.style.animation = 'none';
        element.offsetHeight; // Trigger reflow
        element.style.animation = 'pulse 0.5s ease-in-out';
      }
      
      element.textContent = value;
    }
  }

  /**
   * Format health status for display
   */
  formatHealthStatus(status) {
    const formatted = {
      excellent: 'Excellent',
      good: 'Good',
      fair: 'Fair', 
      poor: 'Poor',
      unknown: 'Unknown'
    };
    
    return formatted[status] || 'Unknown';
  }

  /**
   * Check if there's recent network activity
   */
  hasRecentActivity(statsData) {
    if (!this.lastStats || !statsData) return false;

    // Check for changes in key metrics
    const current = statsData.network;
    const previous = this.lastStats.network;

    return (
      current.totalNodes !== previous.totalNodes ||
      current.onlineNodes !== previous.onlineNodes ||
      statsData.brandPixels?.totalBrandPixels !== this.lastStats.brandPixels?.totalBrandPixels
    );
  }

  /**
   * Add activity indicator animation
   */
  addActivityIndicator() {
    this.widget.classList.add('discovering');
    
    setTimeout(() => {
      this.widget.classList.remove('discovering');
    }, 2000);
  }

  /**
   * Refresh widget data manually
   */
  refreshWidgetData() {
    if (window.sentiumNetwork) {
      const networkStats = window.sentiumNetwork.getNetworkStats();
      this.updateWidgetData(networkStats);
    }

    if (window.sentiumStats) {
      const detailedStats = window.sentiumStats.getCurrentStats();
      this.updateWidgetStats(detailedStats);
    }
  }

  /**
   * Start periodic widget updates
   */
  startPeriodicUpdates() {
    setInterval(() => {
      this.refreshWidgetData();
    }, this.updateInterval);
  }

  /**
   * Handle widget click to show network dashboard
   */
  openNetworkDashboard() {
    // This could open a modal or navigate to a dashboard page
    console.log('Opening network dashboard...');
    
    // For now, just log current stats
    if (window.sentiumStats) {
      const stats = window.sentiumStats.getCurrentStats();
      console.log('Current Network Stats:', stats);
    }
  }

  /**
   * Show network error state
   */
  showError(message) {
    this.updateHealthIndicator('poor');
    this.updateElement('stats-health', 'Error');
    
    console.error('Network widget error:', message);
  }

  /**
   * Show network loading state
   */
  showLoading() {
    this.widget.classList.add('loading');
    this.updateHealthIndicator('unknown');
    this.updateElement('stats-health', 'Loading...');
  }

  /**
   * Hide network loading state
   */
  hideLoading() {
    this.widget.classList.remove('loading');
  }
}

// Global instance
window.NetworkWidget = NetworkWidget;

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  const initWidget = () => {
    window.networkWidget = new NetworkWidget();
    window.networkWidget.init();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
}
