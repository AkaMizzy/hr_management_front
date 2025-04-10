import React from 'react';
import { Layout, Menu, Button, Avatar } from 'antd';
import {
    TeamOutlined,
    BankOutlined,
    FileTextOutlined,
    CalendarOutlined,
    DashboardOutlined,
    LogoutOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const { Sider } = Layout;

const Sidebar = ({ collapsed, onCollapse }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const selectedKey = location.pathname.split('/')[1] || 'dashboard';

    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Tableau de bord',
        },
        {
            key: 'entities',
            icon: <BankOutlined />,
            label: 'Gestion des entités',
        },
        {
            key: 'employees',
            icon: <TeamOutlined />,
            label: 'Gestion des employés',
        },
        {
            key: 'documents',
            icon: <FileTextOutlined />,
            label: 'Gestion des documents',
        },
        {
            key: 'leaves',
            icon: <CalendarOutlined />,
            label: 'Gestion des congés',
        }, 
    ];

    const handleMenuClick = ({ key }) => {
        navigate(`/${key}`);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <Sider
            className="sidebar"
            width={240}
            collapsible
            collapsed={collapsed}
            onCollapse={onCollapse}
        >
            
            
            <div className="user-profile">
                <Avatar 
                    size={collapsed ? 36 : 48} 
                    icon={<UserOutlined />}
                    className="user-avatar"
                />
                {!collapsed && (
                    <div className="user-info">
                        <h3 className="user-name">Admin User</h3>
                        <p className="user-role">Administrator</p>
                    </div>
                )}
            </div>
            
            <div className="menu-container">
                <Menu
                    theme="light"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    className="sidebar-menu"
                />
            </div>
            
            <div className="logout-container">
                <Button 
                    type="primary" 
                    danger 
                    icon={<LogoutOutlined />} 
                    onClick={handleLogout}
                    className="logout-button"
                >
                    {!collapsed && 'Déconnexion'}
                </Button>
            </div>
        </Sider>
    );
};

export default Sidebar; 