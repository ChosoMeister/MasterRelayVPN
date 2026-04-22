"""
Custom log handler that buffers log records for the GUI frontend.
Thread-safe ring buffer — the GUI polls this to display real-time logs.
"""

import logging
import threading
from collections import deque
from datetime import datetime


class GUILogHandler(logging.Handler):
    """Collects log records into a ring-buffer for GUI consumption."""

    def __init__(self, maxlen: int = 5000):
        super().__init__()
        self._buffer: deque[dict] = deque(maxlen=maxlen)
        self._lock = threading.Lock()
        self._cursor = 0

    def emit(self, record: logging.LogRecord):
        entry = {
            "time": datetime.fromtimestamp(record.created).strftime("%H:%M:%S"),
            "level": record.levelname,
            "message": self.format(record),
        }
        with self._lock:
            self._buffer.append(entry)
            self._cursor += 1

    def get_new_entries(self, since_cursor: int = 0) -> tuple[list[dict], int]:
        """Return entries added after *since_cursor* and the new cursor value."""
        with self._lock:
            total = self._cursor
            buf_len = len(self._buffer)
            start_in_buf = max(0, buf_len - (total - since_cursor))
            entries = list(self._buffer)[start_in_buf:]
            return entries, total

    def clear(self):
        with self._lock:
            self._buffer.clear()


# Singleton instance
_handler: GUILogHandler | None = None


def get_gui_handler() -> GUILogHandler:
    global _handler
    if _handler is None:
        _handler = GUILogHandler()
        _handler.setFormatter(logging.Formatter("%(name)s - %(message)s"))
    return _handler


def install_gui_handler():
    """Attach the GUI handler to the root logger."""
    handler = get_gui_handler()
    root = logging.getLogger()
    if handler not in root.handlers:
        root.addHandler(handler)
    return handler
