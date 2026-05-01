import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { LoadingState } from "./components/LoadingState";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PoliciesPage } from "./pages/PoliciesPage";
import { PolicyFormPage } from "./pages/PolicyFormPage";
import { PolicyAnalyticsPage } from "./pages/PolicyAnalyticsPage";
import { UsersPage } from "./pages/UsersPage";

function ProtectedRoute({ roles }) {
  const { initializing, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (initializing) {
    return <LoadingState fullScreen label="Checking your session" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">404</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Page not found</h1>
        <p className="mt-2 text-slate-600">The page you are looking for is not part of this dashboard.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute roles={["planner", "admin"]} />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/policies/new" element={<PolicyFormPage mode="create" />} />
          <Route path="/policies/:id/edit" element={<PolicyFormPage mode="edit" />} />
          <Route path="/policies/:id/analytics" element={<PolicyAnalyticsPage />} />
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
