// Add a listener for messages sent from other parts of the extension, such as a content script or popup.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if the message is to save credentials.
  if (request.type === 'saveCredentials') {
    // Retrieve the current list of credentials from storage, initializing empty array if none exist.
    chrome.storage.local.get({ credentials: [] }, function(data) {
      let credentials = data.credentials;
      // Check if an entry with the same URL already exists.
      const existingIndex = credentials.findIndex(cred => cred.url === request.data.url);
      if (existingIndex !== -1) {
        // If it exists, update the existing entry.
        credentials[existingIndex] = request.data;
      } else {
        // If it does not exist, add the new entry.
        credentials.push(request.data);
      }
      // Save the updated list of credentials back to local storage.
      chrome.storage.local.set({credentials: credentials}, function() {
        // Send a response back to the sender indicating success.
        sendResponse({status: 'Credentials saved'});
      });
    });
    return true;
  }
});
