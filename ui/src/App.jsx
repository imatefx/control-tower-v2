import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { PageLayout } from "@/components/layout"

// Pages
import LoginPage from "@/pages/LoginPage"
import DashboardPage from "@/pages/DashboardPage"
import ProductsPage from "@/pages/ProductsPage"
import ProductDetailPage from "@/pages/ProductDetailPage"
import ProductEditPage from "@/pages/ProductEditPage"
import ClientsPage from "@/pages/ClientsPage"
import ClientDetailPage from "@/pages/ClientDetailPage"
import ClientEditPage from "@/pages/ClientEditPage"
import DeploymentsPage from "@/pages/DeploymentsPage"
import DeploymentDetailPage from "@/pages/DeploymentDetailPage"
import DeploymentEditPage from "@/pages/DeploymentEditPage"
import OnboardingPage from "@/pages/OnboardingPage"
import ReleaseNotesPage from "@/pages/ReleaseNotesPage"
import EAPDashboardPage from "@/pages/EAPDashboardPage"
import EngineeringPage from "@/pages/EngineeringPage"
import ResourceAllocationPage from "@/pages/ResourceAllocationPage"
import ResourceAllocationDetailPage from "@/pages/ResourceAllocationDetailPage"
import UsersPage from "@/pages/UsersPage"
import ApprovalsPage from "@/pages/ApprovalsPage"
import ReportsPage from "@/pages/ReportsPage"
import AuditLogsPage from "@/pages/AuditLogsPage"
import SettingsPage from "@/pages/SettingsPage"
import TrashPage from "@/pages/TrashPage"
import ChecklistItemsPage from "@/pages/ChecklistItemsPage"
import ShareholderDashboardPage from "@/pages/ShareholderDashboardPage"
import ClientProductOverviewPage from "@/pages/ClientProductOverviewPage"

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, hasRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.some(role => hasRole(role))) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PageLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="releases" element={<ShareholderDashboardPage />} />

        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="products/:id/edit" element={<ProductEditPage />} />

        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="clients/:id/edit" element={<ClientEditPage />} />

        <Route path="client-product-overview" element={<ClientProductOverviewPage />} />

        <Route path="deployments" element={<DeploymentsPage />} />
        <Route path="deployments/:id" element={<DeploymentDetailPage />} />
        <Route path="deployments/:id/edit" element={<DeploymentEditPage />} />

        <Route
          path="onboarding"
          element={
            <ProtectedRoute allowedRoles={["admin", "user", "delivery_lead"]}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        <Route path="release-notes" element={<ReleaseNotesPage />} />

        <Route
          path="eap"
          element={
            <ProtectedRoute allowedRoles={["admin", "user", "product_owner"]}>
              <EAPDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="engineering"
          element={
            <ProtectedRoute allowedRoles={["admin", "engineering_manager"]}>
              <EngineeringPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="resource-allocation"
          element={
            <ProtectedRoute allowedRoles={["admin", "delivery_lead", "product_owner", "engineering_manager"]}>
              <ResourceAllocationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="resource-allocation/:productId"
          element={
            <ProtectedRoute allowedRoles={["admin", "delivery_lead", "product_owner", "engineering_manager"]}>
              <ResourceAllocationDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="approvals"
          element={
            <ProtectedRoute allowedRoles={["admin", "delivery_lead", "product_owner"]}>
              <ApprovalsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={["admin", "delivery_lead", "product_owner", "engineering_manager"]}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="audit"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />

        <Route path="settings" element={<SettingsPage />} />

        <Route
          path="checklist-items"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ChecklistItemsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="trash"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <TrashPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
