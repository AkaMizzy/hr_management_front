import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";
import pic1 from './Assets/images/pic1.jpeg';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/forget-password", { email });
      setSuccess(true);
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la vérification de l'email");
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

            <h1>Mot de passe oublié</h1>
            <p className="auth-subtitle">Saisissez votre adresse e-mail pour réinitialiser votre mot de passe</p>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Email vérifié avec succès. Redirection...</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  name="email"
                  type="email"
                  placeholder="Adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <button type="submit" className="auth-button">
                Vérifier
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

export default ForgotPasswordForm;