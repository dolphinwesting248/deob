// Scenario A: API Client - simple variable renaming + string encoding
// Original code

const API_BASE_URL = "https://api.example.com";
const AUTH_TOKEN_KEY = "session_token";

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function buildAuthHeaders(token) {
  return {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json",
    "X-Request-ID": Math.random().toString(36).slice(2)
  };
}

async function sendRequest(endpoint, method, data, token) {
  const url = API_BASE_URL + endpoint;
  const headers = buildAuthHeaders(token);
  const response = await fetch(url, {
    method: method,
    headers: headers,
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) {
    throw new Error("Request failed: " + response.status);
  }
  return response.json();
}

async function login(username, password) {
  const hashed = hashPassword(password);
  const result = await sendRequest("/auth/login", "POST", {
    user: username,
    pass: hashed
  });
  localStorage.setItem(AUTH_TOKEN_KEY, result.token);
  return result.token;
}

async function getUserProfile(userId) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) throw new Error("Not authenticated");
  return sendRequest("/users/" + userId, "GET", null, token);
}

async function updateProfile(userId, data) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) throw new Error("Not authenticated");
  return sendRequest("/users/" + userId, "PUT", data, token);
}

// Entry point
login("admin", "password123").then(function(token) {
  getUserProfile("admin").then(function(profile) {
    console.log("Profile loaded:", profile);
  }).catch(function(err) {
    console.error("Failed to load profile:", err);
  });
}).catch(function(err) {
  console.error("Login failed:", err);
});
