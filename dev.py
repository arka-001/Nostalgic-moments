"""
dev.py — Interactive Dual Server Launcher for Nostalgic Music Platform
Runs both Backend (FastAPI/Uvicorn) and Frontend (Next.js) concurrently.

Key Controls (interactive in terminal):
  [r]  Refresh / Restart BOTH servers (Backend + Frontend)
  [b]  Restart Backend only
  [f]  Restart Frontend only
  [o]  Open application in browser (http://localhost:3000)
  [c]  Clear console screen
  [h]  Show help / keyboard shortcuts
  [q]  Quit and cleanly stop both servers

Usage:
  python dev.py
  py dev.py
"""

import os
import sys
import time
import shutil
import threading
import subprocess
import webbrowser

# Enable ANSI colors on Windows terminal
if sys.platform == "win32":
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
    except Exception:
        pass

# ── ANSI Color Codes ─────────────────────────────────────────────────────────
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
RED = "\033[91m"
BLUE = "\033[94m"
BG_PURPLE = "\033[45m\033[97m"

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

class DualServerManager:
    def __init__(self):
        self.backend_proc = None
        self.frontend_proc = None
        self.running = True
        self.lock = threading.Lock()
        self.backend_port = 8000
        self.frontend_port = 3000

    def find_backend_python(self):
        """Find the virtualenv Python or fallback to current python."""
        if sys.platform == "win32":
            candidates = [
                os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe"),
                os.path.join(BACKEND_DIR, ".venv", "Scripts", "python.exe"),
                os.path.join(ROOT_DIR, "venv", "Scripts", "python.exe"),
            ]
        else:
            candidates = [
                os.path.join(BACKEND_DIR, "venv", "bin", "python"),
                os.path.join(BACKEND_DIR, ".venv", "bin", "python"),
                os.path.join(ROOT_DIR, "venv", "bin", "python"),
            ]
        for p in candidates:
            if os.path.isfile(p):
                return p
        return sys.executable

    def find_npm(self):
        """Find npm executable on system."""
        if sys.platform == "win32":
            npm = shutil.which("npm.cmd") or shutil.which("npm")
        else:
            npm = shutil.which("npm")
        return npm or "npm"

    def kill_port_owner(self, port):
        """Cleanly terminate any lingering process listening on a given port."""
        if sys.platform == "win32":
            try:
                cmd = f"netstat -ano | findstr :{port}"
                out = subprocess.check_output(cmd, shell=True, text=True, stderr=subprocess.DEVNULL)
                pids = set()
                for line in out.strip().splitlines():
                    parts = line.strip().split()
                    if len(parts) >= 5 and "LISTENING" in parts:
                        pid = parts[-1]
                        if pid.isdigit() and int(pid) > 0 and int(pid) != os.getpid():
                            pids.add(pid)
                for pid in pids:
                    subprocess.run(["taskkill", "/F", "/T", "/PID", pid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception:
                pass

    def kill_proc(self, proc):
        """Forcefully and cleanly kill process tree on Windows/Linux."""
        if not proc:
            return
        try:
            if sys.platform == "win32":
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            else:
                proc.terminate()
                try:
                    proc.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    proc.kill()
        except Exception:
            pass

    def pipe_stream(self, stream, prefix, color):
        """Read and format logs from stdout/stderr of child process."""
        try:
            for line in iter(stream.readline, ""):
                if not line:
                    break
                stripped = line.rstrip()
                if stripped:
                    print(f"{color}{BOLD}[{prefix}]{RESET} {stripped}")
        except Exception:
            pass

    def start_backend(self):
        with self.lock:
            if self.backend_proc:
                self.kill_proc(self.backend_proc)
                self.backend_proc = None
            self.kill_port_owner(self.backend_port)

            py_exe = self.find_backend_python()
            cmd = [
                py_exe,
                "-m",
                "uvicorn",
                "app.main:app",
                "--host", "127.0.0.1",
                "--port", str(self.backend_port),
                "--reload",
                "--log-level", "info",
            ]
            print(f"\n{CYAN}{BOLD}▶ Starting Backend (FastAPI) on http://127.0.0.1:{self.backend_port}{RESET}")
            try:
                self.backend_proc = subprocess.Popen(
                    cmd,
                    cwd=BACKEND_DIR,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    encoding="utf-8",
                    errors="replace",
                )
                t = threading.Thread(
                    target=self.pipe_stream,
                    args=(self.backend_proc.stdout, "BACKEND", CYAN),
                    daemon=True,
                )
                t.start()
            except Exception as e:
                print(f"{RED}[ERROR] Failed to start backend: {e}{RESET}")

    def start_frontend(self):
        with self.lock:
            if self.frontend_proc:
                self.kill_proc(self.frontend_proc)
                self.frontend_proc = None
            self.kill_port_owner(self.frontend_port)

            npm_exe = self.find_npm()
            cmd = [npm_exe, "run", "dev"]
            print(f"{MAGENTA}{BOLD}▶ Starting Frontend (Next.js) on http://localhost:{self.frontend_port}{RESET}")
            try:
                self.frontend_proc = subprocess.Popen(
                    cmd,
                    cwd=FRONTEND_DIR,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    bufsize=1,
                    encoding="utf-8",
                    errors="replace",
                    shell=(sys.platform == "win32"),
                )
                t = threading.Thread(
                    target=self.pipe_stream,
                    args=(self.frontend_proc.stdout, "FRONTEND", MAGENTA),
                    daemon=True,
                )
                t.start()
            except Exception as e:
                print(f"{RED}[ERROR] Failed to start frontend: {e}{RESET}")

    def restart_both(self):
        print(f"\n{YELLOW}{BOLD}====================================================={RESET}")
        print(f"{YELLOW}{BOLD}  🔄 RESTARTING BOTH SERVERS (Backend + Frontend)   {RESET}")
        print(f"{YELLOW}{BOLD}====================================================={RESET}\n")
        self.start_backend()
        time.sleep(0.5)
        self.start_frontend()

    def restart_backend_only(self):
        print(f"\n{CYAN}{BOLD}🔄 Restarting Backend server...{RESET}\n")
        self.start_backend()

    def restart_frontend_only(self):
        print(f"\n{MAGENTA}{BOLD}🔄 Restarting Frontend server...{RESET}\n")
        self.start_frontend()

    def print_banner(self):
        print()
        print(f"{BLUE}{BOLD}╔══════════════════════════════════════════════════════════════╗{RESET}")
        print(f"{BLUE}{BOLD}║         NOSTALGIC MOMENTS — MASTER DEV RUNNER                ║{RESET}")
        print(f"{BLUE}{BOLD}╠══════════════════════════════════════════════════════════════╣{RESET}")
        print(f"{BLUE}{BOLD}║{RESET}  🌐 Frontend : {GREEN}http://localhost:3000{RESET}                        {BLUE}{BOLD}║{RESET}")
        print(f"{BLUE}{BOLD}║{RESET}  🚀 Backend  : {CYAN}http://127.0.0.1:8000{RESET}                        {BLUE}{BOLD}║{RESET}")
        print(f"{BLUE}{BOLD}║{RESET}  📖 API Docs : {CYAN}http://127.0.0.1:8000/api/docs{RESET}               {BLUE}{BOLD}║{RESET}")
        print(f"{BLUE}{BOLD}╠══════════════════════════════════════════════════════════════╣{RESET}")
        print(f"{BLUE}{BOLD}║{RESET}  {YELLOW}{BOLD}[r]{RESET} Refresh / Restart BOTH Servers                           {BLUE}{BOLD}║{RESET}")
        print(f"{BLUE}{BOLD}║{RESET}  {CYAN}{BOLD}[b]{RESET} Restart Backend only     {MAGENTA}{BOLD}[f]{RESET} Restart Frontend only      {BLUE}{BOLD}║{RESET}")
        print(f"{BLUE}{BOLD}║{RESET}  {GREEN}{BOLD}[o]{RESET} Open in Browser          {BLUE}{BOLD}[c]{RESET} Clear Screen               {BLUE}{BOLD}║{RESET}")
        print(f"{BLUE}{BOLD}║{RESET}  {RED}{BOLD}[q]{RESET} Quit and Stop all                                       {BLUE}{BOLD}║{RESET}")
        print(f"{BLUE}{BOLD}╚══════════════════════════════════════════════════════════════╝{RESET}")
        print()

    def shutdown(self):
        print(f"\n{RED}{BOLD}⏹ Stopping all servers...{RESET}")
        self.running = False
        with self.lock:
            if self.backend_proc:
                self.kill_proc(self.backend_proc)
                self.backend_proc = None
            if self.frontend_proc:
                self.kill_proc(self.frontend_proc)
                self.frontend_proc = None
        self.kill_port_owner(self.backend_port)
        self.kill_port_owner(self.frontend_port)
        print(f"{GREEN}✓ Servers cleanly stopped. Goodbye!{RESET}\n")

    def run(self):
        self.print_banner()
        self.start_backend()
        time.sleep(0.6)
        self.start_frontend()

        # Keyboard listener loop
        if sys.platform == "win32":
            import msvcrt
            while self.running:
                try:
                    if msvcrt.kbhit():
                        ch = msvcrt.getwch()
                        if ch in ('\x00', '\xe0'):  # Extended keys (arrows, etc.)
                            msvcrt.getwch()
                            continue
                        key = ch.lower()
                        self.handle_key(key)
                    time.sleep(0.08)
                except KeyboardInterrupt:
                    break
        else:
            # Unix-like stdin reading
            while self.running:
                try:
                    line = sys.stdin.readline()
                    if not line:
                        break
                    key = line.strip().lower()
                    if key:
                        self.handle_key(key[0])
                except KeyboardInterrupt:
                    break

        self.shutdown()

    def handle_key(self, key):
        if key == 'r':
            self.restart_both()
        elif key == 'b':
            self.restart_backend_only()
        elif key == 'f':
            self.restart_frontend_only()
        elif key == 'o':
            print(f"\n{GREEN}🌐 Opening http://localhost:3000 in browser...{RESET}\n")
            webbrowser.open("http://localhost:3000")
        elif key == 'c':
            os.system("cls" if sys.platform == "win32" else "clear")
            self.print_banner()
        elif key in ('h', '?'):
            self.print_banner()
        elif key == 'q':
            self.shutdown()
            sys.exit(0)

if __name__ == "__main__":
    manager = DualServerManager()
    try:
        manager.run()
    except KeyboardInterrupt:
        manager.shutdown()
