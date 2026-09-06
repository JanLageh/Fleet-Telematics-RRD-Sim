#!/usr/bin/env bash
set -e

# Resolve backend directory location
SCRIPT_PATH="$(realpath "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"

if [ -f "$SCRIPT_DIR/app/main.py" ]; then
    BACKEND_DIR="$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/backend/app/main.py" ]; then
    BACKEND_DIR="$SCRIPT_DIR/backend"
else
    echo "Error: Could not locate backend directory containing app/main.py." >&2
    exit 1
fi

cd "$BACKEND_DIR"

VENV_DIR="$BACKEND_DIR/.venv"

# 1. Create virtual environment and install dependencies if .venv doesn't exist
if [ ! -d "$VENV_DIR" ] || [ ! -f "$VENV_DIR/bin/activate" ]; then
    echo "Virtual environment not found at $VENV_DIR. Setting it up..."
    if command -v uv >/dev/null 2>&1; then
        echo "Creating virtual environment and installing dependencies using uv..."
        uv sync
    elif command -v python3 >/dev/null 2>&1; then
        echo "uv not found. Creating virtual environment with python3 -m venv..."
        python3 -m venv "$VENV_DIR"
        # shellcheck source=/dev/null
        source "$VENV_DIR/bin/activate"
        echo "Installing dependencies with pip..."
        pip install --upgrade pip
        pip install fastapi "uvicorn[standard]" pydantic pydantic-settings numpy pandas ruff
    else
        echo "Error: Neither 'uv' nor 'python3' was found on your system." >&2
        exit 1
    fi
fi

# 2. Activate virtual environment
echo "Activating virtual environment ($VENV_DIR)..."
# shellcheck source=/dev/null
source "$VENV_DIR/bin/activate"

# Verify uvicorn is available in the virtual environment
if ! command -v uvicorn >/dev/null 2>&1; then
    echo "uvicorn binary missing in virtual environment. Installing dependencies..."
    if command -v uv >/dev/null 2>&1; then
        uv sync
    else
        pip install fastapi "uvicorn[standard]" pydantic pydantic-settings numpy pandas ruff
    fi
fi

# 3. Automatically start the backend server
echo "Starting backend server on http://0.0.0.0:8000 (accessible on LAN)..."
exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 "$@"
