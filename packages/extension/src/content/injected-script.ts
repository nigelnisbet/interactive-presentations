// This script runs in the page's main world and has access to Reveal.js
// It's injected by the background script using chrome.scripting.executeScript

(function() {
  console.log('[Interactive Presentations] Injected script running in main world');

  function setupRevealListener() {
    if (typeof (window as any).Reveal === 'undefined') {
      console.log('[Interactive Presentations] Reveal.js not found, will retry...');
      return false;
    }

    console.log('[Interactive Presentations] Reveal.js detected!');

    const Reveal = (window as any).Reveal;

    // Listen for slide changes
    Reveal.on('slidechanged', (event: any) => {
      const slideData = {
        indexh: event.indexh,
        indexv: event.indexv,
        timestamp: Date.now()
      };

      console.log('[Interactive Presentations] Slide changed:', slideData);

      // Send message to content script
      window.postMessage({
        type: 'REVEAL_SLIDE_CHANGED',
        data: slideData
      }, '*');
    });

    // Send initial slide on ready
    Reveal.on('ready', (event: any) => {
      const slideData = {
        indexh: event.indexh,
        indexv: event.indexv,
        timestamp: Date.now()
      };

      console.log('[Interactive Presentations] Reveal ready:', slideData);

      window.postMessage({
        type: 'REVEAL_READY',
        data: slideData
      }, '*');
    });

    return true;
  }

  // Try to setup immediately
  if (!setupRevealListener()) {
    // If not available, wait for page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(setupRevealListener, 1000);
      });
    } else {
      // Page already loaded, retry after delay
      setTimeout(setupRevealListener, 1000);
    }
  }
})();
