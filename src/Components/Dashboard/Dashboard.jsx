import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Layout } from "antd";
import Sidebar from "../Sidebar/Sidebar";
import "./Dashboard.css";

const { Content } = Layout;

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else if (window.innerWidth > 1200) {
        setCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle sidebar collapse state
  const handleSidebarCollapse = (collapsed) => {
    setCollapsed(collapsed);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} onCollapse={handleSidebarCollapse} />
      <Layout 
        className={`site-layout ${collapsed ? 'site-layout-collapsed' : ''}`} 
        style={{ marginLeft: collapsed ? '80px' : '240px' }}
      >
        <Content style={{ margin: "24px 16px", overflow: "initial" }}>
          <div className="main-content">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Dashboard; 