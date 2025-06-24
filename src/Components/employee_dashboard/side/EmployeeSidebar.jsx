import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  FileOutlined, 
  CheckSquareOutlined,
  FormOutlined,
  ClockCircleOutlined,
  CarryOutOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../Assets/images/pic1.jpeg';

const { Sider } = Layout;

const EmployeeSidebar = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/employee-dashboard/profile',
      icon: <UserOutlined />,
      label: 'Mon Profil'
    },
    {
      key: '/employee-dashboard/tasks',
      icon: <CheckSquareOutlined />,
      label: 'Mes Tâches'
    },
    {
      key: '/employee-dashboard/calendar',
      icon: <CalendarOutlined />,
      label: 'Calendrier'
    },
    {
      key: '/employee-dashboard/documents',
      icon: <FileOutlined />,
      label: 'Mes Documents'
    },
    {
      key: '/employee-dashboard/attestations',
      icon: <FormOutlined />,
      label: 'Attestations'
    },
    {
      key: '/employee-dashboard/absences',
      icon: <ClockCircleOutlined />,
      label: 'Absences'
    },
    {
      key: '/employee-dashboard/conges',
      icon: <CarryOutOutlined  />,
      label: 'Congés'
    },
    {
      key: '/employee-dashboard/note-frais',
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

export default EmployeeSidebar; 