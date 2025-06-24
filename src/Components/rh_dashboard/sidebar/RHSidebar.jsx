import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  TeamOutlined, 
  DashboardOutlined,
  FormOutlined,
  ClockCircleOutlined,
  CarryOutOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../Assets/images/pic1.jpeg';

const { Sider } = Layout;

const RHSidebar = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/rh-dashboard/home',
      icon: <DashboardOutlined />,
      label: 'Tableau de Bord'
    },
    {
      key: '/rh-dashboard/users',
      icon: <TeamOutlined />,
      label: 'Gestion Utilisateurs'
    },
   
    {
      key: '/rh-dashboard/attestations',
      icon: <FormOutlined />,
      label: 'Attestations'
    },
    {
      key: '/rh-dashboard/absences',
      icon: <ClockCircleOutlined />,
      label: 'Absences'
    },
    {
      key: '/rh-dashboard/conges',
      icon: <CarryOutOutlined  />,
      label: 'Congés'
    },
    {
      key: '/rh-dashboard/note-frais',
      icon: <DollarOutlined />,
      label: 'Notes de frais'
    },
  ];

  const handleMenuClick = (item) => {
    navigate(item.key);
  };

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={onCollapse}
      style={{
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <div 
        className="logo-container"
        style={{ 
          height: '100px',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          overflow: 'hidden'
        }}
      >
        <img 
          src={logo} 
          alt="Logo" 
          style={{ 
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
            transition: 'all 0.3s',
            display: collapsed ? 'none' : 'block'
          }} 
        />
      </div>
      <Menu
        theme="light"
        selectedKeys={[location.pathname]}
        mode="inline"
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          borderRight: 'none'
        }}
      />
    </Sider>
  );
};

export default RHSidebar; 