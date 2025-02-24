// Store settings
let settings = {
  logLimit: 50,
  queryLimit: 30000,
  stringSizeLimit: 500,
  showRequestHeaders: false,
  showResponseHeaders: false,
  maxLogSize: 20000,
  screenshotPath: "",
  serverUrl: "http://localhost:3025", // Default to localhost
};

// Connection status variable
let connectionStatus = false;

// Load saved settings on startup
chrome.storage.local.get(["browserConnectorSettings"], (result) => {
  if (result.browserConnectorSettings) {
    settings = { ...settings, ...result.browserConnectorSettings };
    updateUIFromSettings();
  }
});

// Initialize UI elements
const logLimitInput = document.getElementById("log-limit");
const queryLimitInput = document.getElementById("query-limit");
const stringSizeLimitInput = document.getElementById("string-size-limit");
const showRequestHeadersCheckbox = document.getElementById(
  "show-request-headers"
);
const showResponseHeadersCheckbox = document.getElementById(
  "show-response-headers"
);
const maxLogSizeInput = document.getElementById("max-log-size");
const screenshotPathInput = document.getElementById("screenshot-path");
const captureScreenshotButton = document.getElementById("capture-screenshot");
const testConnectionButton = document.getElementById("server-test-connection");
const serverUrlInput = document.getElementById("server-url");
const discoverServerButton = document.getElementById("discover-server");
const discoveredServersContainer = document.getElementById("discovered-servers-container");
const discoveredServersList = document.getElementById("discovered-servers-list");

// Initialize collapsible advanced settings
const advancedSettingsHeader = document.getElementById(
  "advanced-settings-header"
);
const advancedSettingsContent = document.getElementById(
  "advanced-settings-content"
);
const chevronIcon = advancedSettingsHeader.querySelector(".chevron");

advancedSettingsHeader.addEventListener("click", () => {
  advancedSettingsContent.classList.toggle("visible");
  chevronIcon.classList.toggle("open");
});

// Helper function to get server URL
function getServerUrl() {
  return settings.serverUrl || "http://localhost:3025";
}

// Update UI from settings
function updateUIFromSettings() {
  logLimitInput.value = settings.logLimit;
  queryLimitInput.value = settings.queryLimit;
  stringSizeLimitInput.value = settings.stringSizeLimit;
  showRequestHeadersCheckbox.checked = settings.showRequestHeaders;
  showResponseHeadersCheckbox.checked = settings.showResponseHeaders;
  maxLogSizeInput.value = settings.maxLogSize;
  screenshotPathInput.value = settings.screenshotPath;
  serverUrlInput.value = settings.serverUrl || "";
}

// Save settings
function saveSettings() {
  chrome.storage.local.set({ browserConnectorSettings: settings });
  // Notify devtools.js about settings change
  chrome.runtime.sendMessage({
    type: "SETTINGS_UPDATED",
    settings,
  });
}

// Attempt to discover available servers
async function discoverServers() {
  discoveredServersContainer.style.display = "none";
  discoveredServersList.innerHTML = "";
  discoverServerButton.textContent = "Discovering...";
  
  // Prioritize local and WSL addresses first
  const priorityAddresses = [
    "http://localhost:3025",
    "http://127.0.0.1:3025",
    "http://wsl.localhost:3025",  // WSL-specific URL for Windows hosts
    "http://172.17.0.1:3025"      // Common WSL network adapter
  ];
  
  // Secondary addresses to try if priority ones fail
  const secondaryAddresses = [];
  
  // Only add a few common local network patterns - limit to reduce unnecessary requests
  for (let i = 1; i < 10; i++) {
    secondaryAddresses.push(`http://192.168.1.${i}:3025`);
  }
  
  // Try discovery on priority addresses first
  let foundServers = [];
  let foundCount = 0;
  
  // Helper function to check a server URL
  async function checkServer(baseUrl) {
    try {
      console.log(`Checking server at ${baseUrl}...`);
      const serverUrl = `${baseUrl}/server-info`;
      const response = await fetch(serverUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // Short timeout to avoid hanging
        signal: AbortSignal.timeout(500)
      });
      
      if (response.ok) {
        const serverInfo = await response.json();
        console.log(`Found server at ${baseUrl}:`, serverInfo);
        
        // Successfully found a server, add it to the list
        foundServers.push({
          url: baseUrl,
          hostname: serverInfo.hostname,
          platform: serverInfo.platform
        });
        
        foundCount++;
        return true;
      }
    } catch (error) {
      // Ignore errors during discovery
      console.log(`No server at ${baseUrl}`);
    }
    return false;
  }
  
  // Check priority addresses first
  for (const baseUrl of priorityAddresses) {
    if (await checkServer(baseUrl)) {
      // If we found a server in the priority list, don't bother with secondary addresses
      break;
    }
  }
  
  // Only check secondary addresses if we didn't find any servers in priority list
  if (foundCount === 0) {
    for (const baseUrl of secondaryAddresses) {
      // Limit discovery to 3 servers to avoid overwhelming the UI
      if (foundCount >= 3) break;
      await checkServer(baseUrl);
    }
  }
  
  // Display found servers
  if (foundServers.length > 0) {
    discoveredServersContainer.style.display = "block";
    
    foundServers.forEach(server => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `<a href="#" class="server-link" data-url="${server.url}">${server.url}</a> (${server.hostname}, ${server.platform})`;
      discoveredServersList.appendChild(listItem);
    });
    
    // Add click handlers for server links
    document.querySelectorAll(".server-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const serverUrl = e.target.getAttribute("data-url");
        settings.serverUrl = serverUrl;
        serverUrlInput.value = serverUrl;
        saveSettings();
        testConnection(serverUrl);
      });
    });
  } else {
    // If no servers found, show message
    discoveredServersContainer.style.display = "block";
    discoveredServersList.innerHTML = "<li>No servers found. Make sure the server is running on your network.</li>";
  }
  
  discoverServerButton.textContent = "Auto-Discover Server";
}

