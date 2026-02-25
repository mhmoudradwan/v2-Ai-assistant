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

  // On page load, sync current auth state from localStorage to extension storage
  (function syncOnLoad() {
    if (!window.location.href.startsWith('http://localhost:5173') &&
        !window.location.href.startsWith('https://localhost')) return;

    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('baseeraUserName');
    let email = '';

    try {
      const userData = localStorage.getItem('baseeraUserData');
      if (userData) {
        const parsed = JSON.parse(userData);
        email = parsed.email || '';
      }
    } catch (e) {}

    if (token) {
      chrome.runtime.sendMessage({
        type: 'SAVE_AUTH',
        token: token,
        userName: email || userName || ''
      });
    } else {
      chrome.runtime.sendMessage({ type: 'CLEAR_AUTH' });
    }
  })();

  // Listen for localStorage changes (login/logout in other tabs)
  window.addEventListener('storage', (event) => {
    if (event.key === 'authToken') {
      if (event.newValue) {
        const userName = localStorage.getItem('baseeraUserName');
        let email = '';
        try {
          const userData = localStorage.getItem('baseeraUserData');
          if (userData) email = JSON.parse(userData).email || '';
        } catch (e) {}

        chrome.runtime.sendMessage({
          type: 'SAVE_AUTH',
          token: event.newValue,
          userName: email || userName || ''
        });
      } else {
        chrome.runtime.sendMessage({ type: 'CLEAR_AUTH' });
      }
    }
  });
})();
