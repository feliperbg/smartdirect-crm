import { useEffect, useMemo, useState } from 'react';
import { Edit2, LifeBuoy, MessageSquare, Plus, Search } from 'lucide-react';
import { api } from '@/services/api';
import type { Contact, Ticket } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/form';
import { Overlay } from '@/components/ui/overlay';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ticketFormInitial = {
  title: '',
  description: '',
  priority: 'medium',
  category: '',
  contactId: '',
  status: 'open',
};

const statusLabels = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  resolved: 'Resolvido',
  closed: 'Fechado',
};

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export function Sac() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [form, setForm] = useState(ticketFormInitial);
  const [message, setMessage] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      const [{ data: ticketList }, { data: contactList }] = await Promise.all([
        api.get<Ticket[]>(`/sac/tickets${params.toString() ? `?${params}` : ''}`),
        api.get<Contact[]>('/contacts').catch(() => ({ data: [] as Contact[] })),
      ]);
      setTickets(ticketList);
      setContacts(contactList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  const filteredTickets = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return tickets;
    return tickets.filter((ticket) =>
      [ticket.title, ticket.description, ticket.category, ticket.contact?.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [tickets, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(ticketFormInitial);
    setFormOpen(true);
  };

  const openEdit = (ticket: Ticket) => {
    setEditing(ticket);
    setForm({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category || '',
      contactId: ticket.contactId || '',
      status: ticket.status,
    });
    setFormOpen(true);
  };

  const openDetail = async (ticket: Ticket) => {
    const { data } = await api.get<Ticket>(`/sac/tickets/${ticket.id}`);
    setSelectedTicket(data);
    setDetailOpen(true);
  };

  const refreshSelectedTicket = async () => {
    if (!selectedTicket) return;
    const { data } = await api.get<Ticket>(`/sac/tickets/${selectedTicket.id}`);
    setSelectedTicket(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: {
      title: string;
      description: string;
      priority: string;
      category: string;
      contactId?: string;
      status?: string;
    } = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      category: form.category,
      contactId: form.contactId || undefined,
    };
    if (editing) {
      payload.status = form.status;
      await api.put(`/sac/tickets/${editing.id}`, payload);
    } else {
      await api.post('/sac/tickets', payload);
    }
    setFormOpen(false);
    await loadTickets();
  };

  const handleStatusChange = async (ticket: Ticket, status: string) => {
    await api.put(`/sac/tickets/${ticket.id}`, { status });
    await loadTickets();
  };

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !message.trim()) return;
    await api.post(`/sac/tickets/${selectedTicket.id}/messages`, {
      content: message,
      type: 'comment',
      isFromContact: false,
    });
    setMessage('');
    await refreshSelectedTicket();
  };

  return (
    <div>
      <PageHeader
        title="SAC"
        description="Triagem, acompanhamento e histórico de tickets de suporte."
        icon={LifeBuoy}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo ticket
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="grid gap-3 border-b p-4 lg:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar ticket" className="pl-9" />
            </div>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="open">Aberto</option>
              <option value="in_progress">Em andamento</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">Todas prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </Select>
            <Badge variant="outline">{filteredTickets.length} tickets</Badge>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-10 text-center">
              <LifeBuoy className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Nenhum ticket encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Crie ou ajuste os filtros para acompanhar solicitações.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="max-w-sm">
                        <button className="text-left" onClick={() => openDetail(ticket)}>
                          <p className="font-medium hover:text-primary">{ticket.title}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{ticket.description}</p>
                        </button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ticket.contact?.name || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{ticket.category || '-'}</TableCell>
                      <TableCell>
                        <PriorityBadge priority={ticket.priority} />
                      </TableCell>
                      <TableCell>
                        <Select value={ticket.status} onChange={(e) => handleStatusChange(ticket, e.target.value)} className="h-8 min-w-36">
                          <option value="open">Aberto</option>
                          <option value="in_progress">Em andamento</option>
                          <option value="resolved">Resolvido</option>
                          <option value="closed">Fechado</option>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDetail(ticket)}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(ticket)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Overlay open={formOpen} onOpenChange={setFormOpen} side="right" title={editing ? 'Editar ticket' : 'Novo ticket'} description="Registre assunto, prioridade e vínculo com contato.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <Label htmlFor="ticketTitle">Título</Label>
            <Input id="ticketTitle" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field>
            <Label htmlFor="ticketDescription">Descrição</Label>
            <Textarea id="ticketDescription" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="ticketPriority">Prioridade</Label>
              <Select id="ticketPriority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="ticketStatus">Status</Label>
              <Select id="ticketStatus" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="open">Aberto</option>
                <option value="in_progress">Em andamento</option>
                <option value="resolved">Resolvido</option>
                <option value="closed">Fechado</option>
              </Select>
            </Field>
          </div>
          <Field>
            <Label htmlFor="ticketContact">Contato</Label>
            <Select id="ticketContact" value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}>
              <option value="">Sem contato vinculado</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="ticketCategory">Categoria</Label>
            <Input id="ticketCategory" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? 'Salvar ticket' : 'Criar ticket'}</Button>
          </div>
        </form>
      </Overlay>

      <Overlay
        open={detailOpen}
        onOpenChange={setDetailOpen}
        side="right"
        title={selectedTicket?.title || 'Ticket'}
        description={selectedTicket ? `${statusLabels[selectedTicket.status]} · ${priorityLabels[selectedTicket.priority]}` : undefined}
      >
        {selectedTicket && (
          <div className="space-y-5">
            <div className="rounded-md border bg-background/60 p-4">
              <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={selectedTicket.status} />
                <PriorityBadge priority={selectedTicket.priority} />
                {selectedTicket.category && <Badge variant="outline">{selectedTicket.category}</Badge>}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Histórico</h3>
              {selectedTicket.messages?.length ? (
                selectedTicket.messages.map((item) => (
                  <div key={item.id} className="rounded-md border bg-background/60 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{item.user?.name || (item.isFromContact ? 'Contato' : 'Equipe')}</span>
                      <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhuma mensagem registrada.
                </div>
              )}
            </div>

            <form onSubmit={handleAddMessage} className="space-y-3 border-t pt-4">
              <Field>
                <Label htmlFor="message">Adicionar comentário</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
              </Field>
              <Button type="submit" disabled={!message.trim()}>
                Enviar comentário
              </Button>
            </form>
          </div>
        )}
      </Overlay>
    </div>
  );
}

function StatusBadge({ status }: { status: Ticket['status'] }) {
  const variant = status === 'resolved' ? 'success' : status === 'closed' ? 'outline' : status === 'in_progress' ? 'warning' : 'secondary';
  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

function PriorityBadge({ priority }: { priority: Ticket['priority'] }) {
  const variant = priority === 'urgent' ? 'destructive' : priority === 'high' ? 'warning' : 'secondary';
  return <Badge variant={variant}>{priorityLabels[priority]}</Badge>;
}
