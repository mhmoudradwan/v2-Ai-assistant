// Baseera Security Scanner - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('Baseera Security Scanner installed');
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_AUTH') {
    chrome.storage.local.set({
      authToken: message.token,
      userName: message.userName
    }, () => {
      sendResponse({ success: true });
    });
    return true; // Keep message channel open
  }

  if (message.type === 'CLEAR_AUTH') {
    chrome.storage.local.remove(['authToken', 'userName'], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_AUTH') {
    chrome.storage.local.get(['authToken', 'userName'], (result) => {
      sendResponse({ token: result.authToken, userName: result.userName });
    });
    return true;
  }
});
