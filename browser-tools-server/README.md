# Browser Tools Server

This server connects to a Chrome extension to capture browser logs, network activity, and screenshots.

## Configuration

The server can be configured using environment variables:

### Environment Variables

- `SERVER_HOST`: Host to bind the server to
  - Default: `0.0.0.0` (all interfaces)
  - Example: `localhost` (only local connections)

- `PORT`: Port to run the server on
  - Default: `3025`
  - Example: `PORT=3030 npm start`

### Screenshot Path Configuration

The screenshot path is determined in the following order:

1. Path provided by the Chrome extension (highest priority)
2. Default path: User's Downloads/mcp-screenshots folder

## Running the Server

```bash
# Run with default settings
npm start

# Run with custom port
PORT=3030 npm start

# Run with custom host
SERVER_HOST=localhost npm start
```

## Chrome Extension Configuration

To configure your Chrome extension to connect to this server:

1. Start the server
2. Use one of the following URLs in your extension settings:
   - For local access: `http://localhost:3025`
   - For WSL (Windows Subsystem for Linux): `http://wsl.localhost:3025`
   - For specific IP: `http://<your-ip>:3025`
3. Configure the screenshot path in the Chrome extension settings
   - For WSL: Use the Windows path format (e.g., `\\wsl.localhost\Ubuntu\path\to\screenshots`)
   - For Windows: Use the Windows path format (e.g., `C:\path\to\screenshots`)
   - For macOS/Linux: Use the Unix path format (e.g., `/path/to/screenshots`)

## Testing the Connection

You can test the connection with:

```bash
curl http://localhost:3025/ping
```

This should return a JSON response indicating the server is running.

## Features

- Console log capture
- Network request monitoring
- Screenshot capture
- Element selection tracking
- WebSocket real-time communication
- Configurable log limits and settings

## Installation

```bash
npx @agentdeskai/browser-tools-server
```

Or install globally:

```bash
npm install -g @agentdeskai/browser-tools-server
```

## Usage

1. Start the server:

```bash
npx @agentdeskai/browser-tools-server
```

2. The server will start on port 3025 by default

3. Install and enable the Browser Tools Chrome Extension

4. The server exposes the following endpoints:

- `/console-logs` - Get console logs
- `/console-errors` - Get console errors
- `/network-errors` - Get network error logs
- `/network-success` - Get successful network requests
- `/all-xhr` - Get all network requests
- `/screenshot` - Capture screenshots
- `/selected-element` - Get currently selected DOM element

## API Documentation

### GET Endpoints

- `GET /console-logs` - Returns recent console logs
- `GET /console-errors` - Returns recent console errors
- `GET /network-errors` - Returns recent network errors
- `GET /network-success` - Returns recent successful network requests
- `GET /all-xhr` - Returns all recent network requests
- `GET /selected-element` - Returns the currently selected DOM element

### POST Endpoints

- `POST /extension-log` - Receive logs from the extension
- `POST /screenshot` - Capture and save screenshots
- `POST /selected-element` - Update the selected element
- `POST /wipelogs` - Clear all stored logs

## License

MIT
