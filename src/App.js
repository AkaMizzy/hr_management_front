import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "antd/dist/reset.css"; 

// Components
import LoginForm from "./Components/auth/LoginForm";
import RegisterForm from "./Components/auth/RegisterForm";
import ForgotPasswordForm from "./Components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./Components/auth/ResetPasswordForm";
import Dashboard from "./Components/Dashboard/Dashboard";
import Entity from "./Components/Entities/Entity";
import Employee from "./Components/Employees/Employee";
import Document from "./Components/Documents/Document";
import EmployeeDashboard from "./Components/employee_dashboard/EmployeeDashboard";
import TaskList from "./Components/tasks/TaskList";
import EmployeeTasks from "./Components/employee_dashboard/employee_tasks/EmployeeTasks";
import EmployeeProfile from "./Components/employee_dashboard/profile/EmployeeProfile";
import EmployeeDocuments from "./Components/employee_dashboard/documents/EmployeeDocuments";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = ['manager', 'employe'] }) => {
  const token = localStorage.getItem("token");
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const userRole = userData.role;

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'manager') {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'employe') {
      return <Navigate to="/employee-dashboard" replace />;
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
        <Route path="/register" element={<RegisterForm />} />
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
          <Route path="/dashboard" element={<div>Tableau de bord</div>} />
          <Route path="entites" element={<Entity />} />
          <Route path="employes" element={<Employee />} />
          <Route path="taches" element={<TaskList />} />
          <Route path="documents" element={<Document />} />
          <Route path="conge" element={<div>Gestion des congés</div>} />
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
          <Route path="documents" element={<EmployeeDocuments />} />
          <Route path="calendar" element={<div>Calendrier</div>} />
          <Route path="notifications" element={<div>Notifications</div>} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
