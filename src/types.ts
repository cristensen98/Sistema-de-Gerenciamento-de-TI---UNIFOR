export type TicketStatus = 'Aberto' | 'Em Andamento' | 'Pendente' | 'Resolvido' | 'Fechado';
export type TicketPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type UserRole = 'Administrador' | 'Técnico' | 'Usuário';

export interface Branch {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  branchId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string;
  departmentId: string;
  jobTitle?: string;
  contactNumber?: string;
  extension?: string;
  status?: 'Ativo' | 'Inativo';
  theme?: string;
  colorPalette?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface Incident {
  id: string;
  name: string;
  sla: number;
  priority: TicketPriority;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  incidentId?: string;
  incidentName?: string;
  sla?: number;
  departmentId?: string;
  departmentName?: string;
  branchId?: string;
  branchName?: string;
  equipmentId?: string;
  equipmentName?: string;
  requester: string;
  requesterId?: string;
  requesterJobTitle?: string;
  technician?: string;
  technicianIds?: string; // String JSON de IDs de usuários
  technicalObservations?: string;
  solution?: string;
  startedAt?: string;
  finishedAt?: string;
  closedAt?: string;
  createdAt: string;
}

export type DeviceType = 'Desktop' | 'Notebook' | 'Servidor' | 'Switch' | 'Roteador' | 'PABX' | 'DVR' | 'Endereço de rede' | 'Gateway' | 'Broadcast' | 'Impressora' | 'Rede cabeada' | 'Rede Wifi';

export interface Network {
  id: string;
  name: string;
  baseIp: string; // ex., 192.168.1
  description?: string;
  usedIps?: number;
}

export interface Subnet {
  id: string;
  networkId: string;
  name: string;
  cidr: number;
  startSuffix: number;
  endSuffix: number;
  gatewaySuffix: number;
  broadcastSuffix: number;
}

export interface IPAddress {
  id: string;
  networkId: string;
  ipSuffix: number; // 0-255
  hostName?: string;
  deviceType?: DeviceType;
  macAddress?: string;
  sector?: string;
  responsible?: string;
  description?: string;
  equipmentId?: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  status: 'Ativo' | 'Inativo' | 'Manutenção' | 'Descartado';
  branchId: string;
  departmentId: string;
  macAddress?: string;
  responsible?: string;
  description?: string;
  assetNumber?: string;
  responsibilityTerm?: string;
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}
