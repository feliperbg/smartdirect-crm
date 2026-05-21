export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'agent';
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  color?: string;
  pipelineId: string;
  deals?: Deal[];
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  stages: Stage[];
  createdAt: string;
  updatedAt?: string;
}

export interface Deal {
  id: string;
  title: string;
  value?: number;
  status: 'open' | 'won' | 'lost';
  expectedCloseDate?: string;
  notes?: string;
  stageId: string;
  stage?: Stage;
  contactId?: string;
  contact?: Contact;
  assignedToId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category?: string;
  contactId?: string;
  contact?: Contact;
  assignedToId?: string;
  assignedTo?: User;
  messages?: TicketMessage[];
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TicketMessage {
  id: string;
  content: string;
  type: 'comment' | 'internal' | 'email' | 'whatsapp';
  isFromContact: boolean;
  userId?: string;
  user?: User;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  status: 'draft' | 'scheduled' | 'running' | 'done' | 'cancelled';
  subject?: string;
  content?: string;
  scheduledAt?: string;
  sentAt?: string;
  totalRecipients: number;
  totalSent: number;
  totalFailed: number;
  dispatches?: CampaignDispatch[];
  createdAt: string;
  updatedAt?: string;
}

export interface CampaignDispatch {
  id: string;
  campaignId: string;
  contactId?: string;
  contact?: Contact;
  recipientEmail?: string;
  recipientPhone?: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'opened';
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}
