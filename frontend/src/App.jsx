import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminFaculty from './pages/admin/AdminFaculty';
import AdminAssignments from './pages/admin/AdminAssignments';
import AdminStatus from './pages/admin/AdminStatus';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import FacultyCourses from './pages/faculty/FacultyCourses';
import FacultyUploads from './pages/faculty/FacultyUploads';

// Coordinator Pages
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard';
import CoordinatorCourses from './pages/coordinator/CoordinatorCourses';
import CoordinatorCommonDocs from './pages/coordinator/CoordinatorCommonDocs';
import CoordinatorSubmissions from './pages/coordinator/CoordinatorSubmissions';
import CoordinatorCompile from './pages/coordinator/CoordinatorCompile';

// Protected Route wrapper with role check
function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    // Redirect to their respective dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
    if (user.role === 'coordinator') return <Navigate to="/coordinator" replace />;
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Login Route */}
      <Route
        path="/"
        element={
          user ? (
            user.role === 'admin' ? <Navigate to="/admin" replace /> :
            user.role === 'faculty' ? <Navigate to="/faculty" replace /> :
            <Navigate to="/coordinator" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/faculty"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminFaculty />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/assignments"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminAssignments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/status"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminStatus />
          </ProtectedRoute>
        }
      />

      {/* Faculty Routes */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/courses"
        element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/uploads"
        element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyUploads />
          </ProtectedRoute>
        }
      />

      {/* Coordinator Routes */}
      <Route
        path="/coordinator"
        element={
          <ProtectedRoute allowedRole="coordinator">
            <CoordinatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator/courses"
        element={
          <ProtectedRoute allowedRole="coordinator">
            <CoordinatorCourses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator/common-docs"
        element={
          <ProtectedRoute allowedRole="coordinator">
            <CoordinatorCommonDocs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator/submissions"
        element={
          <ProtectedRoute allowedRole="coordinator">
            <CoordinatorSubmissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/coordinator/compile"
        element={
          <ProtectedRoute allowedRole="coordinator">
            <CoordinatorCompile />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
