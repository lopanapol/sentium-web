// Network Link Controller - Show/hide network link based on server availability
class NetworkLinkController {
  constructor() {
    this.networkLinkContainer = document.getElementById('network-link-container');
    this.onlineIndicator = document.getElementById('online-indicator');
    this.checkInterval = null;
  }

  init() {
    // Check immediately on load
    this.checkNetworkStatus();
    
    // Check periodically for server availability
    this.checkInterval = setInterval(() => {
      this.checkNetworkStatus();
    }, 30000); // Check every 30 seconds
  }

  async checkNetworkStatus() {
    try {
      // Try to load the network registry to see if any servers are responding
      const response = await fetch('/network/registry.json');
      const registry = await response.json();
      
      // Check if any nodes are marked as online
      const onlineNodes = registry.nodes.filter(node => node.status === 'online');
      
      if (onlineNodes.length > 0) {
        this.showNetworkLink(onlineNodes.length);
      } else {
        this.hideNetworkLink();
      }
    } catch (error) {
      // If we can't fetch the registry, assume no servers are available
      this.hideNetworkLink();
    }
  }

  showNetworkLink(onlineCount) {
    if (this.networkLinkContainer) {
      this.networkLinkContainer.style.display = 'block';
      this.networkLinkContainer.style.opacity = '0';
      
      // Fade in animation
      setTimeout(() => {
        this.networkLinkContainer.style.transition = 'opacity 0.5s ease-in-out';
        this.networkLinkContainer.style.opacity = '1';
      }, 100);

      // Update online indicator with pulse animation
      if (this.onlineIndicator) {
        this.onlineIndicator.style.animation = 'pulse 2s infinite';
      }
    }
  }

  hideNetworkLink() {
    if (this.networkLinkContainer) {
      this.networkLinkContainer.style.transition = 'opacity 0.5s ease-in-out';
      this.networkLinkContainer.style.opacity = '0';
      
      setTimeout(() => {
        this.networkLinkContainer.style.display = 'none';
      }, 500);
    }
  }

  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const networkLinkController = new NetworkLinkController();
  networkLinkController.init();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', function() {
    networkLinkController.destroy();
  });
});
