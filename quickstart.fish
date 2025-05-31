#!/usr/bin/env fish

echo "🌟 Starting Sentium Pixel Pixel Demo Mode 🌟"
echo "=================================="
echo ""

# Check if required tools are installed
set -l required_tools node npm
set -l missing_tools

for tool in $required_tools
    if not command -v $tool >/dev/null
        set -a missing_tools $tool
    end
end

if test (count $missing_tools) -gt 0
    echo "❌ Error: The following required tools are missing:"
    for tool in $missing_tools
        echo "   - $tool"
    end
    echo ""
    echo "Please install these tools and try again."
    exit 1
end

# Install dependencies if needed
if not test -d "node_modules"
    echo "📦 Installing dependencies..."
    npm install --quiet
else
    echo "✓ Dependencies already installed"
end

# Set up demo environment
echo "🔧 Setting up demo environment..."
# Create .env file for demo mode
echo "DEMO_MODE=true" > .env
echo "NO_SENTIUM_REQUIRED=true" >> .env
echo "PORT=3000" >> .env

# Start the server
echo ""
echo "🚀 Starting Sentium Pixel in demo mode..."
echo "📱 Open your browser at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server with demo flag
npm start

# Cleanup
rm -f .env
echo ""
echo "👋 Thank you for trying Sentium Pixel Pixel Demo!"
