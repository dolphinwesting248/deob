// Scenario B: Authentication Flow
// Original code

function authenticate(credentials) {
  var username = credentials.username;
  var password = credentials.password;
  var mfaCode = credentials.mfaCode;

  // Step 1: Validate input
  if (!username || !password) {
    return { success: false, error: "Missing credentials" };
  }

  // Step 2: Check rate limit
  var attempts = getAttemptCount(username);
  if (attempts > 5) {
    return { success: false, error: "Too many attempts" };
  }

  // Step 3: Verify password
  var hashed = simpleHash(password);
  var stored = getStoredHash(username);
  if (hashed !== stored) {
    incrementAttempts(username);
    return { success: false, error: "Invalid password" };
  }

  // Step 4: Verify MFA if enabled
  if (isMfaEnabled(username)) {
    if (!mfaCode) {
      return { success: false, error: "MFA code required" };
    }
    var mfaValid = verifyMfaCode(username, mfaCode);
    if (!mfaValid) {
      return { success: false, error: "Invalid MFA code" };
    }
  }

  // Step 5: Generate session
  var sessionToken = generateToken(username);
  var expiresAt = Date.now() + 3600000;
  saveSession(username, sessionToken, expiresAt);
  resetAttempts(username);

  return { success: true, token: sessionToken, expires: expiresAt };
}

function simpleHash(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

function getAttemptCount(name) { return 0; }
function getStoredHash(name) { return 42; }
function isMfaEnabled(name) { return false; }
function verifyMfaCode(name, code) { return true; }
function generateToken(name) { return "session_" + Math.random().toString(36); }
function saveSession(name, token, expires) {}
function resetAttempts(name) {}
function incrementAttempts(name) {}
