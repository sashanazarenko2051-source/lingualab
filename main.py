import sys
import os

if sys.platform == 'win32':
    import ctypes
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)  # PROCESS_PER_MONITOR_DPI_AWARE
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()
        except Exception:
            pass

import webview
import socket
import threading
import http.server
import functools

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(BASE_DIR, 'index.html')
ICON_PATH = os.path.join(BASE_DIR, 'icon.ico')
LAN_PORT = 8765


def local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        return s.getsockname()[0]
    except Exception:
        return '127.0.0.1'
    finally:
        s.close()


def start_lan_server():
    """Serves the same app over the local network so it can be opened from a
    phone's browser on the same Wi-Fi (e.g. http://192.168.x.x:8765)."""
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=BASE_DIR)
    try:
        server = http.server.ThreadingHTTPServer(('0.0.0.0', LAN_PORT), handler)
    except OSError:
        return None
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def main():
    start_lan_server()
    ip = local_ip()
    print(f'Phone access (same Wi-Fi): http://{ip}:{LAN_PORT}')

    webview.create_window(
        'Lingua Lab',
        INDEX_PATH,
        width=1200,
        height=800,
        min_size=(960, 640),
    )
    webview.start(icon=ICON_PATH)


if __name__ == '__main__':
    main()
