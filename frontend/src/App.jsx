import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import KanbanPage from './pages/KanbanPage';
import AuditLogPage from './pages/AuditLogPage';
import { useAuth } from './context/AuthContext';

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard"            element={<DashboardPage />} />
              <Route path="/projects"             element={<ProjectsPage />} />
              <Route path="/projects/:id"         element={<ProjectDetailPage />} />
              <Route path="/kanban"               element={<KanbanPage />} />
              <Route path="/audit"                element={<AuditLogPage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
