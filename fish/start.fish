#!/usr/bin/env fish

function start --description "Start Python HTTP server in current directory"
    set -l port 8000
    
    # Check if a port argument is provided
    if test (count $argv) -gt 0
        set port $argv[1]
    end
    
    echo "Starting Python HTTP server on port $port in directory: "(pwd)
    echo "Access your site at: http://localhost:$port"
    echo "Press Ctrl+C to stop the server"
    echo ""
    
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
