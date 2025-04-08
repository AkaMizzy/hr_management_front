import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiUsers, FiBriefcase, FiFileText, FiCalendar, FiSettings } from "react-icons/fi";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/dashboard", icon: <FiHome />, label: "Tableau de bord" },
    { path: "/entities", icon: <FiBriefcase />, label: "Gestion des entités" },
    { path: "/employees", icon: <FiUsers />, label: "Gestion des employés" },
    { path: "/documents", icon: <FiFileText />, label: "Gestion des documents" },
    { path: "/leaves", icon: <FiCalendar />, label: "Gestion des congés" },
    { path: "/settings", icon: <FiSettings />, label: "Paramètres" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
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
        <div style={{ padding: "20px" }}>
          <button className="btn-primary" onClick={handleLogout} style={{ width: "100%" }}>
            Déconnexion
          </button>
        </div>
      </div>
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard; 