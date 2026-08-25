# Installs Windows OneCore speech (TTS) voices for every language supported by
# WO Lingua Lab that isn't already available on this PC. Must be run as Administrator
# (needs to query/install Windows optional features) and needs an internet
# connection (voice data downloads from Windows Update).
#
# HOW TO RUN:
#   1. Right-click PowerShell (or Windows Terminal) in the Start menu -> "Run as administrator"
#   2. cd into this folder, e.g.:  cd "C:\Users\sasha\Documents\LinguaLab"
#   3. powershell -ExecutionPolicy Bypass -File .\install-tts-voices.ps1
#
# Not every language below is guaranteed to be offered by Windows — the script
# reports exactly what it found, installed, or couldn't find, per language.

$targets = @(
  @{ Code = 'de'; Name = 'German';     Tag = 'de-DE' },
  @{ Code = 'nl'; Name = 'Dutch';      Tag = 'nl-NL' },
  @{ Code = 'sv'; Name = 'Swedish';    Tag = 'sv-SE' },
  @{ Code = 'no'; Name = 'Norwegian';  Tag = 'nb-NO' },
  @{ Code = 'da'; Name = 'Danish';     Tag = 'da-DK' },
  @{ Code = 'fr'; Name = 'French';     Tag = 'fr-FR' },
  @{ Code = 'es'; Name = 'Spanish';    Tag = 'es-ES' },
  @{ Code = 'it'; Name = 'Italian';    Tag = 'it-IT' },
  @{ Code = 'pt'; Name = 'Portuguese'; Tag = 'pt-PT' },
  @{ Code = 'ro'; Name = 'Romanian';   Tag = 'ro-RO' },
  @{ Code = 'pl'; Name = 'Polish';     Tag = 'pl-PL' },
  @{ Code = 'sk'; Name = 'Slovak';     Tag = 'sk-SK' },
  @{ Code = 'uk'; Name = 'Ukrainian';  Tag = 'uk-UA' },
  @{ Code = 'ru'; Name = 'Russian';    Tag = 'ru-RU' },
  @{ Code = 'bg'; Name = 'Bulgarian';  Tag = 'bg-BG' },
  @{ Code = 'hr'; Name = 'Croatian';   Tag = 'hr-HR' },
  @{ Code = 'sr'; Name = 'Serbian';    Tag = 'sr-RS' },
  @{ Code = 'el'; Name = 'Greek';      Tag = 'el-GR' },
  @{ Code = 'fi'; Name = 'Finnish';    Tag = 'fi-FI' },
  @{ Code = 'hu'; Name = 'Hungarian';  Tag = 'hu-HU' }
)

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
if (-not $isAdmin) {
  Write-Host "This script must be run as Administrator." -ForegroundColor Red
  Write-Host "Right-click PowerShell in the Start menu -> Run as administrator, then run this script again." -ForegroundColor Yellow
  exit 1
}

Write-Host "Querying available Windows speech voices (may take a moment)..." -ForegroundColor Cyan
$available = Get-WindowsCapability -Online | Where-Object { $_.Name -like "Language.Speech~~~*" }

if (-not $available) {
  Write-Host "Could not query Windows optional features. Check your internet connection and try again." -ForegroundColor Red
  exit 1
}

$results = @()
foreach ($t in $targets) {
  $match = $available | Where-Object { $_.Name -like "Language.Speech~~~$($t.Tag)~*" } | Select-Object -First 1
  if (-not $match) {
    $primary = $t.Tag.Split('-')[0]
    $match = $available | Where-Object { $_.Name -like "Language.Speech~~~$primary-*" } | Select-Object -First 1
  }

  if (-not $match) {
    $results += [PSCustomObject]@{ Language = $t.Name; Code = $t.Code; Status = 'Not offered by Windows' }
    continue
  }

  if ($match.State -eq 'Installed') {
    $results += [PSCustomObject]@{ Language = $t.Name; Code = $t.Code; Status = 'Already installed' }
    continue
  }

  Write-Host "Installing $($t.Name) ($($match.Name))..." -ForegroundColor Cyan
  try {
    Add-WindowsCapability -Online -Name $match.Name -ErrorAction Stop | Out-Null
    $results += [PSCustomObject]@{ Language = $t.Name; Code = $t.Code; Status = 'Installed' }
  } catch {
    $results += [PSCustomObject]@{ Language = $t.Name; Code = $t.Code; Status = "Failed: $($_.Exception.Message)" }
  }
}

Write-Host ""
Write-Host "===== Summary =====" -ForegroundColor Green
$results | Format-Table -AutoSize

Write-Host ""
Write-Host "Done. Fully close and reopen WO Lingua Lab (and any browser tab with it) so it picks up the new voices." -ForegroundColor Yellow
Write-Host "Press Enter to exit..."
Read-Host | Out-Null
