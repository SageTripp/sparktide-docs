param([Parameter(Mandatory)][string]$Path)
$ErrorActionPreference='Stop'
foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^([A-Z][A-Z0-9_]*)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}
