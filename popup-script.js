// Function to handle sign-in button click
function signIn() {
    // Trigger authentication using Chrome Identity API
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
  
  // Add event listener to sign-in button
  document.getElementById('sign-in').addEventListener('click', signIn);
  