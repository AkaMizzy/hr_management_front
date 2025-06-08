import React from 'react';
import { Layout, Menu } from 'antd';
import {
    TeamOutlined,
    BankOutlined,
    FileTextOutlined,
    CalendarOutlined,
    DashboardOutlined,
    CheckSquareOutlined,
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
            key: 'entites',
            icon: <BankOutlined />,
            label: 'Gestion des entités',
        },
        {
            key: 'employes',
            icon: <TeamOutlined />,
            label: 'Gestion des employés',
        },
        {
            key: 'taches',
            icon: <CheckSquareOutlined />,
            label: 'Gestion des tâches',
        },
        {
            key: 'documents',
            icon: <FileTextOutlined />,
            label: 'Gestion des documents',
        },
        {
            key: 'conge',
            icon: <CalendarOutlined />,
            label: 'Gestion des congés',
        },
    ];

    const handleMenuClick = ({ key }) => {
        navigate(`/${key}`);
    };

    return (
        <Sider className="sidebar" width={240} collapsible collapsed={collapsed} onCollapse={onCollapse}>
            <div className="menu-container">
                <Menu theme="light" mode="inline" selectedKeys={[selectedKey]} items={menuItems} onClick={handleMenuClick} className="sidebar-menu" />
            </div>
        </Sider>
    );
};

export default Sidebar; 