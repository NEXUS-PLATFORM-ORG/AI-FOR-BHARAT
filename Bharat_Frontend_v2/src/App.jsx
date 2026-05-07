import { lazy, Suspense } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const ReviewerDashboard = lazy(() => import("@/pages/reviewer/ReviewerDashboard").then(m => ({ default: m.ReviewerDashboard })));
const DashboardPage = lazy(() => import("@/pages/reviewer/DashboardPage").then(m => ({ default: m.DashboardPage })));
const CaseLibraryPage = lazy(() => import("@/pages/reviewer/CaseLibraryPage").then(m => ({ default: m.CaseLibraryPage })));

const CaseTrackingPage = lazy(() => import("@/pages/reviewer/CaseTrackingPage").then(m => ({ default: m.CaseTrackingPage })));
const CompliancePage = lazy(() => import("@/pages/reviewer/CompliancePage").then(m => ({ default: m.CompliancePage })));
const AppealPage = lazy(() => import("@/pages/reviewer/AppealPage").then(m => ({ default: m.AppealPage })));
const ProfilePage = lazy(() => import("@/pages/reviewer/ProfilePage").then(m => ({ default: m.ProfilePage })));
const LoginForm = lazy(() => import("@/components/login-form").then(m => ({ default: m.LoginForm })));
const SignupForm = lazy(() => import("@/components/signup-form").then(m => ({ default: m.SignupForm })));
const AuthCallback = lazy(() => import("@/pages/AuthCallback").then(m => ({ default: m.AuthCallback })));

// Admin
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage").then(m => ({ default: m.AdminDashboardPage })));
const DepartmentsPage = lazy(() => import("@/pages/admin/DepartmentsPage").then(m => ({ default: m.DepartmentsPage })));
const DeadlinesPage = lazy(() => import("@/pages/admin/DeadlinesPage").then(m => ({ default: m.DeadlinesPage })));
const RiskAnalysisPage = lazy(() => import("@/pages/admin/RiskAnalysisPage").then(m => ({ default: m.RiskAnalysisPage })));
const AuditLogsPage = lazy(() => import("@/pages/admin/AuditLogsPage").then(m => ({ default: m.AuditLogsPage })));

function App() {
  return (
    <Router>
      <div className="w-full h-screen">
        <Suspense fallback={
          <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">
            Loading...
          </div>
        }>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={
              <div className="flex h-screen w-full items-center justify-center p-6 md:p-10 bg-slate-50">
                <div className="w-full max-w-sm">
                  <LoginForm />
                </div>
              </div>
            } />
            <Route path="/signup" element={
              <div className="flex h-screen w-full items-center justify-center p-6 md:p-10 bg-slate-50">
                <div className="w-full max-w-sm">
                  <SignupForm />
                </div>
              </div>
            } />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reviewer" element={<ProtectedRoute><ReviewerDashboard /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="case-library" element={<CaseLibraryPage />} />

              <Route path="case-tracking" element={<CaseTrackingPage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="compliance/:caseId" element={<CompliancePage />} />
              <Route path="appeal" element={<AppealPage />} />
              <Route path="appeal/:caseId" element={<AppealPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="departments" element={<DepartmentsPage />} />
              <Route path="deadlines" element={<DeadlinesPage />} />
              <Route path="risk-analysis" element={<RiskAnalysisPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;

