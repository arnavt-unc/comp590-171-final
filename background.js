// background.js

// Function to handle authentication and obtain OAuth token
function authenticate() {
    chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        return;
      }
      console.log("OAuth token:", token);
      // Once you have the token, you can use it to make authenticated requests
      // to your API endpoints or other services
    });
  }
  
  // Event listener to trigger authentication when extension is installed or updated
  chrome.runtime.onInstalled.addListener(function() {
    authenticate();
  });
  
  // Event listener to trigger authentication when extension starts up
  chrome.runtime.onStartup.addListener(function() {
    authenticate();
  });
  