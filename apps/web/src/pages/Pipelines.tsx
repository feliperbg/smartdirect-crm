import { useEffect, useMemo, useState } from 'react';
import { Edit2, KanbanSquare, Plus, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import type { Contact, Deal, Pipeline, Stage } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Label, Select, Textarea } from '@/components/ui/form';
import { ConfirmDialog, Overlay } from '@/components/ui/overlay';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const pipelineFormInitial = { name: '', description: '' };
const stageFormInitial = { name: '', order: '', color: '#f97316' };
const dealFormInitial = {
  title: '',
  value: '',
  stageId: '',
  contactId: '',
  expectedCloseDate: '',
  status: 'open',
  notes: '',
};

export function Pipelines() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deletingStage, setDeletingStage] = useState<Stage | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null);
  const [pipelineForm, setPipelineForm] = useState(pipelineFormInitial);
  const [stageForm, setStageForm] = useState(stageFormInitial);
  const [dealForm, setDealForm] = useState(dealFormInitial);

  const orderedStages = useMemo(
    () => [...(selectedPipeline?.stages || [])].sort((a, b) => a.order - b.order),
    [selectedPipeline],
  );

  const loadPipelines = async (preferredId?: string) => {
    setLoading(true);
    try {
      const [{ data: pipelineList }, { data: contactList }] = await Promise.all([
        api.get<Pipeline[]>('/pipelines'),
        api.get<Contact[]>('/contacts').catch(() => ({ data: [] as Contact[] })),
      ]);
      setPipelines(pipelineList);
      setContacts(contactList);

      const targetId = preferredId || selectedPipeline?.id || pipelineList[0]?.id;
      if (targetId) {
        const { data: detail } = await api.get<Pipeline>(`/pipelines/${targetId}`);
        setSelectedPipeline(detail);
      } else {
        setSelectedPipeline(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPipelines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectPipeline = async (id: string) => {
    const { data } = await api.get<Pipeline>(`/pipelines/${id}`);
    setSelectedPipeline(data);
  };

  const handleCreatePipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data } = await api.post<Pipeline>('/pipelines', pipelineForm);
    setPipelineForm(pipelineFormInitial);
    setPipelineOpen(false);
    await loadPipelines(data.id);
  };

  const openStage = (stage?: Stage) => {
    setEditingStage(stage || null);
    setStageForm(
      stage
        ? { name: stage.name, order: String(stage.order), color: stage.color || '#f97316' }
        : { ...stageFormInitial, order: String((selectedPipeline?.stages?.length || 0) + 1) },
    );
    setStageOpen(true);
  };

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPipeline) return;
    const payload = {
      name: stageForm.name,
      order: stageForm.order ? Number(stageForm.order) : undefined,
      color: stageForm.color,
    };
    if (editingStage) {
      await api.put(`/pipelines/stages/${editingStage.id}`, payload);
    } else {
      await api.post(`/pipelines/${selectedPipeline.id}/stages`, payload);
    }
    setStageOpen(false);
    await loadPipelines(selectedPipeline.id);
  };

  const openDeal = (stageId: string, deal?: Deal) => {
    setEditingDeal(deal || null);
    setDealForm(
      deal
        ? {
            title: deal.title,
            value: deal.value ? String(deal.value) : '',
            stageId: deal.stageId,
            contactId: deal.contactId || '',
            expectedCloseDate: deal.expectedCloseDate?.slice(0, 10) || '',
            status: deal.status,
            notes: deal.notes || '',
          }
        : { ...dealFormInitial, stageId },
    );
    setDealOpen(true);
  };

  const handleDealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPipeline) return;
    const payload: {
      title: string;
      value?: number;
      stageId: string;
      contactId?: string;
      expectedCloseDate?: string;
      status?: string;
      notes: string;
    } = {
      title: dealForm.title,
      value: dealForm.value ? Number(dealForm.value) : undefined,
      stageId: dealForm.stageId,
      contactId: dealForm.contactId || undefined,
      expectedCloseDate: dealForm.expectedCloseDate || undefined,
      notes: dealForm.notes,
    };
    if (editingDeal) {
      payload.status = dealForm.status;
      await api.put(`/pipelines/deals/${editingDeal.id}`, payload);
    } else {
      await api.post('/pipelines/deals', payload);
    }
    setDealOpen(false);
    await loadPipelines(selectedPipeline.id);
  };

  const deleteStage = async () => {
    if (!deletingStage || !selectedPipeline) return;
    await api.delete(`/pipelines/stages/${deletingStage.id}`);
    await loadPipelines(selectedPipeline.id);
  };

  const deleteDeal = async () => {
    if (!deletingDeal || !selectedPipeline) return;
    await api.delete(`/pipelines/deals/${deletingDeal.id}`);
    await loadPipelines(selectedPipeline.id);
  };

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Gerencie funis, etapas e oportunidades comerciais."
        icon={KanbanSquare}
        action={
          <div className="flex gap-2">
            {selectedPipeline && (
              <Button variant="outline" onClick={() => openStage()}>
                <Plus className="h-4 w-4" />
                Nova etapa
              </Button>
            )}
            <Button onClick={() => setPipelineOpen(true)}>
              <Plus className="h-4 w-4" />
              Novo pipeline
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {pipelines.map((pipeline) => (
          <Button
            key={pipeline.id}
            variant={selectedPipeline?.id === pipeline.id ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => selectPipeline(pipeline.id)}
          >
            {pipeline.name}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-[520px] min-w-72 flex-1" />
          ))}
        </div>
      ) : !selectedPipeline ? (
        <Card>
          <CardContent className="p-10 text-center">
            <KanbanSquare className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Nenhum pipeline cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground">Crie o primeiro funil para organizar oportunidades.</p>
            <Button className="mt-4" onClick={() => setPipelineOpen(true)}>
              Criar pipeline
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {orderedStages.map((stage) => (
            <Card key={stage.id} className="flex max-h-[72vh] min-w-72 flex-1 flex-col">
              <CardHeader className="border-b p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color || '#f97316' }} />
                      <CardTitle className="truncate text-sm">{stage.name}</CardTitle>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{stage.deals?.length || 0} oportunidades</p>
                  </div>
                  <div className="flex">
                    <Button variant="ghost" size="icon" onClick={() => openDeal(stage.id)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openStage(stage)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingStage(stage)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 overflow-y-auto p-3">
                {stage.deals?.length ? (
                  stage.deals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} onEdit={() => openDeal(stage.id, deal)} onDelete={() => setDeletingDeal(deal)} />
                  ))
                ) : (
                  <div className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                    Sem oportunidades nesta etapa
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Overlay open={pipelineOpen} onOpenChange={setPipelineOpen} title="Novo pipeline" description="Crie um funil comercial. As etapas podem ser adicionadas depois.">
        <form onSubmit={handleCreatePipeline} className="space-y-4">
          <Field>
            <Label htmlFor="pipelineName">Nome</Label>
            <Input id="pipelineName" required value={pipelineForm.name} onChange={(e) => setPipelineForm({ ...pipelineForm, name: e.target.value })} />
          </Field>
          <Field>
            <Label htmlFor="pipelineDescription">Descrição</Label>
            <Textarea id="pipelineDescription" value={pipelineForm.description} onChange={(e) => setPipelineForm({ ...pipelineForm, description: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPipelineOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar pipeline</Button>
          </div>
        </form>
      </Overlay>

      <Overlay open={stageOpen} onOpenChange={setStageOpen} title={editingStage ? 'Editar etapa' : 'Nova etapa'} description="Defina nome, ordem e cor de identificação.">
        <form onSubmit={handleStageSubmit} className="space-y-4">
          <Field>
            <Label htmlFor="stageName">Nome</Label>
            <Input id="stageName" required value={stageForm.name} onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="stageOrder">Ordem</Label>
              <Input id="stageOrder" type="number" value={stageForm.order} onChange={(e) => setStageForm({ ...stageForm, order: e.target.value })} />
            </Field>
            <Field>
              <Label htmlFor="stageColor">Cor</Label>
              <Input id="stageColor" type="color" value={stageForm.color} onChange={(e) => setStageForm({ ...stageForm, color: e.target.value })} className="h-9 p-1" />
            </Field>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setStageOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingStage ? 'Salvar etapa' : 'Criar etapa'}</Button>
          </div>
        </form>
      </Overlay>

      <Overlay open={dealOpen} onOpenChange={setDealOpen} side="right" title={editingDeal ? 'Editar oportunidade' : 'Nova oportunidade'} description="Atualize valor, etapa, contato e previsão de fechamento.">
        <form onSubmit={handleDealSubmit} className="space-y-4">
          <Field>
            <Label htmlFor="dealTitle">Título</Label>
            <Input id="dealTitle" required value={dealForm.title} onChange={(e) => setDealForm({ ...dealForm, title: e.target.value })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="dealValue">Valor estimado</Label>
              <Input id="dealValue" type="number" value={dealForm.value} onChange={(e) => setDealForm({ ...dealForm, value: e.target.value })} />
            </Field>
            <Field>
              <Label htmlFor="dealDate">Previsão</Label>
              <Input id="dealDate" type="date" value={dealForm.expectedCloseDate} onChange={(e) => setDealForm({ ...dealForm, expectedCloseDate: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="dealStage">Etapa</Label>
              <Select id="dealStage" required value={dealForm.stageId} onChange={(e) => setDealForm({ ...dealForm, stageId: e.target.value })}>
                {orderedStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field>
              <Label htmlFor="dealStatus">Status</Label>
              <Select id="dealStatus" value={dealForm.status} onChange={(e) => setDealForm({ ...dealForm, status: e.target.value })}>
                <option value="open">Aberto</option>
                <option value="won">Ganho</option>
                <option value="lost">Perdido</option>
              </Select>
            </Field>
          </div>
          <Field>
            <Label htmlFor="dealContact">Contato</Label>
            <Select id="dealContact" value={dealForm.contactId} onChange={(e) => setDealForm({ ...dealForm, contactId: e.target.value })}>
              <option value="">Sem contato vinculado</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="dealNotes">Notas</Label>
            <Textarea id="dealNotes" value={dealForm.notes} onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDealOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editingDeal ? 'Salvar oportunidade' : 'Criar oportunidade'}</Button>
          </div>
        </form>
      </Overlay>

      <ConfirmDialog
        open={Boolean(deletingStage)}
        onOpenChange={(open) => !open && setDeletingStage(null)}
        title="Excluir etapa"
        description={`Excluir a etapa ${deletingStage?.name || ''}?`}
        confirmLabel="Excluir"
        onConfirm={deleteStage}
      />
      <ConfirmDialog
        open={Boolean(deletingDeal)}
        onOpenChange={(open) => !open && setDeletingDeal(null)}
        title="Excluir oportunidade"
        description={`Excluir ${deletingDeal?.title || 'esta oportunidade'}?`}
        confirmLabel="Excluir"
        onConfirm={deleteDeal}
      />
    </div>
  );
}

function DealCard({ deal, onEdit, onDelete }: { deal: Deal; onEdit: () => void; onDelete: () => void }) {
  const statusVariant = deal.status === 'won' ? 'success' : deal.status === 'lost' ? 'destructive' : 'secondary';

  return (
    <div className="rounded-md border bg-background/70 p-3 transition-colors hover:bg-accent/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{deal.title}</p>
          {deal.contact && <p className="mt-1 truncate text-xs text-muted-foreground">{deal.contact.name}</p>}
        </div>
        <div className="flex">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge variant={statusVariant} className={cn(deal.status === 'lost' && 'bg-destructive/10 text-destructive')}>
          {deal.status === 'won' ? 'Ganho' : deal.status === 'lost' ? 'Perdido' : 'Aberto'}
        </Badge>
        {deal.value !== undefined && deal.value !== null && (
          <span className="text-xs font-medium text-primary">R$ {Number(deal.value).toLocaleString('pt-BR')}</span>
        )}
      </div>
    </div>
  );
}
