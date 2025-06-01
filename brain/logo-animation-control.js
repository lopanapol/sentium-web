/**
 * Logo Animation Control
 * 
 * Adds the ability to pause all animations by clicking the Sentium logo
 */

document.addEventListener('DOMContentLoaded', function() {
  // Find the logo element
  const sentiumLogo = document.getElementById('sentium-logo');
  if (!sentiumLogo) {
    console.warn('Logo element not found for animation control');
    return;
  }

  // Track animation state
  let isPaused = false;

  // Add click event to toggle animation state
  sentiumLogo.addEventListener('click', function() {
    // Toggle animation state using the global animation control
    if (window.animationControl) {
      if (isPaused) {
        window.animationControl.resume();
        // Add a ripple effect on resume
        addRippleEffect(this, '#39ffba');
        showAnimationMessage('Animations resumed');
      } else {
        window.animationControl.pause();
        // Add a ripple effect on pause
        addRippleEffect(this, '#ff3939');
        showAnimationMessage('Animations paused');
      }
      
      // Update the tracked state
      isPaused = !isPaused;
    } else {
      console.warn('Animation control system not available');
    }
  });

  // Creates a ripple effect on the logo when clicked
  function addRippleEffect(element, color) {
    const ripple = document.createElement('div');
    ripple.className = 'bubble-ripple';
    ripple.style.background = color || 'rgba(255, 255, 255, 0.8)';
    
    element.appendChild(ripple);
    
    // Remove the ripple after animation completes
    setTimeout(() => {
      if (ripple.parentNode === element) {
        element.removeChild(ripple);
      }
    }, 800);
  }

  // Shows a message about animation state
  function showAnimationMessage(message) {
    // Check if a message element already exists
    let messageElement = document.querySelector('.animation-message');
    
    if (!messageElement) {
      // Create a new message element if it doesn't exist
      messageElement = document.createElement('div');
      messageElement.className = 'animation-message';
      document.body.appendChild(messageElement);
      
      // Add styles if needed
      if (!document.getElementById('animation-message-styles')) {
        const styles = document.createElement('style');
        styles.id = 'animation-message-styles';
        styles.textContent = `
          .animation-message {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: #39ffba;
            padding: 10px 20px;
            border-radius: 20px;
            font-family: var(--font-family, sans-serif);
            font-size: 16px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
          }
        `;
        document.head.appendChild(styles);
      }
    }
    
    // Update message and show with !important to ensure visibility
    messageElement.textContent = message;
    messageElement.style.cssText = 'opacity: 1 !important; visibility: visible !important; z-index: 100000 !important;';
    
    // Hide after 2 seconds
    setTimeout(() => {
      messageElement.style.opacity = '0';
    }, 2000);
  }
});
