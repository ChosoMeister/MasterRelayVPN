#!/usr/bin/env python3
"""
Build script for MasterVPN — creates a standalone executable using PyInstaller.

Usage:
    python build_app.py                  # Build for current platform
    python build_app.py --onefile        # Single executable file
    python build_app.py --clean          # Clean previous builds first
    python build_app.py --debug          # Include debug console
"""

import argparse
import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"
BUILD = ROOT / "build"
GUI_DIR = ROOT / "gui"
SRC_DIR = ROOT / "src"
APP_NAME = "MasterVPN"


def clean():
    """Remove previous build artifacts."""
    for d in (DIST, BUILD):
        if d.exists():
            shutil.rmtree(d)
            print(f"  Removed {d}")

    spec = ROOT / f"{APP_NAME}.spec"
    if spec.exists():
        spec.unlink()
        print(f"  Removed {spec}")


def build(onefile: bool = False, debug: bool = False):
    """Run PyInstaller to create the executable."""
    system = platform.system()
    print(f"\n  Building {APP_NAME} for {system}...")

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", APP_NAME,
        "--noconfirm",
        "--clean",
    ]

    if onefile:
        cmd.append("--onefile")
    else:
        cmd.append("--onedir")

    if not debug:
        cmd.append("--windowed")  # No console window

    # Add data files
    sep = ";" if system == "Windows" else ":"
    cmd.extend(["--add-data", f"{GUI_DIR}{sep}gui"])
    cmd.extend(["--add-data", f"{SRC_DIR}{sep}src"])

    # Add config example
    example_cfg = ROOT / "config.example.json"
    if example_cfg.exists():
        cmd.extend(["--add-data", f"{example_cfg}{sep}."])

    # Add CA directory if it exists
    ca_dir = ROOT / "ca"
    if ca_dir.exists():
        cmd.extend(["--add-data", f"{ca_dir}{sep}ca"])

    # Hidden imports that PyInstaller might miss
    hidden = [
        "cryptography",
        "cryptography.x509",
        "cryptography.hazmat.primitives",
        "cryptography.hazmat.primitives.asymmetric",
        "cryptography.hazmat.primitives.asymmetric.rsa",
        "cryptography.hazmat.primitives.hashes",
        "cryptography.hazmat.primitives.serialization",
        "cryptography.hazmat.backends",
        "h2",
        "h2.connection",
        "h2.config",
        "h2.events",
        "hpack",
        "hyperframe",
        "brotli",
        "zstandard",
        "webview",
    ]
    for h in hidden:
        cmd.extend(["--hidden-import", h])

    # Platform-specific icon
    if system == "Darwin":
        icon = ROOT / "assets" / "icon.icns"
        if icon.exists():
            cmd.extend(["--icon", str(icon)])
    elif system == "Windows":
        icon = ROOT / "assets" / "icon.ico"
        if icon.exists():
            cmd.extend(["--icon", str(icon)])

    # Entry point
    cmd.append(str(ROOT / "gui_app.py"))

    print(f"  Command: {' '.join(str(c) for c in cmd)}\n")
    result = subprocess.run(cmd, cwd=str(ROOT))

    if result.returncode == 0:
        if onefile:
            output = DIST / APP_NAME
            if system == "Windows":
                output = output.with_suffix(".exe")
            print(f"\n  [OK] Build successful: {output}")
        else:
            output = DIST / APP_NAME
            if system == "Darwin":
                app_bundle = DIST / f"{APP_NAME}.app"
                if app_bundle.exists():
                    output = app_bundle
            print(f"\n  [OK] Build successful: {output}/")

        size_mb = _dir_size(output) / (1024 * 1024) if output.exists() else 0
        print(f"  Size: {size_mb:.1f} MB")
    else:
        print(f"\n  [FAIL] Build failed (exit code {result.returncode})")
        sys.exit(1)


def _dir_size(path: Path) -> int:
    if path.is_file():
        return path.stat().st_size
    total = 0
    for f in path.rglob("*"):
        if f.is_file():
            total += f.stat().st_size
    return total


def main():
    parser = argparse.ArgumentParser(description=f"Build {APP_NAME} executable")
    parser.add_argument("--onefile", action="store_true", help="Create single-file executable")
    parser.add_argument("--clean", action="store_true", help="Clean previous builds first")
    parser.add_argument("--debug", action="store_true", help="Include debug console window")
    args = parser.parse_args()

    print(f"\n  === {APP_NAME} Build Tool ===")
    print(f"  Platform: {platform.system()} {platform.machine()}")
    print(f"  Python: {sys.version.split()[0]}")

    if args.clean:
        print("\n  Cleaning...")
        clean()

    build(onefile=args.onefile, debug=args.debug)


if __name__ == "__main__":
    main()
