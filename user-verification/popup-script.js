document.querySelector('#sign-in').addEventListener('click', function () {
    chrome.runtime.sendMessage({ message: 'login' }, function (response) {
    });
});

document.querySelector('button').addEventListener('click', function() {
    chrome.runtiem.sendMessage({ message: 'isUsersSignedIn' }, function(response) {
    });
});