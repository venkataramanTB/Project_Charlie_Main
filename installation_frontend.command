#!/bin/bash

# =============================================
#  Charlie Tool FastAPI Launcher (macOS/Linux)
# =============================================

PORT=3000
MODULE="main:app"

echo "============================================"
echo "🔥 Starting Charlie Tool FastAPI Frontend Server"
echo "============================================"
echo "Time: $(date)"
echo "Port: $PORT"
echo "--------------------------------------------"

# Step 0: Check Python
echo "🐍 Checking for Python installation..."
if ! command -v python3 &>/dev/null; then
    echo "❌ Python3 not found."
    echo "👉 Please install Python 3.11+ manually from https://www.python.org/downloads/"
    exit 1
fi

# Step 1: Check Node.js
echo "🧠 Checking for Node.js installation..."
if ! command -v node &>/dev/null; then
    echo "❌ Node.js not found. Installing..."
    if command -v brew &>/dev/null; then
        echo "📦 Installing Node.js via Homebrew..."
        brew install node
    elif command -v apt &>/dev/null; then
        echo "📦 Installing Node.js via apt..."
        sudo apt update && sudo apt install -y nodejs npm
    elif command -v dnf &>/dev/null; then
        echo "📦 Installing Node.js via dnf..."
        sudo dnf install -y nodejs npm
    else
        echo "❌ Could not detect package manager. Please install Node.js manually:"
        echo "👉 https://nodejs.org/"
        exit 1
    fi
else
    echo "✅ Node.js is already installed."
fi

# Step 2: Check Uvicorn + FastAPI
echo "🧩 Ensuring Uvicorn + FastAPI installed..."
if ! python3 -m pip show uvicorn &>/dev/null; then
    echo "📦 Installing uvicorn + fastapi..."
    python3 -m pip install --user uvicorn fastapi
fi

# Step 3: Kill process on port if running
echo "🔍 Checking for process on port $PORT..."
PID=$(lsof -ti:$PORT)
if [ -n "$PID" ]; then
    echo "⚠️ Port $PORT is used by PID $PID. Killing it..."
    kill -9 $PID
    if [ $? -eq 0 ]; then
        echo "✅ Successfully killed PID $PID"
    else
        echo "❌ Failed to kill PID $PID"
    fi
fi

# Step 4: Launch FastAPI
echo "🚀 Starting FastAPI server on http://localhost:$PORT"
open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" 2>/dev/null

python3 -m uvicorn $MODULE --port $PORT
if [ $? -ne 0 ]; then
    echo "❌ Failed to launch FastAPI server. Check module path: $MODULE"
    exit 1
fi

echo "🛑 Script complete."
