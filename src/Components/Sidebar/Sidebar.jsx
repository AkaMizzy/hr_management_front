import React from 'react';
import { Layout, Menu } from 'antd';
import {
    UserOutlined,
    TeamOutlined,
    BankOutlined,
    FileTextOutlined,
    CalendarOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Sider } = Layout;

const Sidebar = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            key: 'dashboard',
            icon: <UserOutlined />,
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
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Paramètres',
        },
    ];

    const handleMenuClick = ({ key }) => {
        navigate(`/${key}`);
    };

    return (
        <Sider
            style={{
                overflow: 'auto',
                height: '100vh',
                position: 'fixed',
                left: 0,
            }}
        >
            <div className="logo" style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
            <Menu
                theme="dark"
                mode="inline"
                defaultSelectedKeys={['dashboard']}
                items={menuItems}
                onClick={handleMenuClick}
            />
        </Sider>
    );
};

export default Sidebar; 