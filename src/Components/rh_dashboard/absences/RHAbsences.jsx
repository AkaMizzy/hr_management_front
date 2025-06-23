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
  Tabs,
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { API_BASE_URL } from '../../../api/constants';
import './RHAbsences.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const RHAbsences = () => {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAbsences();
  }, []);

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/absences/hr`);
      setAbsences(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching absences:', error);
      message.error('Erreur lors du chargement des demandes d\'absence');
      setLoading(false);
    }
  };

  const showDetails = (absence) => {
    setSelectedAbsence(absence);
    setDetailsModalVisible(true);
  };

  const showValidationModal = (absence) => {
    setSelectedAbsence(absence);
    form.resetFields();
    setValidationModalVisible(true);
  };

  const handleValidate = async () => {
    try {
      const values = await form.validateFields();
      const isApproved = values.decision === 'approve';
      
      // If rejecting, justification is required
      if (!isApproved && !values.justification) {
        message.error('Une justification est requise en cas de rejet');
        return;
      }
      
      await axios.post(`${API_BASE_URL}/absences/${selectedAbsence.id}/validate/hr`, {
        is_approved: isApproved,
        justifier: values.justification
      });
      
      message.success(`Demande d'absence ${isApproved ? 'approuvée' : 'rejetée'} avec succès`);
      setValidationModalVisible(false);
      fetchAbsences();
    } catch (error) {
      console.error('Error validating absence request:', error);
      message.error('Erreur lors de la validation de la demande');
    }
  };

  const getStatusTag = (status) => {
    // Convert to lowercase for case-insensitive comparison
    const statusLower = typeof status === 'string' ? status.toLowerCase() : '';
    
    switch (statusLower) {
      case 'approved':
        return <Tag icon={<CheckCircleOutlined />} color="success">Approuvée</Tag>;
      case 'rejected':
        return <Tag icon={<CloseCircleOutlined />} color="error">Rejetée</Tag>;
      case 'pending':
      default:
        return <Tag icon={<ClockCircleOutlined />} color="processing">En attente</Tag>;
    }
  };

  const getHRValidationStatus = (absence) => {
    if (!absence.hr_validation) return null;
    
    return absence.hr_validation.is_approved ? 
      <Tag icon={<CheckCircleOutlined />} color="success">Approuvée</Tag> :
      <Tag icon={<CloseCircleOutlined />} color="error">Rejetée</Tag>;
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Horaires',
      key: 'horaires',
      render: (_, record) => (
        <span>
          {record.heure_debut ? `${record.heure_debut.substring(0, 5)} - ${record.heure_fin.substring(0, 5)}` : 'Journée complète'}
        </span>
      )
    },
    {
      title: 'Motif',
      dataIndex: 'motif',
      key: 'motif',
      ellipsis: true
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
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
          {!record.hr_validation && (
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Horaires',
      key: 'horaires',
      render: (_, record) => (
        <span>
          {record.heure_debut ? `${record.heure_debut.substring(0, 5)} - ${record.heure_fin.substring(0, 5)}` : 'Journée complète'}
        </span>
      )
    },
    {
      title: 'Motif',
      dataIndex: 'motif',
      key: 'motif',
      ellipsis: true
    },
    {
      title: 'Décision',
      key: 'decision',
      render: (_, record) => getHRValidationStatus(record),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
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

  const pendingAbsences = absences.filter(a => 
    a.manager_validation && 
    a.manager_validation.is_approved && 
    !a.hr_validation
  );
  
  const processedAbsences = absences.filter(a => a.hr_validation);

  return (
    <div className="rh-absences-container">
      <Card>
        <Title level={4}>Validation des demandes d'absence</Title>
        
        <Tabs defaultActiveKey="pending">
          <TabPane 
            tab={
              <span>
                En attente <Tag color="processing">{pendingAbsences.length}</Tag>
              </span>
            } 
            key="pending"
          >
            <Table
              dataSource={pendingAbsences}
              columns={pendingColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                Traitées <Tag color="default">{processedAbsences.length}</Tag>
              </span>
            } 
            key="processed"
          >
            <Table
              dataSource={processedAbsences}
              columns={processedColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>

        {/* Absence Details Modal */}
        {selectedAbsence && (
          <Modal
            title="Détails de la demande d'absence"
            open={detailsModalVisible}
            onCancel={() => setDetailsModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setDetailsModalVisible(false)}>
                Fermer
              </Button>
            ]}
            width={700}
          >
            <div className="absence-details">
              <div className="absence-header">
                <Title level={4}>Demande d'absence</Title>
                {getStatusTag(selectedAbsence.status)}
              </div>
              
              <div className="absence-info">
                <div className="info-item">
                  <Text strong>Employé:</Text>
                  <Text>{selectedAbsence.employe_prenom} {selectedAbsence.employe_nom}</Text>
                </div>
                
                <div className="info-item">
                  <Text strong>Date d'absence:</Text>
                  <Text>{formatDate(selectedAbsence.date)}</Text>
                </div>
                
                <div className="info-item">
                  <Text strong>Horaires:</Text>
                  <Text>
                    {selectedAbsence.heure_debut 
                      ? `${selectedAbsence.heure_debut.substring(0, 5)} - ${selectedAbsence.heure_fin.substring(0, 5)}`
                      : 'Journée complète'}
                  </Text>
                </div>
                
                <div className="info-item">
                  <Text strong>Motif:</Text>
                  <Paragraph>{selectedAbsence.motif}</Paragraph>
                </div>
              </div>
              
              <div className="validation-section">
                <Title level={5}>Processus de validation</Title>
                
                <div className="validation-step">
                  <div className="step-header">
                    <Text strong>Validation Manager</Text>
                    <Space>
                      {selectedAbsence.manager_validation ? (
                        selectedAbsence.manager_validation.is_approved ? (
                          <Tag color="success">Approuvée</Tag>
                        ) : (
                          <Tag color="error">Rejetée</Tag>
                        )
                      ) : (
                        <Tag color="processing">En attente</Tag>
                      )}
                    </Space>
                  </div>
                  
                  {selectedAbsence.manager_validation && !selectedAbsence.manager_validation.is_approved && (
                    <div className="justification">
                      <Text type="secondary">Justification: </Text>
                      <Text>{selectedAbsence.manager_validation.justifier}</Text>
                    </div>
                  )}
                </div>
                
                <div className="validation-step">
                  <div className="step-header">
                    <Text strong>Validation RH</Text>
                    <Space>
                      {selectedAbsence.hr_validation ? (
                        selectedAbsence.hr_validation.is_approved ? (
                          <Tag color="success">Approuvée</Tag>
                        ) : (
                          <Tag color="error">Rejetée</Tag>
                        )
                      ) : (
                        <Tag color="processing">En attente</Tag>
                      )}
                    </Space>
                  </div>
                  
                  {selectedAbsence.hr_validation && !selectedAbsence.hr_validation.is_approved && (
                    <div className="justification">
                      <Text type="secondary">Justification: </Text>
                      <Text>{selectedAbsence.hr_validation.justifier}</Text>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedAbsence.manager_validation && 
               selectedAbsence.manager_validation.is_approved && 
               !selectedAbsence.hr_validation && (
                <div className="validation-actions">
                  <Button 
                    type="primary" 
                    onClick={() => {
                      setDetailsModalVisible(false);
                      showValidationModal(selectedAbsence);
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
          title="Validation de la demande d'absence"
          open={validationModalVisible}
          onCancel={() => setValidationModalVisible(false)}
          onOk={handleValidate}
          okText="Soumettre"
          cancelText="Annuler"
        >
          {selectedAbsence && (
            <div>
              <div className="validation-info">
                <Text>Demande de: <strong>{selectedAbsence.employe_prenom} {selectedAbsence.employe_nom}</strong></Text>
                <br />
                <Text>Date: <strong>{formatDate(selectedAbsence.date)}</strong></Text>
                <br />
                <Text>Motif: <strong>{selectedAbsence.motif}</strong></Text>
              </div>
              
              <Form
                form={form}
                layout="vertical"
                initialValues={{ decision: 'approve' }}
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
                  name="justification"
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

export default RHAbsences; 