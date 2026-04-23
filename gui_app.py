#!/usr/bin/env python3
"""
MasterVPN — GUI Application

Standalone desktop GUI for MasterHttpRelayVPN using pywebview.
Provides a browser-based frontend that talks to the Python proxy engine
through a JS ↔ Python bridge API. No external server or framework needed.

Usage:
    python gui_app.py            # Launch GUI
    python gui_app.py --debug    # Launch with DevTools enabled
"""

import asyncio
import json
import logging
import os
import sys
import threading
import time
from pathlib import Path

# ── Path resolution (dev vs PyInstaller frozen) ────────────────
if getattr(sys, "frozen", False):
    # Running as PyInstaller bundle
    _BUNDLE = Path(sys._MEIPASS)
    _ROOT = Path(sys.executable).resolve().parent  # writable directory
    if sys.platform == "darwin" and "Contents/MacOS" in str(_ROOT):
        _ROOT = _ROOT.parent.parent.parent
else:
    _BUNDLE = Path(__file__).resolve().parent
    _ROOT = _BUNDLE

_SRC = _BUNDLE / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

import webview  # pywebview

from cert_installer import install_ca, is_ca_trusted
from constants import DATA_DIR, __version__
from gui_logger import get_gui_handler, install_gui_handler
from logging_utils import configure as configure_logging, print_banner
from mitm import CA_CERT_FILE
from proxy_server import ProxyServer

log = logging.getLogger("GUI")

# Config path inside the writable DATA_DIR
CONFIG_PATH = Path(DATA_DIR) / "config.json"
CONFIG_EXAMPLE_PATH = _BUNDLE / "config.example.json"
GUI_DIR = _BUNDLE / "gui"


