import { useEffect, useMemo, useState } from 'react';
import { ContactRound, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import type { Contact } from '@/types';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, Input, Label, Textarea } from '@/components/ui/form';
import { ConfirmDialog, Overlay } from '@/components/ui/overlay';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const emptyForm = { name: '', email: '', phone: '', company: '', position: '', notes: '' };

export function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Contact[]>('/contacts');
      setContacts(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return contacts;

    return contacts.filter((contact) =>
      [contact.name, contact.email, contact.phone, contact.company, contact.position]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [contacts, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditing(contact);
    setForm({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      position: contact.position || '',
      notes: contact.notes || '',
    });
    setSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await api.put(`/contacts/${editing.id}`, form);
    } else {
      await api.post('/contacts', form);
    }
    setSheetOpen(false);
    await loadContacts();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await api.delete(`/contacts/${deleting.id}`);
    await loadContacts();
  };

  return (
    <div>
      <PageHeader
        title="Contatos"
        description="Base comercial para leads, clientes e destinatários de campanhas."
        icon={ContactRound}
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo contato
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, empresa ou e-mail"
                className="pl-9"
              />
            </div>
            <Badge variant="outline">{filteredContacts.length} contatos</Badge>
          </div>

          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12" />
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-10 text-center">
              <ContactRound className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">Nenhum contato encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Crie um contato para alimentar pipeline, SAC e campanhas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.email || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.phone || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.company || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{contact.position || '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(contact)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleting(contact)}>
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

      <Overlay
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        side="right"
        title={editing ? 'Editar contato' : 'Novo contato'}
        description="Mantenha os dados essenciais para relacionamento e campanhas."
      >
        <form id="contact-form" onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </Field>
            <Field>
              <Label htmlFor="position">Cargo</Label>
              <Input id="position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </Field>
          </div>
          <Field>
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? 'Salvar alterações' : 'Criar contato'}</Button>
          </div>
        </form>
      </Overlay>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir contato"
        description={`Remover ${deleting?.name || 'este contato'} da base?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
      />
    </div>
  );
}
