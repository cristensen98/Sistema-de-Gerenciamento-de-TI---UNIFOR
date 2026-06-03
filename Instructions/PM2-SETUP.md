# PM2 - Configuração de Auto-Inicialização no Windows

## Status Atual ✓

- **PM2 instalado** ✓
- **Aplicação rodando** ✓
- **Configuração salva** ✓

## Para Ativar Auto-Inicialização com o Windows:

### Opção 1: Usar Script Batch (Recomendado)

1. Abra o **Prompt de Comando como Administrador**
   - Pressione `Win + R`
   - Digite `cmd`
   - Pressione `Ctrl + Shift + Enter` para abrir como Admin

2. Execute o seguinte comando:
   ```cmd
   cd /d D:\STI
   setup-autostart.cmd
   ```

3. Confirme o prompt e a tarefa será criada

### Opção 2: Manual via Agendador de Tarefas

1. Abra o **Agendador de Tarefas** (Task Scheduler)
   - Pressione `Win + R`
   - Digite `taskschd.msc`

2. Clique em **Criar Tarefa** (Create Basic Task)

3. Configure:
   - **Nome**: `PM2-STI-App`
   - **Descrição**: `Inicia PM2 com aplicação STI na inicialização`
   - **Tipo de gatilho**: `Ao iniciar o sistema`
   - **Ação**: `Iniciar um programa`
   - **Programa/script**: `D:\STI\start-pm2.cmd`
   - **Usuário**: `SYSTEM`
   - **Permitir que a tarefa seja executada com privilégios mais altos**: ✓ Ativado

4. Clique em **Criar**

## Verificar Configuração

### Ver status do PM2:
```bash
pm2 status
```

### Ver logs da aplicação:
```bash
pm2 logs sti-app
```

### Ver lista de processos:
```bash
pm2 list
```

### Resgatar processo salvo (se PM2 foi reiniciado):
```bash
pm2 resurrect
```

## Comandos Úteis

- **Parar aplicação**: `pm2 stop sti-app`
- **Iniciar aplicação**: `pm2 start sti-app`
- **Reiniciar aplicação**: `pm2 restart sti-app`
- **Deletar aplicação**: `pm2 delete sti-app`
- **Salvar estado atual**: `pm2 save`
- **Monitorar em tempo real**: `pm2 monit`

## Estrutura de Arquivos

```
D:\STI\
├── ecosystem.config.cjs          # Configuração do PM2
├── start-pm2.cmd                 # Script de inicialização
├── setup-autostart.cmd           # Script para criar tarefa agendada
└── logs/
    ├── out.log                   # Output da aplicação
    ├── error.log                 # Erros
    └── combined.log              # Log combinado
```

## O que foi configurado no PM2:

✓ **Auto-restart**: Aplicação reinicia se cair  
✓ **Max Memory**: 1GB (reinicia se exceder)  
✓ **Graceful Shutdown**: 5 segundos de timeout  
✓ **Environment**: NODE_ENV=production  
✓ **Port**: 3000  
✓ **Database**: sisti.db  
✓ **Logs**: Salvos em D:\STI\logs\
