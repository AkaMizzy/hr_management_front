import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "antd";
import "antd/dist/reset.css"; // Import Ant Design styles

// Components
import LoginForm from "./Components/LoginForm";
import RegisterForm from "./Components/RegisterForm";
import ForgotPasswordForm from "./Components/ForgotPasswordForm";
import ResetPasswordForm from "./Components/ResetPasswordForm";
import Dashboard from "./Components/Dashboard/Dashboard";
import EntityTable from "./Components/Entities/EntityTable";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
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

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<div>Tableau de bord</div>} />
          <Route path="entities" element={<EntityTable />} />
          <Route path="employees" element={<div>Gestion des employés</div>} />
          <Route path="documents" element={<div>Gestion des documents</div>} />
          <Route path="leaves" element={<div>Gestion des congés</div>} />
          <Route path="settings" element={<div>Paramètres</div>} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
