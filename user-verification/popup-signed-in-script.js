document.querySelector('#sign-out').addEventListener('click', function () {
    chrome.runtime.sendMessage({ message: 'logout' }, function (response) {
    });
});

document.querySelector('button').addEventListener('click', function() {
    chrome.runtiem.sendMessage({ message: 'isUsersSignedIn' }, function(response) {
    });
});