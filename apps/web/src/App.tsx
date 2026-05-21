import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/auth';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Pipelines } from './pages/Pipelines';
import { Contacts } from './pages/Contacts';
import { Sac } from './pages/Sac';
import { Campaigns } from './pages/Campaigns';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkAuth, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
    checkAuth().catch(() => {});
  }, [checkAuth, loadFromStorage]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen select-none items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-card text-xl font-semibold tracking-tight text-primary">
            SD
          </div>
          <div className="text-sm font-medium text-muted-foreground">Carregando sessão...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="pipelines" element={<Pipelines />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="sac" element={<Sac />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
