import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { RequireAuth } from './components/RequireAuth'
import { RequireKelsee } from './components/RequireKelsee'
import { RootRedirect } from './components/RootRedirect'
import { GoalsPage } from './pages/Goals'
import Hearts from './pages/Hearts'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Schedule from './pages/Schedule'
import { TasksPage } from './pages/Tasks'
import WarrantyCommunitiesPage from './warranty/pages/WarrantyCommunitiesPage'
import WarrantyCommunityDetailPage from './warranty/pages/WarrantyCommunityDetailPage'
import WarrantyContractorsPage from './warranty/pages/WarrantyContractorsPage'
import WarrantyDashboard from './warranty/pages/WarrantyDashboard'
import WarrantyHomeDetailPage from './warranty/pages/WarrantyHomeDetailPage'
import WarrantyHomesPage from './warranty/pages/WarrantyHomesPage'
import WarrantyReportsPage from './warranty/pages/WarrantyReportsPage'
import WarrantySettingsPage from './warranty/pages/WarrantySettingsPage'
import WarrantyTicketDetailPage from './warranty/pages/WarrantyTicketDetailPage'
import WarrantyTicketsPage from './warranty/pages/WarrantyTicketsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/hearts" element={<Hearts />} />
          <Route path="/warranty" element={<RequireKelsee />}>
            <Route index element={<WarrantyDashboard />} />
            <Route path="communities" element={<WarrantyCommunitiesPage />} />
            <Route path="communities/:communityId" element={<WarrantyCommunityDetailPage />} />
            <Route path="homes" element={<WarrantyHomesPage />} />
            <Route path="homes/:homeId" element={<WarrantyHomeDetailPage />} />
            <Route path="tickets" element={<WarrantyTicketsPage />} />
            <Route path="tickets/:ticketId" element={<WarrantyTicketDetailPage />} />
            <Route path="contractors" element={<WarrantyContractorsPage />} />
            <Route path="reports" element={<WarrantyReportsPage />} />
            <Route path="settings" element={<WarrantySettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
