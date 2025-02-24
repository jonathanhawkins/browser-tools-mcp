# Changelog

All notable changes to the Browser Tools MCP project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2023-02-24

### Added
- Auto-discovery feature for server URL in Chrome extension
- Server URL configuration in settings UI
- Connection status indicators
- Platform detection for path handling
- Detailed server information endpoint
- Root endpoint with HTML dashboard
- Debug endpoint for troubleshooting
- Comprehensive error handling for cross-platform scenarios

### Changed
- Replaced hardcoded IP addresses with dynamic discovery
- Enhanced path conversion for cross-platform compatibility
- Updated server to bind to appropriate interfaces
- Improved screenshot saving to work reliably across platforms
- Better error messages for connection issues

### Fixed
- WSL path handling issues
- Screenshot functionality on different platforms
- Connection problems between Chrome extension and server
- Error handling for network requests

## [1.0.9] - 2023-02-19

### Initial Release
- Basic functionality for browser monitoring
- Chrome extension for capturing browser data
- Node server for communication
- MCP server implementation 