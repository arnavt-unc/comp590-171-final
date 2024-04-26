// Normalizes URLs to ensure consistency in storing and retrieving cookies
function normalizeUrl(url) {
    let normalizedUrl = new URL(url);
    // Standardize the protocol to HTTPS
    normalizedUrl.protocol = normalizedUrl.protocol === 'http:' ? 'https:' : normalizedUrl.protocol;
    // Remove 'www.' if present for uniformity
    normalizedUrl.hostname = normalizedUrl.hostname.replace(/^www\./, '');
    // Remove trailing slashes
    normalizedUrl.pathname = normalizedUrl.pathname.replace(/\/$/, '');
    return normalizedUrl.toString();
}

// Listener for messages to save cookies
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'saveCookies') {
        chrome.cookies.getAll({url: request.url}, function(cookies) {
            if (chrome.runtime.lastError) {
                console.error('Error fetching cookies:', chrome.runtime.lastError);
                sendResponse({status: 'Failed to fetch cookies'});
                return;
            }

            const normalizedUrl = normalizeUrl(request.url);
            const adjustedCookies = cookies.map(cookie => {
                if (normalizedUrl.startsWith('https://')) {
                    cookie.secure = true;
                }
                if (!cookie.expirationDate) {
                    const oneWeekLater = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
                    cookie.expirationDate = oneWeekLater / 1000;
                }
                return cookie;
            });

            chrome.storage.local.set({[normalizedUrl]: adjustedCookies}, function() {
                if (chrome.runtime.lastError) {
                    console.error('Error saving cookies:', chrome.runtime.lastError);
                    sendResponse({status: 'Failed to save cookies'});
                } else {
                    sendResponse({status: 'Cookies saved successfully with extended expiration'});
                }
            });
        });
        return true;
    }
});

// Listener for tab updates to restore cookies if applicable
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
        restoreCookies(tab.url);
    }
});

// Function to restore cookies from storage
function restoreCookies(url) {
    const normalizedUrl = normalizeUrl(url);
    console.log('Attempting to restore cookies for URL:', normalizedUrl);
    chrome.storage.local.get(normalizedUrl, function(data) {
        if (!data[normalizedUrl]) {
            console.log('No cookies stored for this URL:', normalizedUrl);
            return;
        }

        const cookies = data[normalizedUrl];
        cookies.forEach(cookie => {
            let cookieDetails = {
                url: normalizedUrl,
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                sameSite: cookie.sameSite,
                expirationDate: cookie.expirationDate
            };

            chrome.cookies.set(cookieDetails, function(setCookie) {
                if (!setCookie) {
                    console.error('Error setting cookie:', chrome.runtime.lastError);
                } else {
                    console.log('Cookie set successfully:', cookie.name);
                }
            });
        });
    });
}
