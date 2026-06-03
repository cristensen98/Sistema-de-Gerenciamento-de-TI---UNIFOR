@echo off
REM Script para criar tarefa agendada de auto-inicialização do PM2
REM Execute como Administrador

echo Criando tarefa agendada para PM2...

schtasks /create /tn "PM2-STI-App" ^
    /tr "D:\STI\start-pm2.cmd" ^
    /sc onstart ^
    /ru SYSTEM ^
    /f

echo.
echo ===== RESUMO DA CONFIGURACAO =====
echo Tarefa: PM2-STI-App
echo Tipo: Executa na inicialização
echo Script: D:\STI\start-pm2.cmd
echo Usuário: SYSTEM
echo ===================================
echo.
echo A tarefa foi criada com sucesso!
echo PM2 iniciará automaticamente na próxima inicialização do Windows.
echo.
pause