// Add event listeners for all inputs
logLimitInput.addEventListener("change", (e) => {
  settings.logLimit = parseInt(e.target.value, 10);
  saveSettings();
});

queryLimitInput.addEventListener("change", (e) => {
  settings.queryLimit = parseInt(e.target.value, 10);
  saveSettings();
});

stringSizeLimitInput.addEventListener("change", (e) => {
  settings.stringSizeLimit = parseInt(e.target.value, 10);
  saveSettings();
});

showRequestHeadersCheckbox.addEventListener("change", (e) => {
  settings.showRequestHeaders = e.target.checked;
  saveSettings();
});

showResponseHeadersCheckbox.addEventListener("change", (e) => {
  settings.showResponseHeaders = e.target.checked;
  saveSettings();
});

maxLogSizeInput.addEventListener("change", (e) => {
  settings.maxLogSize = parseInt(e.target.value, 10);
  saveSettings();
});

screenshotPathInput.addEventListener("change", (e) => {
  settings.screenshotPath = e.target.value;
  saveSettings();
});

serverUrlInput.addEventListener("change", (e) => {
  settings.serverUrl = e.target.value;
  saveSettings();
});

// Add discover server button functionality
discoverServerButton.addEventListener("click", async () => {
  discoverServerButton.textContent = "Discovering...";
  await discoverServers();
  discoverServerButton.textContent = "Auto-Discover Server";
});

// Add improved test connection functionality
function testConnection(urlToTest = null) {
  // Update button
  testConnectionButton.textContent = "Testing...";
  
  // Use provided URL or default to current settings
  const serverUrl = urlToTest || getServerUrl();
  
  // Send a ping request to the server
  fetch(`${serverUrl}/ping`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((result) => {
      console.log("Connection test successful:", result);
      testConnectionButton.textContent = "Connected!";
      testConnectionButton.classList.add("success");
      connectionStatus = true;
      
      setTimeout(() => {
        testConnectionButton.textContent = "Test Connection";
        testConnectionButton.classList.remove("success");
      }, 2000);
    })
    .catch((error) => {
      console.error("Connection test failed:", error);
      testConnectionButton.textContent = "Connection Failed!";
      testConnectionButton.classList.add("error");
      connectionStatus = false;
      
      setTimeout(() => {
        testConnectionButton.textContent = "Test Connection";
        testConnectionButton.classList.remove("error");
      }, 2000);
    });
}

// Update test connection button with new function
testConnectionButton.addEventListener("click", () => {
  testConnection();
});

// Add screenshot capture functionality
captureScreenshotButton.addEventListener("click", () => {
  captureScreenshotButton.textContent = "Capturing...";

  // Send message to devtools.js to capture screenshot
  chrome.runtime.sendMessage({ type: "CAPTURE_SCREENSHOT" }, (response) => {
    if (!response) {
      captureScreenshotButton.textContent = "Failed to capture!";
      console.error("Screenshot capture failed: No response received");
    } else if (!response.success) {
      captureScreenshotButton.textContent = "Failed to capture!";
      console.error("Screenshot capture failed:", response.error);
    } else {
      captureScreenshotButton.textContent = "Screenshot captured!";
    }
    setTimeout(() => {
      captureScreenshotButton.textContent = "Capture Screenshot";
    }, 2000);
  });
});

// Add wipe logs functionality
const wipeLogsButton = document.getElementById("wipe-logs");
wipeLogsButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to wipe all logs?")) {
    // Send a request to wipe logs
    fetch(`${getServerUrl()}/wipelogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then((response) => response.json())
      .then((result) => {
        console.log("Logs wiped successfully:", result.message);
        wipeLogsButton.textContent = "Logs Wiped!";
        setTimeout(() => {
          wipeLogsButton.textContent = "Wipe All Logs";
        }, 2000);
      })
      .catch((error) => {
        console.error("Failed to wipe logs:", error);
        wipeLogsButton.textContent = "Failed to Wipe Logs";
        setTimeout(() => {
          wipeLogsButton.textContent = "Wipe All Logs";
        }, 2000);
      });
  }
});

// Try auto-discovery on load
window.addEventListener("load", async () => {
  if (!settings.serverUrl) {
    await discoverServers();
  }
});
