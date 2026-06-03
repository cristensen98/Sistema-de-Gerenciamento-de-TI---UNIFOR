# 🚀 STI - Servidor Configurado 24/7

## Status Atual ✅

```
┌─────────────────────────────────────────┐
│  APLICAÇÃO ONLINE                       │
│                                         │
│  Porta: 3000                            │
│  Banco: sisti.db (SQLite)               │
│  PM2: ✓ Ativo                           │
│  Auto-restart: ✓ Ativado                │
│  Logs: ✓ Salvos em D:\STI\logs\         │
│                                         │
│  Acesse: http://localhost:3000          │
└─────────────────────────────────────────┘
```

---

## 🎯 Próximo Passo (2 MINUTOS)

### ⚡ Ativar Auto-Inicialização com Windows

**Método 1: Clique Duplo (Mais Fácil)**
```
1. Abra: D:\STI\
2. Clique duplo: setup-pm2-autostart.vbs
3. Confirme
4. ✓ Pronto!
```

**Método 2: Terminal Admin (Alternativo)**
```bash
cd D:\STI
setup-autostart.cmd
```

**Método 3: Manual Agendador (Se nada acima funcionar)**
- Pressione `Win + R`
- Digite `taskschd.msc`
- Siga instruções em `SERVIDOR-24-7.md`

**Depois: Reinicie Windows para testar**

---

## 📚 Documentação

| Arquivo | Descrição | Para Quem |
|---------|-----------|-----------|
| **GUIA-PRATICO.md** | Guia visual passo a passo | Iniciantes |
| **SERVIDOR-RAPIDO.md** | Instalação rápida | Profissionais |
| **SERVIDOR-24-7.md** | Guia completo e detalhado | Avançados |
| **PM2-SETUP.md** | Configuração do PM2 | Técnicos |
| **COMPARATIVO-SOLUCOES.md** | Alternativas e comparação | Quem quer saber mais |

---

## 🔧 Comandos Principais

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs sti-app

# Reiniciar
pm2 restart sti-app

# Parar
pm2 stop sti-app

# Iniciar
pm2 start sti-app

# Monitorar em tempo real
pm2 monit

# Salvar estado
pm2 save

# Resgatar estado salvo (simula boot)
pm2 resurrect
```

---

## 📋 O Que Já Foi Configurado

```
✅ PM2 instalado globalmente
✅ tsx instalado globalmente
✅ ecosystem.config.cjs criado
✅ Aplicação iniciada com PM2
✅ Logs configurados em D:\STI\logs\
✅ Auto-restart ativado
✅ Max memory: 1GB
✅ Graceful shutdown: 5s
⏳ Auto-inicialização com Windows (PRÓXIMO)
```

---

## 🌐 Acessar Aplicação

### Seu PC
```
http://localhost:3000
```

### De outro PC na rede
```
http://<seu-ip>:3000

Descobrir IP:
$ ipconfig
→ Procure: IPv4 Address (ex: 192.168.1.100)
```

---

## 🆘 Problemas Rápidos?

### "Não consigo ativar auto-inicialização"
→ Leia `SERVIDOR-RAPIDO.md` (Opção B: Manual)

### "App não está online"
```bash
pm2 status
pm2 logs sti-app --err
```

### "Preciso reiniciar app"
```bash
pm2 restart sti-app
```

### "Quero ver o que está acontecendo"
```bash
pm2 monit    # Gráfico em tempo real
```

---

## 📁 Arquivos Importantes

```
D:\STI\
├── ecosystem.config.cjs      ← Configuração PM2 (NÃO EDITE sem saber)
├── start-pm2.cmd             ← Script de boot (NÃO MOVA)
├── setup-pm2-autostart.vbs   ← Clique aqui para ativar! ⭐
│
├── sisti.db                  ← Seu banco de dados
├── server.ts                 ← Aplicação
│
├── logs/                     ← Logs da aplicação
│   ├── out.log
│   ├── error.log
│   └── combined.log
│
└── (Esta documentação)
    ├── GUIA-PRATICO.md
    ├── SERVIDOR-RAPIDO.md
    ├── SERVIDOR-24-7.md
    └── COMPARATIVO-SOLUCOES.md
```

---

## ✨ O Que Você Consegue Fazer

```
✓ Deixar PC sempre ligado
✓ App inicia automaticamente ao ligar PC
✓ Se app cair, PM2 reinicia
✓ Se esquecer de salvar config, PM2 relembra
✓ Ver logs para troubleshooting
✓ Controlar via comandos PM2
✓ Acessar de qualquer PC na rede
✓ Sem VS Code aberto
✓ Sem terminal aberto
✓ 100% automático
```

---

## 🎓 Fluxo de Funcionamento

```
BOOT Windows
    ↓
Agendador de Tarefas executa start-pm2.cmd
    ↓
PM2 daemon inicia e ressuscita app
    ↓
STI App online na porta 3000
    ↓
Qualquer pessoa acessa http://localhost:3000
    ↓
Se houver erro, PM2 reinicia automaticamente
```

---

## 📞 Suporte Rápido

**Tudo no Terminal (ou PowerShell):**

```bash
# Ver se está online
pm2 status

# Ver erros
pm2 logs sti-app

# Reiniciar
pm2 restart sti-app

# Monitorar
pm2 monit

# Salvar
pm2 save

# Resgatar
pm2 resurrect
```

---

## 🚀 Você Está Pronto!

Seu computador agora é um **servidor profissional**:

- ✅ Aplicação sempre online
- ✅ Auto-recovery
- ✅ Sem intervenção humana
- ✅ Tudo automatizado
- ✅ Fácil de monitorar

---

## 📖 Leia Depois

1. `GUIA-PRATICO.md` - Entender o funcionamento
2. `SERVIDOR-24-7.md` - Configurações avançadas
3. `COMPARATIVO-SOLUCOES.md` - Outras opções no futuro

---

**Próximo: Clique em `setup-pm2-autostart.vbs` para finalizar! 🎉**
