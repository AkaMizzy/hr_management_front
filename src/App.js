import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "antd/dist/reset.css"; 

// Components
import LoginForm from "./Components/auth/LoginForm";
import ForgotPasswordForm from "./Components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./Components/auth/ResetPasswordForm";
import Dashboard from "./Components/Manager/Dashboard/Dashboard";
import Entity from "./Components/Manager/Entities/Entity";
import Employee from "./Components/Manager/Employees/Employee";
import Document from "./Components/Manager/Documents/Document";
import EmployeeDashboard from "./Components/employee_dashboard/EmployeeDashboard";
import TaskList from "./Components/Manager/tasks/TaskList";
import EmployeeTasks from "./Components/employee_dashboard/employee_tasks/EmployeeTasks";
import EmployeeProfile from "./Components/employee_dashboard/profile/EmployeeProfile";
import EmployeeDocuments from "./Components/employee_dashboard/documents/EmployeeDocuments";
import EmployeeCalendar from './Components/employee_dashboard/calendar/EmployeeCalendar';
import EmployeeAttestations from './Components/employee_dashboard/attestations/EmployeeAttestations';
import EmployeeAbsences from './Components/employee_dashboard/absences/EmployeeAbsences';
import EmployeeConges from './Components/employee_dashboard/conges/EmployeeConges';
import EmployeeNoteFrais from './Components/employee_dashboard/note_frais/EmployeeNoteFrais';
import ManagerAttestations from './Components/Manager/Attestations/ManagerAttestations';
import ManagerAbsences from './Components/Manager/Absences/ManagerAbsences';
import ManagerConges from './Components/Manager/Conges/ManagerConges';
import ManagerNoteFrais from './Components/Manager/NoteFrais/ManagerNoteFrais';

// Import RH Dashboard components
import RHDashboard from './Components/rh_dashboard/RHDashboard';
import RHHome from './Components/rh_dashboard/home/RHHome';
import UserManagement from './Components/rh_dashboard/users/UserManagement';
import RHAttestations from './Components/rh_dashboard/attestations/RHAttestations';
import RHAbsences from './Components/rh_dashboard/absences/RHAbsences';
import RHConges from './Components/rh_dashboard/conges/RHConges';
import RHNoteFrais from './Components/rh_dashboard/note_frais/RHNoteFrais';
import PayrollManagement from './Components/rh_dashboard/paie/RHPaie';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userRole = userData.role;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'manager') {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'employe') {
      return <Navigate to="/employee-dashboard" replace />;
    } else if (userRole === 'responsable_rh') {
      return <Navigate to="/rh-dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/forget-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />

        {/* Manager Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<div></div>} />
          <Route path="entites" element={<Entity />} />
          <Route path="employes" element={<Employee />} />
          <Route path="taches" element={<TaskList />} />
          <Route path="documents" element={<Document />} />
          <Route path="attestations" element={<ManagerAttestations />} />
          <Route path="absences" element={<ManagerAbsences />} />
          <Route path="conges" element={<ManagerConges />} />
          <Route path="note-frais" element={<ManagerNoteFrais />} />
        </Route>

        {/* Employee Routes */}
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute allowedRoles={['employe']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="profile" replace />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="tasks" element={<EmployeeTasks />} />
          <Route path="calendar" element={<EmployeeCalendar />} />
          <Route path="documents" element={<EmployeeDocuments />} />
          <Route path="attestations" element={<EmployeeAttestations />} />
          <Route path="absences" element={<EmployeeAbsences />} />
          <Route path="conges" element={<EmployeeConges />} />
          <Route path="note-frais" element={<EmployeeNoteFrais />} />
          <Route path="notifications" element={<div>Notifications</div>} />
        </Route>

        {/* RH Dashboard Routes */}
        <Route path="/rh-dashboard" element={
          <ProtectedRoute allowedRoles={['responsable_rh']}>
            <RHDashboard />
          </ProtectedRoute>
        }>
          <Route path="home" element={<RHHome />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="attestations" element={<RHAttestations />} />
          <Route path="absences" element={<RHAbsences />} />
          <Route path="conges" element={<RHConges />} />
          <Route path="note-frais" element={<RHNoteFrais />} />
          <Route path="paie" element={<PayrollManagement />} />
          <Route index element={<Navigate to="home" replace />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
