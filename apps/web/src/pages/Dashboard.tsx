import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, LifeBuoy, Megaphone, Plus, TrendingUp } from 'lucide-react';
import { api } from '@/services/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  sac: { total: number; open: number; inProgress: number; resolved: number; closed: number };
  campaigns: { total: number; draft: number; running: number; done: number };
}

const fallbackStats = {
  sac: { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 },
  campaigns: { total: 0, draft: 0, running: 0, done: 0 },
};

export function Dashboard() {
  const [stats, setStats] = useState<Stats>(fallbackStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [sacRes, campaignsRes] = await Promise.all([
          api.get('/sac/tickets/stats').catch(() => ({ data: fallbackStats.sac })),
          api.get('/campaigns/stats').catch(() => ({ data: fallbackStats.campaigns })),
        ]);
        setStats({ sac: sacRes.data, campaigns: campaignsRes.data });
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão operacional de atendimento, campanhas e oportunidades."
        icon={BarChart3}
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Tickets abertos" value={stats.sac.open} icon={LifeBuoy} tone="primary" />
            <MetricCard label="Em atendimento" value={stats.sac.inProgress} icon={TrendingUp} />
            <MetricCard label="Campanhas ativas" value={stats.campaigns.running} icon={Megaphone} tone="warning" />
            <MetricCard label="Campanhas concluídas" value={stats.campaigns.done} icon={BarChart3} tone="success" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Atendimento</CardTitle>
                <Badge variant="outline">{stats.sac.total} tickets</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <SmallStat label="Abertos" value={stats.sac.open} />
                  <SmallStat label="Resolvidos" value={stats.sac.resolved} />
                  <SmallStat label="Fechados" value={stats.sac.closed} />
                </div>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/sac">
                    Ver SAC
                    <LifeBuoy className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Campanhas</CardTitle>
                <Badge variant="outline">{stats.campaigns.total} campanhas</Badge>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <SmallStat label="Rascunhos" value={stats.campaigns.draft} />
                  <SmallStat label="Rodando" value={stats.campaigns.running} />
                  <SmallStat label="Concluídas" value={stats.campaigns.done} />
                </div>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/campaigns">
                    Nova campanha
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  tone?: 'primary' | 'success' | 'warning';
}

function MetricCard({ label, value, icon: Icon, tone = 'primary' }: MetricCardProps) {
  const color = {
    primary: 'text-primary',
    success: 'text-emerald-300',
    warning: 'text-amber-300',
  }[tone];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className={`rounded-md border bg-background p-2 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
