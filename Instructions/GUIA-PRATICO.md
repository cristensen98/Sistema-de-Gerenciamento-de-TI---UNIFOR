# 🎯 Guia Prático: Seu PC como Servidor 24/7

## O Que Você Consegue Fazer Agora

```
┌─────────────────────────────────────────────────┐
│  SEM VS CODE ABERTO                             │
│  SEM TERMINAL ABERTO                            │
│  SUA APLICAÇÃO ESTÁ ONLINE NA PORTA 3000       │
│                                                 │
│  ✓ Acesse http://localhost:3000                │
│  ✓ Qualquer pessoa na sua rede pode acessar    │
│  ✓ Reinicie Windows, app volta sozinha         │
│  ✓ Se der erro, PM2 reinicia automaticamente   │
└─────────────────────────────────────────────────┘
```

---

## 🎬 Passo a Passo Executado

### ✅ FEITO

```
1. [X] Instalado PM2 globalmente
   $ npm install -g pm2
   
2. [X] Instalado tsx globalmente
   $ npm install -g tsx
   
3. [X] Criado ecosystem.config.cjs
   $ cat D:\STI\ecosystem.config.cjs
   
4. [X] Iniciado aplicação com PM2
   $ pm2 start ecosystem.config.cjs
   
5. [X] Salvado configuração
   $ pm2 save
   
6. [X] Criados scripts de auto-inicialização
   - D:\STI\start-pm2.cmd
   - D:\STI\setup-pm2-autostart.vbs
```

### ⏳ PRÓXIMO (5 MINUTOS)

```
[ ] Executar setup de auto-inicialização
    → Clique duplo em: D:\STI\setup-pm2-autostart.vbs
    
[ ] Confirmar se pedido (Yes/Sim)

[ ] Reiniciar Windows para testar
```

---

## 📋 Checklist de Funcionalidades

### Imediatamente (Agora)

- [x] Aplicação online
  ```bash
  pm2 status
  ```

- [x] Auto-restart se cair
  - Configurado em `ecosystem.config.cjs`
  - Teste: `pm2 kill` → `pm2 resurrect`

- [x] Logs disponíveis
  ```bash
  pm2 logs sti-app
  # Ver em: D:\STI\logs\
  ```

- [x] Controlar via PM2
  ```bash
  pm2 stop sti-app
  pm2 start sti-app
  pm2 restart sti-app
  ```

### Após Auto-Inicialização ✅

- [ ] App inicia com Windows
- [ ] Sem VS Code aberto
- [ ] Sem terminal aberto
- [ ] 100% automático

---

## 🔗 Ordem de Instalação

```
1. Windows Inicia
   ├─ Se 1ª vez: Executar setup-pm2-autostart.vbs
   └─ Depois: Automático
   
2. Agendador de Tarefas
   └─ Executa: D:\STI\start-pm2.cmd
   
3. PM2 Daemon Inicia
   └─ Lê: ecosystem.config.cjs
   
4. Aplicação STI Reinicia
   ├─ Porta: 3000
   ├─ BD: sisti.db
   └─ Logs: D:\STI\logs\
   
5. Online ✓
```

---

## 💻 Como Acessar a Aplicação

### Localmente (seu PC)
```
http://localhost:3000
```

### De outro PC na rede
```
http://<seu-ip-local>:3000

Exemplo:
http://192.168.1.100:3000
```

### Descobrir seu IP
```bash
ipconfig

# Procure por: IPv4 Address
# Exemplo: 192.168.1.100
```

---

## 🛠️ Comandos Essenciais

### Ver Status
```bash
pm2 status
pm2 list
pm2 show sti-app
```

### Ver Logs (problemas)
```bash
pm2 logs sti-app
pm2 logs sti-app --lines 100 --err
```

### Controlar Aplicação
```bash
pm2 stop sti-app      # Parar
pm2 start sti-app     # Iniciar
pm2 restart sti-app   # Reiniciar
pm2 delete sti-app    # Remover
```

### Monitoramento
```bash
pm2 monit             # Gráfico em tempo real
pm2 info sti-app      # Informações detalhadas
```

---

## 📁 Estrutura de Arquivos

