import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiUsers, FiBriefcase, FiFileText, FiCalendar, FiSettings, FiLogOut, FiChevronDown, FiSun, FiMoon } from "react-icons/fi";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const menuItems = [
    { path: "/dashboard", icon: <FiHome />, label: "Tableau de bord" },
    { path: "/entities", icon: <FiBriefcase />, label: "Gestion des entités" },
    { path: "/employees", icon: <FiUsers />, label: "Gestion des employés" },
    { path: "/documents", icon: <FiFileText />, label: "Gestion des documents" },
    { path: "/leaves", icon: <FiCalendar />, label: "Gestion des congés" },
    { path: "/settings", icon: <FiSettings />, label: "Paramètres" },
  ];

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode', !darkMode);
  };

  return (
    <div className={`dashboard-container ${darkMode ? 'dark' : ''}`}>
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">Muntadaa</div>
        </div>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li
              key={item.path}
              className={`menu-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="menu-icon">{item.icon}</span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="main-content">
        <div className="dashboard-header">
          <h1>Bienvenue, {user?.name}</h1>
          <div className="user-profile-section">
            <div 
              className="user-profile-trigger"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div className="user-avatar">
                {user?.profileImage ? (
                  <img 
                    src={`http://localhost:7000/uploads/${user.profileImage}`} 
                    alt="Profile" 
                  />
                ) : (
                  <div className="avatar-placeholder">{user?.name?.charAt(0)}</div>
                )}
              </div>
              <span className="user-name">{user?.name}</span>
              <FiChevronDown className={`dropdown-icon ${showProfileDropdown ? 'open' : ''}`} />
            </div>
            
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <div className="profile-avatar">
                    {user?.profileImage ? (
                      <img 
                        src={`http://localhost:7000/uploads/${user.profileImage}`} 
                        alt="Profile" 
                      />
                    ) : (
                      <div className="avatar-placeholder">{user?.name?.charAt(0)}</div>
                    )}
                  </div>
                  <div className="profile-details">
                    <h3 className="profile-name">{user?.name || "Utilisateur"}</h3>
                    <p className="profile-email">{user?.email || "Email non disponible"}</p>
                  </div>
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                  <FiLogOut /> Déconnexion
                </button>
              </div>
            )}
          </div>
          <button className="dark-mode-toggle" onClick={toggleDarkMode}>
            {darkMode ? <FiSun /> : <FiMoon />}
          </button>
        </div>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;