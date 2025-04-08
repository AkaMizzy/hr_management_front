import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaGoogle, FaGithub } from "react-icons/fa";
import pic1 from "../Assets/images/pic1.jpeg";

import "./auth.css";

const LoginForm = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/login", form);
      localStorage.setItem("token", res.data.token);
      toast.success("Connexion réussie !");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur de connexion");
    }
  };

  const handleGoToRegister = () => {
    navigate("/register");
  };

  const handleForgotPassword = () => {
    navigate("/forget-password");
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-illustration">
          <div className="illustration-content">
            <img src={pic1} alt="" />
          </div>
        </div>
        
        <div className="auth-form-container">
          <div className="auth-form-content">
            <div className="auth-brand">
              <span className="logo">Muntadaa</span>
            </div>
            
            <h1>Se connecter</h1>
            
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
              
              <button type="submit" className="auth-button">
                Se connecter
              </button>
            </form>
            
            <div className="divider">
              <span>ou se connecter avec</span>
            </div>
            
            <div className="social-login">
              <button className="social-button google">
                <FaGoogle />
              </button>
              <button className="social-button github">
                <FaGithub />
              </button>
            </div>
            
            <div className="auth-footer">
              <p>
                Vous n'avez pas de compte? <button className="text-link" onClick={handleGoToRegister}>S'inscrire</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;