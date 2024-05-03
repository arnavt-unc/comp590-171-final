// Constants for OAuth 2.0 authentication with Google
const CLIENT_ID = encodeURIComponent('730526965793-6r4sntakf1td81uli46rsph7qc8fk2nb.apps.googleusercontent.com');
const RESPONSE_TYPE = encodeURIComponent('id_token');
const REDIRECT_URI = encodeURIComponent('https://lpahenmeijebgbcdhndpfkajghebefja.chromiumapp.org');
const STATE = encodeURIComponent('openid');
const SCOPE = encodeURIComponent('meet' + Math.random().toString(36).substring(2, 15));
const PROMPT = encodeURIComponent('consent');


// Variable to track user sign-in state
let user_signed_in = false;


// Function to check if the user is signed in
function is_user_signed_in() {
    return user_signed_in;
 }


 // Function to create the authentication endpoint URL
function create_auth_endpoint() {
    // Generate a nonce for security
    let nonce = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));    
    // Construct the OpenID endpoint URL with necessary parameters
    let openId_endpoint_url =
        `https://accounts.google.com/o/oauth2/v2/auth
        ?client_id=${CLIENT_ID}
        &response_type=${RESPONSE_TYPE}
        &redirect_uri=${REDIRECT_URI}
        &scope=${SCOPE}
        &state=${STATE}
        &nonce=${nonce}
        &prompt=${PROMPT}`;
    // Log the constructed URL for debugging
    console.log(openId_endpoint_url);
    return openId_endpoint_url;
}


// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Handle login message
    if (request.message === 'login') {
        // Check if user is already signed in
        if (user_signed_in) {
            console.log("User is already signed in.");
        } else {
            // Launch web authentication flow
            chrome.identity.launchWebAuthFlow({
                'url': create_auth_endpoint(),
                'interactive': true
            }, function (redirect_url) {
                if (chrome.runtime.lastError) {
                    // Problem signing in
                } else {
                    // Extract ID token from redirect URL
                    let id_token = redirect_url.substring(redirect_url.indexOf('id_token=') + 9);
                    id_token = id_token.substring(0, id_token.indexOf('&'));
                    // Parse user info from ID token
                    const user_info = KJUR.jws.JWS.readSafeJSONString(b64utoutf8(id_token.split(".")[1]));
                    // Check if ID token is valid
                    if ((user_info.iss === 'https://accounts.google.com' || user_info.iss === 'accounts.google.com') &&
                        user_info.aud === CLIENT_ID) {
                        console.log("User successfully signed in.");
                        // Update user sign-in state
                        user_signed_in = true;
                        // Update browser action popup to display signed-in state
                        chrome.browserAction.setPopup({ popup: './popup-signed-in.html' }, () => {
                            sendResponse('success');                       
                        });
                    } else {
                        // Invalid credentials
                        console.log("Invalid credentials.");
                    }
                }
            });
            // Inform Chrome that the message handling is asynchronous
            return true;
        }
    } 
    // Handle logout message
    else if (request.message === 'logout') {
        // Update user sign-in state
        user_signed_in = false;
        // Update browser action popup to display default login state
        chrome.browserAction.setPopup({ popup: './popup.html' }, () => {
            sendResponse('success');
        });
        // Inform Chrome that the message handling is asynchronous
        return true;
    } 
    // Handle check user sign-in status message
    else if (request.message === 'isUserSignedIn') {
        // Respond with current user sign-in status
        sendResponse(is_user_signed_in());
    }
});