param(
    [Parameter(Mandatory = $true)]
    [string]$Source,
    [Parameter(Mandatory = $true)]
    [string]$Destination,
    [Parameter(Mandatory = $true)]
    [string]$RollbackDir,
    [Parameter(Mandatory = $true)]
    [string]$Record
)

$ErrorActionPreference = 'Stop'

function Get-TreeDigest {
    param([Parameter(Mandatory = $true)][string]$Root)
    $lines = New-Object System.Collections.Generic.List[string]
    Get-ChildItem -LiteralPath $Root -File -Recurse -Force |
        Sort-Object FullName |
        ForEach-Object {
            $relative = $_.FullName.Substring($Root.Length).TrimStart('\', '/').Replace('\', '/')
            $digest = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            $lines.Add("$digest  $relative")
        }
    $payload = [Text.Encoding]::UTF8.GetBytes(($lines -join [Environment]::NewLine))
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        return ($sha.ComputeHash($payload) | ForEach-Object { $_.ToString('x2') }) -join ''
    } finally {
        $sha.Dispose()
    }
}

if (-not (Test-Path -LiteralPath $Source -PathType Container)) {
    throw "迁移源目录不存在: $Source"
}
if (Test-Path -LiteralPath $Destination) {
    throw "迁移目标已存在，为避免覆盖数据而停止: $Destination"
}

New-Item -ItemType Directory -Force -Path $RollbackDir | Out-Null
$recordParent = Split-Path -Parent $Record
if (-not [string]::IsNullOrWhiteSpace($recordParent)) {
    New-Item -ItemType Directory -Force -Path $recordParent | Out-Null
}
$sourceDigest = Get-TreeDigest -Root $Source
$staging = $Destination + '.staging-' + $PID
try {
    New-Item -ItemType Directory -Force -Path $staging | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | Copy-Item -Destination $staging -Recurse -Force
    $stagingDigest = Get-TreeDigest -Root $staging
    if ($sourceDigest -ne $stagingDigest) {
        throw "复制后哈希不一致: source=$sourceDigest staging=$stagingDigest"
    }

    $database = Join-Path $staging 'data\xianyu_data.db'
    $databaseCheck = 'not_present'
    if (Test-Path -LiteralPath $database -PathType Leaf) {
        $sqlite = Get-Command sqlite3.exe -ErrorAction SilentlyContinue
        if ($null -eq $sqlite) {
            $databaseCheck = 'deferred_to_server'
        } else {
            $check = (& $sqlite.Source $database 'PRAGMA integrity_check;' | Out-String).Trim()
            if ($check -ne 'ok') {
                throw "SQLite 数据库完整性校验失败: $database"
            }
            $databaseCheck = 'ok'
        }
    }

    Move-Item -LiteralPath $staging -Destination $Destination
    $destinationDigest = Get-TreeDigest -Root $Destination
    if ($sourceDigest -ne $destinationDigest) {
        throw "切换后哈希不一致: source=$sourceDigest destination=$destinationDigest"
    }

    Get-ChildItem -LiteralPath $Source -File -Recurse -Force | ForEach-Object {
        $_.IsReadOnly = $true
    }
    Get-ChildItem -LiteralPath $Source -Directory -Recurse -Force | ForEach-Object {
        $_.Attributes = $_.Attributes -bor [IO.FileAttributes]::ReadOnly
    }

    $rollbackScript = Join-Path $RollbackDir 'rollback-data.ps1'
    $rollbackContent = @'
param([string]$Source = '__SOURCE__', [string]$Destination = '__DESTINATION__')
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $Source -PathType Container) -or -not (Test-Path -LiteralPath $Destination -PathType Container)) {
    throw '回滚源或目标目录不存在'
}
function Get-TreeDigest {
    param([Parameter(Mandatory = $true)][string]$Root)
    $lines = New-Object System.Collections.Generic.List[string]
    Get-ChildItem -LiteralPath $Root -File -Recurse -Force |
        Sort-Object FullName |
        ForEach-Object {
            $relative = $_.FullName.Substring($Root.Length).TrimStart('\', '/').Replace('\', '/')
            $digest = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            $lines.Add("$digest  $relative")
        }
    $payload = [Text.Encoding]::UTF8.GetBytes(($lines -join [Environment]::NewLine))
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return ($sha.ComputeHash($payload) | ForEach-Object { $_.ToString('x2') }) -join '' } finally { $sha.Dispose() }
}
Get-ChildItem -LiteralPath $Source -File -Recurse -Force | ForEach-Object { $_.IsReadOnly = $false }
$backup = $Destination + '.v2-before-rollback-' + (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
Move-Item -LiteralPath $Destination -Destination $backup
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
Get-ChildItem -LiteralPath $Source -Force | Copy-Item -Destination $Destination -Recurse -Force
if ((Get-TreeDigest -Root $Source) -ne (Get-TreeDigest -Root $Destination)) { throw '回滚后哈希不一致' }
Write-Output 'rollback_status=ok'
Write-Output ('backup=' + $backup)
'@
    $rollbackContent = $rollbackContent.Replace('__SOURCE__', $Source.Replace("'", "''")).Replace('__DESTINATION__', $Destination.Replace("'", "''"))
    Set-Content -LiteralPath $rollbackScript -Value $rollbackContent -Encoding UTF8
    $recordContent = @(
        'status=ok'
        ('source=' + $Source)
        ('destination=' + $Destination)
        ('source_hash=' + $sourceDigest)
        ('staging_hash=' + $stagingDigest)
        ('destination_hash=' + $destinationDigest)
        ('database_integrity=' + $databaseCheck)
        'legacy_readonly=true'
        ('rollback_script=' + $rollbackScript)
        ('completed_at=' + [DateTime]::UtcNow.ToString('o'))
    )
    Set-Content -LiteralPath $Record -Value $recordContent -Encoding UTF8
    Write-Output "数据迁移完成: $Source -> $Destination"
    Write-Output "回滚脚本: $rollbackScript"
} catch {
    if (Test-Path -LiteralPath $staging) {
        Remove-Item -LiteralPath $staging -Recurse -Force
    }
    throw
}
