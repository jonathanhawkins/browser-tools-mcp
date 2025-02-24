#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "path";
import fs from "fs";
import os from "os";
// import { z } from "zod";
// import fs from "fs";

// Create the MCP server
const server = new McpServer({
  name: "Browser Tools MCP",
  version: "1.0.9",
});

// Function to get the port from environment variable or default
function getServerPort(): number {
  // Check environment variable first
  if (process.env.BROWSER_TOOLS_PORT) {
    const envPort = parseInt(process.env.BROWSER_TOOLS_PORT, 10);
    if (!isNaN(envPort) && envPort > 0) {
      return envPort;
    }
  }
  
  // Try to read from .port file
  try {
    const portFilePath = path.join(__dirname, ".port");
    if (fs.existsSync(portFilePath)) {
      const port = parseInt(fs.readFileSync(portFilePath, "utf8").trim(), 10);
      if (!isNaN(port) && port > 0) {
        return port;
      }
    }
  } catch (err) {
    console.error("Error reading port file:", err);
  }
  
  // Default port if no configuration found
  return 3025;
}

// Function to get server host from environment variable or default
function getServerHost(): string {
  // Check environment variable first
  if (process.env.BROWSER_TOOLS_HOST) {
    return process.env.BROWSER_TOOLS_HOST;
  }
  
  // Default to localhost
  return "127.0.0.1";
}

const PORT = getServerPort();
const HOST = getServerHost();

// We'll define four "tools" that retrieve data from the aggregator at localhost:3000

server.tool("getConsoleLogs", "Check our browser logs", async () => {
  const response = await fetch(`http://${HOST}:${PORT}/console-logs`);
  const json = await response.json();
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(json, null, 2),
      },
    ],
  };
});

server.tool(
  "getConsoleErrors",
  "Check our browsers console errors",
  async () => {
    const response = await fetch(`http://${HOST}:${PORT}/console-errors`);
    const json = await response.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(json, null, 2),
        },
      ],
    };
  }
);

// Return all HTTP errors (4xx/5xx)
server.tool("getNetworkErrors", "Check our network ERROR logs", async () => {
  const response = await fetch(`http://${HOST}:${PORT}/network-errors`);
  const json = await response.json();
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(json, null, 2),
      },
    ],
  };
});

// // Return all XHR/fetch requests
// server.tool("getNetworkSuccess", "Check our network SUCCESS logs", async () => {
//   const response = await fetch(`http://127.0.0.1:${PORT}/all-xhr`);
//   const json = await response.json();
//   return {
//     content: [
//       {
//         type: "text",
//         text: JSON.stringify(json, null, 2),
//       },
//     ],
//   };
// });

// Return all XHR/fetch requests
server.tool("getNetworkLogs", "Check ALL our network logs", async () => {
  const response = await fetch(`http://${HOST}:${PORT}/all-xhr`);
  const json = await response.json();
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(json, null, 2),
      },
    ],
  };
});

// Add new tool for taking screenshots
server.tool(
  "takeScreenshot",
  "Take a screenshot of the current browser tab",
  async () => {
    try {
      const response = await fetch(
        `http://${HOST}:${PORT}/capture-screenshot`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // const message = `Screenshot saved to: ${
        //   result.path
        // }\nFilename: ${path.basename(result.path)}`;
        return {
          content: [
            {
              type: "text",
              text: "Successfully saved screenshot",
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Error taking screenshot: ${result.error}`,
            },
          ],
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to take screenshot: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Add new tool for getting selected element
server.tool(
  "getSelectedElement",
  "Get the selected element from the browser",
  async () => {
    const response = await fetch(`http://${HOST}:${PORT}/selected-element`);
    const json = await response.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(json, null, 2),
        },
      ],
    };
  }
);

// Add new tool for wiping logs
server.tool("wipeLogs", "Wipe all browser logs from memory", async () => {
  const response = await fetch(`http://${HOST}:${PORT}/wipelogs`, {
    method: "POST",
  });
  const json = await response.json();
  return {
    content: [
      {
        type: "text",
        text: json.message,
      },
    ],
  };
});

// Start receiving messages on stdio
(async () => {
  try {
    const transport = new StdioServerTransport();

    // Ensure stdout is only used for JSON messages
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: any, encoding?: any, callback?: any) => {
      // Only allow JSON messages to pass through
      if (typeof chunk === "string" && !chunk.startsWith("{")) {
        return true; // Silently skip non-JSON messages
      }
      return originalStdoutWrite(chunk, encoding, callback);
    };

    await server.connect(transport);
  } catch (error) {
    console.error("Failed to initialize MCP server:", error);
    process.exit(1);
  }
})(); 