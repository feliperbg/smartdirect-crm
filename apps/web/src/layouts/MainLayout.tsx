import type React from 'react';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ContactRound,
  KanbanSquare,
  LifeBuoy,
  LogOut,
  Menu,
  Megaphone,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: BarChart3 },
  { path: '/pipelines', label: 'Pipeline', icon: KanbanSquare },
  { path: '/contacts', label: 'Contatos', icon: ContactRound },
  { path: '/sac', label: 'SAC', icon: LifeBuoy },
  { path: '/campaigns', label: 'Campanhas', icon: Megaphone },
];

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tenant, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarContent
        className="hidden w-64 shrink-0 border-r bg-card/70 md:flex"
        locationPath={location.pathname}
        tenantName={tenant?.name}
        userName={user?.name}
        userEmail={user?.email}
        onLogout={handleLogout}
      />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <SidebarContent
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] border-r bg-card shadow-xl"
            locationPath={location.pathname}
            tenantName={tenant?.name}
            userName={user?.name}
            userEmail={user?.email}
            onLogout={handleLogout}
            onNavigate={() => setMobileMenuOpen(false)}
            closeAction={
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card/50 px-4 md:hidden">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-xs font-semibold text-primary">
              SD
            </div>
            <span className="text-sm font-semibold">SmartDirect</span>
          </div>
        </header>
        <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  className?: string;
  locationPath: string;
  tenantName?: string;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  onNavigate?: () => void;
  closeAction?: React.ReactNode;
}

function SidebarContent({
  className,
  locationPath,
  tenantName,
  userName,
  userEmail,
  onLogout,
  onNavigate,
  closeAction,
}: SidebarContentProps) {
  return (
    <aside className={cn('flex-col', className)}>
      <div className="border-b p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background text-sm font-semibold text-primary">
              SD
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold tracking-tight">SmartDirect</h1>
              <p className="truncate text-xs text-muted-foreground">{tenantName || 'Workspace'}</p>
            </div>
          </div>
          {closeAction}
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = locationPath === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                isActive && 'bg-primary/10 text-primary ring-1 ring-primary/20',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <div className="mb-3 flex items-center gap-3 rounded-md border bg-background/60 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold">
            {userName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Encerrar sessão
        </Button>
      </div>
    </aside>
  );
}
