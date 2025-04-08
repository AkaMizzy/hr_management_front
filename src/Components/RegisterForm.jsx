import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FaGoogle, FaGithub } from "react-icons/fa";
import pic1 from "./Assets/images/pic1.jpeg";

import "../App.css";

const RegisterForm = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword
      });
      toast.success("Inscription réussie !");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur d'inscription");
    }
  };

  const handleGoToLogin = () => {
    navigate("/login");
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

            <h1>Créer un compte</h1>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  name="name"
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

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

              <div className="form-group password-input-group">
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmer le mot de passe"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              <button type="submit" className="auth-button">
                S'inscrire
              </button>
            </form>

            <div className="divider">
              <span>ou s'inscrire avec</span>
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
                Vous avez déjà un compte? <button className="text-link" onClick={handleGoToLogin}>Se connecter</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;