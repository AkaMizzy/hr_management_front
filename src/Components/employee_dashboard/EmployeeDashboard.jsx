import React, { useState } from 'react';
import { Layout, Typography, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import EmployeeSidebar from './side/EmployeeSidebar';
import './EmployeeDashboard.css';

const { Header, Content } = Layout;
const { Title } = Typography;

const EmployeeDashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    toast((t) => (
      <div className="delete-confirmation">
        <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
        <div className="delete-actions">
          <button 
            className="delete-confirm-btn"
            onClick={() => {
              // First dismiss the confirmation toast
              toast.dismiss(t.id);
              
              // Then handle logout
              localStorage.removeItem("token");
              localStorage.removeItem("userData");
              
              // Show success message and navigate
              toast.success("Déconnexion réussie");
              navigate("/login");
            }}
          >
            Confirmer
          </button>
          <button 
            className="delete-cancel-btn"
            onClick={() => toast.dismiss(t.id)}
          >
            Annuler
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
      style: {
        background: '#fff',
        color: '#333',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '400px',
        width: '100%'
      }
    });
  };

  return (
    <Layout style={{ minHeight: '100vh' }} className="employee-dashboard">
      <EmployeeSidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout style={{ 
        marginLeft: collapsed ? '80px' : '200px',
        transition: 'margin-left 0.2s'
      }}>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Title level={4} style={{ margin: '16px 0', lineHeight: '32px' }}>
            Tableau de Bord Employé
          </Title>
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout}
            danger
            style={{ fontSize: '16px' }}
          >
            Déconnexion
          </Button>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default EmployeeDashboard; 