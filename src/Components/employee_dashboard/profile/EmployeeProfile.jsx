import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Avatar, Typography, Statistic, Descriptions, Spin, Divider, Progress, Tag } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  FileOutlined, 
  CheckSquareOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  TeamOutlined,
  IdcardOutlined,
  BankOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/fr';

const { Title, Text, Paragraph } = Typography;

// Set moment to French locale
moment.locale('fr');

const EmployeeProfile = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [managerData, setManagerData] = useState(null);
  const [entityData, setEntityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskCount, setTaskCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  const [activeTasks, setActiveTasks] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.employe_id) {
        navigate('/login');
        return;
      }

      // Fetch employee profile
      const profileResponse = await axios.get(`http://localhost:5000/api/employes/${userData.employe_id}`);
      setEmployeeData(profileResponse.data);

      // Fetch manager data if manager_id exists
      if (profileResponse.data.manager_id) {
        const managerResponse = await axios.get(`http://localhost:5000/api/employes/${profileResponse.data.manager_id}`);
        setManagerData(managerResponse.data);
      }
      
      // Fetch entity data if entite_id exists
      if (profileResponse.data.entite_id) {
        try {
          const entityResponse = await axios.get(`http://localhost:5000/api/entites/${profileResponse.data.entite_id}`);
          setEntityData(entityResponse.data);
        } catch (error) {
          console.error('Error fetching entity data:', error);
        }
      }
      
      // Fetch employee's tasks
      const tasksResponse = await axios.get(`http://localhost:5000/api/taches/employee/${userData.employe_id}`);
      const tasks = tasksResponse.data;
      setTaskCount(tasks.length);
      
      // Get active tasks (not completed)
      const active = tasks.filter(task => task.status !== 'completed').slice(0, 3);
      setActiveTasks(active);

      // Fetch employee's documents
      const documentsResponse = await axios.get(`http://localhost:5000/api/documents/${userData.employe_id}`);
      const documents = documentsResponse.data;
      setDocumentCount(documents.length);
      
      // Get recent documents
      const recent = [...documents].sort((a, b) => 
        new Date(b.date_upload) - new Date(a.date_upload)
      ).slice(0, 3);
      setRecentDocuments(recent);
      
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#faad14';
      case 'in_progress': return '#1890ff';
      case 'completed': return '#52c41a';
      case 'overdue': return '#f5222d';
      default: return '#8c8c8c';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'En attente';
      case 'in_progress': return 'En cours';
      case 'completed': return 'Terminée';
      case 'overdue': return 'En retard';
      default: return 'Inconnu';
    }
  };

  const calculateCompletionRate = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="employee-profile">
      <Title level={3} style={{ marginBottom: 24 }}>Mon Profil</Title>
      
      {/* Personal Information */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card 
            className="profile-card"
            style={{ height: '100%' }}
            bordered={false}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                size={120} 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: '#1890ff',
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)'
                }}
              />
              <Title level={3} style={{ marginTop: 16, marginBottom: 4 }}>
                {employeeData?.prenom} {employeeData?.nom}
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                {entityData?.tituler || 'Département non assigné'}
              </Text>
              
              <Divider style={{ margin: '16px 0' }} />
              
              <Row gutter={[8, 16]} style={{ textAlign: 'left' }}>
                <Col span={24}>
                  <Text strong><MailOutlined /> Email:</Text>
                  <Paragraph ellipsis={{ rows: 1 }} style={{ marginLeft: 24 }}>
                    {employeeData?.email}
                  </Paragraph>
                </Col>
                <Col span={24}>
                  <Text strong><PhoneOutlined /> Téléphone:</Text>
                  <Paragraph style={{ marginLeft: 24 }}>
                    {employeeData?.telephone || 'Non spécifié'}
                  </Paragraph>
                </Col>
                <Col span={24}>
                  <Text strong><HomeOutlined /> Adresse:</Text>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ marginLeft: 24 }}>
                    {employeeData?.adresse || 'Non spécifié'}
                  </Paragraph>
                </Col>
                <Col span={24}>
                  <Text strong><CalendarOutlined /> Date de naissance:</Text>
                  <Paragraph style={{ marginLeft: 24 }}>
                    {employeeData?.date_naissance ? moment(employeeData.date_naissance).format('DD MMMM YYYY') : 'Non spécifié'}
                  </Paragraph>
                </Col>
                <Col span={24}>
                  <Text strong><IdcardOutlined /> Genre:</Text>
                  <Paragraph style={{ marginLeft: 24 }}>
                    {employeeData?.genre === 'homme' ? 'Homme' : 'Femme'}
                  </Paragraph>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            {/* Statistics Cards */}
            <Col xs={24} sm={8}>
              <Card 
                bordered={false} 
                className="stat-card"
                style={{ height: '100%' }}
              >
                <Statistic
                  title="Tâches Assignées"
                  value={taskCount}
                  prefix={<CheckSquareOutlined style={{ color: '#1890ff' }} />}
                />
                <Progress 
                  percent={calculateCompletionRate(activeTasks)} 
                  size="small" 
                  status="active"
                  style={{ marginTop: 16 }}
                />
                <Text type="secondary">
                  Taux de complétion
                </Text>
              </Card>
            </Col>
            
            <Col xs={24} sm={8}>
              <Card 
                bordered={false} 
                className="stat-card"
                style={{ height: '100%' }}
              >
                <Statistic
                  title="Documents"
                  value={documentCount}
                  prefix={<FileOutlined style={{ color: '#52c41a' }} />}
                />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">
                    Dernier ajout: {recentDocuments.length > 0 ? 
                      moment(recentDocuments[0].date_upload).format('DD/MM/YYYY') : 
                      'Aucun document'}
                  </Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={8}>
              <Card 
                bordered={false} 
                className="stat-card"
                style={{ height: '100%' }}
              >
                <Statistic
                  title="Jours de Congés"
                  value={employeeData?.joursConges || 0}
                  prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
                />
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">
                    Disponibles pour l'année {new Date().getFullYear()}
                  </Text>
                </div>
              </Card>
            </Col>
            
            {/* Manager Information */}
            {managerData && (
              <Col xs={24}>
                <Card 
                  title="Mon Responsable" 
                  bordered={false}
                  extra={<TeamOutlined />}
                  className="manager-card"
                >
                  <Row align="middle" gutter={16}>
                    <Col xs={24} sm={4} md={3}>
                      <Avatar 
                        size={64} 
                        icon={<UserOutlined />} 
                        style={{ backgroundColor: '#722ed1' }}
                      />
                    </Col>
                    <Col xs={24} sm={20} md={21}>
                      <Title level={4} style={{ margin: '0 0 8px 0' }}>
                        {managerData.prenom} {managerData.nom}
                      </Title>
                      <Row gutter={[16, 8]}>
                        <Col xs={24} md={12}>
                          <Text>
                            <MailOutlined style={{ marginRight: 8 }} />
                            {managerData.email}
                          </Text>
                        </Col>
                        <Col xs={24} md={12}>
                          <Text>
                            <PhoneOutlined style={{ marginRight: 8 }} />
                            {managerData.telephone || 'Non spécifié'}
                          </Text>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Card>
              </Col>
            )}
            
            {/* Department Information */}
            {entityData && (
              <Col xs={24}>
                <Card 
                  title="Mon Département" 
                  bordered={false}
                  extra={<BankOutlined />}
                  className="department-card"
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Title level={4} style={{ margin: '0 0 8px 0' }}>
                        {entityData.tituler}
                      </Title>
                      <Text type="secondary">
                        {entityData.description || 'Aucune description disponible'}
                      </Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
            )}
          </Row>
        </Col>
      </Row>

      {/* Tasks and Documents */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* Active Tasks */}
        <Col xs={24} md={12}>
          <Card 
            title="Tâches Actives" 
            bordered={false}
            extra={<CheckSquareOutlined />}
            className="tasks-card"
          >
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <div key={task.id} style={{ marginBottom: 16, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={5} style={{ margin: 0 }}>{task.titre}</Title>
                    <Tag color={getStatusColor(task.status)}>
                      {getStatusText(task.status)}
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ display: 'block', margin: '8px 0' }}>
                    {task.description}
                  </Text>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <Text type="secondary">
                      <ClockCircleOutlined /> Échéance: {moment(task.date_echeance).format('DD/MM/YYYY')}
                    </Text>
                    <Text type="secondary">
                      Priorité: {task.priorite || 'Normale'}
                    </Text>
                  </div>
                </div>
              ))
            ) : (
              <Text type="secondary">Aucune tâche active pour le moment</Text>
            )}
            {activeTasks.length > 0 && (
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <a onClick={() => navigate('/taches')}>Voir toutes les tâches</a>
              </div>
            )}
          </Card>
        </Col>
        
        {/* Recent Documents */}
        <Col xs={24} md={12}>
          <Card 
            title="Documents Récents" 
            bordered={false}
            extra={<FileOutlined />}
            className="documents-card"
          >
            {recentDocuments.length > 0 ? (
              recentDocuments.map((doc) => (
                <div key={doc.id} style={{ marginBottom: 16, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={5} style={{ margin: 0 }}>{doc.nom_fichier}</Title>
                    <Text type="secondary">{moment(doc.date_upload).format('DD/MM/YYYY')}</Text>
                  </div>
                  <Text type="secondary" style={{ display: 'block', margin: '8px 0' }}>
                    {doc.description || 'Aucune description'}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color="#108ee9">{doc.type || 'Document'}</Tag>
                  </div>
                </div>
              ))
            ) : (
              <Text type="secondary">Aucun document récent</Text>
            )}
            {recentDocuments.length > 0 && (
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <a onClick={() => navigate('/documents')}>Voir tous les documents</a>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EmployeeProfile; 