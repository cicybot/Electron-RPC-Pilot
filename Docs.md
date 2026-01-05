# Documentation

## Installation & Setup

1. **Prerequisites**: Ensure Node.js is installed.
2. **Install Dependencies**:
   ```bash
   npm install electron express cors electron-context-menu
   ```
3. **Run the Server**:
   ```bash
   npm start
   # or
   node index.js
   ```
   The server will start on port `3456` (or `process.env.PORT`) and automatically launch an initial window.

---

## API Reference

The server exposes an HTTP API at `http://127.0.0.1:3456`.

### 1. RPC Endpoint
**URL:** `POST /rpc`
**Content-Type:** `application/json`

**Body Structure:**
```json
{
  "method": "method_name",
  "params": {
    "win_id": 1, // Optional: Target specific window ID
    ...other_params
  }
}
```

#### Available Methods

| Method | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `ping` | Health check. | None | `"pong"` |
| `info` | System & process info. | None | System stats, memory, screen size. |
| `openWindow` | Opens a new browser window. | `account_index` (int), `url` (string), `options` (obj), `others` (obj: `{userAgent, cookies, openDevtools}`) | `{ "id": <window_id> }` |
| `loadURL` | Navigates a window. | `win_id`, `url` | `null` |
| `getWindows` | List active windows. | None | JSON map of active windows grouped by account. |
| `executeJavaScript`| Run JS in renderer. | `win_id`, `code` (string) | Result of execution. |
| `screenshot` | Capture base64 PNG. | `win_id` | Base64 string of screenshot. |
| `importCookies` | Set session cookies. | `win_id`, `cookies` (Array) | `{}` |
| `exportCookies` | Get session cookies. | `win_id`, `options` (filter obj) | Array of cookies. |
| `getRequests` | Get network log. | None | Array of request headers/urls. |
| `getURL` | Get current URL. | `win_id` | Current URL string. |
| `reload` | Reload page. | `win_id` | `null` |
| `setUserAgent` | Change UA string. | `win_id`, `userAgent` | `null` |

#### Example: Opening a Window with Isolation
```bash
curl -X POST http://127.0.0.1:3456/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "openWindow",
    "params": {
      "account_index": 1,
      "url": "https://google.com",
      "others": {
        "userAgent": "Mozilla/5.0 (CustomBot/1.0)",
        "openDevtools": false
      }
    }
  }'
```

### 2. Screenshot Endpoint
**URL:** `GET /screenshot`

Directly retrieves a PNG image of a specific window.

**Query Parameters:**
- `id`: The ID of the BrowserWindow to capture (default: 1).

**Example:**
```bash
# Save screenshot of window 2 to file
curl "http://127.0.0.1:3456/screenshot?id=2" --output window2.png
```

## Cookie Object Structure
When using `importCookies`, the cookie objects should adhere to the Electron `CookiesSetDetails` structure, with standard fields like:
- `name`, `value`, `domain`, `path`
- `secure` (boolean), `httpOnly` (boolean)
- `sameSite` ("no_restriction" | "lax" | "strict")

*Note: The system automatically handles strict prefix rules for `__Secure-` and `__Host-` cookies.*