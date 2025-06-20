/**
 * Mobile Touch Handler - Prevents unwanted scroll and movement behaviors
 */

(function() {
  'use strict';
  
  let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  let isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isMobile || isTouch) {
    // Prevent default touch behaviors that cause unwanted movement
    document.addEventListener('touchstart', function(e) {
      // Allow touch on interactive elements
      const target = e.target;
      const interactiveElements = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'];
      const hasInteractiveClass = target.classList.contains('illustration') || 
                                  target.classList.contains('btn') || 
                                  target.classList.contains('sound-toggle') ||
                                  target.closest('#sentium-logo') ||
                                  target.closest('.illustration');
      
      if (!interactiveElements.includes(target.tagName) && !hasInteractiveClass) {
        // Prevent scrolling/movement for non-interactive touches
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
      // Allow scrolling only in the wrapper container
      const target = e.target;
      const wrapper = target.closest('.wrapper');
      
      if (!wrapper) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Prevent iOS bounce effect
    document.addEventListener('touchend', function(e) {
      e.preventDefault();
    }, { passive: false });
    
    // Fix for iOS Safari viewport issues
    function fixViewport() {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
      }
    }
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
      setTimeout(fixViewport, 100);
    });
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', function() {
      fixViewport();
      
      // Add mobile class to body for CSS targeting
      document.body.classList.add('mobile-device');
      
      // Prevent context menu on long press
      document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
      });
    });
  }
})();
