import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Dropdown, Avatar, Menu,  Badge, Row, Col, Card, Statistic, Typography, Progress } from "antd";
import { LogoutOutlined, BellOutlined,  TeamOutlined, BankOutlined, FileOutlined, CalendarOutlined, ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { toast } from 'react-hot-toast';
import Sidebar from "../Sidebar/Sidebar";
import userImage from "../Assets/images/user.png";
import "./Dashboard.css";
import axios from 'axios';

const { Content, Header, Footer } = Layout;
const { Title: AntTitle } = Typography;

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
    email: ""
  });
  
  // État pour les notifications
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Bienvenue sur Muntadaa!", read: false },
    { id: 2, message: "Votre compte a été créé avec succès", read: false }
  ]);

  const [stats, setStats] = useState({
    employees: {
      total: 0,
      change: 0,
      trend: 'up'
    },
    entities: {
      total: 0,
      change: 0,
      trend: 'up'
    },
    documents: {
      total: 0,
      change: 0,
      trend: 'up'
    },
    leaves: {
      total: 0,
      change: 0,
      trend: 'up'
    }
  });

  const [chartData, setChartData] = useState({
    employees: {
      current: 25,
      previous: 22,
      change: 13.6
    },
    entities: {
      current: 7,
      previous: 6,
      change: 16.7
    },
    documents: {
      current: 45,
      previous: 42,
      change: 7.1
    },
    leaves: {
      current: 18,
      previous: 15,
      change: 20
    }
  });

  // Récupérer les données utilisateur au chargement du composant
  useEffect(() => {
    const getUserData = () => {
      // Récupérer les données utilisateur du localStorage
      const userData = localStorage.getItem("userData");
      
      if (userData) {
        const parsedData = JSON.parse(userData);
        setUser({
          name: parsedData.name || "Utilisateur",
          email: parsedData.email || ""
        });
      } else {
        // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
        navigate("/login");
      }
    };

    getUserData();
  }, [navigate]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Récupérer les statistiques des employés
      const employeesRes = await axios.get('http://localhost:5000/api/employes');
      const employeesCount = employeesRes.data.length;
      
      // Récupérer les statistiques des entités
      const entitiesRes = await axios.get('http://localhost:5000/api/entites');
      const entitiesCount = entitiesRes.data.length;
      
      // Récupérer les statistiques des documents
      const documentsRes = await axios.get('http://localhost:5000/api/documents');
      const documentsCount = documentsRes.data.length;
      
      // Récupérer les statistiques des congés
      const leavesRes = await axios.get('http://localhost:5000/api/conges');
      const leavesCount = leavesRes.data.length;

      setStats({
        employees: {
          total: employeesCount,
          change: 5, // À remplacer par la vraie variation
          trend: 'up'
        },
        entities: {
          total: entitiesCount,
          change: 2,
          trend: 'up'
        },
        documents: {
          total: documentsCount,
          change: -3,
          trend: 'down'
        },
        leaves: {
          total: leavesCount,
          change: 8,
          trend: 'up'
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
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
      {notifications.length > 0 ? (
        notifications.map(notification => (
          <Menu.Item 
            key={notification.id} 
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            onClick={() => markNotificationAsRead(notification.id)}
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

  const StatCard = ({ title, value, change, trend, icon, color, chartData }) => (
    <Card className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}15` }}>
        {icon}
      </div>
      <Statistic
        title={title}
        value={value}
        valueStyle={{ color: color }}
        prefix={trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        suffix={`${Math.abs(change)}%`}
      />
      <div className="chart-container">
        <div className="stat-comparison">
          <div className="stat-label">Mois précédent: {chartData.previous}</div>
          <div className="stat-label">Mois actuel: {chartData.current}</div>
        </div>
        <Progress 
          percent={Math.min(100, Math.abs(chartData.change))} 
          strokeColor={color} 
          trailColor={`${color}20`}
          size="small"
          showInfo={false}
        />
      </div>
    </Card>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} onCollapse={handleSidebarCollapse} />
      <Layout 
        className={`site-layout ${collapsed ? 'site-layout-collapsed' : ''}`} 
        style={{ marginLeft: collapsed ? '80px' : '240px' }}
      >
        <Header className="dashboard-header">
          <div className="header-welcome">
            Bienvenue
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
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Employés"
                      value={stats.employees.total}
                      change={stats.employees.change}
                      trend={stats.employees.trend}
                      icon={<TeamOutlined style={{ color: '#1890ff' }} />}
                      color="#1890ff"
                      chartData={chartData.employees}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Entités"
                      value={stats.entities.total}
                      change={stats.entities.change}
                      trend={stats.entities.trend}
                      icon={<BankOutlined style={{ color: '#52c41a' }} />}
                      color="#52c41a"
                      chartData={chartData.entities}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Documents"
                      value={stats.documents.total}
                      change={stats.documents.change}
                      trend={stats.documents.trend}
                      icon={<FileOutlined style={{ color: '#faad14' }} />}
                      color="#faad14"
                      chartData={chartData.documents}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Demandes de Congés"
                      value={stats.leaves.total}
                      change={stats.leaves.change}
                      trend={stats.leaves.trend}
                      icon={<CalendarOutlined style={{ color: '#f5222d' }} />}
                      color="#f5222d"
                      chartData={chartData.leaves}
                    />
                  </Col>
                </Row>
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