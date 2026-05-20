import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import MainLayout from '@/components/Layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import { UserRole } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const UsersPage = lazy(() => import('@/pages/users/UsersPage'));
const ProjectsPage = lazy(() => import('@/pages/projects/ProjectsPage'));
const BudgetPage = lazy(() => import('@/pages/budget/BudgetPage'));
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage'));
const VendorsPage = lazy(() => import('@/pages/vendors/VendorsPage'));
const SafetyPage = lazy(() => import('@/pages/safety/SafetyPage'));
const CompliancePage = lazy(() => import('@/pages/compliance/CompliancePage'));
const FinancialsPage = lazy(() => import('@/pages/financials/FinancialsPage'));
const BoqPage = lazy(() => import('@/pages/boq/BoqPage'));
const EstimationPage = lazy(() => import('@/pages/estimation/EstimationPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullscreen />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={[UserRole.ADMIN, UserRole.OWNER]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="budget" element={<Navigate to="/projects" replace />} />
          <Route path="budget/:projectId" element={<BudgetPage />} />
          <Route path="boq/:projectId" element={<BoqPage />} />
          <Route path="estimation/:projectId" element={<EstimationPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="safety" element={<SafetyPage />} />
          <Route
            path="compliance"
            element={
              <ProtectedRoute roles={[UserRole.ADMIN, UserRole.OWNER]}>
                <CompliancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="financials"
            element={
              <ProtectedRoute roles={[UserRole.ADMIN, UserRole.OWNER]}>
                <FinancialsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
