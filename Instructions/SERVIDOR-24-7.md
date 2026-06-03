# Como Manter a Aplicação Online 24/7 sem VS Code

## Resumo Rápido

Você **JÁ TEM** tudo configurado! O PM2 está rodando e a aplicação está online. Falta apenas ativar a **auto-inicialização com o Windows**.

---

## 1. Verificar Status Atual

```bash
pm2 status
pm2 logs sti-app
```

✓ Se aparecer `online` - a app está rodando!

---

## 2. Ativar Auto-Inicialização com Windows

### ⚡ Método Recomendado: Executar Script como Admin

1. **Abra PowerShell como Administrador**:
   - Pressione `Win + X`
   - Escolha `Windows PowerShell (Admin)` ou `Terminal (Admin)`

2. **Cole e execute este comando**:
   ```powershell
   cd D:\STI
   powershell -ExecutionPolicy Bypass -File setup-pm2.ps1
   ```

   Ou use o script batch:
   ```cmd
   D:\STI\setup-autostart.cmd
   ```

3. ✓ Tarefa agendada criada

### Manual: Via Agendador de Tarefas

1. Pressione `Win + R` → Digite `taskschd.msc` → Enter
2. Clique em **Criar Tarefa** (direita)
3. **Guia Geral**:
   - Nome: `PM2-STI-App`
   - Descrição: `Inicia PM2 com aplicação STI na inicialização`
   - ☑ "Executar com privilégios mais altos"

4. **Guia Gatilhos**:
   - Clique em **Novo**
   - Selecione: `Ao iniciar o sistema`
   - Clique **OK**

5. **Guia Ações**:
   - Clique em **Novo**
   - Programa: `D:\STI\start-pm2.cmd`
   - Clique **OK**

6. **Clique Criar**

---

## 3. Testar Auto-Inicialização

```bash
# Resetar PM2
pm2 kill
pm2 resurrect

# Verificar se voltou online
pm2 status
```

---

## 4. Fluxo Completo: Como Funciona

```
Windows Inicializa
    ↓
Agendador de Tarefas executa start-pm2.cmd
    ↓
PM2 daemon inicia
    ↓
PM2 ressuscita aplicações salvas (pm2 resurrect)
    ↓
sti-app inicia automaticamente
    ↓
Aplicação roda 24/7 na porta 3000
```

---

## 5. Após Reiniciar Windows

Acesse sua aplicação normalmente:
```
http://localhost:3000
```

✓ Estará online **sem precisar abrir VS Code**

---

## 6. Monitorar Aplicação Rodando

### Ver status em tempo real:
```bash
pm2 monit
```

### Ver logs:
```bash
pm2 logs sti-app
pm2 logs sti-app --lines 100  # Últimas 100 linhas
```

### Ver arquivo de logs:
```
D:\STI\logs\
  ├── out.log         # Output
  ├── error.log       # Erros
  └── combined.log    # Tudo
```

---

## 7. Controlar Aplicação

```bash
# Ver status
pm2 status

# Parar
pm2 stop sti-app

# Iniciar
pm2 start sti-app

# Reiniciar
pm2 restart sti-app

# Ver processos
pm2 list

# Salvar estado
pm2 save

# Resgatar último estado salvo
pm2 resurrect

# Apagar aplicação
pm2 delete sti-app

# Parar tudo
pm2 kill
```

---

## 8. Problemas Comuns

### "PM2 não inicia com o Windows"
- ✓ Execute `setup-autostart.cmd` como **Administrador**
- Verifique em `Agendador de Tarefas` → `Biblioteca` → procure `PM2-STI-App`

### "Aplicação fica offline"
```bash
# PM2 auto-reinicia, mas verifique logs
pm2 logs sti-app

# Se houver erro, veja o arquivo
cat D:\STI\logs\error.log
```

### "Mudei a pasta do projeto"
```bash
pm2 delete sti-app
cd /d <nova-pasta>
pm2 start D:\STI\ecosystem.config.cjs
pm2 save
```

### "Preciso mudar linha de comando"
```bash
# Edite o arquivo
notepad D:\STI\ecosystem.config.cjs

# Aplique mudanças
pm2 restart sti-app
```

---

## 9. Próximos Passos (Optional)

### Expor Aplicação na Internet (NGROK)
```bash
npm install -g ngrok
ngrok http 3000
```

### Usar Domínio Próprio
Veja configuração de proxy reverso (Nginx/Apache)

### Backup do Banco de Dados
```bash
# Copiar D:\STI\sisti.db regularmente
```

---

## 10. Configuração Atual do PM2

```javascript
// D:\STI\ecosystem.config.cjs

- Nome: sti-app
- Comando: tsx server.ts
- Porta: 3000
- BD: sisti.db
- Ambiente: production
- Auto-restart: ✓ Ativado
- Max Memory: 1GB
- Graceful Shutdown: 5s
- Logs: D:\STI\logs/
```

---

## Checklist Final

- [ ] PM2 está instalado: `pm2 -v`
- [ ] App está online: `pm2 status`
- [ ] Tarefa agendada criada: `taskschd.msc`
- [ ] Teste: Reinicie Windows (ou `pm2 kill && pm2 resurrect`)
- [ ] Acesse: `http://localhost:3000`

✓ **Pronto! Seu computador é um servidor 24/7**

---

## Dúvidas?

Verifique logs:
```bash
pm2 logs sti-app --err
```

Ou reinicie tudo:
```bash
pm2 kill
pm2 start D:\STI\ecosystem.config.cjs
pm2 save
```
