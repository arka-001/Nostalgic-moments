"""
run.py — Easy Backend Launcher for Nostalgic Music Platform
Run: python run.py
"""

import subprocess
import sys
import os
import shutil

# ── Configuration ─────────────────────────────────────────────────────────────
HOST = "127.0.0.1"
PORT = 8000
RELOAD = True
LOG_LEVEL = "info"
# ──────────────────────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def in_virtualenv():
    """Check if we are already running inside the virtual environment."""
    return (
        hasattr(sys, "real_prefix")
        or (hasattr(sys, "base_prefix") and sys.base_prefix != sys.prefix)
    )

def find_venv_python():
    """Return the path to the Python executable inside the local venv."""
    if sys.platform == "win32":
        candidates = [
            os.path.join(BASE_DIR, "venv", "Scripts", "python.exe"),
            os.path.join(BASE_DIR, ".venv", "Scripts", "python.exe"),
        ]
    else:
        candidates = [
            os.path.join(BASE_DIR, "venv", "bin", "python"),
            os.path.join(BASE_DIR, ".venv", "bin", "python"),
        ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    return None

def find_uvicorn():
    """Return the uvicorn executable path."""
    if sys.platform == "win32":
        candidates = [
            os.path.join(BASE_DIR, "venv", "Scripts", "uvicorn.exe"),
            os.path.join(BASE_DIR, ".venv", "Scripts", "uvicorn.exe"),
        ]
    else:
        candidates = [
            os.path.join(BASE_DIR, "venv", "bin", "uvicorn"),
            os.path.join(BASE_DIR, ".venv", "bin", "uvicorn"),
        ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    # Fallback: system uvicorn
    return shutil.which("uvicorn")

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def banner():
    print()
    print("=" * 60)
    print("  Nostalgic Music Platform - Backend Launcher")
    print("=" * 60)
    print(f"  Host     : http://{HOST}:{PORT}")
    print(f"  API Docs : http://{HOST}:{PORT}/api/docs")
    print(f"  Health   : http://{HOST}:{PORT}/api/health")
    print(f"  Reload   : {'ON' if RELOAD else 'OFF'}")
    print("=" * 60)
    print()

def main():
    banner()
    os.chdir(BASE_DIR)

    # Re-launch with venv Python if not already inside venv
    if not in_virtualenv():
        venv_python = find_venv_python()
        if venv_python:
            print(f"  Activating virtual environment: {venv_python}")
            print()
            # Re-execute this script using venv Python
            os.execv(venv_python, [venv_python, __file__] + sys.argv[1:])
        else:
            print("  WARNING: No virtual environment found. Running with system Python.")
            print("  Create one with: python -m venv venv && .\\venv\\Scripts\\Activate.ps1 && pip install -r requirements.txt")
            print()

    venv_python = find_venv_python() or sys.executable
    cmd = [
        venv_python,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host", HOST,
        "--port", str(PORT),
        "--log-level", LOG_LEVEL,
    ]
    if RELOAD:
        cmd.append("--reload")

    print(f"  Launching: {' '.join(cmd)}")
    print()

    try:
        subprocess.run(cmd, cwd=BASE_DIR, check=False)
    except KeyboardInterrupt:
        print("\n\n  Server stopped. Goodbye!\n")

if __name__ == "__main__":
    main()
