import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Avatar, Typography, Statistic, Descriptions, Spin } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  FileOutlined, 
  BellOutlined, 
  CheckSquareOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  TeamOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const { Title, Text } = Typography;

const EmployeeProfile = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [managerData, setManagerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskCount, setTaskCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
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
      
      // Fetch employee's tasks count
      const tasksResponse = await axios.get(`http://localhost:5000/api/taches/employee/${userData.employe_id}`);
      setTaskCount(tasksResponse.data.length);

      // Fetch employee's documents count using the correct endpoint
      const documentsResponse = await axios.get(`http://localhost:5000/api/documents/${userData.employe_id}`);
      setDocumentCount(documentsResponse.data.length);
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
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
      
      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tâches Assignées"
              value={taskCount}
              prefix={<CheckSquareOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Documents"
              value={documentCount}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Notifications"
              value={employeeData?.notifications?.length || 0}
              prefix={<BellOutlined />}
            />
          </Card>
        </Col>
        
        <Col span={6}>
          <Card>
            <Statistic
              title="Jours de Congés"
              value={employeeData?.joursConges || 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Personal Information */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Informations Personnelles">
            <Row gutter={[16, 16]}>
              <Col span={24} md={8}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <Avatar size={120} icon={<UserOutlined />} />
                  <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>
                    {employeeData?.prenom} {employeeData?.nom}
                  </Title>
                  <Text type="secondary">{employeeData?.email}</Text>
                </div>
              </Col>
              <Col span={24} md={16}>
                <Descriptions column={1} bordered>
                  <Descriptions.Item label={<><UserOutlined /> Genre</>}>
                    {employeeData?.genre === 'homme' ? 'Homme' : 'Femme'}
                  </Descriptions.Item>
                  <Descriptions.Item label={<><CalendarOutlined /> Date de Naissance</>}>
                    {employeeData?.date_naissance ? moment(employeeData.date_naissance).format('DD/MM/YYYY') : 'Non spécifié'}
                  </Descriptions.Item>
                  <Descriptions.Item label={<><PhoneOutlined /> Téléphone</>}>
                    {employeeData?.telephone || 'Non spécifié'}
                  </Descriptions.Item>
                  <Descriptions.Item label={<><MailOutlined /> Email</>}>
                    {employeeData?.email}
                  </Descriptions.Item>
                  <Descriptions.Item label={<><HomeOutlined /> Adresse</>}>
                    {employeeData?.adresse || 'Non spécifié'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Manager Information */}
      {managerData && (
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card title="Mon Responsable" extra={<TeamOutlined />}>
              <Row align="middle" gutter={16}>
                <Col>
                  <Avatar size={64} icon={<UserOutlined />} />
                </Col>
                <Col>
                  <Title level={5} style={{ margin: 0 }}>
                    {managerData.prenom} {managerData.nom}
                  </Title>
                  <Text type="secondary">{managerData.email}</Text>
                  <br />
                  <Text type="secondary">
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    {managerData.telephone || 'Non spécifié'}
                  </Text>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default EmployeeProfile; 