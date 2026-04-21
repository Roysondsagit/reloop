#!/bin/bash

# --- FORMATTING ---
BOLD="\033[1m"
RESET="\033[0m"
CYAN="\033[36m"
GREEN="\033[32m"
RED="\033[31m"

print_step() {
    echo -e "\n${CYAN}[STEP] $1${RESET}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${RESET}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${RESET}"
}

clear
echo -e "${BOLD}============================================================${RESET}"
echo -e "${BOLD}         RELOOP ENGINE: ENVIRONMENT SETUP (LINUX/MAC)      ${RESET}"
echo -e "${BOLD}============================================================${RESET}"

# --- 1. SYSTEM DIAGNOSTICS ---
print_step "Running System Diagnostics..."
echo "OS Name:      $(uname -s)"
echo "Kernel:       $(uname -r)"
echo "Architecture: $(uname -m)"

# Check Python
if command -v python3 &>/dev/null; then
    PY_CMD="python3"
elif command -v python &>/dev/null; then
    PY_CMD="python"
else
    print_error "Python is not installed. Please install Python 3.10+."
    exit 1
fi
echo "Python Ver:   $($PY_CMD --version)"
echo "Start Time:   $(date)"

# --- 2. VIRTUAL ENVIRONMENT ---
print_step "Creating Virtual Environment (venv)..."
if [ -d "venv" ]; then
    echo "Existing venv found. Skipping creation."
else
    $PY_CMD -m venv venv
    if [ $? -eq 0 ]; then
        print_success "Virtual environment created."
    else
        print_error "Failed to create venv."
        exit 1
    fi
fi

# Activate
source venv/bin/activate

# --- 3. DEPENDENCIES ---
print_step "Installing Dependencies from requirements.txt..."
pip install --upgrade pip
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully."
else
    print_error "Dependency installation failed."
    exit 1
fi

# --- 4. DIRECTORY STRUCTURE ---
print_step "Verifying Directory Structure..."
mkdir -p temp_uploads/crops
mkdir -p data/processed
mkdir -p data/factory_pdfs
mkdir -p qdrant_db
print_success "Runtime directories ready."

# --- 5. MODEL CHECK ---
print_step "Checking AI Models..."
if [ -f "yolo11m.pt" ]; then
    echo "Found: yolo11m.pt (Local)"
else
    echo "Missing: yolo11m.pt"
    echo "Note: The Ultralytics library will attempt to download this automatically on first run."
fi

echo -e "\n${BOLD}============================================================${RESET}"
echo -e "${BOLD}   SETUP COMPLETE!   ${RESET}"
echo -e "   To start the engine, run:"
echo -e "   ${CYAN}source venv/bin/activate${RESET}"
echo -e "   ${CYAN}python main.py${RESET}"
echo -e "${BOLD}============================================================${RESET}"