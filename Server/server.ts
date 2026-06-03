import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || 'sisti.db';
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'sisti-super-secret-key-2024';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'sisti-super-secret-key-2024') {
  console.warn('AVISO DE SEGURANÇA: Usando JWT_SECRET padrão em produção. Defina a variável de ambiente JWT_SECRET.');
}

console.log(`Iniciando servidor. Banco de dados: ${dbPath}`);

// Inicializar Banco de Dados
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      branchId TEXT,
      departmentId TEXT,
      status TEXT DEFAULT 'Ativo'
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      branchId TEXT,
      FOREIGN KEY (branchId) REFERENCES branches(id)
    );

    CREATE TABLE IF NOT EXISTS networks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      baseIp TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS ip_addresses (
      id TEXT PRIMARY KEY,
      networkId TEXT NOT NULL,
      ipSuffix INTEGER NOT NULL,
      hostName TEXT,
      deviceType TEXT,
      macAddress TEXT,
      sector TEXT,
      responsible TEXT,
      description TEXT,
      equipmentId TEXT,
      updatedAt TEXT,
      FOREIGN KEY (networkId) REFERENCES networks(id),
      FOREIGN KEY (equipmentId) REFERENCES equipments(id),
      UNIQUE(networkId, ipSuffix)
    );

    CREATE TABLE IF NOT EXISTS equipments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      serialNumber TEXT,
      model TEXT,
      manufacturer TEXT,
      purchaseDate TEXT,
      warrantyUntil TEXT,
      status TEXT NOT NULL,
      branchId TEXT,
      departmentId TEXT,
      macAddress TEXT,
      responsible TEXT,
      description TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      FOREIGN KEY (branchId) REFERENCES branches(id),
      FOREIGN KEY (departmentId) REFERENCES departments(id)
    );
    CREATE TABLE IF NOT EXISTS subnets (
      id TEXT PRIMARY KEY,
      networkId TEXT NOT NULL,
      name TEXT NOT NULL,
      cidr INTEGER NOT NULL,
      startSuffix INTEGER NOT NULL,
      endSuffix INTEGER NOT NULL,
      gatewaySuffix INTEGER NOT NULL,
      broadcastSuffix INTEGER NOT NULL,
      FOREIGN KEY (networkId) REFERENCES networks(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      requester TEXT NOT NULL,
      requesterId TEXT,
      technician TEXT,
      technicianIds TEXT,
      technicalObservations TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      incidentId TEXT,
      sla INTEGER,
      description TEXT,
      solution TEXT,
      startedAt TEXT,
      finishedAt TEXT,
      closedAt TEXT,
      createdAt TEXT NOT NULL,
      departmentId TEXT,
      equipmentId TEXT
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sla INTEGER NOT NULL,
      priority TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id TEXT PRIMARY KEY,
      companyName TEXT,
      logoUrl TEXT
    );
  `);
  console.log('Database tables initialized successfully');

  // Migração: Adicionar equipmentId em ip_addresses se não existir
  try {
    const settingsCount = db.prepare("SELECT COUNT(*) as count FROM system_settings").get() as any;
    if (settingsCount.count === 0) {
      db.prepare("INSERT INTO system_settings (id, companyName, logoUrl) VALUES ('default', 'Sistema Integrado de Suporte de TI', '')").run();
    } else {
      // Atualiza se for o nome antigo
      db.prepare("UPDATE system_settings SET companyName = 'Sistema Integrado de Suporte de TI' WHERE id = 'default' AND companyName = 'HelpDesk Pro'").run();
    }

    const columns = db.prepare("PRAGMA table_info(ip_addresses)").all() as any[];
    const hasEquipmentId = columns.some(col => col.name === 'equipmentId');
    if (!hasEquipmentId) {
      db.exec("ALTER TABLE ip_addresses ADD COLUMN equipmentId TEXT");
      console.log('Migração: Coluna equipmentId adicionada em ip_addresses');
    }

    // Migração: Adicionar macAddress e responsible em equipments se não existirem
    const equipmentColumns = db.prepare("PRAGMA table_info(equipments)").all() as any[];
    if (!equipmentColumns.some(col => col.name === 'macAddress')) {
      db.exec("ALTER TABLE equipments ADD COLUMN macAddress TEXT");
      console.log('Migração: Coluna macAddress adicionada em equipments');
    }
    if (!equipmentColumns.some(col => col.name === 'responsible')) {
      db.exec("ALTER TABLE equipments ADD COLUMN responsible TEXT");
      console.log('Migração: Coluna responsible adicionada em equipments');
    }

    // Migração: Adicionar status em users se não existir
    const userColumns = db.prepare("PRAGMA table_info(users)").all() as any[];
    if (!userColumns.some(col => col.name === 'status')) {
      db.exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Ativo'");
      console.log('Migração: Coluna status adicionada em users');
    }
    if (!userColumns.some(col => col.name === 'theme')) {
      db.exec("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'system'");
      console.log('Migração: Coluna theme adicionada em users');
    }
    if (!userColumns.some(col => col.name === 'colorPalette')) {
      db.exec("ALTER TABLE users ADD COLUMN colorPalette TEXT DEFAULT 'blue'");
      console.log('Migração: Coluna colorPalette adicionada em users');
    }
    if (!userColumns.some(col => col.name === 'bio')) {
      db.exec("ALTER TABLE users ADD COLUMN bio TEXT");
      console.log('Migração: Coluna bio adicionada em users');
    }
    if (!userColumns.some(col => col.name === 'avatarUrl')) {
      db.exec("ALTER TABLE users ADD COLUMN avatarUrl TEXT");
      console.log('Migração: Coluna avatarUrl adicionada em users');
    }
    if (!userColumns.some(col => col.name === 'contactNumber')) {
      db.exec("ALTER TABLE users ADD COLUMN contactNumber TEXT");
      console.log('Migração: Coluna contactNumber adicionada em users');
    }
    if (!userColumns.some(col => col.name === 'extension')) {
      db.exec("ALTER TABLE users ADD COLUMN extension TEXT");
      console.log('Migração: Coluna extension adicionada em users');
    }

    // Migração: Adicionar novas colunas na tabela tickets
    const ticketColumns = db.prepare("PRAGMA table_info(tickets)").all() as any[];
    if (!ticketColumns.some(col => col.name === 'requesterId')) {
      db.exec("ALTER TABLE tickets ADD COLUMN requesterId TEXT");
      console.log('Migração: Coluna requesterId adicionada em tickets');
    }
    if (!ticketColumns.some(col => col.name === 'solution')) {
      db.exec("ALTER TABLE tickets ADD COLUMN solution TEXT");
    }
    if (!ticketColumns.some(col => col.name === 'startedAt')) {
      db.exec("ALTER TABLE tickets ADD COLUMN startedAt TEXT");
    }
    if (!ticketColumns.some(col => col.name === 'finishedAt')) {
      db.exec("ALTER TABLE tickets ADD COLUMN finishedAt TEXT");
    }
    if (!ticketColumns.some(col => col.name === 'closedAt')) {
      db.exec("ALTER TABLE tickets ADD COLUMN closedAt TEXT");
    }
    if (!ticketColumns.some(col => col.name === 'incidentId')) {
      db.exec("ALTER TABLE tickets ADD COLUMN incidentId TEXT");
      console.log('Migration: Added incidentId column to tickets');
    }
    if (!ticketColumns.some(col => col.name === 'sla')) {
      db.exec("ALTER TABLE tickets ADD COLUMN sla INTEGER");
      console.log('Migration: Added sla column to tickets');
    }
    if (!ticketColumns.some(col => col.name === 'departmentId')) {
      db.exec("ALTER TABLE tickets ADD COLUMN departmentId TEXT");
      console.log('Migration: Added departmentId column to tickets');
    }
    if (!ticketColumns.some(col => col.name === 'equipmentId')) {
      db.exec("ALTER TABLE tickets ADD COLUMN equipmentId TEXT");
      console.log('Migration: Added equipmentId column to tickets');
    }
    if (!ticketColumns.some(col => col.name === 'branchId')) {
      db.exec("ALTER TABLE tickets ADD COLUMN branchId TEXT");
      console.log('Migration: Added branchId column to tickets');
    }
    if (!ticketColumns.some(col => col.name === 'technicianIds')) {
      db.exec("ALTER TABLE tickets ADD COLUMN technicianIds TEXT");
      console.log('Migration: Added technicianIds column to tickets');
    }
    if (!ticketColumns.some(col => col.name === 'technicalObservations')) {
      db.exec("ALTER TABLE tickets ADD COLUMN technicalObservations TEXT");
      console.log('Migration: Added technicalObservations column to tickets');
    }

    // Migração: Converter IDs de tickets para o formato TKT-XXX se ainda forem inteiros
    const ticketColumnsInfo = db.prepare("PRAGMA table_info(tickets)").all() as any[];
    const idColumnInfo = ticketColumnsInfo.find(col => col.name === 'id');
    if (idColumnInfo && idColumnInfo.type === 'INTEGER') {
      console.log('Migração: Convertendo IDs de tickets para o formato TKT-XXX');
      const allTickets = db.prepare("SELECT * FROM tickets").all() as any[];
      db.exec("ALTER TABLE tickets RENAME TO tickets_old");
      db.exec(`
        CREATE TABLE tickets (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          requester TEXT NOT NULL,
          requesterId TEXT,
          technician TEXT,
          technicianIds TEXT,
          technicalObservations TEXT,
          status TEXT NOT NULL,
          priority TEXT NOT NULL,
          incidentId TEXT,
          sla INTEGER,
          description TEXT,
          solution TEXT,
          startedAt TEXT,
          finishedAt TEXT,
          closedAt TEXT,
          createdAt TEXT NOT NULL,
          departmentId TEXT,
          equipmentId TEXT
        )
      `);
      const insertStmt = db.prepare(`
        INSERT INTO tickets (id, title, requester, requesterId, technician, technicianIds, technicalObservations, status, priority, incidentId, sla, description, solution, startedAt, finishedAt, closedAt, createdAt, departmentId, equipmentId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      allTickets.forEach(t => {
        const formattedId = `TKT-${t.id.toString().padStart(3, '0')}`;
        insertStmt.run(
          formattedId, t.title, t.requester, t.requesterId, t.technician, t.technicianIds, t.technicalObservations, 
          t.status, t.priority, t.incidentId, t.sla, t.description, t.solution, t.startedAt, t.finishedAt, t.closedAt, t.createdAt,
          t.departmentId, t.equipmentId
        );
      });
      db.exec("DROP TABLE tickets_old");
      console.log('Migração: IDs de tickets convertidos com sucesso');
    }

    // Migração: Adicionar jobTitle na tabela users
    const userColumns2 = db.prepare("PRAGMA table_info(users)").all() as any[];
    if (!userColumns2.some(col => col.name === 'jobTitle')) {
      db.exec("ALTER TABLE users ADD COLUMN jobTitle TEXT");
      console.log('Migração: Coluna jobTitle adicionada em users');
    }
    if (!userColumns2.some(col => col.name === 'contactNumber')) {
      db.exec("ALTER TABLE users ADD COLUMN contactNumber TEXT");
      console.log('Migração: Coluna contactNumber adicionada em users');
    }
    if (!userColumns2.some(col => col.name === 'extension')) {
      db.exec("ALTER TABLE users ADD COLUMN extension TEXT");
      console.log('Migração: Coluna extension adicionada em users');
    }

    // Migração: Adicionar assetNumber e responsibilityTerm na tabela equipments
    const equipmentColumns2 = db.prepare("PRAGMA table_info(equipments)").all() as any[];
    if (!equipmentColumns2.some(col => col.name === 'assetNumber')) {
      db.exec("ALTER TABLE equipments ADD COLUMN assetNumber TEXT");
      console.log('Migração: Coluna assetNumber adicionada em equipments');
    }
    if (!equipmentColumns2.some(col => col.name === 'responsibilityTerm')) {
      db.exec("ALTER TABLE equipments ADD COLUMN responsibilityTerm TEXT");
      console.log('Migração: Coluna responsibilityTerm adicionada em equipments');
    }

    // Migração: Adicionar city em branches
    const branchColumns = db.prepare("PRAGMA table_info(branches)").all() as any[];
    if (!branchColumns.some(col => col.name === 'city')) {
      db.exec("ALTER TABLE branches ADD COLUMN city TEXT");
      console.log('Migração: Coluna city adicionada em branches');
    }

    // Migração: Adicionar head em departments
    const deptColumns = db.prepare("PRAGMA table_info(departments)").all() as any[];
    if (!deptColumns.some(col => col.name === 'head')) {
      db.exec("ALTER TABLE departments ADD COLUMN head TEXT");
      console.log('Migração: Coluna head adicionada em departments');
    }
  } catch (migrationErr) {
    console.error('Migração falhou:', migrationErr);
  }
} catch (err) {
  console.error('Falha na inicialização do banco de dados:', err);
}

