import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin } from 'antd';
import { 
  TeamOutlined, 
  UserSwitchOutlined, 
  UserOutlined, 
  DatabaseOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

const RHHome = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalManagers: 0,
    activeUsers: 0,
    totalEntities: 0
  });

  useEffect(() => {
    // In a real scenario, you'd fetch data from your API
    // For now, we'll simulate loading and set dummy data
    const fetchData = async () => {
      try {
        setLoading(true);
        setTimeout(() => {
          setStats({
            totalEmployees: 48,
            totalManagers: 12,
            activeUsers: 57,
            totalEntities: 8
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <Title level={3}>Tableau de Bord RH</Title>
      <p style={{ marginBottom: 24 }}>Bienvenue dans votre espace de gestion des ressources humaines</p>
      
      {loading ? (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Employés"
                value={stats.totalEmployees}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Responsables"
                value={stats.totalManagers}
                prefix={<UserSwitchOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Comptes Actifs"
                value={stats.activeUsers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="stat-card">
              <Statistic
                title="Entités"
                value={stats.totalEntities}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      )}
      
      <div style={{ marginTop: 32 }}>
        <Title level={4}>Actions Rapides</Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              title="Créer un compte utilisateur" 
              className="stat-card"
              hoverable
              onClick={() => window.location.href = '/rh-dashboard/users/create'}
            >
              <p>Ajouter un nouveau utilisateur au système</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              title="Gérer les employés" 
              className="stat-card"
              hoverable
              onClick={() => window.location.href = '/rh-dashboard/employees'}
            >
              <p>Consulter et modifier les informations des employés</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card 
              title="Gérer les responsables" 
              className="stat-card"
              hoverable
              onClick={() => window.location.href = '/rh-dashboard/managers'}
            >
              <p>Consulter et modifier les informations des responsables</p>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default RHHome; 