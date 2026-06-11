const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'sisti.db');
console.log(`Abrindo banco de dados em: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('foreign_keys = OFF'); // Desativa FKeys temporariamente para limpeza limpa

function getColumns(tableName) {
  try {
    const info = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return info.map(col => col.name);
  } catch (err) {
    console.error(`Erro ao buscar colunas da tabela ${tableName}:`, err);
    return [];
  }
}

function insertRow(tableName, data) {
  const tableCols = getColumns(tableName);
  const keys = Object.keys(data).filter(key => tableCols.includes(key));
  if (keys.length === 0) return null;
  
  const placeholders = keys.map(() => '?').join(', ');
  const insertQuery = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`;
  const stmt = db.prepare(insertQuery);
  const values = keys.map(key => data[key]);
  return stmt.run(...values);
}

// 1. Ler usuários existentes para preservação
let existingUsers = [];
try {
  existingUsers = db.prepare('SELECT * FROM users').all();
  console.log(`Encontrados ${existingUsers.length} usuários existentes na tabela para preservação.`);
  existingUsers.forEach(u => {
    console.log(`- Preservando: ${u.name} (${u.email}) - Perfil: ${u.role}`);
  });
} catch (err) {
  console.log('Tabela de usuários não existia ou estava vazia. Criando estrutura...');
}

// 2. Limpar todas as tabelas para re-população
const tablesToClear = [
  'branches',
  'departments',
  'networks',
  'ip_addresses',
  'equipments',
  'subnets',
  'tickets',
  'incidents',
  'users',
  'system_settings'
];

console.log('Limpando dados antigos das tabelas...');
db.transaction(() => {
  tablesToClear.forEach(table => {
    try {
      db.prepare(`DELETE FROM ${table}`).run();
      console.log(`  Tabela ${table} limpa.`);
    } catch (err) {
      console.log(`  Erro ao limpar a tabela ${table} (pode ainda não ter sido criada pelo servidor):`, err.message);
    }
  });
})();

// Re-criar tabelas de backup e instâncias principais se não criadas
db.exec(`
  CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    companyName TEXT,
    logoUrl TEXT
  );
`);

// 3. Cadastrar Configurações do Sistema
insertRow('system_settings', {
  id: 'default',
  companyName: 'Sistema Integrado de Suporte de TI',
  logoUrl: ''
});

// 4. Cadastrar Filiais (Branches)
const branches = [
  { id: '1', name: 'Matriz - São Paulo', city: 'São Paulo' },
  { id: '2', name: 'Filial - Rio de Janeiro', city: 'Rio de Janeiro' },
  { id: '3', name: 'Filial - Belo Horizonte', city: 'Belo Horizonte' },
  { id: '4', name: 'Filial - Curitiba', city: 'Curitiba' }
];

console.log('Inserindo Filiais...');
branches.forEach(b => insertRow('branches', b));

// 5. Cadastrar Setores (Departments)
const departments = [
  { id: 'dept-ti', name: 'Tecnologia da Informação', branchId: '1', head: 'Marcelo Fonseca' },
  { id: 'dept-fin', name: 'Financeiro', branchId: '1', head: 'Lúcia Albuquerque' },
  { id: 'dept-rh', name: 'Recursos Humanos', branchId: '1', head: 'Carla Mendes' },
  { id: 'dept-log', name: 'Logística', branchId: '2', head: 'Roberto Santos' },
  { id: 'dept-ps', name: 'Pronto Socorro', branchId: '1', head: 'Dr. André Martins' },
  { id: 'dept-fat', name: 'Faturamento', branchId: '1', head: 'Sonia Regina' },
  { id: 'dept-amb', name: 'Ambulatório', branchId: '3', head: 'Patrícia Souza' },
  { id: 'dept-adm', name: 'Administração Geral', branchId: '1', head: 'Renato Porto' }
];

console.log('Inserindo Setores...');
departments.forEach(d => insertRow('departments', d));

