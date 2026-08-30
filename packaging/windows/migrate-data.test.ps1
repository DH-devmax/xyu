param(
    [Parameter(Mandatory = $true)]
    [string]$Validator
)

$ErrorActionPreference = 'Stop'
$root = Join-Path ([IO.Path]::GetTempPath()) ('dh-brand-migration-' + [Guid]::NewGuid().ToString('N'))
$source = Join-Path $root 'legacy data'
$destination = Join-Path $root 'current data'
$rollbackDir = Join-Path $root 'rollback evidence'
$record = Join-Path $rollbackDir 'migration.env'
$migrationLog = Join-Path $rollbackDir 'migration.log'
$migrationScript = Join-Path $PSScriptRoot 'migrate-data.ps1'
$failedValidator = Join-Path $root 'failed-validator.cmd'
$dataKey = 'windows-brand-migration-key'
try {
    New-Item -ItemType Directory -Force -Path (Join-Path $source 'data') | Out-Null
    Set-Content -LiteralPath (Join-Path $source 'data-key') -Value $dataKey -Encoding ASCII
    & $Validator `
        -verify-data `
        -workdir $source `
        -db (Join-Path $source 'data\xianyu_data.db') `
        -data-key-file (Join-Path $source 'data-key') | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "创建 Windows 迁移样本失败: $LASTEXITCODE" }

    $encryptedFixture = Join-Path $PSScriptRoot 'migrate-data.fixture.cjs'
    & node $encryptedFixture (Join-Path $source 'data\xianyu_data.db') $dataKey
    if ($LASTEXITCODE -ne 0) { throw "创建 Windows 加密迁移样本失败: $LASTEXITCODE" }
    Set-Content -LiteralPath (Join-Path $source 'settings.env') -Value 'legacy' -Encoding ASCII

    $wrongKeySource = Join-Path $root 'legacy wrong key'
    $wrongKeyDestination = Join-Path $root 'wrong key destination'
    Copy-Item -LiteralPath $source -Destination $wrongKeySource -Recurse -Force
    Set-Content -LiteralPath (Join-Path $wrongKeySource 'data-key') -Value 'wrong-windows-brand-migration-key' -Encoding ASCII
    $wrongKeyRejected = $false
    try {
        & $migrationScript `
            -Source $wrongKeySource `
            -Destination $wrongKeyDestination `
            -RollbackDir (Join-Path $root 'wrong key rollback') `
            -Record (Join-Path $root 'wrong key rollback\migration.env') `
            -Validator $Validator | Out-Host
    } catch {
        $wrongKeyRejected = $true
    }
    if (-not $wrongKeyRejected -or (Test-Path -LiteralPath $wrongKeyDestination)) {
        throw '密钥错误时不应切换 Windows 数据目录'
    }

    Set-Content -LiteralPath $failedValidator -Value '@exit /b 23' -Encoding ASCII
    $rejectedDestination = Join-Path $root 'rejected destination'
    $rejected = $false
    try {
        & $migrationScript `
            -Source $source `
            -Destination $rejectedDestination `
            -RollbackDir (Join-Path $root 'rejected rollback') `
            -Record (Join-Path $root 'rejected rollback\migration.env') `
            -Validator $failedValidator | Out-Host
    } catch {
        $rejected = $true
    }
    if (-not $rejected -or (Test-Path -LiteralPath $rejectedDestination)) {
        throw '验证器失败时不应切换 Windows 数据目录'
    }

    & $migrationScript `
        -Source $source `
        -Destination $destination `
        -RollbackDir $rollbackDir `
        -Record $record `
        -Validator $Validator `
        -LogFile $migrationLog | Out-Host
    if (-not (Test-Path -LiteralPath $destination -PathType Container)) { throw 'Windows 迁移目标不存在' }
    $recordText = Get-Content -Raw -LiteralPath $record
    if ($recordText -notmatch '(?m)^database_decryption=ok\r?$') { throw 'Windows 迁移记录缺少解密成功状态' }
    $migrationLogText = Get-Content -Raw -LiteralPath $migrationLog
    if ($migrationLogText -notmatch 'migration_start' -or $migrationLogText -notmatch 'migration_complete') {
        throw 'Windows 迁移诊断日志缺少开始或完成阶段'
    }
    if (-not (Get-Item -LiteralPath (Join-Path $source 'settings.env')).IsReadOnly) { throw 'Windows 旧副本不是只读状态' }

    Set-Content -LiteralPath (Join-Path $destination 'settings.env') -Value 'changed' -Encoding ASCII
    $rollbackScript = Join-Path $rollbackDir 'rollback-data.ps1'
    & $rollbackScript | Out-Host
    $restored = (Get-Content -Raw -LiteralPath (Join-Path $destination 'settings.env')).Trim()
    if ($restored -ne 'legacy') { throw "Windows 回滚内容异常: $restored" }
    Write-Output 'windows-product-data-migration: 通过'
} finally {
    if (Test-Path -LiteralPath $root) {
        Get-ChildItem -LiteralPath $root -File -Recurse -Force -ErrorAction SilentlyContinue |
            ForEach-Object { $_.IsReadOnly = $false }
        Remove-Item -LiteralPath $root -Recurse -Force
    }
}
