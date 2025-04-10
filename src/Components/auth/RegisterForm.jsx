import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-hot-toast';
import { FiEye, FiEyeOff, FiUpload, FiX } from "react-icons/fi";
import { FaGoogle, FaGithub } from "react-icons/fa";
import pic1 from "../Assets/images/pic1.jpeg";

import "./auth.css";

const RegisterForm = () => {
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    profileImage: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState(null);
  const navigate = useNavigate();

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner une image valide");
        return;
      }
      setForm({ ...form, profileImage: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setForm({ ...form, profileImage: null });
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('password', form.password);
      formData.append('confirmPassword', form.confirmPassword);
      if (form.profileImage) {
        formData.append('profileImage', form.profileImage);
      }

      const res = await axios.post("http://localhost:5000/api/register", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
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
              <div className="form-group profile-image-group">
                <div className="profile-image-container">
                  <div className="profile-image-wrapper">
                    <div 
                      className="profile-image-preview"
                      onClick={handleImageClick}
                    >
                      {previewImage ? (
                        <img src={previewImage} alt="Profile preview" />
                      ) : (
                        <div className="profile-image-placeholder">
                          <FiUpload size={24} />
                          <span>Cliquez pour ajouter une photo</span>
                        </div>
                      )}
                    </div>
                    {previewImage && (
                      <button 
                        type="button" 
                        className="remove-image-btn-external"
                        onClick={handleRemoveImage}
                      >
                        <FiX color="red" size={20} />
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    name="profileImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="profile-image-input"
                  />
                </div>
              </div>

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