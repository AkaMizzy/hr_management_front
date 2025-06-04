//LoginForm.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import { FiEye, FiEyeOff } from "react-icons/fi";
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import pic1 from "../Assets/images/pic1.jpeg";
import { API_BASE_URL, setToken, setUserData } from "../../api/constants";

import "./auth.css";

const LoginForm = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, form);
      
      // Set token using helper
      setToken(res.data.token);
      
      // Set user data using helper
      const userData = {
        name: res.data.user.name || res.data.user.fullName || res.data.user.username || "Utilisateur",
        email: res.data.user.email
      };
      
      setUserData(userData);
      
      toast.success("Connexion réussie !");
      setShowLoading(true);
      
      // Attendre 4 secondes avant de rediriger vers le dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 4000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToRegister = () => {
    navigate("/register");
  };

  const handleForgotPassword = () => {
    navigate("/forget-password");
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-illustration">
            <div className="illustration-content">
              <img src={pic1} alt="Illustration" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>
          
          <div className="auth-form-container">
            {showLoading && (
              <div className="loading-overlay">
                <div className="loading-content">
                  <Spin 
                    indicator={<LoadingOutlined style={{ fontSize: 48, color: '#009965' }} spin />} 
                  />
                  <h2 className="loading-text">Chargement en cours...</h2>
                </div>
              </div>
            )}
            <div className="auth-form-content">
              <div className="auth-brand">
                <span className="logo">Muntadaa</span>
              </div>
              
              <h1>Bienvenue</h1>
              <p className="auth-subtitle">Connectez-vous pour accéder à votre compte</p>
              
              {error && <div className="error-message">{error}</div>}
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <input
                    name="email"
                    type="email"
                    placeholder="Adresse email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group password-input-group">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                  <button 
                    type="button" 
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <div className="forgot-password">
                  <button 
                    type="button" 
                    className="text-link" 
                    onClick={handleForgotPassword}
                  >
                    Mot de passe oublié?
                  </button>
                </div>
                
                <button 
                  type="submit" 
                  className="auth-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Connexion en cours..." : "Se connecter"}
                </button>
              </form>
              
              <div className="auth-footer">
                <p>
                  Vous n'avez pas de compte? <button className="text-link" onClick={handleGoToRegister}>S'inscrire</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;