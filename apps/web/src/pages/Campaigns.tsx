import { useEffect, useMemo, useState } from 'react';
import { Edit2, Megaphone, Plus, Send, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import type { Campaign, Contact } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/form';
import { ConfirmDialog, Overlay } from '@/components/ui/overlay';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const campaignFormInitial = {
  name: '',
  type: 'email',
  subject: '',
  content: '',
  scheduledAt: '',
};

const statusLabels = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  running: 'Rodando',
  done: 'Concluída',
  cancelled: 'Cancelada',
};

const typeLabels = {
  email: 'E-mail',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
};

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState<Campaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [form, setForm] = useState(campaignFormInitial);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const [{ data: campaignList }, { data: contactList }] = await Promise.all([
        api.get<Campaign[]>('/campaigns'),
        api.get<Contact[]>('/contacts').catch(() => ({ data: [] as Contact[] })),
      ]);
      setCampaigns(campaignList);
      setContacts(contactList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCampaigns();
  }, []);

  const filteredCampaigns = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return campaigns;
    return campaigns.filter((campaign) =>
      [campaign.name, campaign.subject, campaign.type, campaign.status]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [campaigns, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(campaignFormInitial);
    setFormOpen(true);
  };

  const openEdit = (campaign: Campaign) => {
    setEditing(campaign);
    setForm({
      name: campaign.name,
      type: campaign.type,
      subject: campaign.subject || '',
      content: campaign.content || '',
      scheduledAt: campaign.scheduledAt ? campaign.scheduledAt.slice(0, 16) : '',
    });
    setFormOpen(true);
  };

  const openDetail = async (campaign: Campaign) => {
    const { data } = await api.get<Campaign>(`/campaigns/${campaign.id}`);
    setSelectedCampaign(data);
    setSelectedContacts([]);
    setDetailOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      type: form.type,
      subject: form.subject || undefined,
      content: form.content || undefined,
      scheduledAt: form.scheduledAt || undefined,
    };
    if (editing) {
      await api.put(`/campaigns/${editing.id}`, payload);
    } else {
      await api.post('/campaigns', payload);
    }
    setFormOpen(false);
    await loadCampaigns();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await api.delete(`/campaigns/${deleting.id}`);
    await loadCampaigns();
  };

  const toggleContact = (id: string) => {
    setSelectedContacts((current) =>
      current.includes(id) ? current.filter((contactId) => contactId !== id) : [...current, id],
    );
  };

  const handleDispatch = async () => {
    if (!selectedCampaign || selectedContacts.length === 0) return;
    const { data } = await api.post<Campaign>(`/campaigns/${selectedCampaign.id}/dispatch`, {
      contactIds: selectedContacts,
    });
    setSelectedCampaign(data);
    setSelectedContacts([]);
    await loadCampaigns();
  };

  return (
    <div>
      <PageHeader
        title="Campanhas"
        description="Crie campanhas e acompanhe envios por contato."
        icon={Megaphone}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nova campanha
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar campanha" className="md:max-w-sm" />
            <Badge variant="outline">{filteredCampaigns.length} campanhas</Badge>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-14" />
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-10 text-center">
              <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Nenhuma campanha encontrada</p>
              <p className="mt-1 text-sm text-muted-foreground">Crie uma campanha para disparar para sua base de contatos.</p>
              <Button className="mt-4" onClick={openCreate}>
                Criar campanha
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campanha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destinatários</TableHead>
                    <TableHead>Enviados</TableHead>
                    <TableHead>Falhas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCampaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <button className="text-left" onClick={() => openDetail(campaign)}>
                          <p className="font-medium hover:text-primary">{campaign.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{campaign.subject || 'Sem assunto'}</p>
                        </button>
                      </TableCell>
                      <TableCell>{typeLabels[campaign.type]}</TableCell>
                      <TableCell>
                        <CampaignStatusBadge status={campaign.status} />
                      </TableCell>
                      <TableCell>{campaign.totalRecipients}</TableCell>
                      <TableCell>{campaign.totalSent}</TableCell>
                      <TableCell>{campaign.totalFailed}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDetail(campaign)}>
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(campaign)} disabled={campaign.status === 'running' || campaign.status === 'done'}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleting(campaign)} disabled={campaign.status === 'running'}>
                            <Trash2 className="h-4 w-4 text-destructive" />
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

      <Overlay open={formOpen} onOpenChange={setFormOpen} side="right" title={editing ? 'Editar campanha' : 'Nova campanha'} description="Defina canal, conteúdo e agendamento opcional.">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <Label htmlFor="campaignName">Nome</Label>
            <Input id="campaignName" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="campaignType">Tipo</Label>
              <Select id="campaignType" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="email">E-mail</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
            </Field>
            <Field>
              <Label htmlFor="campaignDate">Agendamento</Label>
              <Input id="campaignDate" type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
            </Field>
          </div>
          <Field>
            <Label htmlFor="campaignSubject">Assunto</Label>
            <Input id="campaignSubject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </Field>
          <Field>
            <Label htmlFor="campaignContent">Conteúdo</Label>
            <Textarea id="campaignContent" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? 'Salvar campanha' : 'Criar campanha'}</Button>
          </div>
        </form>
      </Overlay>

      <Overlay
        open={detailOpen}
        onOpenChange={setDetailOpen}
        side="right"
        title={selectedCampaign?.name || 'Campanha'}
        description={selectedCampaign ? `${typeLabels[selectedCampaign.type]} · ${statusLabels[selectedCampaign.status]}` : undefined}
      >
        {selectedCampaign && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Destinatários" value={selectedCampaign.totalRecipients} />
              <MiniMetric label="Enviados" value={selectedCampaign.totalSent} />
              <MiniMetric label="Falhas" value={selectedCampaign.totalFailed} />
            </div>

            <div className="rounded-md border bg-background/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{selectedCampaign.subject || 'Sem assunto'}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{selectedCampaign.content || 'Sem conteúdo'}</p>
                </div>
                <CampaignStatusBadge status={selectedCampaign.status} />
              </div>
            </div>

            {selectedCampaign.status === 'draft' || selectedCampaign.status === 'scheduled' ? (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Selecionar destinatários</h3>
                  <Badge variant="outline">{selectedContacts.length} selecionados</Badge>
                </div>
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
                  {contacts.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">Nenhum contato disponível.</p>
                  ) : (
                    contacts.map((contact) => (
                      <label key={contact.id} className="flex cursor-pointer items-center gap-3 rounded-md p-2 text-sm hover:bg-accent">
                        <input
                          type="checkbox"
                          checked={selectedContacts.includes(contact.id)}
                          onChange={() => toggleContact(contact.id)}
                          className="h-4 w-4 accent-primary"
                        />
                        <span className="flex-1">{contact.name}</span>
                        <span className="text-xs text-muted-foreground">{contact.email || contact.phone || '-'}</span>
                      </label>
                    ))
                  )}
                </div>
                <Button onClick={handleDispatch} disabled={selectedContacts.length === 0}>
                  <Send className="h-4 w-4" />
                  Disparar campanha
                </Button>
              </div>
            ) : null}

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-medium">Envios</h3>
              {selectedCampaign.dispatches?.length ? (
                selectedCampaign.dispatches.map((dispatch) => (
                  <div key={dispatch.id} className="flex items-center justify-between gap-3 rounded-md border bg-background/60 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{dispatch.contact?.name || dispatch.recipientEmail || dispatch.recipientPhone || 'Destinatário'}</p>
                      {dispatch.errorMessage && <p className="truncate text-xs text-destructive">{dispatch.errorMessage}</p>}
                    </div>
                    <Badge variant={dispatch.status === 'failed' ? 'destructive' : dispatch.status === 'sent' ? 'success' : 'secondary'}>
                      {dispatch.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Nenhum envio registrado.
                </div>
              )}
            </div>
          </div>
        )}
      </Overlay>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir campanha"
        description={`Excluir ${deleting?.name || 'esta campanha'}?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: Campaign['status'] }) {
  const variant = status === 'done' ? 'success' : status === 'running' ? 'warning' : status === 'cancelled' ? 'destructive' : 'secondary';
  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
