@echo off
REM Script para iniciar PM2 com o Windows
REM Este script deve ser executado pelo Agendador de Tarefas do Windows

REM Aguarde 5 segundos para o Windows carregar
timeout /t 5 /nobreak

REM Inicie o daemon do PM2
pm2 resurrect

REM Log de inicialização
echo PM2 iniciado em %DATE% %TIME% >> "D:\STI\logs\pm2-startup.log"
