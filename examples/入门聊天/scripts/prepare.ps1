param([Parameter(Mandatory)][string]$ModelEndpoint,[Parameter(Mandatory)][string]$ModelId)
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot
$local=Join-Path $root '.local'
if (Test-Path -LiteralPath $local) { throw '.local 已存在。保留原配置；不要重复初始化或覆盖凭据。' }
$endpoint=[Uri]$ModelEndpoint
if (-not $endpoint.IsAbsoluteUri -or $endpoint.Scheme -notin @('http','https') -or $endpoint.UserInfo -or $endpoint.Query -or $endpoint.Fragment) { throw '请填写完整 Chat Completions 请求地址' }
if ([string]::IsNullOrWhiteSpace($ModelId)) { throw '模型标识必填' }
function New-LocalToken { [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) }
$admin=New-LocalToken
$browser=New-LocalToken
$callback=New-LocalToken
$secureKey=Read-Host '模型 API Key（仅在本地文件保存；无鉴权的本地服务可留空）' -AsSecureString
$ptr=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
try { $key=[Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
if ($key -match '[\r\n]' -or $ModelId -match '[\r\n]') { throw '值不能包含换行' }
New-Item -ItemType Directory -Path $local | Out-Null
$origin=$endpoint.GetLeftPart([UriPartial]::Authority)
@(
    "SPARKTIDE_ADMIN_TOKEN=$admin", 'SPARKTIDE_PLATFORM_URL=http://127.0.0.1:8080',
    "SPARKTIDE_ALLOWED_ORIGINS=$origin,http://127.0.0.1:8099", 'SPARKTIDE_ALLOW_HTTP=true',
    'SPARKTIDE_SECRET_NAMES=MODEL_API_KEY,TUTORIAL_CALLBACK_KEY',
    "SPARKTIDE_SECRET_ORIGINS=MODEL_API_KEY=$origin,TUTORIAL_CALLBACK_KEY=http://127.0.0.1:8099",
    'SPARKTIDE_SECRET_APPLICATIONS=MODEL_API_KEY=tutorial,TUTORIAL_CALLBACK_KEY=tutorial',
    "MODEL_API_KEY=$key", "TUTORIAL_CALLBACK_KEY=$callback"
) | Set-Content -LiteralPath (Join-Path $local 'platform.env') -Encoding utf8
@(
    'SPARKTIDE_PLATFORM_URL=http://127.0.0.1:8080', "TUTORIAL_MODEL_ENDPOINT=$ModelEndpoint", "TUTORIAL_MODEL_ID=$ModelId",
    "DEV_BROWSER_TOKEN=$browser", "TUTORIAL_CALLBACK_KEY=$callback"
) | Set-Content -LiteralPath (Join-Path $local 'business.env') -Encoding utf8
$browser | Set-Content -LiteralPath (Join-Path $local 'browser-token.txt') -Encoding utf8
Write-Output '本地配置已生成。平台用 platform.env；业务服务用 business.env；浏览器只使用 browser-token.txt。'