// 6. Cadastrar Usuários (Users)
const hashedDefaultPassword = bcrypt.hashSync('senha123', 10);
const usersToInsert = [
  // Administradores
  {
    id: 'user-admin-1',
    name: 'Carlos Silva',
    email: 'carlos.silva@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Administrador',
    branchId: '1',
    departmentId: 'dept-ti',
    jobTitle: 'Coordenador de TI',
    contactNumber: '(11) 98765-4321',
    extension: '4001',
    status: 'Ativo',
    bio: 'Responsável geral pelo gerenciamento de infraestrutura e equipe de suporte.',
    theme: 'system',
    colorPalette: 'blue'
  },
  // Técnicos
  {
    id: 'user-tech-1',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Técnico',
    branchId: '1',
    departmentId: 'dept-ti',
    jobTitle: 'Analista de Suporte Pleno',
    contactNumber: '(11) 97654-3210',
    extension: '4002',
    status: 'Ativo',
    bio: 'Especialista em software hospitalar e incidentes de Banco de Dados.',
    theme: 'dark',
    colorPalette: 'indigo'
  },
  {
    id: 'user-tech-2',
    name: 'Paulo Santos',
    email: 'paulo.santos@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Técnico',
    branchId: '1',
    departmentId: 'dept-ti',
    jobTitle: 'Analista de Infraestrutura',
    contactNumber: '(11) 96543-2109',
    extension: '4003',
    status: 'Ativo',
    bio: 'Foco no gerenciamento de redes, switches corporativos e servidores locais.',
    theme: 'light',
    colorPalette: 'emerald'
  },
  {
    id: 'user-tech-3',
    name: 'Roberto Gomes',
    email: 'roberto.gomes@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Técnico',
    branchId: '2',
    departmentId: 'dept-ti',
    jobTitle: 'Técnico de Suporte Regional',
    contactNumber: '(21) 95432-1098',
    extension: '5002',
    status: 'Ativo',
    bio: 'Suporte local para a filial do Rio de Janeiro.',
    theme: 'system',
    colorPalette: 'blue'
  },
  // Usuários comuns
  {
    id: 'user-usr-1',
    name: 'Mariana Costa',
    email: 'mariana.costa@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Usuário',
    branchId: '1',
    departmentId: 'dept-fin',
    jobTitle: 'Assistente Financeiro',
    contactNumber: '(11) 94321-0987',
    extension: '4110',
    status: 'Ativo'
  },
  {
    id: 'user-usr-2',
    name: 'Renato Albuquerque',
    email: 'renato.albuquerque@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Usuário',
    branchId: '1',
    departmentId: 'dept-rh',
    jobTitle: 'Analista de D.P',
    contactNumber: '(11) 93210-9876',
    extension: '4220',
    status: 'Ativo'
  },
  {
    id: 'user-usr-3',
    name: 'Juliana Mendes',
    email: 'juliana.mendes@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Usuário',
    branchId: '2',
    departmentId: 'dept-log',
    jobTitle: 'Supervisor de Logística',
    contactNumber: '(21) 92109-8765',
    extension: '5110',
    status: 'Ativo'
  },
  {
    id: 'user-usr-4',
    name: 'Dr. Fabio Ribeiro',
    email: 'fabio.ribeiro@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Usuário',
    branchId: '1',
    departmentId: 'dept-ps',
    jobTitle: 'Médico Plantonista',
    contactNumber: '(11) 91098-7654',
    extension: '4330',
    status: 'Ativo'
  },
  {
    id: 'user-usr-5',
    name: 'Sandra Souza',
    email: 'sandra.souza@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Usuário',
    branchId: '1',
    departmentId: 'dept-fat',
    jobTitle: 'Faturista Sênior',
    contactNumber: '(11) 90987-6543',
    extension: '4440',
    status: 'Ativo'
  },
  {
    id: 'user-usr-6',
    name: 'Patrícia Lima',
    email: 'patricia.lima@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Usuário',
    branchId: '3',
    departmentId: 'dept-amb',
    jobTitle: 'Enfermeira de Triagem',
    contactNumber: '(31) 99876-5432',
    extension: '6110',
    status: 'Ativo'
  },
  {
    id: 'user-usr-7',
    name: 'Eliana Rocha',
    email: 'eliana.rocha@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Usuário',
    branchId: '1',
    departmentId: 'dept-adm',
    jobTitle: 'Secretária de Diretoria',
    contactNumber: '(11) 98765-1234',
    extension: '4005',
    status: 'Ativo'
  },
  {
    id: 'user-usr-8',
    name: 'Júlio Costa',
    email: 'julio.costa@hpsvp.org.br',
    password: hashedDefaultPassword,
    role: 'Usuário',
    branchId: '2',
    departmentId: 'dept-log',
    jobTitle: 'Auxiliar Administrativo',
    contactNumber: '(21) 97654-4321',
    extension: '5112',
    status: 'Inativo',
    bio: 'Usuário com acesso bloqueado devido a desligamento imediato.'
  }
];

