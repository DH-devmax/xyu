param(
    [Parameter(Mandatory = $true)]
    [string]$Source,
    [Parameter(Mandatory = $true)]
    [string]$Destination,
    [Parameter(Mandatory = $true)]
    [string]$RollbackDir,
    [Parameter(Mandatory = $true)]
    [string]$Record,
    [Parameter(Mandatory = $true)]
    [string]$Validator
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

function Set-EnvironmentValue {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [AllowNull()][object]$Value
    )
    if ($null -eq $Value) {
        Remove-Item -LiteralPath "Env:$Name" -ErrorAction SilentlyContinue
    } else {
        Set-Item -LiteralPath "Env:$Name" -Value $Value.ToString()
    }
}

function Invoke-DataVerification {
    param([Parameter(Mandatory = $true)][string]$StagingRoot)
    $database = Join-Path $StagingRoot 'data\xianyu_data.db'
    if (-not (Test-Path -LiteralPath $database -PathType Leaf)) {
        return 'not_present'
    }

    $verificationRoot = Join-Path $RollbackDir ('.data-verification-' + [Guid]::NewGuid().ToString('N'))
    $environmentNames = @(
        'DATABASE_URL',
        'XIANYU_DATA_KEY',
        'DH_XIANYU_AGENTPANEL_DATA_KEY',
        'XIANYU_LOG_DIR',
        'DH_XIANYU_AGENTPANEL_LOG_DIR'
    )
    $savedEnvironment = @{}
    foreach ($environmentName in $environmentNames) {
        $savedEnvironment[$environmentName] = [Environment]::GetEnvironmentVariable($environmentName, 'Process')
        Set-EnvironmentValue -Name $environmentName -Value $null
    }
    try {
        New-Item -ItemType Directory -Force -Path $verificationRoot | Out-Null
        Get-ChildItem -LiteralPath $StagingRoot -Force |
            Copy-Item -Destination $verificationRoot -Recurse -Force
        $verificationDatabase = Join-Path $verificationRoot 'data\xianyu_data.db'
        $verificationKey = Join-Path $verificationRoot 'data-key'
        & $Validator `
            -verify-data `
            -workdir $verificationRoot `
            -db $verificationDatabase `
            -data-key-file $verificationKey | Out-Host
        if ($LASTEXITCODE -ne 0) {
            throw "数据验证器失败，错误码: $LASTEXITCODE"
        }
        return 'ok'
    } finally {
        if (Test-Path -LiteralPath $verificationRoot) {
            Remove-Item -LiteralPath $verificationRoot -Recurse -Force
        }
        foreach ($environmentName in $environmentNames) {
            Set-EnvironmentValue -Name $environmentName -Value $savedEnvironment[$environmentName]
        }
    }
}

if (-not (Test-Path -LiteralPath $Source -PathType Container)) {
    throw "迁移源目录不存在: $Source"
}
if (Test-Path -LiteralPath $Destination) {
    throw "迁移目标已存在，为避免覆盖数据而停止: $Destination"
}
if (-not (Test-Path -LiteralPath $Validator -PathType Leaf)) {
    throw "数据验证器不存在: $Validator"
}

