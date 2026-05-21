import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Building2, UserRound } from 'lucide-react';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/auth';
import type { AuthResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input, Label } from '@/components/ui/form';

export function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    tenantName: '',
    tenantEmail: '',
    tenantPhone: '',
    userName: '',
    userEmail: '',
    userPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post<AuthResponse>('/auth/register', form);
      setAuth(data);
      navigate('/');
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Erro ao realizar o cadastro. Verifique os dados inseridos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background text-sm font-semibold text-primary">
              SD
            </div>
            <div>
              <CardTitle>Criar conta</CardTitle>
              <CardDescription>Configure a empresa e o usuário administrador.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 text-sm font-medium">
                <Building2 className="h-4 w-4 text-primary" />
                Dados corporativos
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label htmlFor="tenantName">Nome da empresa</Label>
                  <Input
                    id="tenantName"
                    required
                    value={form.tenantName}
                    onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
                    placeholder="Acme Ltda"
                  />
                </Field>
                <Field>
                  <Label htmlFor="tenantEmail">E-mail corporativo</Label>
                  <Input
                    id="tenantEmail"
                    type="email"
                    required
                    value={form.tenantEmail}
                    onChange={(e) => setForm({ ...form, tenantEmail: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </Field>
              </div>
              <Field>
                <Label htmlFor="tenantPhone">Telefone</Label>
                <Input
                  id="tenantPhone"
                  value={form.tenantPhone}
                  onChange={(e) => setForm({ ...form, tenantPhone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </Field>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 text-sm font-medium">
                <UserRound className="h-4 w-4 text-primary" />
                Administrador
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <Label htmlFor="userName">Nome completo</Label>
                  <Input
                    id="userName"
                    required
                    value={form.userName}
                    onChange={(e) => setForm({ ...form, userName: e.target.value })}
                    placeholder="Nome Sobrenome"
                  />
                </Field>
                <Field>
                  <Label htmlFor="userEmail">E-mail</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    required
                    value={form.userEmail}
                    onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
                    placeholder="voce@empresa.com"
                  />
                </Field>
              </div>
              <Field>
                <Label htmlFor="userPassword">Senha</Label>
                <Input
                  id="userPassword"
                  type="password"
                  required
                  value={form.userPassword}
                  onChange={(e) => setForm({ ...form, userPassword: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </Field>
            </section>

            <Button className="w-full" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Finalizar cadastro'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Já possui conta?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Fazer login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
