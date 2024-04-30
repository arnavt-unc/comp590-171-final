// Maximum allowed dynamic rules
const MAX_DYNAMIC_RULES = 1000;
// Assuming static rules have IDs 1-5, start dynamic rule IDs from 6
const START_DYNAMIC_RULE_ID = 6;

// Function to fetch and parse blocklist from a URL
async function fetchBlocklist() {
  const response = await fetch('https://blocklistproject.github.io/Lists/alt-version/ads-nl.txt');
  const text = await response.text();
  const lines = text.split('\n');
  const blockedDomains = lines.filter(line => line.trim() && !line.startsWith('#'));
  
  return blockedDomains; // Return the list of parsed domains
}

// Function to update dynamic rules, ensuring not to exceed the max limit
async function updateDynamicRules() {
    const blockedDomains = await fetchBlocklist();
  
    // Get the current dynamic rules
    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIdsToRemove = currentRules
    .filter(rule => rule.id >= START_DYNAMIC_RULE_ID)
    .map(rule => rule.id);
    
    // Remove all existing dynamic rules
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
}

// Call the updateDynamicRules function when the extension is installed or updated
chrome.runtime.onInstalled.addListener(updateDynamicRules);

// Periodic updates, if needed (e.g., every 24 hours)
setInterval(updateDynamicRules, 86400000); // 24 hours in milliseconds
