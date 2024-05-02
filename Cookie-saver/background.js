const MAX_DYNAMIC_RULES = 1000;
// Assuming static rules have IDs 1-5, start dynamic rule IDs from 6
const START_DYNAMIC_RULE_ID = 6;

async function fetchBlocklist() {
    const response = await fetch('https://blocklistproject.github.io/Lists/alt-version/ads-nl.txt');
    const text = await response.text();
    const lines = text.split('\n');
    const blockedDomains = lines.filter(line => line.trim() && !line.startsWith('#'));
    
    return blockedDomains; 
  }
  
  // Function to update dynamic rules, ensuring not to exceed the max limit
  async function updateDynamicRules() {
      const blockedDomains = await fetchBlocklist();
    
  
      const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
      const ruleIdsToRemove = currentRules
      .filter(rule => rule.id >= START_DYNAMIC_RULE_ID)
      .map(rule => rule.id);
      
  
      await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: ruleIdsToRemove });
    
      // Ensure we don't exceed the limit
      const numberOfDomains = Math.min(blockedDomains.length, MAX_DYNAMIC_RULES);
    
      const dynamicRules = blockedDomains.slice(0, numberOfDomains).map((domain, index) => ({
        id: index + START_DYNAMIC_RULE_ID, // ID should be unique
        action: { type: 'block' },
        condition: { urlFilter: `*://${domain}/*` },
      }));
  
    chrome.declarativeNetRequest.updateDynamicRules(
      {
        addRules: dynamicRules,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error updating dynamic rules:", chrome.runtime.lastError.message);
        } else {
          console.log("Dynamic rules updated successfully.");
        }
      }
    );
    const newRules = await chrome.declarativeNetRequest.getDynamicRules();
  }
  
  // Call the updateDynamicRules function when the extension is installed or updated
  chrome.runtime.onInstalled.addListener(updateDynamicRules);
  
  // Periodic updates, if needed (e.g., every 24 hours)
  setInterval(updateDynamicRules, 86400000); 
  
  // Debounce time :0
  const DEBOUNCE_TIME = 60000; // 1 minute
  
  // List to store domains that triggered blocked requests within the debounce period
  let debounceNotificationQueue = [];
  
  let debounceTimer = null;
  
  // Function to send a single notification summarizing blocked requests
  function sendDebouncedNotification() {
    const uniqueDomains = [...new Set(debounceNotificationQueue)]; // Remove duplicates
  
    // Create a summary message with unique blocked domains
    const message = `Blocked requests to the following domains: ${uniqueDomains.join(', ')}`;
  
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../Adblock/lock_16x16.png',
      title: 'Ad Blocker Alert',
      message,
      priority: 2
    });
  
    // Clear the queue after sending the notification
    debounceNotificationQueue = [];
  }
  
  function monitorBlockedRequests(blockedDomains) {
    const urls = blockedDomains.map(domain => `*://${domain}/*`);
    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        const domain = new URL(details.url).hostname;
  
        // Add the domain to the notification queue
        debounceNotificationQueue.push(domain);
  
        // Reset the debounce timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
  
        debounceTimer = setTimeout(sendDebouncedNotification, DEBOUNCE_TIME);
  
        return { cancel: false }; // Not blocking, just monitoring
      },
      { urls: urls },
      []
    );
  }
  
  async function initMonitoring() {
      let blockedDomains = (await fetchBlocklist()).slice(0, MAX_DYNAMIC_RULES);
      blockedDomains.push('*.google-analytics.com', '*.doubleclick.net', '*.googleadservices.com', '*.adbrite.com', '*.quantserve.com');     
    monitorBlockedRequests(blockedDomains); // Set up monitoring based on blocklist
  }
  
  initMonitoring();

  
// Normalize URLs to ensure consistency in storing and retrieving cookies
function normalizeUrl(url) {
    let normalizedUrl = new URL(url);
    normalizedUrl.protocol = 'https:';
    normalizedUrl.hostname = normalizedUrl.hostname.replace(/^www\./, '');
    normalizedUrl.pathname = normalizedUrl.pathname.replace(/\/$/, '');
    return normalizedUrl.toString();
}

// Listener for messages to save cookies
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'saveCookies') {
        chrome.cookies.getAll({url: request.url}, (cookies) => {
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
                    cookie.expirationDate = (Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000;
                }
                return cookie;
            });

            chrome.storage.local.set({[normalizedUrl]: adjustedCookies}, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving cookies:', chrome.runtime.lastError);
                    sendResponse({status: 'Failed to save cookies'});
                } else {
                    sendResponse({status: 'Cookies saved successfully with extended expiration'});
                }
            });
        });
        return true; // Keep the messaging channel open for the response
    }
});

// Listener for tab updates to restore cookies if applicable
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        restoreCookies(tab.url);
    }
});

// Function to restore cookies from storage
function restoreCookies(url) {
    const normalizedUrl = normalizeUrl(url);
    chrome.windows.getCurrent({}, (window) => {
        const storeId = window.incognito ? '1' : '0'; // Default store ID

        chrome.storage.local.get(normalizedUrl, (data) => {
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
                    expirationDate: cookie.expirationDate,
                    storeId: storeId
                };

                chrome.cookies.set(cookieDetails, (setCookie) => {
                    if (!setCookie) {
                        console.error('Error setting cookie:', chrome.runtime.lastError);
                    } else {
                        console.log('Cookie set successfully:', cookie.name);
                    }
                });
            });
        });
    });
}
