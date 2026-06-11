// Routeur principal avec protection par rôle
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'

import ComptesPage from './pages/client/ComptesPage'
import DepotPage from './pages/client/DepotPage'
import RetraitPage from './pages/client/RetraitPage'
import TransfertPage from './pages/client/TransfertPage'
import PretsPage from './pages/client/PretsPage'
import DocumentsPage from './pages/client/DocumentsPage'
import NotificationsPage from './pages/client/NotificationsPage'

import DemandesPretPage from './pages/operator/DemandesPretPage'
import RapportsPage from './pages/operator/RapportsPage'

import OperateursPage from './pages/admin/OperateursPage'
import AuditPage from './pages/admin/AuditPage'
import RapportsAdminPage from './pages/admin/RapportsAdminPage'

function HomeRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'CLIENT') return <Navigate to="/comptes" replace />
  if (user.role === 'OPERATOR') return <Navigate to="/demandes-pret" replace />
  return <Navigate to="/operateurs" replace />
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<HomeRedirect />} />
            <Route path="comptes" element={<ComptesPage />} />
            <Route path="depot" element={<DepotPage />} />
            <Route path="retrait" element={<RetraitPage />} />
            <Route path="transfert" element={<TransfertPage />} />
            <Route path="prets" element={<PretsPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="demandes-pret" element={<DemandesPretPage />} />
            <Route path="rapports" element={<RapportsPage />} />
            <Route path="operateurs" element={<OperateursPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="rapports-admin" element={<RapportsAdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
