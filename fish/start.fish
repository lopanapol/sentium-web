#!/usr/bin/env fish

function start --description "Start Python HTTP server in current directory"
    set -l port 8000
    
    # Check if a port argument is provided
    if test (count $argv) -gt 0
        set port $argv[1]
    end
    
    echo "Starting Python HTTP server on port $port in directory: "(pwd)
    echo "Access your site at: http://localhost:$port"
    echo "� Auto-opening VS Code Simple Browser..."
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Function to open VS Code Simple Browser after server starts
    function open_simple_browser
        sleep 3  # Wait for server to fully start
        echo "Opening Simple Browser in VS Code..."
        
        # Try multiple methods to open Simple Browser
        # Method 1: Direct command (if VS Code CLI is available)
        if command -v code >/dev/null 2>&1; and code --command "simpleBrowser.show" http://localhost:$port 2>/dev/null
            echo "✅ Opened Simple Browser via VS Code command"
        # Method 2: Use custom URI scheme
        else if open "vscode://ms-vscode.simple-browser/show?url=http://localhost:$port" 2>/dev/null
            echo "✅ Opened Simple Browser via URI scheme"
        # Method 3: Fallback to default browser
        else
            echo "⚠️  Could not auto-open Simple Browser. Opening default browser instead..."
            open "http://localhost:$port"
        end
    end
    
    # Start browser opening in background
    open_simple_browser &
    
    # Try Python 3 first, then Python 2 as fallback
    if command -v python3 >/dev/null 2>&1
        python3 -m http.server $port
    else if command -v python >/dev/null 2>&1
        python -m SimpleHTTPServer $port
    else
        echo "Error: Python not found. Please install Python to use this function."
        return 1
    end
end
