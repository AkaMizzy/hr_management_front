import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Radio,
  message,
  Tag,
  Typography,
  Space,
  Tabs
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/fr';
import './ManagerConges.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { confirm } = Modal;

moment.locale('fr');

const ManagerConges = () => {
  const [conges, setConges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [selectedConge, setSelectedConge] = useState(null);
  const [form] = Form.useForm();

  // Get manager data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const managerId = userData.employe_id;

  useEffect(() => {
    if (managerId) {
      fetchConges();
    }
  }, [managerId]);

  const fetchConges = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/conges/manager/${managerId}`);
      setConges(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      message.error('Erreur lors du chargement des demandes de congé');
      setLoading(false);
    }
  };

  const showDetails = (conge) => {
    setSelectedConge(conge);
    setDetailsModalVisible(true);
  };

  const showValidationModal = (conge) => {
    setSelectedConge(conge);
    form.resetFields();
    setValidationModalVisible(true);
  };

  const handleValidate = async () => {
    try {
      const values = await form.validateFields();
      const isApproved = values.decision === 'approve';
      
      // If rejecting, justification is required
      if (!isApproved && !values.justifier) {
        message.error('Une justification est requise en cas de rejet');
        return;
      }
      
      // Ensure annulable is a boolean value
      const isAnnulable = values.annulable === true;
      
      await axios.post(`http://localhost:5000/api/conges/${selectedConge.id}/validate/manager`, {
        is_approved: isApproved,
        justifier: values.justifier,
        manager_id: managerId,
        annulable: isAnnulable
      });
      
      message.success(`Demande de congé ${isApproved ? 'approuvée' : 'rejetée'} avec succès`);
      setValidationModalVisible(false);
      fetchConges();
    } catch (error) {
      console.error('Error validating leave request:', error);
      message.error('Erreur lors de la validation de la demande');
    }
  };

  const getStatusTag = (status, managerValidation, hrValidation) => {
    if (status === 'rejected') {
      return <Tag icon={<CloseCircleOutlined />} color="error">Refusée</Tag>;
    } else if (status === 'approved') {
      return <Tag icon={<CheckCircleOutlined />} color="success">Approuvée</Tag>;
    } else if (managerValidation && managerValidation.is_approved === true) {
      return <Tag icon={<ClockCircleOutlined />} color="processing">En attente RH</Tag>;
    } else {
      return <Tag icon={<ClockCircleOutlined />} color="warning">En attente</Tag>;
    }
  };

  const getManagerValidationStatus = (conge) => {
    if (!conge.manager_validation) return null;
    
    return conge.manager_validation.is_approved ? 
      <Tag icon={<CheckCircleOutlined />} color="success">Approuvée</Tag> :
      <Tag icon={<CloseCircleOutlined />} color="error">Rejetée</Tag>;
  };

  const getAnnulableStatus = (conge) => {
    if (!conge.manager_validation) return null;
    
    return conge.manager_validation.annulable ? 
      <Tag color="success">Annulable</Tag> : 
      <Tag color="error">Non-annulable</Tag>;
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
  };

  const pendingColumns = [
    {
      title: 'Employé',
      key: 'employee',
      render: (_, record) => `${record.employe_prenom} ${record.employe_nom}`,
    },
    {
      title: 'Type',
      dataIndex: 'type_intitule',
      key: 'type_intitule',
    },
    {
      title: 'Période',
      key: 'periode',
      render: (_, record) => (
        <span>
          {formatDate(record.date_debut)} - {formatDate(record.date_fin)}
        </span>
      )
    },
    {
      title: 'Jours',
      dataIndex: 'nombre_jours',
      key: 'nombre_jours'
    },
    {
      title: 'Statut',
      key: 'status',
      render: (_, record) => getStatusTag(record.status, record.manager_validation, record.hr_validation),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            type="text"
            icon={<FileTextOutlined />}
            onClick={() => showDetails(record)}
          >
            Détails
          </Button>
          {!record.manager_validation && (
            <Button
              type="primary"
              onClick={() => showValidationModal(record)}
            >
              Valider
            </Button>
          )}
        </div>
      ),
    },
  ];

  const processedColumns = [
    {
      title: 'Employé',
      key: 'employee',
      render: (_, record) => `${record.employe_prenom} ${record.employe_nom}`,
    },
    {
      title: 'Type',
      dataIndex: 'type_intitule',
      key: 'type_intitule',
    },
    {
      title: 'Période',
      key: 'periode',
      render: (_, record) => (
        <span>
          {formatDate(record.date_debut)} - {formatDate(record.date_fin)}
        </span>
      )
    },
    {
      title: 'Jours',
      dataIndex: 'nombre_jours',
      key: 'nombre_jours'
    },
    {
      title: 'Décision',
      key: 'decision',
      render: (_, record) => getManagerValidationStatus(record),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="text"
          icon={<FileTextOutlined />}
          onClick={() => showDetails(record)}
        >
          Détails
        </Button>
      ),
    },
  ];

  const pendingConges = conges.filter(c => !c.manager_validation);
  const processedConges = conges.filter(c => c.manager_validation);

  return (
    <div className="manager-conges-container">
      <Card>
        <Title level={4}>Demandes de congé</Title>
        
        <Tabs defaultActiveKey="pending">
          <TabPane 
            tab={
              <span>
                En attente <Tag color="processing">{pendingConges.length}</Tag>
              </span>
            } 
            key="pending"
          >
            <Table
              dataSource={pendingConges}
              columns={pendingColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                Traitées <Tag color="default">{processedConges.length}</Tag>
              </span>
            } 
            key="processed"
          >
            <Table
              dataSource={processedConges}
              columns={processedColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>

        {/* Leave Request Details Modal */}
        {selectedConge && (
          <Modal
            title="Détails de la demande de congé"
            open={detailsModalVisible}
            onCancel={() => setDetailsModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setDetailsModalVisible(false)}>
                Fermer
              </Button>
            ]}
            width={700}
          >
            <div className="conge-details">
              <div className="conge-header">
                <Title level={4}>Demande de congé - {selectedConge.type_intitule}</Title>
                {getStatusTag(selectedConge.status, selectedConge.manager_validation, selectedConge.hr_validation)}
              </div>
              
              <div className="conge-info">
                <div className="info-item">
                  <Text strong>Employé:</Text>
                  <Text>{selectedConge.employe_prenom} {selectedConge.employe_nom}</Text>
                </div>
                
                <div className="info-item">
                  <Text strong>Type:</Text>
                  <Text>{selectedConge.type_intitule}</Text>
                </div>
                
                <div className="info-item">
                  <Text strong>Période:</Text>
                  <Text>
                    {formatDate(selectedConge.date_debut)} - {formatDate(selectedConge.date_fin)}
                  </Text>
                </div>
                
                <div className="info-item">
                  <Text strong>Nombre de jours:</Text>
                  <Text>{selectedConge.nombre_jours}</Text>
                </div>
              </div>
              
              <div className="validation-section">
                <Title level={5}>Validation</Title>
                
                <div className="validation-step">
                  <div className="step-header">
                    <Text strong>Validation Manager</Text>
                    <Space>
                      {selectedConge.manager_validation ? (
                        selectedConge.manager_validation.is_approved ? (
                          <Tag color="success">Approuvée</Tag>
                        ) : (
                          <Tag color="error">Rejetée</Tag>
                        )
                      ) : (
                        <Tag color="processing">En attente</Tag>
                      )}
                    </Space>
                  </div>
                  
                  {selectedConge.manager_validation && (
                    <>
                      {!selectedConge.manager_validation.is_approved && (
                        <div className="justification">
                          <Text type="secondary">Justification: </Text>
                          <Text>{selectedConge.manager_validation.justifier}</Text>
                        </div>
                      )}
                      <div className="annulable-status">
                        <Text type="secondary">Annulable: </Text>
                        {getAnnulableStatus(selectedConge)}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {!selectedConge.manager_validation && (
                <div className="validation-actions">
                  <Button 
                    type="primary" 
                    onClick={() => {
                      setDetailsModalVisible(false);
                      showValidationModal(selectedConge);
                    }}
                  >
                    Valider cette demande
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Validation Modal */}
        <Modal
          title="Validation de la demande de congé"
          open={validationModalVisible}
          onCancel={() => setValidationModalVisible(false)}
          onOk={handleValidate}
          okText="Soumettre"
          cancelText="Annuler"
        >
          {selectedConge && (
            <div>
              <div className="validation-info">
                <Text>Demande de: <strong>{selectedConge.employe_prenom} {selectedConge.employe_nom}</strong></Text>
                <br />
                <Text>Type: <strong>{selectedConge.type_intitule}</strong></Text>
                <br />
                <Text>Période: <strong>{formatDate(selectedConge.date_debut)} - {formatDate(selectedConge.date_fin)}</strong></Text>
                <br />
                <Text>Nombre de jours: <strong>{selectedConge.nombre_jours}</strong></Text>
              </div>
              
              <Form
                form={form}
                layout="vertical"
                initialValues={{ decision: 'approve', annulable: false }}
              >
                <Form.Item
                  name="decision"
                  label="Décision"
                  rules={[{ required: true, message: 'Veuillez sélectionner une décision' }]}
                >
                  <Radio.Group>
                    <Radio value="approve">Approuver</Radio>
                    <Radio value="reject">Rejeter</Radio>
                  </Radio.Group>
                </Form.Item>
                
                <Form.Item
                  name="annulable"
                  label="Annulable par l'employé"
                >
                  <Radio.Group>
                    <Radio value={true}>Oui</Radio>
                    <Radio value={false}>Non</Radio>
                  </Radio.Group>
                </Form.Item>
                
                <Form.Item
                  name="justifier"
                  label="Justification (obligatoire en cas de rejet)"
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (getFieldValue('decision') === 'reject' && (!value || value.trim() === '')) {
                          return Promise.reject(new Error('Veuillez fournir une justification pour le rejet'));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <TextArea 
                    rows={4} 
                    placeholder="Expliquez la raison du rejet..."
                  />
                </Form.Item>
              </Form>
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default ManagerConges; 