$Source = [IO.Path]::GetFullPath($Source).TrimEnd('\', '/')
$Destination = [IO.Path]::GetFullPath($Destination).TrimEnd('\', '/')
$RollbackDir = [IO.Path]::GetFullPath($RollbackDir).TrimEnd('\', '/')
$Record = [IO.Path]::GetFullPath($Record)
$Validator = [IO.Path]::GetFullPath($Validator)
if ([StringComparer]::OrdinalIgnoreCase.Equals($Source, $Destination)) {
    throw '迁移源和目标不能相同'
}

New-Item -ItemType Directory -Force -Path $RollbackDir | Out-Null
$recordParent = Split-Path -Parent $Record
if (-not [string]::IsNullOrWhiteSpace($recordParent)) {
    New-Item -ItemType Directory -Force -Path $recordParent | Out-Null
}
$sourceDigest = Get-TreeDigest -Root $Source
$staging = $Destination + '.staging-' + $PID
$destinationCreated = $false
$sourceReadOnly = $false
try {
    New-Item -ItemType Directory -Force -Path $staging | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | Copy-Item -Destination $staging -Recurse -Force
    $stagingDigest = Get-TreeDigest -Root $staging
    if ($sourceDigest -ne $stagingDigest) {
        throw "复制后哈希不一致: source=$sourceDigest staging=$stagingDigest"
    }

    $databaseVerification = Invoke-DataVerification -StagingRoot $staging
    if ($databaseVerification -notin @('ok', 'not_present')) {
        throw "数据库验证未返回成功状态: $databaseVerification"
    }

    Move-Item -LiteralPath $staging -Destination $Destination
    $destinationCreated = $true
    $destinationDigest = Get-TreeDigest -Root $Destination
    if ($sourceDigest -ne $destinationDigest) {
        throw "切换后哈希不一致: source=$sourceDigest destination=$destinationDigest"
    }

    $rollbackScript = Join-Path $RollbackDir 'rollback-data.ps1'
    $rollbackContent = @'
param([string]$Source = '__SOURCE__', [string]$Destination = '__DESTINATION__', [string]$ExpectedSourceHash = '__EXPECTED_SOURCE_HASH__')
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
$before = Get-TreeDigest -Root $Source
if ($before -ne $ExpectedSourceHash) { throw "旧版只读副本已漂移: expected=$ExpectedSourceHash actual=$before" }
Get-ChildItem -LiteralPath $Source -File -Recurse -Force | ForEach-Object { $_.IsReadOnly = $false }
$backup = $Destination + '.v2-before-rollback-' + (Get-Date).ToUniversalTime().ToString('yyyyMMddTHHmmssZ')
$destinationMoved = $false
try {
    Move-Item -LiteralPath $Destination -Destination $backup
    $destinationMoved = $true
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | Copy-Item -Destination $Destination -Recurse -Force
    $after = Get-TreeDigest -Root $Destination
    if ($before -ne $after) { throw '回滚后哈希不一致' }
} catch {
    if ($destinationMoved) {
        if (Test-Path -LiteralPath $Destination) { Remove-Item -LiteralPath $Destination -Recurse -Force }
        Move-Item -LiteralPath $backup -Destination $Destination
    }
    throw
}
Write-Output 'rollback_status=ok'
Write-Output ('backup=' + $backup)
Write-Output ('source_hash=' + $before)
Write-Output ('destination_hash=' + $after)
'@
    $rollbackContent = $rollbackContent.Replace('__SOURCE__', $Source.Replace("'", "''"))
    $rollbackContent = $rollbackContent.Replace('__DESTINATION__', $Destination.Replace("'", "''"))
    $rollbackContent = $rollbackContent.Replace('__EXPECTED_SOURCE_HASH__', $sourceDigest)
    Set-Content -LiteralPath $rollbackScript -Value $rollbackContent -Encoding UTF8

    Get-ChildItem -LiteralPath $Source -File -Recurse -Force | ForEach-Object {
        $_.IsReadOnly = $true
    }
    Get-ChildItem -LiteralPath $Source -Directory -Recurse -Force | ForEach-Object {
        $_.Attributes = $_.Attributes -bor [IO.FileAttributes]::ReadOnly
    }
    $sourceReadOnly = $true

    $recordContent = @(
        'status=ok'
        ('source=' + $Source)
        ('destination=' + $Destination)
        ('source_hash=' + $sourceDigest)
        ('staging_hash=' + $stagingDigest)
        ('destination_hash=' + $destinationDigest)
        ('database_integrity=' + $databaseVerification)
        ('database_decryption=' + $databaseVerification)
        'legacy_readonly=true'
        ('validator=' + $Validator)
        ('rollback_script=' + $rollbackScript)
        ('completed_at=' + [DateTime]::UtcNow.ToString('o'))
    )
    Set-Content -LiteralPath $Record -Value $recordContent -Encoding UTF8
    Write-Output "数据迁移完成: $Source -> $Destination"
    Write-Output "回滚脚本: $rollbackScript"
    Write-Output "校验记录: $Record"
} catch {
    if (Test-Path -LiteralPath $staging) {
        Remove-Item -LiteralPath $staging -Recurse -Force
    }
    if ($destinationCreated -and (Test-Path -LiteralPath $Destination)) {
        Remove-Item -LiteralPath $Destination -Recurse -Force
    }
    if ($sourceReadOnly) {
        Get-ChildItem -LiteralPath $Source -File -Recurse -Force | ForEach-Object { $_.IsReadOnly = $false }
    }
    throw
}
