document.addEventListener('DOMContentLoaded', function() {
  function loadCredentials() {
  chrome.storage.local.get('credentials', function(data) {
    const container = document.getElementById('credentials');
    container.innerHTML = ''; // Clear the loading message or previous content
    if (data.credentials && data.credentials.length > 0) {
      data.credentials.forEach(cred => {
        const credDiv = document.createElement('div');
        credDiv.classList.add('credential');
        credDiv.innerHTML = `<div class="site">Site: ${cred.url}</div><div>Username: ${cred.username}</div><div>Password: ${cred.password}</div>`;
        container.appendChild(credDiv);
      });
    } else {
      container.textContent = 'No credentials saved.';
    }
  });
}

document.getElementById('clearStorage').addEventListener('click', function() {
  chrome.storage.local.clear(function(){
  });
});

  loadCredentials();
});
