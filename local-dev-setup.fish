#!/usr/bin/env fish

# Sentium Pixel Local Development Setup
# This script helps set up local development to avoid CORS issues

echo "Sentium Pixel Local Development Setup"
echo "========================================"
echo ""

# Check if we're in the right directory
if not test -f "index.html"
    echo "Error: Please run this script from the sentium-pixel directory"
    echo "   Expected files: index.html, brain/, css/, etc."
    exit 1
end

echo "Current directory: "(pwd)
echo ""

# Option 1: Simple HTTP Server
echo "Option 1: Start Local HTTP Server"
echo "-----------------------------------"
echo "This will serve the app at http://localhost:8000 (no CORS issues)"
echo ""

# Check for Python
if command -v python3 > /dev/null
    echo "Python 3 detected"
    echo "   Run: python3 -m http.server 8000"
    echo "   Then visit: http://localhost:8000"
elif command -v python > /dev/null
    echo "Python detected"
    echo "   Run: python -m SimpleHTTPServer 8000"
    echo "   Then visit: http://localhost:8000"
else
    echo "Python not found"
end

# Check for Node.js
if command -v npx > /dev/null
    echo "Node.js detected"
    echo "   Run: npx http-server -p 8000"
    echo "   Then visit: http://localhost:8000"
end

# Check for PHP
if command -v php > /dev/null
    echo "PHP detected"
    echo "   Run: php -S localhost:8000"
    echo "   Then visit: http://localhost:8000"
end

echo ""

# Option 2: CORS Browser Extension
echo "Option 2: Browser CORS Extension"
echo "-----------------------------------"
echo "Install a CORS extension to bypass restrictions:"
echo "• Chrome: https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino"
echo "• Firefox: https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/"
echo ""

# Option 3: URL Parameters
echo "Option 3: URL Parameters"
echo "--------------------------"
echo "Add these parameters to sentium.dev URL:"
echo "• ?local=true     - Force connection attempt to localhost"
echo "• ?cors=ignore    - Suppress CORS warnings"
echo "• ?port=3001      - Use custom port (default: 3000)"
echo "• ?debug=true     - Enable verbose logging"
echo ""
echo "Example: https://sentium.dev/?local=true&debug=true"
echo ""

# Option 4: Local Sentium Server
echo "Option 4: Local Sentium Server"
echo "----------------------------------"
echo "Make sure your local Sentium server is running:"
echo "1. Start server: cd ~/git-repos/sentium && ./run.fish"
echo "2. Test connection: curl http://localhost:3000/api/test-connection"
echo "3. Enable CORS in server config if needed"
echo ""

# Interactive choice
echo "What would you like to do?"
echo "1) Start Python HTTP server (recommended)"
echo "2) Start Node.js HTTP server"
echo "3) Start PHP server"
echo "4) Show browser extension links"
echo "5) Exit"
echo ""

read -P "Enter your choice (1-5): " choice

switch $choice
    case 1
        echo ""
        echo "Starting Python HTTP server..."
        if command -v python3 > /dev/null
            echo "Server will be available at: http://localhost:8000"
            echo "Press Ctrl+C to stop the server"
            echo ""
            python3 -m http.server 8000
        else
            echo "Server will be available at: http://localhost:8000"
            echo "Press Ctrl+C to stop the server"
            echo ""
            python -m SimpleHTTPServer 8000
        end
        
    case 2
        if command -v npx > /dev/null
            echo ""
            echo "Starting Node.js HTTP server..."
            echo "Server will be available at: http://localhost:8000"
            echo "Press Ctrl+C to stop the server"
            echo ""
            npx http-server -p 8000
        else
            echo "npx not found. Please install Node.js first."
        end
        
    case 3
        if command -v php > /dev/null
            echo ""
            echo "Starting PHP server..."
            echo "Server will be available at: http://localhost:8000"
            echo "Press Ctrl+C to stop the server"
            echo ""
            php -S localhost:8000
        else
            echo "PHP not found. Please install PHP first."
        end
        
    case 4
        echo ""
        echo "Browser Extensions for CORS:"
        echo "Chrome: https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino"
        echo "Firefox: https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/"
        echo ""
        echo "After installing, enable the extension and reload sentium.dev"
        
    case 5
        echo "Goodbye!"
        
    case '*'
        echo "Invalid choice. Please run the script again."
end
