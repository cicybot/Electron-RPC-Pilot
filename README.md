# Electron RPC Pilot

**Electron RPC Pilot** is a powerful, headless-capable browser automation tool built on Electron and Express. It functions as a local HTTP server that allows developers to programmatically spawn, control, and inspect browser windows via a simple JSON-RPC API.

Unlike standard automation tools, this project focuses on multi-account management with isolated sessions (cookies/storage) and detailed network request logging, making it ideal for scraping, testing, or managing multiple unique browser identities simultaneously.

## Features & Functionality

### 1. HTTP JSON-RPC Interface
- **Remote Control:** Control the browser via standard HTTP POST requests to `http://localhost:3456/rpc`.
- **Screenshot API:** specialized endpoint to capture compressed PNG screenshots of specific windows.

### 2. Advanced Window & Session Management
- **Multi-Account Support:** Create windows associated with specific `account_index` IDs.
- **Session Isolation:** Each account index uses a unique partition (`persist:p_{index}`), ensuring cookies, local storage, and cache do not leak between windows.
- **Custom configurations:** Set specific User-Agents, open DevTools, or configure WebPreferences dynamically per window.

### 3. Cookie & Network Handling
- **Cookie Import/Export:** Programmatically inject complex cookies (handling `__Secure-` and `__Host-` prefixes automatically) and export current session cookies.
- **Network Logging:** intercepts and logs metadata for all HTTP requests made by the renderer processes, retrievable via the API.

### 4. Remote Execution
- **Execute JavaScript:** Run arbitrary JavaScript code within the context of any open window and retrieve the result immediately.
- **DOM Interaction:** Wait for DOM ready events and interact with page elements via injected scripts.

### 5. System Introspection
- **Resource Monitoring:** Retrieve system memory usage, CPU usage, and process details.
- **Screen Metrics:** Get primary display dimensions for responsive testing.