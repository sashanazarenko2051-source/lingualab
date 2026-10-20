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
import asyncio
import urllib.parse
from collections import OrderedDict

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


# Online neural voices (Microsoft Edge read-aloud voices, via edge-tts): a
# male and a female voice for every course language. Windows itself has
# only some languages offline, often one voice (Czech: only male Jakub).
ONLINE_VOICES = {
    'en': ('en-GB-RyanNeural', 'en-GB-SoniaNeural'), 'de': ('de-DE-ConradNeural', 'de-DE-KatjaNeural'),
    'nl': ('nl-NL-MaartenNeural', 'nl-NL-ColetteNeural'), 'sv': ('sv-SE-MattiasNeural', 'sv-SE-SofieNeural'),
    'no': ('nb-NO-FinnNeural', 'nb-NO-PernilleNeural'), 'da': ('da-DK-JeppeNeural', 'da-DK-ChristelNeural'),
    'fr': ('fr-FR-HenriNeural', 'fr-FR-DeniseNeural'), 'es': ('es-ES-AlvaroNeural', 'es-ES-ElviraNeural'),
    'it': ('it-IT-DiegoNeural', 'it-IT-ElsaNeural'), 'pt': ('pt-PT-DuarteNeural', 'pt-PT-RaquelNeural'),
    'ro': ('ro-RO-EmilNeural', 'ro-RO-AlinaNeural'), 'pl': ('pl-PL-MarekNeural', 'pl-PL-ZofiaNeural'),
    'cs': ('cs-CZ-AntoninNeural', 'cs-CZ-VlastaNeural'), 'sk': ('sk-SK-LukasNeural', 'sk-SK-ViktoriaNeural'),
    'uk': ('uk-UA-OstapNeural', 'uk-UA-PolinaNeural'), 'ru': ('ru-RU-DmitryNeural', 'ru-RU-SvetlanaNeural'),
    'bg': ('bg-BG-BorislavNeural', 'bg-BG-KalinaNeural'), 'hr': ('hr-HR-SreckoNeural', 'hr-HR-GabrijelaNeural'),
    'sr': ('sr-RS-NicholasNeural', 'sr-RS-SophieNeural'), 'el': ('el-GR-NestorasNeural', 'el-GR-AthinaNeural'),
    'fi': ('fi-FI-HarriNeural', 'fi-FI-NooraNeural'), 'hu': ('hu-HU-TamasNeural', 'hu-HU-NoemiNeural'),
}
# Some listed voices don't answer at times (cs Antonín, sk Lukáš); then a
# multilingual voice of the same gender reads the text instead.
MULTILINGUAL = {'male': 'en-US-AndrewMultilingualNeural', 'female': 'en-US-AvaMultilingualNeural'}
_tts_broken = {}
_tts_cache = OrderedDict()
_tts_lock = threading.Lock()


def online_tts(lang, gender, text, rate):
    """MP3 bytes for the text, or None (no internet, no edge-tts)."""
    voices = ONLINE_VOICES.get(lang)
    if not voices or not text:
        return None
    gender = 'female' if gender == 'female' else 'male'
    voice = voices[1] if gender == 'female' else voices[0]
    key = (voice, rate, text)
    with _tts_lock:
        if key in _tts_cache:
            _tts_cache.move_to_end(key)
            return _tts_cache[key]
    try:
        import edge_tts
    except ImportError:
        return None

    async def run(v):
        out = bytearray()
        async for chunk in edge_tts.Communicate(text, v, rate=rate).stream():
            if chunk.get('type') == 'audio':
                out += chunk['data']
        return bytes(out)
    data = None
    for v in (voice, MULTILINGUAL[gender]):
        if time.time() < _tts_broken.get(v, 0):
            continue
        try:
            data = asyncio.run(asyncio.wait_for(run(v), 15))
        except Exception as e:
            # A voice that sends no audio is skipped for 10 minutes; a
            # network error just fails this request.
            if type(e).__name__ == 'NoAudioReceived':
                _tts_broken[v] = time.time() + 600
                continue
            return None
        if data:
            break
    if not data:
        return None
    with _tts_lock:
        _tts_cache[key] = data
        while len(_tts_cache) > 600:
            _tts_cache.popitem(last=False)
    return data


class AppRequestHandler(http.server.SimpleHTTPRequestHandler):
    # Some Windows registries map .js to text/plain; pin the right types.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.webmanifest': 'application/manifest+json',
    }

    def do_GET(self):
        if self.path.startswith('/tts?'):
            q = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
            rate = q.get('r', ['+0%'])[0]
            if not re.fullmatch(r'[+-]\d{1,2}%', rate):
                rate = '+0%'
            data = online_tts(q.get('l', [''])[0], q.get('g', ['male'])[0], q.get('t', [''])[0][:400], rate)
            if not data:
                self.send_response(503)
                self.send_header('Content-Length', '0')
                self.end_headers()
                return
            self.send_response(200)
            self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
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


def window_size(width=1200, height=800):
    """The window size, shrunk to fit above the taskbar on small or scaled
    screens (pywebview centers the window on the whole screen, taskbar
    included, so the bottom edge could end up under the taskbar)."""
    if sys.platform != 'win32':
        return width, height
    try:
        import ctypes
        from ctypes import wintypes
        user32 = ctypes.windll.user32
        area = wintypes.RECT()
        user32.SystemParametersInfoW(0x30, 0, ctypes.byref(area), 0)  # SPI_GETWORKAREA
        screen_h = user32.GetSystemMetrics(1)
        # Work in logical pixels: when the process is DPI-aware the numbers
        # above are physical, so divide by the display scale.
        scale = ctypes.windll.shcore.GetScaleFactorForDevice(0) / 100
        hdc = user32.GetDC(0)
        physical_w = ctypes.windll.gdi32.GetDeviceCaps(hdc, 118)  # DESKTOPHORZRES
        user32.ReleaseDC(0, hdc)
        k = scale if user32.GetSystemMetrics(0) == physical_w and scale > 1 else 1
        top, bottom, left, right = area.top / k, area.bottom / k, area.left / k, area.right / k
        screen_h /= k
        # Centered on the screen, the window must still end above the taskbar.
        fit_h = min(bottom - top, 2 * bottom - screen_h, screen_h - 2 * top) - 12
        return int(min(width, right - left - 24)), int(min(height, fit_h))
    except Exception:
        return width, height


def main():
    server = start_server(wait=4)
    if server:
        print(f'Phone access (same Wi-Fi): http://{local_ip()}:{LAN_PORT}')
    # The ?v= makes the page URL itself new after every update — WebView2
    # kept serving a stale cached /index.html without even asking the server.
    url = f'http://127.0.0.1:{LAN_PORT}/index.html?v={asset_version()}'

    width, height = window_size()
    window = webview.create_window(
        'WO Lingua Lab',
        url,
        width=width,
        height=height,
        min_size=(min(960, width), min(640, height)),
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
