#!/bin/bash

# ===========================================
#   Charlie Tool Backend Setup (macOS/Linux)
# ===========================================

echo "==============================="
echo "   Charlie Tool Backend Setup"
echo "==============================="


cd "$(dirname "$0")"
# ✅ Move into Server directory
cd Server || { echo "❌ Server directory not found!"; exit 1; }

# Step 0: Kill process on port 8000
echo
echo "[0] Checking and killing process on port 8000 if exists..."
PID=$(lsof -ti:8000)
if [ -n "$PID" ]; then
    echo "⚠️ Killing PID $PID..."
    kill -9 $PID
    echo "✅ Port 8000 freed."
else
    echo "✅ No process on port 8000."
fi

# Step 1: Cleanup previous venv & __pycache__
echo
echo "[1] Cleaning up previous virtual environment and __pycache__ folders..."
if [ -d "venv" ]; then
    echo "🧹 Removing existing venv..."
    rm -rf venv
else
    echo "✅ No existing venv found."
fi

echo "🔍 Scanning for __pycache__ folders..."
find . -type d -name "__pycache__" -exec rm -rf {} +

# Step 2: Check Python
echo
echo "[2] Checking Python..."
if ! command -v python3 &>/dev/null; then
    echo "❌ Python3 not found. Please install Python 3.11+ (brew install python3)."
    exit 1
else
    python3 --version
fi

# Step 3: Create virtual environment
echo
echo "[3] Creating new virtual environment..."
python3 -m venv venv
if [ ! -d "venv" ]; then
    echo "❌ Failed to create virtual environment."
    exit 1
fi

# Step 4: Activate virtual environment
echo
echo "[4] Activating virtual environment..."
source venv/bin/activate || { echo "❌ Failed to activate virtual environment."; exit 1; }

# Step 5: Install dependencies
echo
echo "[5] Installing dependencies..."
if [ -f requirements.txt ]; then
    echo "✅ Found requirements.txt"
    pip install -r requirements.txt
elif [ -f Requirements.txt ]; then
    echo "✅ Found Requirements.txt"
    pip install -r Requirements.txt
else
    echo "❌ No requirements file found."
    deactivate
    exit 1
fi

# Step 6: Verify Main.py exists
echo
echo "[6] Checking Main.py..."
if [ ! -f Main.py ]; then
    echo "❌ Main.py not found in Server directory!"
    deactivate
    exit 1
fi

# Step 7: Run server
echo
echo "[7] Starting FastAPI server with Uvicorn..."
if ! pip show uvicorn &>/dev/null; then
    echo "⚠️ Uvicorn not installed, installing now..."
    pip install uvicorn
fi

echo "🚀 Launching FastAPI server..."
python -m uvicorn Main:app --reload --port 8000 &

SERVER_PID=$!
echo "🎉 Server started (PID: $SERVER_PID). Access it at: http://127.0.0.1:8000"

# Optional: Step 8 cleanup port 8000 on exit
cleanup() {
    echo
    echo "[8] Cleaning up process on port 8000..."
    kill -9 $SERVER_PID 2>/dev/null
    echo "🛑 Server stopped."
    deactivate
    exit 0
}

# Trap CTRL+C to cleanup
trap cleanup SIGINT

# Keep script alive
wait $SERVER_PID
