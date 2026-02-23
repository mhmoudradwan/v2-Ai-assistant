// Baseera Security Scanner - Content Script
// Passive observer - does not modify the page

(function() {
  'use strict';
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PING') {
      sendResponse({ status: 'ready', url: window.location.href });
    }
  });
})();
