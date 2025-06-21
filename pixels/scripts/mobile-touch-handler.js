/**
 * Mobile Touch Handler - Prevents unwanted scroll and movement behaviors
 */

(function() {
  'use strict';
  
  let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  let isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  if (isMobile || isTouch) {
    // Prevent pinch-to-zoom specifically
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('touchend', function(e) {
      // Only prevent multi-touch gestures, allow single touch interactions
      if (e.touches.length > 1) {
        e.preventDefault();
      }
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
