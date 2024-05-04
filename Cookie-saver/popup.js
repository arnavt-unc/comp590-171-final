document.addEventListener('DOMContentLoaded', function() {
    const loadCookies = () => {
      chrome.storage.local.get(null, data => {
        const container = document.getElementById('cookies');
        container.innerHTML = ''; // Clear the area before showing cookie details
        if (Object.keys(data).length === 0) {
          container.textContent = 'No cookies saved.';
          return;
        }
        Object.keys(data).forEach(url => {
          data[url].forEach(cookie => {
            const cookieDiv = document.createElement('div');
            cookieDiv.classList.add('cookie');
            cookieDiv.innerHTML = `<div class="site">Site: ${url}</div><div>Name: ${cookie.name}</div><div>Value: ${cookie.value}</div>`;
            container.appendChild(cookieDiv);
          });
        });
      });
    };
  
    document.getElementById('clearStorage').addEventListener('click', () => {
      chrome.storage.local.clear(() => {
        const container = document.getElementById('cookies');
        container.textContent = 'All cookies cleared.';
      });
    });
  
    loadCookies();
  });