// Preservar usuários antigos injetando no topo ou evitando duplicatas de e-mail!
const finalUsers = [...existingUsers];
const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

// Adicionar apenas os novos que não tenham e-mail duplicado
usersToInsert.forEach(u => {
  if (!existingEmails.has(u.email.toLowerCase())) {
    finalUsers.push(u);
  }
});

// Se o usuário admin padrão 'admin@hpsvp.org.br' não foi mantido, certificar que ele exista
const hasMainAdmin = finalUsers.some(u => u.email.toLowerCase() === 'admin@hpsvp.org.br');
if (!hasMainAdmin) {
  finalUsers.push({
    id: '1',
    name: 'Administrador do Sistema',
    email: 'admin@hpsvp.org.br',
    password: bcrypt.hashSync('admin123', 10),
    role: 'Administrador',
    branchId: '1',
    departmentId: 'dept-ti',
    status: 'Ativo'
  });
}

console.log(`Escrevendo ${finalUsers.length} usuários na base de dados (preservados + adicionados)...`);
finalUsers.forEach(u => insertRow('users', u));

// 7. Cadastrar Incidentes & SLAs
const incidents = [
  { id: 'inc1', name: 'Falha Geral na Internet (Link Principal)', sla: 2, priority: 'Urgente' },
  { id: 'inc2', name: 'Acesso Indisponível ao Sistema PEP Hospitalar', sla: 4, priority: 'Alta' },
  { id: 'inc3', name: 'Impressora de Etiquetas Térmicas Não Imprime', sla: 8, priority: 'Média' },
  { id: 'inc4', name: 'Instalação ou Atualização de Certificado Digital', sla: 24, priority: 'Baixa' },
  { id: 'inc5', name: 'Problema Físico com Hardware (Mouse/Teclado/Monitor)', sla: 12, priority: 'Baixa' },
  { id: 'inc6', name: 'Instabilidade ou Sinal Fraco na Rede Sem Fio (Wi-Fi)', sla: 4, priority: 'Alta' },
  { id: 'inc7', name: 'Instalar ou Configurar Novo Aparelho / Linha VOIP', sla: 8, priority: 'Média' },
  { id: 'inc8', name: 'Criação ou Permissões Especiais de Usuário de Rede', sla: 24, priority: 'Baixa' },
  { id: 'inc9', name: 'Computador Não Liga / Fonte Queimada', sla: 4, priority: 'Alta' },
  { id: 'inc10', name: 'Problema na Emissão de Notas Fiscais (Faturamento)', sla: 4, priority: 'Alta' }
];

console.log('Inserindo Incidentes padrão...');
incidents.forEach(inc => insertRow('incidents', inc));

// 8. Cadastrar Redes (Networks)
const networks = [
  { id: 'net-adm', name: 'Rede Corporativa Administrativa', baseIp: '192.168.10', description: 'Rede interna cabeada interligando servidores ativos e computadores administrativos' },
  { id: 'net-med', name: 'Rede Dispositivos Hospitalares', baseIp: '10.100.20', description: 'Rede isolada dedicada a equipamentos médicos e prontuários' },
  { id: 'net-wifi', name: 'Rede Wi-Fi Corporativa', baseIp: '192.168.50', description: 'Acesso sem fio para notebooks e tablets autorizados nos setores' },
  { id: 'net-voip', name: 'Rede Telefonia VoIP', baseIp: '172.20.10', description: 'Garante prioridade de banda e tráfego prioritário para ligações e ramais IP' }
];

console.log('Inserindo Redes...');
networks.forEach(net => insertRow('networks', net));

// 9. Cadastrar Sub-redes (Subnets)
const subnets = [
  { id: 'sub-adm-ti', networkId: 'net-adm', name: 'Suporte e Servidores TI', cidr: 24, startSuffix: 10, endSuffix: 254, gatewaySuffix: 1, broadcastSuffix: 255 },
  { id: 'sub-adm-fin', networkId: 'net-adm', name: 'Financeiro, Faturamento e RH', cidr: 25, startSuffix: 100, endSuffix: 200, gatewaySuffix: 1, broadcastSuffix: 255 },
  { id: 'sub-med-ps', networkId: 'net-med', name: 'Ala Pronto Socorro Meds', cidr: 24, startSuffix: 10, endSuffix: 150, gatewaySuffix: 1, broadcastSuffix: 255 },
  { id: 'sub-wifi-set', networkId: 'net-wifi', name: 'Setor de Internação Wi-Fi', cidr: 24, startSuffix: 50, endSuffix: 240, gatewaySuffix: 1, broadcastSuffix: 255 }
];

