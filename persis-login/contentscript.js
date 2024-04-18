// Add an event listener that triggers on form submissions on the page.
window.addEventListener('submit', function(event) {
  // Select input elements for username, supporting different attribute identifiers.
  const username = document.querySelector('input[type="email"], input[type="text"], input[name="username"]');
  // Select the password input element.
  const password = document.querySelector('input[type="password"]');

  // Check if both username and password inputs are found.
  if (username && password) {
    // Send a message to the background script to save credentials.
    chrome.runtime.sendMessage({
      type: 'saveCredentials',
      data: {
        url: window.location.origin, // Use the origin of the current website.
        username: username.value,
        password: password.value
      }
    }, function(response) {
      // Log the response status from the background script.
      console.log(response.status);
    });
  }
});
