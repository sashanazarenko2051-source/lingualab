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


class AppRequestHandler(http.server.SimpleHTTPRequestHandler):
    # Some Windows registries map .js to text/plain; pin the right types.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.css': 'text/css',
    }

    def end_headers(self):
        # Always revalidate, so an updated JS/CSS file shows up on next launch
        # instead of WebView2 serving a stale cached copy.
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, format, *args):
        # Launched via pythonw.exe there is no stderr to log to, and writing
        # to it would break request handling.
        pass


class AppServer(http.server.ThreadingHTTPServer):
    # The page requests ~45 scripts at once. socketserver's default listen
    # backlog of 5 made Windows refuse the overflow, so random files (a
    # language, or lesson.js itself) failed to load and pages came up empty.
    request_queue_size = 128
    daemon_threads = True


def start_server():
    """Serves the app for the desktop window and, on the same port, for a
    phone's browser on the same Wi-Fi (e.g. http://192.168.x.x:8765).

    The window loads from this server instead of pywebview's built-in one,
    which randomly dropped some of the ~45 script requests on startup (so
    e.g. no.js/da.js went missing and the home page failed to render). A
    fixed port also keeps a stable origin, so localStorage progress survives
    restarts. Falls back to a random local-only port if 8765 is taken."""
    handler = functools.partial(AppRequestHandler, directory=BASE_DIR)
    for host, port in (('0.0.0.0', LAN_PORT), ('127.0.0.1', 0)):
        try:
            server = AppServer((host, port), handler)
            break
        except OSError:
            continue
    else:
        return None
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def main():
    server = start_server()
    if server:
        port = server.server_address[1]
        url = f'http://127.0.0.1:{port}/index.html'
        if port == LAN_PORT:
            print(f'Phone access (same Wi-Fi): http://{local_ip()}:{LAN_PORT}')
    else:
        url = INDEX_PATH

    webview.create_window(
        'WO Lingua Lab',
        url,
        width=1200,
        height=800,
        min_size=(960, 640),
    )
    # private_mode=False keeps localStorage (profile, progress, streak)
    # between launches instead of wiping it every time the window closes.
    webview.start(icon=ICON_PATH, private_mode=False)


if __name__ == '__main__':
    main()