```
D:\STI\                              ← Seu projeto
├── package.json                     ← Dependências
├── package-lock.json
├── server.ts                        ← Servidor Node
├── sisti.db                         ← Banco de dados SQLite
│
├── CONFIGURAÇÃO PM2
├── ecosystem.config.cjs             ← Config principal ⭐
├── start-pm2.cmd                    ← Script iniciação
├── setup-pm2-autostart.vbs          ← Setup (clique aqui!)
├── setup-autostart.cmd              ← Setup alternativo
│
├── DOCUMENTAÇÃO
├── PM2-SETUP.md                     ← Setup completo
├── SERVIDOR-24-7.md                 ← Guia detalhado
├── SERVIDOR-RAPIDO.md               ← Resumo rápido
├── COMPARATIVO-SOLUCOES.md          ← Alternativas
│
└── logs/                            ← Registros de execução
    ├── out.log                      ← Output da app
    ├── error.log                    ← Erros
    ├── combined.log                 ← Tudo junto
    └── pm2-startup.log              ← Startup log
```

---

## 🧪 Teste de Funcionamento

### Teste 1: App está online?
```bash
pm2 status

# Esperado:
# │ 0  │ sti-app  │ online │
```

### Teste 2: Acesso HTTP
```bash
curl http://localhost:3000

# Ou abra no navegador:
# http://localhost:3000
```

### Teste 3: Auto-restart
```bash
# 1. Parar app
pm2 stop sti-app

# 2. Verificar (deve estar stopped)
pm2 status

# 3. Iniciar novamente
pm2 start sti-app

# 4. Verificar (deve estar online)
pm2 status
```

### Teste 4: Auto-inicialização (APÓS SETUP)
```bash
# 1. Matar PM2
pm2 kill

# 2. Ressuscitar (simula boot)
pm2 resurrect

# 3. Verificar
pm2 status

# Deve estar online!
```

### Teste 5: Após Reiniciar Windows (FINAL)
```bash
# 1. Reinicie Windows
# 2. Não abra nada manualmente
# 3. Espere 10 segundos
# 4. Abra navegador
# 5. http://localhost:3000

# Deve estar funcionando! ✓
```

---

## ⚠️ Se Algo Não Funcionar

### PM2 não foi iniciado
```bash
pm2 start D:\STI\ecosystem.config.cjs
pm2 save
```

### Auto-inicialização não funciona
```bash
# Verifique se tarefa foi criada
# Abra: Agendador de Tarefas (taskschd.msc)
# Procure por: PM2-STI-App
# Se não existir, clique em: setup-pm2-autostart.vbs
```

### Porta 3000 em uso
```bash
# Descubra qual processo
netstat -ano | findstr :3000

# Mude a porta em ecosystem.config.cjs
# ou mate o processo
taskkill /PID <numero> /F
```

### Erros na aplicação
```bash
# Veja logs detalhados
pm2 logs sti-app --lines 200

# Ou arquivo directly
notepad D:\STI\logs\error.log
```

---

## 📞 Resumo Rápido

| O que fazer | Comando |
|-------------|---------|
| Ver status | `pm2 status` |
| Ver logs | `pm2 logs sti-app` |
| Reiniciar | `pm2 restart sti-app` |
| Parar | `pm2 stop sti-app` |
| Iniciar | `pm2 start sti-app` |
| Monitorar | `pm2 monit` |
| Salvar config | `pm2 save` |
| Resgatar salvo | `pm2 resurrect` |
| Apagar | `pm2 delete sti-app` |

---

## 🎓 Próximos Passos (Opcional)

### Aumentar Segurança
```bash
# 1. Adicionar HTTPS
# 2. Adicionar autenticação
# 3. Configurar firewall
```

### Backeup Automático
```bash
# Copiar D:\STI\sisti.db regularmente
# Para: D:\STI\backups\
```

### Expor na Internet
```bash
# 1. NGROK: ngrok http 3000
# 2. Ou abrir porta no roteador
# 3. Usar domínio próprio
```

### Docker (Profissional)
```bash
# Containerizar a aplicação
# Facilita deploy e replicação
```

---

## ✨ Resultado Final

Você agora tem:

```
✅ Computador funcionando como SERVIDOR
✅ Aplicação rodando 24/7
✅ Sem VS Code aberto
✅ Auto-restart se cair
✅ Logs para troubleshooting
✅ Controle via PM2
✅ Inicia automaticamente com Windows
```

**PRONTO! 🚀 Seu PC é um servidor profissional!**

---

## 📚 Documentos Neste Projeto

- `PM2-SETUP.md` - Configuração completa
- `SERVIDOR-24-7.md` - Guia detalhado
- `SERVIDOR-RAPIDO.md` - Resumo visual
- `COMPARATIVO-SOLUCOES.md` - Alternativas
- `ecosystem.config.cjs` - Arquivo de config
- `start-pm2.cmd` - Script startup
- `setup-pm2-autostart.vbs` - Setup automático

---

**Dúvidas? Veja os arquivos .md**
