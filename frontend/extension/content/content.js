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

  // Listen for auth updates from the Baseera website
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data?.type === 'BASEERA_AUTH_UPDATE') {
      chrome.runtime.sendMessage({
        type: 'SAVE_AUTH',
        token: event.data.token,
        userName: event.data.email || event.data.userName
      });
    }

    if (event.data?.type === 'BASEERA_AUTH_LOGOUT') {
      chrome.runtime.sendMessage({ type: 'CLEAR_AUTH' });
    }
  });
})();