// Criar administrador padrão se não existir
try {
  const adminExists = db.prepare('SELECT * FROM users WHERE email = ?').get('admin@hpsvp.org.br');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
      '1',
      'Administrador do Sistema',
      'admin@hpsvp.org.br',
      hashedPassword,
      'Administrador'
    );
    console.log('Administrador padrão criado');
  } else if (adminExists.name === 'Administrador SISTI') {
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run('Administrador do Sistema', adminExists.id);
  }

  // Criar filiais e setores padrão
  const branchExists = db.prepare('SELECT * FROM branches WHERE id = ?').get('1');
  if (!branchExists) {
    db.prepare('INSERT INTO branches (id, name) VALUES (?, ?)').run('1', 'Matriz');
    db.prepare('INSERT INTO branches (id, name) VALUES (?, ?)').run('2', 'Filial SP');
    db.prepare('INSERT INTO branches (id, name) VALUES (?, ?)').run('3', 'Filial RJ');
    console.log('Filiais padrão criadas');
  }

  const deptExists = db.prepare('SELECT * FROM departments WHERE id = ?').get('1');
  if (!deptExists) {
    db.prepare('INSERT INTO departments (id, name, branchId) VALUES (?, ?, ?)').run('1', 'T.I', '1');
    db.prepare('INSERT INTO departments (id, name, branchId) VALUES (?, ?, ?)').run('2', 'Financeiro', '1');
    db.prepare('INSERT INTO departments (id, name, branchId) VALUES (?, ?, ?)').run('3', 'RH', '1');
    console.log('Setores padrão criados');
  }

  // Criar chamados padrão
  const ticketExists = db.prepare('SELECT * FROM tickets LIMIT 1').get();
  if (!ticketExists) {
    const now = new Date().toISOString();
    const tickets = [
      ['TKT-001', 'Sistema ERP fora do ar', 'João Silva', 'Maria Souza', 'Aberto', 'Urgente', 'O sistema ERP não está carregando para nenhum usuário.'],
      ['TKT-002', 'Troca de mouse', 'Ana Costa', 'Carlos Dias', 'Em Andamento', 'Baixa', 'O mouse da estação 04 está com falha no clique.'],
      ['TKT-003', 'Acesso ao e-mail corporativo', 'Pedro Alves', 'Maria Souza', 'Resolvido', 'Média', 'Usuário não conseguia sincronizar o Outlook.'],
      ['TKT-004', 'Impressora atolando papel', 'Lucas Lima', null, 'Aberto', 'Média', 'A printer do RH está atolando papel constantemente.'],
    ];
    const stmt = db.prepare('INSERT INTO tickets (id, title, requester, technician, status, priority, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    tickets.forEach(t => stmt.run(...t, now));
    console.log('Chamados padrão criados');
  }
} catch (err) {
  console.error('Falha ao criar administrador:', err);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  
  // Segurança com Helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Desabilitado temporariamente para não quebrar o Vite no dev
    crossOriginEmbedderPolicy: false,
  }));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 15000, // Limite de 15000 requisições por IP por janela
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });
  app.use('/api/', limiter);

  // Rate Limiting mais restrito para login
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Limite de 10 tentativas de login por IP
    message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
  });

  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL || true : true,
    credentials: true
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());

  // Middleware de Autenticação
  const authenticateToken = (req: any, res: any, next: any) => {
    try {
      let token = req.cookies?.token;
      
      if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      if (!token) {
        if (req.path !== '/api/auth/me') {
          console.log(`Falha na autenticação: Nenhum token encontrado para ${req.method} ${req.path}`);
        }
        return res.status(401).json({ message: 'Não autorizado' });
      }

      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) {
          return res.status(403).json({ message: 'Token inválido ou expirado', error: err.name });
        }
        req.user = user;
        next();
      });
    } catch (err) {
      console.error('Auth middleware error:', err);
      res.status(500).json({ message: 'Erro interno na autenticação' });
    }
  };

  // Middlewares de Autorização
  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'Administrador') {
      return res.status(403).json({ message: 'Acesso negado: Requer privilégios de Administrador' });
    }
    next();
  };

  const isTechnicianOrAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'Administrador' && req.user?.role !== 'Técnico') {
      return res.status(403).json({ message: 'Acesso negado: Requer privilégios de Técnico ou Administrador' });
    }
    next();
  };

  // Helper para sanitização de inputs
  const sanitize = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const sanitized: any = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = obj[key].trim();
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  };

  app.get('/api/search', authenticateToken, (req: any, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string' || q.length < 2) {
        return res.json([]);
      }

      const term = `%${q}%`;
      const results: any[] = [];

      // Buscar Chamados (Todos podem buscar, mas resultados podem ser filtrados se necessário)
      const tickets = db.prepare(`
        SELECT id, title, description as subtitle, 'ticket' as type 
        FROM tickets 
        WHERE id LIKE ? OR title LIKE ? OR description LIKE ?
        LIMIT 5
      `).all(term, term, term);
      results.push(...tickets);

      // Buscar Usuários (Apenas Técnicos e Admins podem buscar outros usuários detalhadamente)
      if (req.user.role !== 'Usuário') {
        const users = db.prepare(`
          SELECT id, name as title, email as subtitle, 'user' as type 
          FROM users 
          WHERE name LIKE ? OR email LIKE ?
          LIMIT 5
        `).all(term, term);
        results.push(...users);
      }

      // Buscar Equipamentos (Apenas Técnicos e Admins)
      if (req.user.role !== 'Usuário') {
        const equipments = db.prepare(`
          SELECT id, name as title, type || ' - ' || COALESCE(serialNumber, 'S/N') as subtitle, 'equipment' as type 
          FROM equipments 
          WHERE name LIKE ? OR serialNumber LIKE ? OR assetNumber LIKE ?
          LIMIT 5
        `).all(term, term, term);
        results.push(...equipments);
      }

      res.json(results);
    } catch (err) {
      console.error('Search error:', err);
      res.status(500).json({ message: 'Erro ao realizar busca' });
    }
  });

  // Rota de Verificação de Saúde (Health Check)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Error().stack });
  });

  // Rotas de Autenticação
  app.post('/api/auth/login', loginLimiter, async (req, res) => {
    try {
      const { email, password } = sanitize(req.body);
      
      if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

      if (!user) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos' });
      }

      if (user.status === 'Inativo') {
        return res.status(403).json({ message: 'Usuário inativo. Contate o administrador.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const isSecureCookie = process.env.NODE_ENV === 'production' && String(process.env.FRONTEND_URL || '').startsWith('https');
      res.cookie('token', token, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: isSecureCookie ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      console.error('Erro no login:', err);
      res.status(500).json({ message: 'Erro ao realizar login' });
    }
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    try {
      const user = db.prepare('SELECT id, name, email, role, branchId, departmentId, status, jobTitle, contactNumber, extension, bio, avatarUrl, theme, colorPalette FROM users WHERE id = ?').get(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      res.json({ user });
    } catch (err) {
      console.error('Error fetching current user:', err);
      res.status(500).json({ message: 'Erro ao buscar dados do usuário' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const isSecureCookie = process.env.NODE_ENV === 'production' && String(process.env.FRONTEND_URL || '').startsWith('https');
    res.clearCookie('token', { secure: isSecureCookie, sameSite: isSecureCookie ? 'none' : 'lax' });
    res.json({ message: 'Logout realizado com sucesso' });
  });

  // Rotas de Usuário
  app.get('/api/users', authenticateToken, (req, res) => {
    try {
      const users = db.prepare('SELECT id, name, email, role, branchId, departmentId, status, jobTitle, contactNumber, extension, bio, avatarUrl FROM users').all();
      res.json(users);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      res.status(500).json({ message: 'Erro ao buscar usuários' });
    }
  });

  app.get('/api/users/:id', authenticateToken, (req, res) => {
    try {
      const user = db.prepare('SELECT id, name, email, role, branchId, departmentId, status, jobTitle, contactNumber, extension, bio, avatarUrl FROM users WHERE id = ?').get(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      res.json(user);
    } catch (err) {
      console.error('Error fetching user:', err);
      res.status(500).json({ message: 'Erro ao buscar usuário' });
    }
  });

  app.post('/api/users', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { name, email, password, role, branchId, departmentId, jobTitle, contactNumber, extension } = sanitize(req.body);
      
      if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Nome, e-mail, senha e nível de acesso são obrigatórios' });
      }

      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existingUser) {
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = crypto.randomUUID();
      
      db.prepare(`
        INSERT INTO users (id, name, email, password, role, branchId, departmentId, jobTitle, contactNumber, extension, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Ativo')
      `).run(id, name, email, hashedPassword, role, branchId || null, departmentId || null, jobTitle || null, contactNumber || null, extension || null);
      
      res.status(201).json({ message: 'Usuário criado com sucesso', id });
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      res.status(500).json({ message: 'Erro ao criar usuário' });
    }
  });

  app.put('/api/users/:id', authenticateToken, async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { name, email, password, role, branchId, departmentId, jobTitle, contactNumber, extension, bio, avatarUrl } = sanitize(req.body);
      
      if (!name || !email || !role) {
        return res.status(400).json({ message: 'Nome, e-mail e nível de acesso são obrigatórios' });
      }

      // Segurança: Apenas administradores podem editar outros usuários, ou o próprio usuário pode editar seu perfil (limitado)
      if (req.user.role !== 'Administrador' && req.user.id !== id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const userToEdit = db.prepare('SELECT role FROM users WHERE id = ?').get(id) as { role: string };
      if (req.user.role === 'Técnico' && userToEdit?.role === 'Administrador' && req.user.id !== id) {
        return res.status(403).json({ message: 'Técnicos não podem editar administradores' });
      }

      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
      if (existingUser) {
        return res.status(400).json({ message: 'E-mail já utilizado por outro usuário' });
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.prepare(`
          UPDATE users SET name = ?, email = ?, password = ?, role = ?, branchId = ?, departmentId = ?, jobTitle = ?, contactNumber = ?, extension = ?, bio = ?, avatarUrl = ?
          WHERE id = ?
        `).run(name, email, hashedPassword, role, branchId || null, departmentId || null, jobTitle || null, contactNumber || null, extension || null, bio || null, avatarUrl || null, id);
      } else {
        db.prepare(`
          UPDATE users SET name = ?, email = ?, role = ?, branchId = ?, departmentId = ?, jobTitle = ?, contactNumber = ?, extension = ?, bio = ?, avatarUrl = ?
          WHERE id = ?
        `).run(name, email, role, branchId || null, departmentId || null, jobTitle || null, contactNumber || null, extension || null, bio || null, avatarUrl || null, id);
      }
      
      res.json({ message: 'Usuário atualizado com sucesso' });
    } catch (err) {
      console.error('Error updating user:', err);
      res.status(500).json({ message: 'Erro ao atualizar usuário' });
    }
  });

  app.put('/api/users/:id/status', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { status } = sanitize(req.body);
      
      if (id === '1') {
        return res.status(403).json({ message: 'O status do administrador principal não pode ser alterado' });
      }

      if (status !== 'Ativo' && status !== 'Inativo') {
        return res.status(400).json({ message: 'Status inválido' });
      }

      db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
      res.json({ message: 'Status do usuário atualizado' });
    } catch (err) {
      console.error('Error updating user status:', err);
      res.status(500).json({ message: 'Erro ao atualizar status do usuário' });
    }
  });

  app.delete('/api/users/:id', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      if (id === '1') {
        return res.status(403).json({ message: 'O administrador principal não pode ser excluído' });
      }

      const userToDelete = db.prepare('SELECT role FROM users WHERE id = ?').get(id) as { role: string };
      
      // Previne a exclusão do último administrador
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Administrador'").get() as { count: number };
      
      if (userToDelete?.role === 'Administrador' && adminCount.count <= 1) {
        return res.status(400).json({ message: 'Não é possível excluir o único administrador do sistema' });
      }

      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      res.json({ message: 'Usuário excluído com sucesso' });
    } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ message: 'Erro ao excluir usuário' });
    }
  });

  app.put('/api/users/:id/preferences', authenticateToken, (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { theme, colorPalette } = sanitize(req.body);
      
      // Segurança: Usuário só pode editar suas próprias preferências
      if (req.user.id !== id) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      
      db.prepare('UPDATE users SET theme = COALESCE(?, theme), colorPalette = COALESCE(?, colorPalette) WHERE id = ?').run(theme ?? null, colorPalette ?? null, id);
      res.json({ message: 'Preferências atualizadas' });
    } catch (err) {
      console.error('Error updating user preferences:', err);
      res.status(500).json({ message: 'Erro ao atualizar preferências' });
    }
  });

  // Rotas de Incidentes
  app.get('/api/incidents', authenticateToken, (req, res) => {
    try {
      const incidents = db.prepare('SELECT * FROM incidents ORDER BY name ASC').all();
      res.json(incidents);
    } catch (err) {
      console.error('Erro ao buscar incidentes:', err);
      res.status(500).json({ message: 'Erro ao buscar incidentes' });
    }
  });

  app.post('/api/incidents', authenticateToken, (req: any, res: any) => {
    try {
      if (req.user.role === 'Usuário') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      const { id, name, sla, priority } = req.body;
      
      if (!name || !sla || !priority) {
        return res.status(400).json({ message: 'Nome, SLA e prioridade são obrigatórios' });
      }

      const incidentId = id || crypto.randomUUID();
      db.prepare('INSERT INTO incidents (id, name, sla, priority) VALUES (?, ?, ?, ?)').run(
        incidentId,
        name,
        sla,
        priority
      );
      res.status(201).json({ message: 'Incidente criado com sucesso', id: incidentId });
    } catch (err) {
      console.error('Error creating incident:', err);
      res.status(500).json({ message: 'Erro ao criar incidente' });
    }
  });

  app.put('/api/incidents/:id', authenticateToken, isTechnicianOrAdmin, (req: any, res: any) => {
    try {
      const { name, sla, priority } = sanitize(req.body);
      
      if (!name || !sla || !priority) {
        return res.status(400).json({ message: 'Nome, SLA e prioridade são obrigatórios' });
      }

      db.prepare('UPDATE incidents SET name = ?, sla = ?, priority = ? WHERE id = ?').run(
        name,
        sla,
        priority,
        req.params.id
      );
      res.json({ message: 'Incidente atualizado com sucesso' });
    } catch (err) {
      console.error('Error updating incident:', err);
      res.status(500).json({ message: 'Erro ao atualizar incidente' });
    }
  });

  app.delete('/api/incidents/:id', authenticateToken, isTechnicianOrAdmin, (req: any, res: any) => {
    try {
      db.prepare('DELETE FROM incidents WHERE id = ?').run(req.params.id);
      res.json({ message: 'Incidente excluído com sucesso' });
    } catch (err) {
      console.error('Error deleting incident:', err);
      res.status(500).json({ message: 'Erro ao excluir incidente' });
    }
  });

  // Rotas de Configurações do Sistema
  app.get('/api/settings', (req, res) => {
    try {
      const settings = db.prepare("SELECT * FROM system_settings WHERE id = 'default'").get();
      res.json(settings || { companyName: 'Sistema Integrado de Suporte de TI', logoUrl: '' });
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
      res.status(500).json({ message: 'Erro ao buscar configurações' });
    }
  });

  app.put('/api/settings', authenticateToken, (req: any, res) => {
    try {
      if (req.user?.role !== 'Administrador') {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      const { companyName, logoUrl } = req.body;
      
      if (!companyName) {
        return res.status(400).json({ message: 'Nome da empresa é obrigatório' });
      }

      db.prepare("UPDATE system_settings SET companyName = ?, logoUrl = ? WHERE id = 'default'").run(companyName, logoUrl);
      res.json({ message: 'Configurações atualizadas' });
    } catch (err) {
      console.error('Error updating settings:', err);
      res.status(500).json({ message: 'Erro ao atualizar configurações' });
    }
  });

  // Rotas de Filiais e Setores
  app.get('/api/branches', authenticateToken, (req, res) => {
    try {
      const branches = db.prepare('SELECT * FROM branches ORDER BY name ASC').all();
      res.json(branches);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao buscar filiais' });
    }
  });

  app.post('/api/branches', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      const { name, city } = sanitize(req.body);
      
      if (!name) {
        return res.status(400).json({ message: 'Nome da filial é obrigatório' });
      }

      const id = crypto.randomUUID();
      db.prepare('INSERT INTO branches (id, name, city) VALUES (?, ?, ?)').run(id, name, city || null);
      res.status(201).json({ message: 'Filial criada com sucesso', id });
    } catch (err) {
      console.error('Erro ao criar filial:', err);
      res.status(500).json({ message: 'Erro ao criar filial' });
    }
  });

  app.put('/api/branches/:id', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      const { name, city } = sanitize(req.body);
      
      if (!name) {
        return res.status(400).json({ message: 'Nome da filial é obrigatório' });
      }

      db.prepare('UPDATE branches SET name = ?, city = ? WHERE id = ?').run(name, city || null, req.params.id);
      res.json({ message: 'Filial atualizada com sucesso' });
    } catch (err) {
      console.error('Erro ao atualizar filial:', err);
      res.status(500).json({ message: 'Erro ao atualizar filial' });
    }
  });

  app.delete('/api/branches/:id', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      db.prepare('DELETE FROM branches WHERE id = ?').run(req.params.id);
      res.json({ message: 'Filial excluída com sucesso' });
    } catch (err) {
      console.error('Erro ao excluir filial:', err);
      res.status(500).json({ message: 'Erro ao excluir filial' });
    }
  });

  app.get('/api/departments', authenticateToken, (req, res) => {
    try {
      const { branchId } = req.query;
      let departments;
      if (branchId) {
        departments = db.prepare('SELECT * FROM departments WHERE branchId = ? ORDER BY name ASC').all(branchId);
      } else {
        departments = db.prepare('SELECT * FROM departments ORDER BY name ASC').all();
      }
      res.json(departments);
    } catch (err) {
      res.status(500).json({ message: 'Erro ao buscar setores' });
    }
  });

  app.post('/api/departments', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      const { name, head, branchId } = sanitize(req.body);
      
      if (!name) {
        return res.status(400).json({ message: 'Nome do setor é obrigatório' });
      }

      const id = crypto.randomUUID();
      db.prepare('INSERT INTO departments (id, name, head, branchId) VALUES (?, ?, ?, ?)').run(id, name, head || null, branchId || null);
      res.status(201).json({ message: 'Setor criado com sucesso', id });
    } catch (err) {
      console.error('Erro ao criar setor:', err);
      res.status(500).json({ message: 'Erro ao criar setor' });
    }
  });

  app.put('/api/departments/:id', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      const { name, head, branchId } = sanitize(req.body);
      
      if (!name) {
        return res.status(400).json({ message: 'Nome do setor é obrigatório' });
      }

      db.prepare('UPDATE departments SET name = ?, head = ?, branchId = ? WHERE id = ?').run(name, head || null, branchId || null, req.params.id);
      res.json({ message: 'Setor atualizado com sucesso' });
    } catch (err) {
      console.error('Erro ao atualizar setor:', err);
      res.status(500).json({ message: 'Erro ao atualizar setor' });
    }
  });

  app.delete('/api/departments/:id', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      db.prepare('DELETE FROM departments WHERE id = ?').run(req.params.id);
      res.json({ message: 'Setor excluído com sucesso' });
    } catch (err) {
      console.error('Erro ao excluir setor:', err);
      res.status(500).json({ message: 'Erro ao excluir setor' });
    }
  });

  // Rotas de Redes
  app.get('/api/networks', authenticateToken, (req, res) => {
    try {
      const networks = db.prepare(`
        SELECT n.*, (SELECT COUNT(*) FROM ip_addresses WHERE networkId = n.id) as usedIps
        FROM networks n
      `).all();
      res.json(networks);
    } catch (err) {
      console.error('Erro ao buscar redes:', err);
      res.status(500).json({ message: 'Erro ao buscar redes' });
    }
  });

  app.post('/api/networks', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      const { id, name, baseIp, description } = sanitize(req.body);
      
      if (!name || !baseIp) {
        return res.status(400).json({ message: 'Nome e IP base são obrigatórios' });
      }

      db.prepare('INSERT INTO networks (id, name, baseIp, description) VALUES (?, ?, ?, ?)').run(id, name, baseIp, description);
      res.status(201).json({ message: 'Rede criada com sucesso' });
    } catch (error) {
      console.error('Erro ao criar rede:', error);
      res.status(500).json({ message: 'Erro ao criar rede no banco de dados' });
    }
  });

  app.put('/api/networks/:id', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      const { name, description } = sanitize(req.body);
      
      if (!name) {
        return res.status(400).json({ message: 'Nome é obrigatório' });
      }

      db.prepare('UPDATE networks SET name = ?, description = ? WHERE id = ?').run(name, description, req.params.id);
      res.json({ message: 'Rede atualizada com sucesso' });
    } catch (err) {
      console.error('Erro ao atualizar rede:', err);
      res.status(500).json({ message: 'Erro ao atualizar rede' });
    }
  });

  app.delete('/api/networks/:id', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      const { id } = req.params;
      const deleteTransaction = db.transaction(() => {
        db.prepare('DELETE FROM ip_addresses WHERE networkId = ?').run(id);
        db.prepare('DELETE FROM subnets WHERE networkId = ?').run(id);
        db.prepare('DELETE FROM networks WHERE id = ?').run(id);
      });
      deleteTransaction();
      res.json({ message: 'Rede excluída com sucesso' });
    } catch (err) {
      console.error('Erro ao excluir rede:', err);
      res.status(500).json({ message: 'Erro ao excluir rede' });
    }
  });

  app.get('/api/networks/:id/ips', authenticateToken, (req, res) => {
    try {
      const ips = db.prepare('SELECT * FROM ip_addresses WHERE networkId = ?').all(req.params.id);
      res.json(ips);
    } catch (err) {
      console.error('Erro ao buscar IPs:', err);
      res.status(500).json({ message: 'Erro ao buscar IPs' });
    }
  });

  app.get('/api/networks/:id/subnets', authenticateToken, (req, res) => {
    try {
      const subnets = db.prepare('SELECT * FROM subnets WHERE networkId = ?').all(req.params.id);
      res.json(subnets);
    } catch (err) {
      console.error('Erro ao buscar sub-redes:', err);
      res.status(500).json({ message: 'Erro ao buscar sub-redes' });
    }
  });

  app.get('/api/subnets', authenticateToken, (req, res) => {
    try {
      const subnets = db.prepare(`
        SELECT s.*, n.baseIp,
               (SELECT COUNT(*) FROM ip_addresses 
                WHERE networkId = s.networkId 
                AND ipSuffix >= s.startSuffix 
                AND ipSuffix <= s.endSuffix) as usedIps
        FROM subnets s
        JOIN networks n ON s.networkId = n.id
      `).all();
      res.json(subnets);
    } catch (err) {
      console.error('Erro ao buscar todas as sub-redes:', err);
      res.status(500).json({ message: 'Erro ao buscar todas as sub-redes' });
    }
  });

  app.post('/api/networks/:id/subnets/divide', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      const { cidr } = sanitize(req.body);
      const networkId = req.params.id;
      
      if (![25, 26, 27, 28, 29, 30].includes(cidr)) {
        return res.status(400).json({ message: 'CIDR inválido. Use entre /25 e /30' });
      }

      const size = Math.pow(2, 32 - cidr);
      const count = 256 / size;

      const divideTransaction = db.transaction(() => {
        // Limpar sub-redes existentes para esta rede
        db.prepare('DELETE FROM subnets WHERE networkId = ?').run(networkId);

        for (let i = 0; i < count; i++) {
          const startSuffix = i * size;
          const endSuffix = (i + 1) * size - 1;
          const gatewaySuffix = startSuffix + 1;
          const broadcastSuffix = endSuffix;
          const name = `Sub-rede ${i + 1} (/${cidr})`;
          const id = `${networkId}_sub_${i}`;

          db.prepare(`
            INSERT INTO subnets (id, networkId, name, cidr, startSuffix, endSuffix, gatewaySuffix, broadcastSuffix)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(id, networkId, name, cidr, startSuffix, endSuffix, gatewaySuffix, broadcastSuffix);
        }
      });

      divideTransaction();
      res.json({ message: 'Rede dividida com sucesso' });
    } catch (err) {
      console.error('Erro ao dividir rede:', err);
      res.status(500).json({ message: 'Erro ao dividir rede' });
    }
  });

  app.delete('/api/networks/:id/subnets', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      db.prepare('DELETE FROM subnets WHERE networkId = ?').run(req.params.id);
      res.json({ message: 'Sub-redes removidas com sucesso' });
    } catch (err) {
      console.error('Erro ao remover sub-redes:', err);
      res.status(500).json({ message: 'Erro ao remover sub-redes' });
    }
  });

  app.put('/api/subnets/:id', authenticateToken, isAdmin, (req: any, res: any) => {
    try {
      const { name } = sanitize(req.body);
      
      if (!name) {
        return res.status(400).json({ message: 'Nome da sub-rede é obrigatório' });
      }

      db.prepare('UPDATE subnets SET name = ? WHERE id = ?').run(name, req.params.id);
      res.json({ message: 'Sub-rede atualizada com sucesso' });
    } catch (err) {
      console.error('Erro ao atualizar sub-rede:', err);
      res.status(500).json({ message: 'Erro ao atualizar sub-rede' });
    }
  });

  app.post('/api/ips', authenticateToken, isTechnicianOrAdmin, (req, res) => {
    try {
      const { networkId, ipSuffix, hostName, deviceType, macAddress, sector, responsible, description, equipmentId } = sanitize(req.body);
      
      if (!networkId || ipSuffix === undefined) {
        return res.status(400).json({ message: 'Rede e sufixo IP são obrigatórios' });
      }

      const id = `${networkId}_${ipSuffix}`;
      const updatedAt = new Date().toISOString();
      const eqId = equipmentId || null;

      db.prepare(`
        INSERT INTO ip_addresses (id, networkId, ipSuffix, hostName, deviceType, macAddress, sector, responsible, description, equipmentId, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          hostName = excluded.hostName,
          deviceType = excluded.deviceType,
          macAddress = excluded.macAddress,
          sector = excluded.sector,
          responsible = excluded.responsible,
          description = excluded.description,
          equipmentId = excluded.equipmentId,
          updatedAt = excluded.updatedAt
      `).run(id, networkId, ipSuffix, hostName, deviceType, macAddress, sector, responsible, description, eqId, updatedAt);

      res.json({ message: 'IP atualizado com sucesso' });
    } catch (err) {
      console.error('Erro ao atualizar IP:', err);
      res.status(500).json({ message: 'Erro ao atualizar IP' });
    }
  });

  // Rotas de Equipamentos
  app.get('/api/equipments', authenticateToken, (req, res) => {
    try {
      const equipments = db.prepare(`
        SELECT e.*, b.name as branchName, d.name as departmentName,
               n.baseIp || '.' || ip.ipSuffix as ipAddress
        FROM equipments e
        LEFT JOIN branches b ON e.branchId = b.id
        LEFT JOIN departments d ON e.departmentId = d.id
        LEFT JOIN ip_addresses ip ON e.id = ip.equipmentId
        LEFT JOIN networks n ON ip.networkId = n.id
      `).all();
      res.json(equipments);
    } catch (err) {
      console.error('Erro ao buscar equipamentos:', err);
      res.status(500).json({ message: 'Erro ao buscar equipamentos' });
    }
  });

  app.get('/api/equipments/:id', authenticateToken, (req, res) => {
    try {
      const equipment = db.prepare(`
        SELECT e.*, b.name as branchName, d.name as departmentName,
               n.baseIp || '.' || ip.ipSuffix as ipAddress
        FROM equipments e
        LEFT JOIN branches b ON e.branchId = b.id
        LEFT JOIN departments d ON e.departmentId = d.id
        LEFT JOIN ip_addresses ip ON e.id = ip.equipmentId
        LEFT JOIN networks n ON ip.networkId = n.id
        WHERE e.id = ?
      `).get(req.params.id);
      if (!equipment) {
        return res.status(404).json({ message: 'Equipamento não encontrado' });
      }
      res.json(equipment);
    } catch (err) {
      console.error('Erro ao buscar equipamento:', err);
      res.status(500).json({ message: 'Erro ao buscar equipamento' });
    }
  });

  app.post('/api/equipments', authenticateToken, isTechnicianOrAdmin, (req, res) => {
    try {
      const { 
        id, name, type, serialNumber, model, manufacturer, 
        purchaseDate, warrantyUntil, status, branchId, 
        departmentId, macAddress, responsible, description,
        assetNumber, responsibilityTerm
      } = sanitize(req.body);
      
      if (!name || !type || !status) {
        return res.status(400).json({ message: 'Nome, tipo e status são obrigatórios' });
      }

      const now = new Date().toISOString();
      const equipmentId = id || crypto.randomUUID();

      // Tratar strings vazias para chaves estrangeiras
      const bId = branchId || null;
      const dId = departmentId || null;

      db.prepare(`
        INSERT INTO equipments (
          id, name, type, serialNumber, model, manufacturer, 
          purchaseDate, warrantyUntil, status, branchId, 
          departmentId, macAddress, responsible, description, 
          assetNumber, responsibilityTerm, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        equipmentId, name, type, serialNumber, model, manufacturer, 
        purchaseDate, warrantyUntil, status, bId, 
        dId, macAddress, responsible, description, 
        assetNumber || null, responsibilityTerm || null, now, now
      );
      
      res.status(201).json({ message: 'Equipamento cadastrado com sucesso', id: equipmentId });
    } catch (error) {
      console.error('Erro ao criar equipamento:', error);
      res.status(500).json({ message: 'Erro ao cadastrar equipamento' });
    }
  });

  app.put('/api/equipments/:id', authenticateToken, isTechnicianOrAdmin, (req, res) => {
    try {
      const { id } = req.params;
      const { 
        name, type, serialNumber, model, manufacturer, 
        purchaseDate, warrantyUntil, status, branchId, 
        departmentId, macAddress, responsible, description,
        assetNumber, responsibilityTerm
      } = sanitize(req.body);
      
      if (!name || !type || !status) {
        return res.status(400).json({ message: 'Nome, tipo e status são obrigatórios' });
      }

      const now = new Date().toISOString();
      const bId = branchId || null;
      const dId = departmentId || null;

      const result = db.prepare(`
        UPDATE equipments SET 
          name = ?, type = ?, serialNumber = ?, model = ?, manufacturer = ?, 
          purchaseDate = ?, warrantyUntil = ?, status = ?, branchId = ?, 
          departmentId = ?, macAddress = ?, responsible = ?, description = ?, 
          assetNumber = ?, responsibilityTerm = ?, updatedAt = ?
        WHERE id = ?
      `).run(
        name, type, serialNumber, model, manufacturer, 
        purchaseDate, warrantyUntil, status, bId, 
        dId, macAddress, responsible, description, 
        assetNumber || null, responsibilityTerm || null, now, id
      );

      if (result.changes > 0) {
        res.json({ message: 'Equipamento atualizado com sucesso' });
      } else {
        res.status(404).json({ message: 'Equipamento não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error);
      res.status(500).json({ message: 'Erro ao atualizar equipamento' });
    }
  });

  app.delete('/api/equipments/:id', authenticateToken, (req: any, res: any) => {
    try {
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'Apenas administradores podem excluir equipamentos' });
      }
      const { id } = req.params;
      
      const deleteTransaction = db.transaction(() => {
        // Também limpa o equipmentId em ip_addresses
        db.prepare('UPDATE ip_addresses SET equipmentId = NULL WHERE equipmentId = ?').run(id);
        return db.prepare('DELETE FROM equipments WHERE id = ?').run(id);
      });

      const result = deleteTransaction();

      if (result.changes > 0) {
        res.json({ message: 'Equipamento excluído com sucesso' });
      } else {
        res.status(404).json({ message: 'Equipamento não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao excluir equipamento:', error);
      res.status(500).json({ message: 'Erro ao excluir equipamento' });
    }
  });

  // Rotas de Chamados (Tickets)
  app.get('/api/tickets', authenticateToken, (req, res) => {
    try {
      const tickets = db.prepare(`
        SELECT t.*, u.jobTitle as requesterJobTitle, d.name as departmentName, i.name as incidentName, e.name as equipmentName, b.name as branchName
        FROM tickets t
        LEFT JOIN users u ON t.requesterId = u.id
        LEFT JOIN departments d ON t.departmentId = d.id
        LEFT JOIN incidents i ON t.incidentId = i.id
        LEFT JOIN equipments e ON t.equipmentId = e.id
        LEFT JOIN branches b ON t.branchId = b.id
        ORDER BY t.createdAt DESC, t.id DESC
      `).all();
      res.json(tickets);
    } catch (err) {
      console.error('Erro ao buscar chamados:', err);
      res.status(500).json({ message: 'Erro ao buscar chamados' });
    }
  });

  app.get('/api/tickets/:id', authenticateToken, (req, res) => {
    try {
      const ticket = db.prepare(`
        SELECT t.*, u.jobTitle as requesterJobTitle, d.name as departmentName, i.name as incidentName, e.name as equipmentName, b.name as branchName
        FROM tickets t
        LEFT JOIN users u ON t.requesterId = u.id
        LEFT JOIN departments d ON t.departmentId = d.id
        LEFT JOIN incidents i ON t.incidentId = i.id
        LEFT JOIN equipments e ON t.equipmentId = e.id
        LEFT JOIN branches b ON t.branchId = b.id
        WHERE t.id = ?
      `).get(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: 'Chamado não encontrado' });
      }
      res.json(ticket);
    } catch (err) {
      console.error('Erro ao buscar chamado:', err);
      res.status(500).json({ message: 'Erro ao buscar chamado' });
    }
  });

  app.post('/api/tickets', authenticateToken, (req: any, res) => {
    try {
      const { title, requester, requesterId, status, priority, incidentId, sla, departmentId, branchId, equipmentId, description } = sanitize(req.body);
      
      if (!title || !description) {
        return res.status(400).json({ message: 'Título e descrição são obrigatórios' });
      }

      const now = new Date().toISOString();
      const rId = requesterId || req.user?.id || null;
      
      // Obter o próximo ID
      const lastTicket = db.prepare("SELECT id FROM tickets ORDER BY CAST(SUBSTR(id, 5) AS INTEGER) DESC LIMIT 1").get() as { id: string } | undefined;
      let nextIdNum = 1;
      if (lastTicket) {
        const lastIdNum = parseInt(lastTicket.id.split('-')[1]);
        nextIdNum = lastIdNum + 1;
      }
      const nextId = `TKT-${nextIdNum.toString().padStart(3, '0')}`;

      db.prepare(`
        INSERT INTO tickets (id, title, requester, requesterId, status, priority, incidentId, sla, departmentId, branchId, equipmentId, description, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(nextId, title, requester, rId, status || 'Aberto', priority || 'Média', incidentId || null, sla || null, departmentId || null, branchId || null, equipmentId || null, description, now);
      
      res.status(201).json({ message: 'Chamado criado com sucesso', id: nextId });
    } catch (err) {
      console.error('Erro ao criar chamado:', err);
      res.status(500).json({ message: 'Erro ao criar chamado' });
    }
  });

  app.put('/api/tickets/:id', authenticateToken, (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { title, priority, description, status, technician, solution, startedAt, finishedAt, closedAt, equipmentId, technicalObservations, technicianIds } = sanitize(req.body);

      db.prepare(`
        UPDATE tickets SET 
          title = COALESCE(?, title),
          priority = COALESCE(?, priority),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          technician = COALESCE(?, technician),
          technicianIds = COALESCE(?, technicianIds),
          technicalObservations = COALESCE(?, technicalObservations),
          solution = COALESCE(?, solution),
          startedAt = COALESCE(?, startedAt),
          finishedAt = COALESCE(?, finishedAt),
          closedAt = COALESCE(?, closedAt),
          equipmentId = COALESCE(?, equipmentId)
        WHERE id = ?
      `).run(
        title ?? null, 
        priority ?? null, 
        description ?? null, 
        status ?? null, 
        technician ?? null, 
        technicianIds ?? null,
        technicalObservations ?? null,
        solution ?? null, 
        startedAt ?? null, 
        finishedAt ?? null, 
        closedAt ?? null, 
        equipmentId ?? null,
        id
      );

      res.json({ message: 'Chamado atualizado com sucesso' });
    } catch (err) {
      console.error('Erro ao atualizar chamado:', err);
      res.status(500).json({ message: 'Erro ao atualizar chamado' });
    }
  });

  app.delete('/api/tickets/:id', authenticateToken, (req: any, res: any) => {
    try {
      if (req.user.role !== 'Administrador') {
        return res.status(403).json({ message: 'Apenas administradores podem excluir chamados' });
      }
      const { id } = req.params;
      const result = db.prepare('DELETE FROM tickets WHERE id = ?').run(id);
      
      if (result.changes > 0) {
        res.json({ message: 'Chamado excluído com sucesso' });
      } else {
        res.status(404).json({ message: 'Chamado não encontrado' });
      }
    } catch (err) {
      console.error('Erro ao excluir chamado:', err);
      res.status(500).json({ message: 'Erro ao excluir chamado' });
    }
  });

  // Middleware Vite para desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
