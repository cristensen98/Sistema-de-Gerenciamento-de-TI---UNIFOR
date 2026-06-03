import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Lazy load page components
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Tickets = React.lazy(() => import('./pages/Tickets'));
const NewTicket = React.lazy(() => import('./pages/NewTicket'));
const Equipments = React.lazy(() => import('./pages/Equipments'));
const NewEquipment = React.lazy(() => import('./pages/NewEquipment'));
const EditEquipment = React.lazy(() => import('./pages/EditEquipment'));
const Users = React.lazy(() => import('./pages/Users'));
const NewUser = React.lazy(() => import('./pages/NewUser'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Network = React.lazy(() => import('./pages/Network'));

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string | string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Dashboard />
                </Suspense>
              } />
              <Route path="tickets" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Tickets />
                </Suspense>
              } />
              <Route path="tickets/new" element={
                <Suspense fallback={<LoadingSpinner />}>
                  <NewTicket />
                </Suspense>
              } />

              {/* Routes restricted to Technicians and Administrators */}
              <Route path="equipments" element={
                <ProtectedRoute requiredRole={['Técnico', 'Administrador']}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Equipments />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="equipments/new" element={
                <ProtectedRoute requiredRole={['Técnico', 'Administrador']}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <NewEquipment />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="equipments/edit/:id" element={
                <ProtectedRoute requiredRole={['Técnico', 'Administrador']}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <EditEquipment />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="network" element={
                <ProtectedRoute requiredRole={['Técnico', 'Administrador']}>
                  <Suspense fallback={<LoadingSpinner />}>
                    <Network />
                  </Suspense>
                </ProtectedRoute>
              } />

              {/* Routes restricted to Administrators only */}
              <Route path="users" element={
                <ProtectedRoute requiredRole="Administrador">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Users />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="users/new" element={
                <ProtectedRoute requiredRole="Administrador">
                  <Suspense fallback={<LoadingSpinner />}>
                    <NewUser />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="settings" element={
                <ProtectedRoute requiredRole="Administrador">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Settings />
                  </Suspense>
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