class ProxyBridge:
    """
    pywebview JS Bridge — each public method is callable from JavaScript
    via ``window.pywebview.api.<method>(...)``.
    """

    def __init__(self):
        self._config: dict = {}
        self._server: ProxyServer | None = None
        self._loop: asyncio.AbstractEventLoop | None = None
        self._thread: threading.Thread | None = None
        self._running = False
        self._log_cursor = 0
        self._start_time: float | None = None

        # Traffic counters (updated by hooks in proxy_server)
        self.bytes_sent = 0
        self.bytes_received = 0
        self.request_count = 0

    # ── Config ─────────────────────────────────────────────────

    def get_config(self) -> dict:
        """Load and return the current config.json."""
        cfg = self._load_config()
        self._config = cfg
        return cfg

    def save_config(self, config: dict) -> dict:
        """Save config dict to config.json."""
        try:
            # Preserve fields not exposed in GUI
            existing = self._load_config()
            for key in ("direct_google_exclude", "direct_google_allow", "hosts"):
                if key in existing and key not in config:
                    config[key] = existing[key]

            config.setdefault("mode", "apps_script")

            with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                json.dump(config, f, indent="\t", ensure_ascii=False)

            self._config = config
            return {"success": True}
        except Exception as e:
            log.error("Failed to save config: %s", e)
            return {"success": False, "error": str(e)}

    def _load_config(self) -> dict:
        try:
            with open(CONFIG_PATH, encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            # Copy example config as starting point
            if CONFIG_EXAMPLE_PATH.exists():
                import shutil
                shutil.copy2(CONFIG_EXAMPLE_PATH, CONFIG_PATH)
                with open(CONFIG_PATH, encoding="utf-8") as f:
                    return json.load(f)
            return {}
        except json.JSONDecodeError as e:
            log.error("Invalid JSON in config: %s", e)
            return {}

    # ── Setup Helpers ──────────────────────────────────────────

    def get_code_gs(self, auth_key: str = "") -> str:
        """Read Code.gs template and replace AUTH_KEY with user's key."""
        code_gs_path = _BUNDLE / "apps_script" / "Code.gs"
        if not code_gs_path.exists():
            log.error("Code.gs not found at %s", code_gs_path)
            return ""

        code = code_gs_path.read_text(encoding="utf-8")

        if auth_key:
            code = code.replace(
                'const AUTH_KEY = "CHANGE_ME_TO_A_STRONG_SECRET";',
                f'const AUTH_KEY = "{auth_key}";',
            )
        return code

    def open_url(self, url: str) -> None:
        """Open a URL in the system's default browser."""
        import webbrowser
        webbrowser.open(url)

    # ── Proxy Control ──────────────────────────────────────────

    def start_proxy(self) -> dict:
        """Start the proxy engine in a background thread."""
        if self._running:
            return {"success": True, "message": "Already running"}

        config = self._load_config()
        self._config = config

        # Validate minimum config
        auth_key = config.get("auth_key", "")
        if not auth_key or auth_key in ("", "CHANGE_ME_TO_A_STRONG_SECRET", "your-secret-password-here"):
            return {"success": False, "error": "Set a valid Auth Key in Settings first."}

        sid = config.get("script_ids") or config.get("script_id")
        if not sid:
            return {"success": False, "error": "Add at least one Script ID in Settings first."}
        if isinstance(sid, list) and (not sid or all(s in ("", "YOUR_APPS_SCRIPT_DEPLOYMENT_ID") for s in sid)):
            return {"success": False, "error": "Add at least one valid Script ID in Settings first."}
        if isinstance(sid, str) and sid in ("YOUR_APPS_SCRIPT_DEPLOYMENT_ID", ""):
            return {"success": False, "error": "Set a valid Script ID in Settings first."}

        config["mode"] = "apps_script"

        # Reset counters
        self.bytes_sent = 0
        self.bytes_received = 0
        self.request_count = 0
        self._start_time = time.time()

        try:
            self._loop = asyncio.new_event_loop()
            self._server = ProxyServer(config)

            # Inject traffic tracking hooks
            self._inject_stats_hooks(self._server)

            self._thread = threading.Thread(
                target=self._run_loop,
                name="ProxyThread",
                daemon=True,
            )
            self._thread.start()
            self._running = True

            host = config.get("listen_host", "127.0.0.1")
            port = config.get("listen_port", 8085)
            log.info("Proxy started on %s:%d", host, port)
            return {"success": True}
        except Exception as e:
            log.error("Failed to start proxy: %s", e)
            self._running = False
            return {"success": False, "error": str(e)}

    def stop_proxy(self) -> dict:
        """Stop the proxy engine."""
        if not self._running:
            return {"success": True, "message": "Not running"}

        try:
            if self._loop and self._server:
                asyncio.run_coroutine_threadsafe(
                    self._server.stop(), self._loop
                ).result(timeout=5)
        except Exception as e:
            log.warning("Error stopping proxy: %s", e)

        if self._loop:
            self._loop.call_soon_threadsafe(self._loop.stop)

        if self._thread:
            self._thread.join(timeout=5)

        self._running = False
        self._server = None
        self._loop = None
        self._thread = None
        self._start_time = None

        log.info("Proxy stopped")
        return {"success": True}

    def get_status(self) -> dict:
        """Return proxy running state."""
        return {"running": self._running}

    def get_stats(self) -> dict:
        """Return traffic statistics."""
        return {
            "bytes_sent": self.bytes_sent,
            "bytes_received": self.bytes_received,
            "requests": self.request_count,
        }

    def _run_loop(self):
        """Run the asyncio event loop in a background thread."""
        asyncio.set_event_loop(self._loop)
        try:
            self._loop.run_until_complete(self._server.start())
        except Exception as e:
            log.error("Proxy loop error: %s", e)
        finally:
            self._running = False

    def _inject_stats_hooks(self, server: ProxyServer):
        """Monkey-patch the proxy server to track traffic statistics."""
        bridge = self
        original_relay = server.fronter.relay

        async def tracked_relay(method, url, headers, body, **kwargs):
            bridge.request_count += 1
            if body:
                bridge.bytes_sent += len(body)

            response = await original_relay(method, url, headers, body, **kwargs)
            if response:
                bridge.bytes_received += len(response)
            return response

        server.fronter.relay = tracked_relay

    # ── Logs ───────────────────────────────────────────────────

    def get_logs(self) -> list[dict]:
        """Return new log entries since last poll."""
        handler = get_gui_handler()
        entries, self._log_cursor = handler.get_new_entries(self._log_cursor)
        return entries

    # ── Certificate ────────────────────────────────────────────

    def check_cert(self) -> dict:
        """Check if MITM CA certificate exists and is trusted."""
        try:
            if not os.path.exists(CA_CERT_FILE):
                return {"exists": False, "trusted": False, "error": "Certificate not generated yet. Click 'Regenerate' to create one."}

            trusted = is_ca_trusted(CA_CERT_FILE)
            info = self._read_cert_info()
            return {"exists": True, "trusted": trusted, **info}
        except Exception as e:
            return {"exists": False, "trusted": False, "error": str(e)}

    def get_cert_info(self) -> dict:
        """Return certificate details (CN, expiry, fingerprint)."""
        try:
            if not os.path.exists(CA_CERT_FILE):
                return {"exists": False}
            info = self._read_cert_info()
            return {"exists": True, **info}
        except Exception as e:
            return {"exists": False, "error": str(e)}

    def _read_cert_info(self) -> dict:
        """Internal: parse the CA cert and extract display info."""
        from cryptography import x509
        from cryptography.hazmat.primitives import hashes
        with open(CA_CERT_FILE, "rb") as f:
            cert = x509.load_pem_x509_certificate(f.read())
        cn = cert.subject.get_attributes_for_oid(x509.oid.NameOID.COMMON_NAME)
        cn_value = cn[0].value if cn else "Unknown"
        fp = cert.fingerprint(hashes.SHA256()).hex(":")
        return {
            "cn": cn_value,
            "expiry": cert.not_valid_after_utc.strftime("%Y-%m-%d"),
            "fingerprint": fp[:23] + "...",  # show first 8 octets
        }

    def download_cert(self) -> dict:
        """Trigger native save-file dialog to export the CA certificate."""
        try:
            if not os.path.exists(CA_CERT_FILE):
                from mitm import MITMCertManager
                MITMCertManager()

            window = webview.windows[0] if webview.windows else None
            if not window:
                return {"success": False, "error": "No GUI window available"}

            dest = window.create_file_dialog(
                webview.SAVE_DIALOG,
                save_filename="MasterVPN-CA.crt",
                file_types=("Certificate Files (*.crt;*.pem)", "All Files (*.*)"),
            )
            if dest:
                import shutil
                shutil.copy2(CA_CERT_FILE, dest)
                return {"success": True, "path": str(dest)}
            return {"success": False, "error": "Cancelled"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def regenerate_cert(self) -> dict:
        """Delete existing CA cert/key and generate a fresh pair."""
        try:
            from mitm import CA_KEY_FILE as _key, CA_DIR as _dir
            # Remove old files
            for f in (CA_CERT_FILE, _key):
                if os.path.exists(f):
                    os.remove(f)
            # Generate new
            from mitm import MITMCertManager
            MITMCertManager()
            info = self._read_cert_info()
            return {"success": True, **info}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def install_cert(self) -> dict:
        """Install the MITM CA certificate into the system trust store."""
        try:
            if not os.path.exists(CA_CERT_FILE):
                from mitm import MITMCertManager
                MITMCertManager()

            ok = install_ca(CA_CERT_FILE)
            return {"success": ok, "error": None if ok else "Installation failed. Try running as admin."}
        except Exception as e:
            return {"success": False, "error": str(e)}


    def test_connection(self) -> dict:
        """Test the relay connection."""
        try:
            config = self._load_config()
            # Quick validation
            sid = config.get("script_ids") or config.get("script_id")
            if not sid:
                return {"success": False, "error": "No Script ID configured"}
            return {"success": True, "message": "Config looks valid"}
        except Exception as e:
            return {"success": False, "error": str(e)}


def main():
    import argparse
    parser = argparse.ArgumentParser(description="MasterVPN GUI")
    parser.add_argument("--debug", action="store_true", help="Enable DevTools")
    args = parser.parse_args()

    # Configure logging
    configure_logging("INFO")
    install_gui_handler()
    # Skip print_banner in GUI mode to avoid UnicodeEncodeError on Windows --noconsole

    log.info("Starting MasterVPN GUI v%s", __version__)

    api = ProxyBridge()

    # Create window
    window = webview.create_window(
        title=f"MasterVPN v{__version__}",
        url=str(GUI_DIR / "index.html"),
        js_api=api,
        width=920,
        height=660,
        min_size=(760, 520),
        background_color="#0a0e17",
        text_select=False,
    )

    def on_closing():
        """Cleanup on window close."""
        if api._running:
            log.info("Stopping proxy before exit...")
            api.stop_proxy()

    window.events.closing += on_closing

    # Start pywebview
    webview.start(
        debug=args.debug,
        http_server=True,  # needed for loading local HTML/CSS/JS
    )


if __name__ == "__main__":
    main()
