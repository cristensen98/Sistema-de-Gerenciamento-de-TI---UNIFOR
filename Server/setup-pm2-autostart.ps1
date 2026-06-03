param($TaskName = "PM2-STI-App")

# Verifica se está rodando como administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Clique direito no PowerShell e escolha 'Executar como Administrador'"
    exit 1
}

# Caminho do script batch
$scriptPath = "D:\STI\start-pm2.cmd"

if (-not (Test-Path $scriptPath)) {
    Write-Host "Erro: Arquivo $scriptPath nao encontrado!" -ForegroundColor Red
    exit 1
}

# Cria uma tarefa agendada que executa na inicialização
$trigger = New-ScheduledTaskTrigger -AtStartup
$action = New-ScheduledTaskAction -Execute $scriptPath
$principal = New-ScheduledTaskPrincipal -UserID "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Registra a tarefa
Register-ScheduledTask -TaskName $TaskName `
    -Trigger $trigger `
    -Action $action `
    -Principal $principal `
    -Force | Out-Null

Write-Host "✓ Tarefa agendada '$TaskName' criada com sucesso!" -ForegroundColor Green
Write-Host "PM2 iniciará automaticamente na próxima inicialização do Windows"
