import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Dropdown, Avatar, Menu, Badge, Row, Col, Card, Statistic, Typography, Progress, Spin, Alert, Tooltip } from "antd";
import { 
  LogoutOutlined, 
  BellOutlined, 
  TeamOutlined, 
  BankOutlined, 
  UserOutlined,
  FileDoneOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined
} from "@ant-design/icons";
import { toast } from 'react-hot-toast';
import Sidebar from "../Sidebar/Sidebar";
import DashboardCharts from "./DashboardCharts";
import userImage from "../../Assets/images/user.png";
import "./Dashboard.css";
import axios from 'axios';
import moment from 'moment';

const { Content, Header, Footer } = Layout;
const { Title: AntTitle, Text } = Typography;

const getLightAvatarColor = (name) => {
  const lightColors = [
    '#FF6B6B', // Rouge clair
    '#4ECDC4', // Turquoise
    '#45B7D1', // Bleu clair
    '#96CEB4', // Vert menthe
    '#FFEEAD', // Jaune pâle
    '#D4A5A5', // Rose pâle
    '#9B59B6', // Violet
    '#3498DB'  // Bleu
  ];
  
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  return lightColors[Math.abs(hash) % lightColors.length];
};

const Dashboard = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const location = useLocation();
  
  // État pour stocker les informations de l'utilisateur
  const [user, setUser] = useState({
    name: "",
    email: "",
    employe_id: null
  });
  
  // État pour les notifications
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // État pour les données de demandes
  const [allLeaves, setAllLeaves] = useState([]);
  const [allAbsences, setAllAbsences] = useState([]);
  const [allAttestations, setAllAttestations] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);

  const [stats, setStats] = useState({
    employees: {
      total: 0,
      change: 0
    },
    entities: {
      total: 0,
      change: 0
    },
    managers: {
      total: 0,
      change: 0
    },
    documents: {
      total: 0,
      change: 0
    }
  });

  const [chartData, setChartData] = useState({
    employees: {
      current: 0,
      previous: 0,
      change: 0
    },
    entities: {
      current: 0,
      previous: 0,
      change: 0
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer les données utilisateur au chargement du composant
  useEffect(() => {
    const getUserData = () => {
      // Récupérer les données utilisateur du localStorage
      const userData = localStorage.getItem("userData");
      
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUser({
          name: parsedData.name || "Utilisateur",
          email: parsedData.email || "",
          employe_id: parsedData.employe_id || null
        });
      } else {
        // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
        navigate("/login");
      }
    };

    getUserData();
  }, [navigate]);

  useEffect(() => {
    if (user.employe_id) {
    fetchStats();
      fetchNotifications();
    }
  }, [user.employe_id]);

  const fetchNotifications = async () => {
    if (!user.employe_id) return;
    
    setLoadingNotifications(true);
    try {
      // Fetch pending requests that require manager validation
      const [congesRes, absencesRes, attestationsRes, expensesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/conges/manager/${user.employe_id}`),
        axios.get(`http://localhost:5000/api/absences/manager/${user.employe_id}`),
        axios.get(`http://localhost:5000/api/attestations/manager/${user.employe_id}`),
        axios.get(`http://localhost:5000/api/note-frais/manager/${user.employe_id}`)
      ]);
      
      // Filter only pending requests (those without manager validation)
      const pendingConges = congesRes.data.filter(c => !c.manager_validation);
      const pendingAbsences = absencesRes.data.filter(a => !a.manager_validation);
      const pendingAttestations = attestationsRes.data.filter(a => !a.manager_validation);
      const pendingExpenses = expensesRes.data.filter(e => !e.manager_validation);
      
      // Create notification objects
      const notificationsList = [
        ...pendingConges.map(c => ({
          id: `conge-${c.id}`,
          message: `Demande de congé en attente de ${c.employe_prenom} ${c.employe_nom}`,
          type: 'conge',
          data: c,
          read: false
        })),
        ...pendingAbsences.map(a => ({
          id: `absence-${a.id}`,
          message: `Demande d'absence en attente de ${a.employe_prenom} ${a.employe_nom}`,
          type: 'absence',
          data: a,
          read: false
        })),
        ...pendingAttestations.map(a => ({
          id: `attestation-${a.id}`,
          message: `Demande d'attestation en attente de ${a.employe_prenom} ${a.employe_nom}`,
          type: 'attestation',
          data: a,
          read: false
        })),
        ...pendingExpenses.map(e => ({
          id: `expense-${e.id}`,
          message: `Note de frais en attente de ${e.employe_prenom} ${e.employe_nom}`,
          type: 'expense',
          data: e,
          read: false
        }))
      ];
      
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

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

  const fetchStats = async () => {
    if (!user.employe_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all employees from the system
      const allEmployeesRes = await axios.get('http://localhost:5000/api/employes');
      const allEmployees = allEmployeesRes.data;
      
      // Get employees under this manager
      const employeesRes = await axios.get(`http://localhost:5000/api/employes/responsable/${user.employe_id}`);
      const employees = employeesRes.data;
      const employeeIds = employees.map(emp => emp.id);
      
      // Count managers (employees with at least one direct report)
      const managersCount = allEmployees.reduce((count, emp) => {
        // Check if this employee is someone's manager
        const hasDirectReports = allEmployees.some(e => e.manager_id === emp.id);
        return hasDirectReports ? count + 1 : count;
      }, 0);
      
      // Get entities (returns a tree structure)
      const entitiesRes = await axios.get('http://localhost:5000/api/entites');
      const entitiesTree = entitiesRes.data;
      
      // Count all entities including nested ones
      const entitiesCount = countAllEntities(entitiesTree);
      
      // Get all documents
      let documentsCount = 0;
      try {
        const documentsRes = await axios.get('http://localhost:5000/api/documents');
        documentsCount = documentsRes.data.length;
      } catch (error) {
        console.error('Error fetching documents:', error);
        // Continue with documentsCount = 0
      }
      
      // Get all leave requests for employees under this manager
      const allLeavesPromises = employeeIds.map(id => 
        axios.get(`http://localhost:5000/api/conges/employee/${id}`)
      );
      const allLeavesResponses = await Promise.all(allLeavesPromises);
      const leavesData = allLeavesResponses.flatMap(res => res.data);
      setAllLeaves(leavesData);
      
      // Get all absence requests for employees under this manager
      const allAbsencesPromises = employeeIds.map(id => 
        axios.get(`http://localhost:5000/api/absences/employee/${id}`)
      );
      const allAbsencesResponses = await Promise.all(allAbsencesPromises);
      const absencesData = allAbsencesResponses.flatMap(res => res.data);
      setAllAbsences(absencesData);
      
      // Get all attestation requests for employees under this manager
      const allAttestationsPromises = employeeIds.map(id => 
        axios.get(`http://localhost:5000/api/attestations/employee/${id}`)
      );
      const allAttestationsResponses = await Promise.all(allAttestationsPromises);
      const attestationsData = allAttestationsResponses.flatMap(res => res.data);
      setAllAttestations(attestationsData);
      
      // Get all expense requests for employees under this manager
      const allExpensesPromises = employeeIds.map(id => 
        axios.get(`http://localhost:5000/api/note-frais/employee/${id}`)
      );
      const allExpensesResponses = await Promise.all(allExpensesPromises);
      const expensesData = allExpensesResponses.flatMap(res => res.data);
      setAllExpenses(expensesData);
      
      // Simulate changes (in a real app, you would fetch historical data)
      // For this example, we'll generate random changes between -15% and +15%
      const getRandomChange = () => Math.floor(Math.random() * 31) - 15;
      
      // Update state with all the calculated data
      setStats({
        employees: {
          total: allEmployees.length, // This is the total count of all employees in the system
          change: getRandomChange()
        },
        entities: {
          total: entitiesCount, // Count of all entities including nested ones
          change: getRandomChange()
        },
        managers: {
          total: managersCount,
          change: getRandomChange()
        },
        documents: {
          total: documentsCount,
          change: getRandomChange()
        }
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      setError('Erreur lors du chargement des données. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

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

  // Handle logout
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

  // Marquer une notification comme lue
  const markNotificationAsRead = (id) => {
    setNotifications(
      notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);
    
    // Navigate to the appropriate page based on notification type
    switch (notification.type) {
      case 'conge':
        navigate('/conges');
        break;
      case 'absence':
        navigate('/absences');
        break;
      case 'attestation':
        navigate('/attestations');
        break;
      case 'expense':
        navigate('/note-frais');
        break;
      default:
        break;
    }
  };

  // Menu de l'utilisateur
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" className="user-dropdown-item">
        <div className="user-info-container">
          <div className="user-info-name">{user.name}</div>
          <div className="user-info-email">{user.email}</div>
          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            <LogoutOutlined /> Déconnexion
          </button>
        </div>
      </Menu.Item>
    </Menu>
  );

  // Menu des notifications
  const notificationMenu = (
    <Menu className="notification-menu">
      {loadingNotifications ? (
        <Menu.Item key="loading" className="notification-item">
          <div className="notification-content" style={{ textAlign: 'center' }}>
            <Spin size="small" /> Chargement...
          </div>
        </Menu.Item>
      ) : notifications.length > 0 ? (
        notifications.map(notification => (
          <Menu.Item 
            key={notification.id} 
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="notification-content">
              {notification.message}
            </div>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item key="no-notifications" className="notification-item">
          <div className="notification-content">
            Aucune notification
          </div>
        </Menu.Item>
      )}
    </Menu>
  );

  const unreadCount = notifications.filter(n => !n.read).length;
  const avatarColor = getLightAvatarColor(user.name);
  const currentYear = new Date().getFullYear();

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
        case 'Managers':
          return 'Nombre total de managers avec au moins un subordonné direct';
        case 'Entités':
          return 'Nombre total d\'entités dans la hiérarchie de l\'entreprise';
        case 'Documents':
          return 'Nombre total de documents enregistrés dans le système';
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} onCollapse={handleSidebarCollapse} />
      <Layout 
        className={`site-layout ${collapsed ? 'site-layout-collapsed' : ''}`}
      >
        <Header className="dashboard-header">
          <div className="header-welcome">
            Bienvenue, {user.name}
          </div>
          <div className="header-right">
            <div className="notification-container">
              <Dropdown 
                overlay={notificationMenu} 
                trigger={['click']} 
                placement="bottomRight"
              >
                <Badge count={unreadCount} size="small">
                  <BellOutlined className="notification-icon" />
                </Badge>
              </Dropdown>
            </div>
            <div className="header-user">
              <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
                <div className="user-dropdown-trigger">
                  <div className="user-info-display">
                    <Avatar 
                      style={{ 
                        backgroundColor: avatarColor,
                        color: '#fff',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }} 
                      className="user-avatar"
                      src={userImage}
                      alt="User avatar"
                    />
                    <span className="user-name">{user.name}</span>
                  </div>
                </div>
              </Dropdown>
            </div>
          </div>
        </Header>
        
        <Content style={{ margin: "24px 16px", overflow: "initial" }}>
          <div className="main-content">
            {location.pathname === '/dashboard' && (
              <>
                <AntTitle level={2}>Tableau de Bord</AntTitle>
                
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
                  <div style={{ textAlign: 'center', padding: '50px 0' }}>
                    <Spin size="large" />
                    <div style={{ marginTop: 16 }}>Chargement des données...</div>
                  </div>
                ) : (
                  <>
                    <Row gutter={[16, 16]}>
                      {/* Shows total count of all employees in the system */}
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
                          title="Managers"
                          value={stats.managers.total}
                          icon={<UserOutlined style={{ color: '#722ed1' }} />}
                          color="#722ed1"
                          change={stats.managers.change}
                    />
                  </Col>
                      {/* Shows total count of all entities including nested ones in the hierarchy */}
                      <Col xs={12} sm={12} md={6} lg={6}>
                    <StatCard
                      title="Entités"
                      value={stats.entities.total}
                      icon={<BankOutlined style={{ color: '#52c41a' }} />}
                      color="#52c41a"
                          change={stats.entities.change}
                    />
                  </Col>
                      {/* Shows total count of all documents in the system */}
                      <Col xs={12} sm={12} md={6} lg={6}>
                    <StatCard
                      title="Documents"
                      value={stats.documents.total}
                          icon={<FileDoneOutlined style={{ color: '#faad14' }} />}
                          color="#faad14"
                      change={stats.documents.change}
                    />
                  </Col>
                </Row>
                    <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                  <Col xs={24}>
                        <DashboardCharts 
                          leavesData={allLeaves} 
                          absencesData={allAbsences}
                          attestationsData={allAttestations}
                          expensesData={allExpenses}
                        />
                  </Col>
                </Row>
                  </>
                )}
              </>
            )}
            <Outlet />
          </div>
        </Content>
        
        <Footer className="dashboard-footer">
          <div className="footer-copyright">
            © {currentYear} MuntadaaCom. Tous droits réservés.
          </div>
        </Footer>
      </Layout>
    </Layout>
  );
};

export default Dashboard;