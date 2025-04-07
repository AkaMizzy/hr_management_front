import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import LoginForm from "./Components/LoginForm";
import RegisterForm from "./Components/RegisterForm";
import ForgotPasswordForm from "./Components/ForgotPasswordForm";
import ResetPasswordForm from "./Components/ResetPasswordForm";

import "./App.css";

// Exemple de composant protégé
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <>
      {/* Affichage des toasts dans toute l'application */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forget-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />

          {/* Exemple d’une page d'accueil protégée */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <h1 style={{ padding: "2rem", color: "#123524" }}>Bienvenue sur la page d'accueil sécurisée 🎉</h1>
              </ProtectedRoute>
            }
          />

          {/* Redirection pour toutes les autres routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
