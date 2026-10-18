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
import re
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Built into one .exe by PyInstaller (build-exe.ps1), the app files are
# unpacked to a temp folder named by sys._MEIPASS.
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
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


ASSET_RE = re.compile(r'((?:src|href)="(?:js|css)/[^"?]+\.(?:js|css))"')


def asset_version():
    """Newest modification time of the app's files, used to version every
    script/style URL in index.html."""
    newest = os.path.getmtime(INDEX_PATH)
    for folder in ('js', 'css'):
        for root, _, files in os.walk(os.path.join(BASE_DIR, folder)):
            for name in files:
                newest = max(newest, os.path.getmtime(os.path.join(root, name)))
    return str(int(newest))


class AppRequestHandler(http.server.SimpleHTTPRequestHandler):
    # Some Windows registries map .js to text/plain; pin the right types.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.webmanifest': 'application/manifest+json',
    }

    def do_GET(self):
        # index.html goes out with "?v=<version>" on every script and style,
        # so after an update WebView2 can't reuse stale cached copies — it
        # did, even with no-cache, mixing an old index.html/app.js with new
        # views and leaving the home page empty.
        if self.path.split('?')[0] in ('/', '/index.html'):
            with open(INDEX_PATH, encoding='utf-8') as f:
                html = f.read()
            body = ASSET_RE.sub(lambda m: m.group(1) + '?v=' + asset_version() + '"', html).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
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
    # On Windows SO_REUSEADDR lets a second server bind the same port and
    # silently split requests with the first; take the port exclusively.
    allow_reuse_address = False

    def server_bind(self):
        if hasattr(socket, 'SO_EXCLUSIVEADDRUSE'):
            self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
        super().server_bind()


def start_server(wait=0.0):
    """Serves the app for the desktop window and, on the same port, for a
    phone's browser on the same Wi-Fi (e.g. http://192.168.x.x:8765).

    The window loads from this server instead of pywebview's built-in one,
    which randomly dropped some of the ~45 script requests on startup. A
    fixed port also keeps a stable origin, so localStorage progress survives
    restarts. Keeps retrying for `wait` seconds (a just-closed window's
    process may still hold the port); returns None if it stays taken."""
    handler = functools.partial(AppRequestHandler, directory=BASE_DIR)
    deadline = time.monotonic() + wait
    while True:
        try:
            server = AppServer(('0.0.0.0', LAN_PORT), handler)
            break
        except OSError:
            if time.monotonic() >= deadline:
                return None
            time.sleep(0.25)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def take_over_port(window, url):
    """Used when another instance owned the port at startup: once it exits,
    start our own server so this window doesn't end up with nothing behind
    it ("connection refused"), and reload if the page never loaded."""
    while not start_server():
        time.sleep(0.5)
    try:
        if window.evaluate_js('typeof App') != 'object':
            window.load_url(url)
    except Exception:
        pass


# Windows toast shown through PowerShell's registered app id (an
# unregistered id makes Windows drop the toast silently). Title and text go
# in through environment variables, never into the script source.
TOAST_PS = r"""
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
$xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$t = $xml.GetElementsByTagName('text')
$t.Item(0).AppendChild($xml.CreateTextNode($env:LL_TITLE)) > $null
$t.Item(1).AppendChild($xml.CreateTextNode($env:LL_BODY)) > $null
$id = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($id).Show([Windows.UI.Notifications.ToastNotification]::new($xml))
"""


class Api:
    """Functions the page can call as window.pywebview.api.*"""

    def notify(self, title, body):
        if sys.platform != 'win32':
            return False
        import subprocess
        env = dict(os.environ, LL_TITLE=str(title)[:120], LL_BODY=str(body)[:240])
        try:
            subprocess.Popen(
                ['powershell', '-NoProfile', '-NonInteractive', '-Command', TOAST_PS],
                env=env, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            return True
        except Exception:
            return False


def main():
    server = start_server(wait=4)
    if server:
        print(f'Phone access (same Wi-Fi): http://{local_ip()}:{LAN_PORT}')
    # The ?v= makes the page URL itself new after every update — WebView2
    # kept serving a stale cached /index.html without even asking the server.
    url = f'http://127.0.0.1:{LAN_PORT}/index.html?v={asset_version()}'

    window = webview.create_window(
        'WO Lingua Lab',
        url,
        width=1200,
        height=800,
        min_size=(960, 640),
        js_api=Api(),
    )
    # A second window reuses the running instance's server (same origin, so
    # the same saved progress) and takes the port over when that one exits.
    func, args = (None, ()) if server else (take_over_port, (window, url))
    # private_mode=False keeps localStorage (profile, progress, streak)
    # between launches instead of wiping it every time the window closes.
    webview.start(func, args, icon=ICON_PATH, private_mode=False)


if __name__ == '__main__':
    main()
