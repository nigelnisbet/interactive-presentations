// Content script that runs in slides.com pages
// Requests background script to inject code into main world

console.log('[Interactive Presentations] Content script loaded');

// Listen for messages from the injected script (in main world)
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'REVEAL_SLIDE_CHANGED' || event.data.type === 'REVEAL_READY') {
    console.log('[Interactive Presentations] Received from page:', event.data);

    // Forward to background script
    chrome.runtime.sendMessage({
      type: event.data.type,
      data: event.data.data
    }).catch(err => {
      console.error('[Interactive Presentations] Error sending to background:', err);
    });
  }
});

// Request background script to inject into main world
// This bypasses CSP restrictions
chrome.runtime.sendMessage({
  type: 'INJECT_REVEAL_LISTENER',
  url: window.location.href
}).then(() => {
  console.log('[Interactive Presentations] Injection requested');
}).catch(err => {
  console.error('[Interactive Presentations] Error requesting injection:', err);
});

export {};