console.log('Inserindo Sub-redes de teste...');
subnets.forEach(sub => insertRow('subnets', sub));

// 10. Cadastrar Equipamentos (Equipments)
const manufacturersPrn = ['HP', 'Epson', 'Brother', 'Zebra'];
const manufacturersPc = ['Dell', 'Lenovo', 'HP', 'Apple'];
const manufacturersNet = ['Cisco', 'Ubiquiti', 'MikroTik', 'TP-Link'];

const pcModels = ['OptiPlex 3080', 'ThinkCentre M70', 'ProDesk 400', 'ThinkPad L14', 'Latitude 5420'];
const prnModels = ['LaserJet Pro M404', 'L3250 EcoTank', 'HL-L1212W', 'ZD220 Térmica'];
const netModels = ['Catalyst 9200', 'EdgeRouter X', 'UniFi AP AC LR', 'RB2011UiAS'];

const types = ['Desktop', 'Notebook', 'Servidor', 'Switch', 'Roteador', 'Impressora', 'Telefone IP'];
const statuses = ['Ativo', 'Ativo', 'Ativo', 'Inativo', 'Manutenção'];

const equipments = [];
const today = new Date();

console.log('Gerando Equipamentos aleatórios para o inventário...');
for (let i = 1; i <= 150; i++) {
  const type = types[Math.floor(Math.random() * types.length)];
  let manufacturer = '';
  let model = '';
  
  if (type === 'Desktop' || type === 'Notebook' || type === 'Servidor') {
    manufacturer = manufacturersPc[Math.floor(Math.random() * manufacturersPc.length)];
    model = pcModels[Math.floor(Math.random() * pcModels.length)];
  } else if (type === 'Impressora') {
    manufacturer = manufacturersPrn[Math.floor(Math.random() * manufacturersPrn.length)];
    model = prnModels[Math.floor(Math.random() * prnModels.length)];
  } else {
    manufacturer = manufacturersNet[Math.floor(Math.random() * manufacturersNet.length)];
    model = netModels[Math.floor(Math.random() * netModels.length)];
  }

  // Filtrar setores e filiais
  const dept = departments[Math.floor(Math.random() * departments.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  
  const purchaseDate = new Date(today.getTime() - Math.random() * 3 * 365 * 24 * 60 * 60 * 1000); // nos últimos 3 anos
  const warrantyUntil = new Date(purchaseDate.getTime() + 2 * 365 * 24 * 60 * 60 * 1000); // 2 anos de garantia

  const id = `equip-${i.toString().padStart(3, '0')}`;
  const macRandom = Array.from({length: 6}, () => Math.floor(Math.random()*256).toString(16).padStart(2, '0')).join(':').toUpperCase();

  const eq = {
    id,
    name: `${type.substring(0, 3).toUpperCase()}-${dept.name.substring(0, 3).toUpperCase()}-${i.toString().padStart(2, '0')}`,
    type,
    serialNumber: `BRS${Math.floor(100000 + Math.random() * 900000)}X`,
    model,
    manufacturer,
    purchaseDate: purchaseDate.toISOString().split('T')[0],
    warrantyUntil: warrantyUntil.toISOString().split('T')[0],
    status,
    branchId: dept.branchId,
    departmentId: dept.id,
    macAddress: macRandom,
    responsible: dept.head,
    description: `Equipamento de TI no setor de ${dept.name}, responsável ${dept.head}.`,
    assetNumber: `PAT-2026-${(100 + i).toString()}`,
    responsibilityTerm: '',
    createdAt: purchaseDate.toISOString(),
    updatedAt: today.toISOString()
  };

  equipments.push(eq);
  insertRow('equipments', eq);
}

// 11. Cadastrar IPs válidos (ip_addresses)
console.log('Cadastrando endereços de IP vinculados às redes e aos equipamentos...');
const selectedNets = ['net-adm', 'net-med', 'net-voip'];
let ipCounter = 1;

for (let r = 0; r < 100; r++) {
  const netId = selectedNets[Math.floor(Math.random() * selectedNets.length)];
  const net = networks.find(n => n.id === netId);
  const eq = equipments[r]; // associa com equip correspondente
  
  const ipSuffix = 10 + r;
  const ipAdd = {
    id: `ip-${ipCounter++}`,
    networkId: netId,
    ipSuffix,
    hostName: eq.name,
    deviceType: eq.type,
    macAddress: eq.macAddress,
    sector: departments.find(d => d.id === eq.departmentId)?.name || 'Geral',
    responsible: eq.responsible,
    description: `Endereço IP corporativo fixado para ${eq.type} no barramento.`,
    equipmentId: eq.id,
    updatedAt: today.toISOString()
  };

  insertRow('ip_addresses', ipAdd);
}

// 12. Cadastrar Chamados (Tickets)
console.log('Gerando histórico rico de Chamados (Tickets) para análises e gráficos...');
const ticketStatuses = ['Aberto', 'Em Andamento', 'Pendente', 'Resolvido', 'Fechado'];
const priorities = ['Baixa', 'Média', 'Alta', 'Urgente'];

const ticketTitlesByIncident = {
  'inc1': [
    'Queda total de conexão com a Internet central',
    'Link de internet fora do ar - Matriz sem acesso',
    'Roteador parou de sincronizar a fibra ótica'
  ],
  'inc2': [
    'Sistema PEP apresenta erro 500 no Pronto Socorro',
    'Acesso negado ao prontuário médico eletrônico',
    'Lentidão extrema ao carregar dados do paciente no PEP'
  ],
  'inc3': [
    'Impressora do RH travou ao imprimir etiquetas',
    'Zebra com luz vermelha piscando intermitente',
    'Não imprime via porta paralela/USB no Faturamento'
  ],
  'inc4': [
    'Instalar e configurar certificado digital A3',
    'Renovação de assinatura digital de receita médica',
    'Falha ao autenticar certificado na emissão de NF'
  ],
  'inc5': [
    'Teclado com teclas travando no financeiro',
    'Mouse óptico com defeito na recepção',
    'Monitor do RH piscando e desligando sozinho'
  ],
  'inc6': [
    'Sinal Wi-Fi muito fraco na triagem do P.S.',
    'Aparelhos desconectam sozinhos do Wi-Fi corporativo',
    'Notebook da diretoria não conecta no Wi-Fi interno'
  ],
  'inc7': [
    'Ramal VoIP mudo e com estática',
    'Aparelho IP com tela apagada e sem luz',
    'Mudar posição física do aparelho VOIP de mesa'
  ],
  'inc8': [
    'Criar e cadastrar conta de e-mail institucional',
    'Liberar acesso aos arquivos compartilhados no financeiro',
    'Redefinição de senha de rede expirada'
  ],
  'inc9': [
    'Microcomputador não inicia após pico de energia',
    'Desktop liga cooler por 2s e desliga imediatamente',
    'Problema físico na inicialização do disco rígido'
  ],
  'inc10': [
    'Falha no webservice ao transmitir lote de notas',
    'Erro de rejeição de Nota Fiscal de Serviços na SEFAZ',
    'Computador do faturamento não abre o validador tributário'
  ]
};

const solutionsByIncident = {
  'inc1': 'Feito reinício forçado da ONU de fibra principal e estabelecido link secundário de contingência da Vivo.',
  'inc2': 'Contatado suporte terceirizado da MV Sistemas. Efetuado flush do cache do servidor IIS e reinício do pool de serviços.',
  'inc3': 'Efetuado alinhamento do sensor de papel térmico e substituição de rolo de fita ribbon preso na engrenagem.',
  'inc4': 'Instalados drivers atualizados da leitora de cartão e importado certificado do usuário no navegador Google Chrome.',
  'inc5': 'Substituído mouse e teclado antigos do usuário por novos itens de estoque.',
  'inc6': 'Realizado o reboot lógico do Access Point Ubiquiti do corredor principal. Canal trocado para evitar interferências.',
  'inc7': 'Corrigido provisionamento SIP do telefone IP no painel central do PABX virtual Asterisk.',
  'inc8': 'Criado usuário no Active Directory sob o grupo do setor correspondente. Configurada caixa de e-mail de 15GB e enviadas credenciais à chefia.',
  'inc9': 'Efetuada a troca da fonte de alimentação de 500W queimada por uma nova de 500W selada de estoque de peças.',
  'inc10': 'Atualizada tabela de alíquotas do ICMS no banco de dados local e restabelecida sincronia com a Sefaz estadual.'
};

const supportObservations = [
  'O chamado foi atendido presencialmente no departamento. Problema sanado com sucesso.',
  'Efetuado suporte remoto via terminal AnyDesk com autorização prévia.',
  'Equipamento foi removido temporariamente para o laboratório de eletrônica para testes.',
  'O requisitante testou o fluxo e confirmou que a falha foi resolvida, aprovando o encerramento imediato.'
];

const totalTickets = 400;
const usersOrdinary = finalUsers.filter(u => u.role === 'Usuário');
const technicians = finalUsers.filter(u => u.role === 'Técnico');

let ticketCounter = 1;

for (let t = 0; t < totalTickets; t++) {
  const reqUser = usersOrdinary[Math.floor(Math.random() * usersOrdinary.length)];
  const techUser = technicians[Math.floor(Math.random() * technicians.length)];
  const inc = incidents[Math.floor(Math.random() * incidents.length)];
  
  // decide status based on loop indexes for proper representation
  let status = 'Aberto';
  if (t < 250) {
    status = 'Fechado';
  } else if (t < 340) {
    status = 'Resolvido';
  } else if (t < 380) {
    status = 'Em Andamento';
  } else if (t < 390) {
    status = 'Pendente';
  }

  const priority = inc.priority;
  const titles = ticketTitlesByIncident[inc.id];
  const title = titles[Math.floor(Math.random() * titles.length)];
  
  const createdDaysAgo = Math.floor(Math.random() * 90); // nos últimos 90 dias
  const createdDate = new Date(today.getTime() - createdDaysAgo * 24 * 60 * 60 * 1000 - Math.floor(Math.random() * 8) * 60 * 60 * 1000);
  
  const ticketId = `TKT-${String(ticketCounter).padStart(3, '0')}`;
  ticketCounter++;
  
  let startedAt = null;
  let finishedAt = null;
  let closedAt = null;
  let solutionText = null;
  let techObs = null;

  if (status !== 'Aberto') {
    // Iniciado algumas horas depois da criação
    startedAt = new Date(createdDate.getTime() + (10 + Math.random() * 50) * 60 * 1000).toISOString();
  }

  if (status === 'Resolvido' || status === 'Fechado') {
    // Resolvido algumas horas após o início
    const resolvedTime = new Date(new Date(startedAt).getTime() + (30 + Math.random() * 180) * 60 * 1000);
    finishedAt = resolvedTime.toISOString();
    solutionText = solutionsByIncident[inc.id] || 'Problema analisado e resolvido com sucesso pela equipe de infraestrutura.';
    techObs = supportObservations[Math.floor(Math.random() * supportObservations.length)];

    if (status === 'Fechado') {
      closedAt = new Date(resolvedTime.getTime() + (60 + Math.random() * 120) * 60 * 1000).toISOString();
    }
  }

  const associatedEquipment = equipments.find(e => e.departmentId === reqUser.departmentId);

  const tkt = {
    id: ticketId,
    title,
    requester: reqUser.name,
    requesterId: reqUser.id,
    technician: techUser.name,
    technicianIds: JSON.stringify([techUser.id]),
    technicalObservations: techObs,
    status,
    priority,
    incidentId: inc.id,
    sla: inc.sla,
    description: `Usuário relata que está enfrentando gargalos e intermitências no fluxo de trabalho habitual referente ao item. Solicita atendimento com urgência média.`,
    solution: solutionText,
    startedAt,
    finishedAt,
    closedAt,
    createdAt: createdDate.toISOString(),
    departmentId: reqUser.departmentId,
    equipmentId: associatedEquipment ? associatedEquipment.id : null,
    branchId: reqUser.branchId
  };

  insertRow('tickets', tkt);
}

db.pragma('foreign_keys = ON'); // Ativa FKeys de volta
console.log('---');
console.log('SEMEADURA CONCLUÍDA COM EXTREMO SUCESSO!');
console.log(`- Foram semeados ${branches.length} filiais.`);
console.log(`- Foram semeados ${departments.length} setores hospitalares.`);
console.log(`- Foram semeados ${incidents.length} tipos de incidentes com SLA configurado.`);
console.log(`- Foram geradas ${networks.length} redes e suas correspondentes sub-redes.`);
console.log(`- Foram cadastrados 150 equipamentos estruturados no inventário.`);
console.log(`- Foram vinculados 100 IPs fixos ativos.`);
console.log(`- Foram criados 400 chamados distribuídos para os gráficos do Painel.`);
console.log('Todos os dados de login de usuários antigos foram perfeitamente mantidos!');
