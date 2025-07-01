import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Alert, Tooltip, Divider } from 'antd';
import { 
  TeamOutlined, 
  UserSwitchOutlined, 
  UserOutlined, 
  DatabaseOutlined,
  FormOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined
} from '@ant-design/icons';
import axios from 'axios';
import DashboardCharts from '../../Manager/Dashboard/DashboardCharts';

const { Title, Text } = Typography;

const RHHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);
  
  // Data states
  const [stats, setStats] = useState({
    employees: {
      total: 0,
      change: 0
    },
    managers: {
      total: 0,
      change: 0
    },
    activeUsers: {
      total: 0,
      change: 0
    },
    entities: {
      total: 0,
      change: 0
    }
  });
  
  // Request data for charts
  const [allLeaves, setAllLeaves] = useState([]);
  const [allAbsences, setAllAbsences] = useState([]);
  const [allAttestations, setAllAttestations] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  // Helper function to count all entities in a tree structure
  const countAllEntities = (entitiesTree) => {
    if (!entitiesTree || !Array.isArray(entitiesTree)) return 0;
    
    return entitiesTree.reduce((count, entity) => {
      // Count this entity
      let total = 1;
      // Add count of all children entities recursively
      if (entity.children && Array.isArray(entity.children)) {
        total += countAllEntities(entity.children);
      }
      return count + total;
    }, 0);
  };

  // Wrap fetchData in useCallback to prevent it from being recreated on each render
  const fetchData = useCallback(async () => {
    // Don't fetch data if it's already been fetched
    if (dataFetched) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all employees
      const allEmployeesRes = await axios.get('http://localhost:5000/api/employes');
      const allEmployees = allEmployeesRes.data;
      
      // Count managers (employees with at least one direct report)
      const managersCount = allEmployees.reduce((count, emp) => {
        // Check if this employee is someone's manager
        const hasDirectReports = allEmployees.some(e => e.manager_id === emp.id);
        return hasDirectReports ? count + 1 : count;
      }, 0);
      
      // Count active users
      const activeUsersCount = allEmployees.filter(emp => emp.status === 'active').length;
      
      // Get entities (returns a tree structure)
      const entitiesRes = await axios.get('http://localhost:5000/api/entites');
      const entitiesTree = entitiesRes.data;
      
      // Count all entities including nested ones
      const entitiesCount = countAllEntities(entitiesTree);
      
      // Fetch all request data for charts using the new /all routes
      let leavesData = [], absencesData = [], attestationsData = [], expensesData = [];
      
      try {
        const leavesRes = await axios.get('http://localhost:5000/api/conges/all');
        leavesData = leavesRes.data;
      } catch (error) {
        console.warn('Error fetching leaves data:', error);
      }
      
      try {
        const absencesRes = await axios.get('http://localhost:5000/api/absences/all');
        absencesData = absencesRes.data;
      } catch (error) {
        console.warn('Error fetching absences data:', error);
      }
      
      try {
        const attestationsRes = await axios.get('http://localhost:5000/api/attestations/all');
        attestationsData = attestationsRes.data;
      } catch (error) {
        console.warn('Error fetching attestations data:', error);
      }
      
      try {
        const expensesRes = await axios.get('http://localhost:5000/api/note-frais/all');
        expensesData = expensesRes.data;
      } catch (error) {
        console.warn('Error fetching expenses data:', error);
      }
      
      setAllLeaves(leavesData);
      setAllAbsences(absencesData);
      setAllAttestations(attestationsData);
      setAllExpenses(expensesData);
      
      // Check if any of the data is empty and set a warning
      if (!leavesData.length || !absencesData.length || !attestationsData.length || !expensesData.length) {
        setError('Certaines données pourraient ne pas être complètes. Les routes backend correspondantes pourraient ne pas être disponibles ou nécessiter un redémarrage du serveur.');
      }
      
      // Simulate changes (in a real app, you would fetch historical data)
      // For this example, we'll generate random changes between -15% and +15%
      const getRandomChange = () => Math.floor(Math.random() * 31) - 15;
      
      setStats({
        employees: {
          total: allEmployees.length,
          change: getRandomChange()
        },
        managers: {
          total: managersCount,
          change: getRandomChange()
        },
        activeUsers: {
          total: activeUsersCount,
          change: getRandomChange()
        },
        entities: {
          total: entitiesCount,
          change: getRandomChange()
        }
      });
      
      setDataFetched(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [dataFetched]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Function to manually refresh data
  const handleRefresh = () => {
    setDataFetched(false);
    fetchData();
  };

  const StatCard = ({ title, value, icon, color, change }) => {
    // Determine trend icon and color based on change value
    let trendIcon = null;
    let trendColor = '';
    
    if (change > 0) {
      trendIcon = <ArrowUpOutlined />;
      trendColor = '#52c41a'; // green
    } else if (change < 0) {
      trendIcon = <ArrowDownOutlined />;
      trendColor = '#f5222d'; // red
    } else {
      trendIcon = <MinusOutlined />;
      trendColor = '#8c8c8c'; // grey
    }
    
    // Generate tooltip content based on title
    const getTooltipContent = () => {
      switch(title) {
        case 'Employés':
          return 'Nombre total d\'employés dans le système';
        case 'Responsables':
          return 'Nombre total de responsables avec au moins un subordonné direct';
        case 'Comptes Actifs':
          return 'Nombre d\'utilisateurs avec un statut actif';
        case 'Entités':
          return 'Nombre total d\'entités dans la hiérarchie de l\'entreprise';
        default:
          return '';
      }
    };
    
    return (
      <Tooltip title={getTooltipContent()}>
        <Card 
          className="stat-card" 
          size="small" 
          style={{ 
            height: '100%',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          hoverable
        >
          <div className="stat-header" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <div className="stat-icon" style={{ 
              backgroundColor: `${color}15`, 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: '8px'
            }}>
              {React.cloneElement(icon, { style: { ...icon.props.style, fontSize: '16px' } })}
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#8c8c8c' }}>{title}</div>
            </div>
          </div>
          <Statistic
            value={value}
            valueStyle={{ color: color, fontSize: '24px', fontWeight: 'bold', margin: '4px 0' }}
          />
          {change !== undefined && (
            <div className="stat-trend" style={{ fontSize: '12px', color: trendColor, marginTop: '8px' }}>
              {trendIcon} <span>{Math.abs(change)}% par rapport au mois dernier</span>
            </div>
          )}
        </Card>
      </Tooltip>
    );
  };

  const ActionCard = ({ title, description, icon, color, onClick }) => {
    return (
      <Card 
        className="action-card"
        hoverable
        onClick={onClick}
        style={{ height: '100%' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ 
            backgroundColor: `${color}15`, 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            {React.cloneElement(icon, { style: { color: color, fontSize: '20px' } })}
          </div>
          <Title level={5} style={{ margin: 0 }}>{title}</Title>
        </div>
        <Text>{description}</Text>
      </Card>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3}>Tableau de Bord RH</Title>
        <button 
          onClick={handleRefresh}
          style={{
            padding: '8px 16px',
            background: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Actualiser les données
        </button>
      </div>
      <Text style={{ marginBottom: 24, display: 'block' }}>
        Bienvenue dans votre espace de gestion des ressources humaines. Consultez les statistiques et accédez rapidement aux fonctionnalités principales.
      </Text>
      
      {error && (
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      
      {loading ? (
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Chargement des données...</div>
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={12} md={6} lg={6}>
              <StatCard
                title="Employés"
                value={stats.employees.total}
                icon={<TeamOutlined style={{ color: '#1890ff' }} />}
                color="#1890ff"
                change={stats.employees.change}
              />
            </Col>
            <Col xs={12} sm={12} md={6} lg={6}>
              <StatCard
                title="Responsables"
                value={stats.managers.total}
                icon={<UserSwitchOutlined style={{ color: '#722ed1' }} />}
                color="#722ed1"
                change={stats.managers.change}
              />
            </Col>
            <Col xs={12} sm={12} md={6} lg={6}>
              <StatCard
                title="Comptes Actifs"
                value={stats.activeUsers.total}
                icon={<UserOutlined style={{ color: '#52c41a' }} />}
                color="#52c41a"
                change={stats.activeUsers.change}
              />
            </Col>
            <Col xs={12} sm={12} md={6} lg={6}>
              <StatCard
                title="Entités"
                value={stats.entities.total}
                icon={<DatabaseOutlined style={{ color: '#fa8c16' }} />}
                color="#fa8c16"
                change={stats.entities.change}
              />
            </Col>
          </Row>
          
          <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
            <Col xs={24}>
              {(allLeaves.length || allAbsences.length || allAttestations.length || allExpenses.length) ? (
                <DashboardCharts 
                  leavesData={allLeaves} 
                  absencesData={allAbsences}
                  attestationsData={allAttestations}
                  expensesData={allExpenses}
                  employeesByDepartmentVisible={false}
                />
              ) : (
                <Card>
                  <Alert
                    message="Données insuffisantes pour afficher les graphiques"
                    description="Veuillez vous assurer que les routes backend sont disponibles et que les données ont été chargées correctement."
                    type="info"
                    showIcon
                  />
                </Card>
              )}
            </Col>
          </Row>
        </>
      )}
      
      <Divider style={{ margin: '32px 0 24px' }} />
      
      <Title level={4}>Actions Rapides</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <ActionCard 
            title="Gérer les Utilisateurs"
            description="Créer, modifier ou désactiver des comptes utilisateurs"
            icon={<UserOutlined />}
            color="#1890ff"
            onClick={() => window.location.href = '/rh-dashboard/users'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ActionCard 
            title="Attestations"
            description="Gérer les demandes d'attestation en attente"
            icon={<FormOutlined />}
            color="#722ed1"
            onClick={() => window.location.href = '/rh-dashboard/attestations'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ActionCard 
            title="Congés"
            description="Traiter les demandes de congés"
            icon={<CalendarOutlined />}
            color="#52c41a"
            onClick={() => window.location.href = '/rh-dashboard/conges'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ActionCard 
            title="Absences"
            description="Consulter et gérer les absences"
            icon={<ClockCircleOutlined />}
            color="#fa8c16"
            onClick={() => window.location.href = '/rh-dashboard/absences'}
          />
        </Col>
      </Row>
    </div>
  );
};

export default RHHome; 