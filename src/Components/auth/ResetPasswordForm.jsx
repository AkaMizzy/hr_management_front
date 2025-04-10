import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./auth.css";
import { FiEye, FiEyeOff } from 'react-icons/fi';
import pic1 from '../Assets/images/pic1.jpeg';

const ResetPasswordForm = () => {
  const location = useLocation();
  const email = location.state?.email || "";

  const [form, setForm] = useState({
    email: email,
    newPassword: "",
    confirmNewPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmNewPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const res = await axios.post("http://localhost:7000/api/reset-password", form);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la réinitialisation du mot de passe");
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

            <h1>Réinitialiser le mot de passe</h1>
            <p className="auth-subtitle">Veuillez entrer votre nouveau mot de passe</p>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Mot de passe réinitialisé avec succès. Redirection vers la page de connexion...</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  name="email"
                  type="email"
                  placeholder="Adresse email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  readOnly={!!email}
                  className="form-input"
                />
              </div>

              <div className="form-group password-input-group">
                <input
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nouveau mot de passe"
                  value={form.newPassword}
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
                  name="confirmNewPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmer le nouveau mot de passe"
                  value={form.confirmNewPassword}
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
                Réinitialiser le mot de passe
              </button>
            </form>

            <div className="auth-footer">
              <p>
                <button className="text-link" onClick={handleGoToLogin}>Retour à la connexion</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;