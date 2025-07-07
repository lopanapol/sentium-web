# CORS Issues and Solutions

When running Sentium Pixel from `https://sentium.dev`, you may encounter CORS (Cross-Origin Resource Sharing) errors when trying to connect to your local Sentium server. This is a browser security feature that blocks requests from HTTPS sites to HTTP localhost servers.

## The Problem

The error messages you'll see include:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:3000/api/test-connection. (Reason: CORS request did not succeed).
```

This happens because:
- Your web app runs on `https://sentium.dev` (HTTPS)
- Your local server runs on `http://localhost:3000` (HTTP)
- Browsers block HTTPS → HTTP requests for security

## Solutions

### Option 1: Run Locally (Recommended)
Run the Sentium Pixel app locally to avoid CORS issues entirely:

```bash
# Navigate to your sentium-web directory
cd ~/path/to/sentium-web

# Run the setup script
./local-dev-setup.fish

# Or manually start a local server:
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

### Option 2: Browser CORS Extension
Install a CORS extension to bypass restrictions:
- **Chrome**: [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino)
- **Firefox**: [CORS Everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/)

**Security Warning**: Only enable CORS extensions for development, not general browsing.

### Option 3: URL Parameters
Add these parameters to the sentium.dev URL:
- `?local=true` - Force connection attempt to localhost
- `?cors=ignore` - Suppress CORS warnings  
- `?port=3001` - Use custom port (default: 3000)
- `?debug=true` - Enable verbose logging

**Example**: `https://sentium.dev/?local=true&debug=true`

### Option 4: HTTPS Local Server
Set up HTTPS on your local Sentium server:
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Start server with HTTPS
# (Implementation depends on your server setup)
```

## Automatic Detection

The Sentium Pixel app now includes:
- Automatic CORS issue detection
- User-friendly notification with solutions
- Smart connection attempt logic
- Graceful fallback to standalone mode

## Troubleshooting

If you're still having issues:

1. **Check server status**:
   ```bash
   curl http://localhost:3000/api/test-connection
   ```

2. **Try different ports**:
   ```
   https://sentium.dev/?port=3001
   ```

3. **Enable debug mode**:
   ```
   https://sentium.dev/?debug=true
   ```

4. **Check browser console** for detailed error messages

## Technical Details

CORS is enforced by browsers to prevent malicious websites from accessing local services. The "mixed content" policy specifically blocks HTTPS sites from making HTTP requests.

**What we've implemented**:
- Smart CORS detection based on protocol and hostname
- Multiple fallback connection endpoints
- User-friendly error messages and solutions
- URL parameter support for development workflows
- Graceful degradation to standalone mode

The app will continue to work in standalone mode even when the local server cannot be reached.
