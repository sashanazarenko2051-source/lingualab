# Builds dist\WO-Lingua-Lab.exe: one file to send to someone, who just runs it.
# Needs: python -m pip install pyinstaller pywebview edge-tts
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$work = "$env:TEMP\lingualab-build"
$data = 'index.html', 'manifest.webmanifest', 'sw.js', 'icon.ico', 'icon-192.png', 'icon-512.png' |
  ForEach-Object { '--add-data', "$root\$_;." }
python -m PyInstaller --noconfirm --clean --onefile --windowed `
  --name WO-Lingua-Lab --icon "$root\icon.ico" --hidden-import edge_tts `
  @data --add-data "$root\js;js" --add-data "$root\css;css" `
  --distpath "$root\dist" --workpath $work --specpath $work `
  "$root\main.py"
Write-Host "Done: $root\dist\WO-Lingua-Lab.exe"
