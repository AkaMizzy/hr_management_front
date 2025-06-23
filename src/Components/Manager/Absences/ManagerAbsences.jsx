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
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/fr';
import './ManagerAbsences.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { confirm } = Modal;

moment.locale('fr');

const ManagerAbsences = () => {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [form] = Form.useForm();

  // Get manager data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const managerId = userData.employe_id;

  useEffect(() => {
    if (managerId) {
      fetchAbsences();
    }
  }, [managerId]);

  const fetchAbsences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/absences/manager/${managerId}`);
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
      if (!isApproved && !values.justifier) {
        message.error('Une justification est requise en cas de rejet');
        return;
      }
      
      // Debug logs
      console.log('Form values:', values);
      console.log('Annulable raw value:', values.annulable);
      console.log('Annulable type:', typeof values.annulable);
      
      // Ensure annulable is a number (0 or 1)
      const annulableValue = Number(values.annulable);
      console.log('Converted annulable value:', annulableValue);
      
      await axios.post(`http://localhost:5000/api/absences/${selectedAbsence.id}/validate/manager`, {
        is_approved: isApproved,
        justifier: values.justifier,
        manager_id: managerId,
        annulable: annulableValue
      });
      
      message.success(`Demande d'absence ${isApproved ? 'approuvée' : 'rejetée'} avec succès`);
      setValidationModalVisible(false);
      fetchAbsences();
    } catch (error) {
      console.error('Error validating absence request:', error);
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

  const getManagerValidationStatus = (absence) => {
    if (!absence.manager_validation) return null;
    
    return absence.manager_validation.is_approved ? 
      <Tag icon={<CheckCircleOutlined />} color="success">Approuvée</Tag> :
      <Tag icon={<CloseCircleOutlined />} color="error">Rejetée</Tag>;
  };

  const getAnnulableStatus = (absence) => {
    if (!absence.manager_validation) return null;
    
    return absence.manager_validation.annulable ? 
      <Tag color="success">Annulable</Tag> : 
      <Tag color="error">Non-annulable</Tag>;
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
  };

  const formatTime = (timeString) => {
    return timeString ? timeString.substring(0, 5) : '';
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
        record.heure_debut ? 
        `${formatTime(record.heure_debut)} - ${formatTime(record.heure_fin)}` : 
        'Journée complète'
      ),
    },
    {
      title: 'Motif',
      dataIndex: 'motif',
      key: 'motif',
      ellipsis: true,
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
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Horaires',
      key: 'horaires',
      render: (_, record) => (
        record.heure_debut ? 
        `${formatTime(record.heure_debut)} - ${formatTime(record.heure_fin)}` : 
        'Journée complète'
      ),
    },
    {
      title: 'Motif',
      dataIndex: 'motif',
      key: 'motif',
      ellipsis: true,
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

  const pendingAbsences = absences.filter(a => !a.manager_validation);
  const processedAbsences = absences.filter(a => a.manager_validation);

  return (
    <div className="manager-absences-container">
      <Card>
        <Title level={4}>Demandes d'absence</Title>
        
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
                {getStatusTag(selectedAbsence.status, selectedAbsence.manager_validation, selectedAbsence.hr_validation)}
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
                      ? `${formatTime(selectedAbsence.heure_debut)} - ${formatTime(selectedAbsence.heure_fin)}`
                      : 'Journée complète'}
                  </Text>
                </div>
                
                <div className="info-item">
                  <Text strong>Motif:</Text>
                  <Paragraph>{selectedAbsence.motif}</Paragraph>
                </div>
              </div>
              
              <div className="validation-section">
                <Title level={5}>Validation</Title>
                
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
                  
                  {selectedAbsence.manager_validation && (
                    <>
                      {!selectedAbsence.manager_validation.is_approved && (
                        <div className="justification">
                          <Text type="secondary">Justification: </Text>
                          <Text>{selectedAbsence.manager_validation.justifier}</Text>
                        </div>
                      )}
                      <div className="annulable-status">
                        <Text type="secondary">Annulable: </Text>
                        {getAnnulableStatus(selectedAbsence)}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {!selectedAbsence.manager_validation && (
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
                <Text>
                  Horaires: <strong>
                    {selectedAbsence.heure_debut 
                      ? `${formatTime(selectedAbsence.heure_debut)} - ${formatTime(selectedAbsence.heure_fin)}`
                      : 'Journée complète'}
                  </strong>
                </Text>
              </div>
              
              <Form
                form={form}
                layout="vertical"
                initialValues={{ decision: 'approve', annulable: 0 }}
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
                    <Radio value={1}>Oui</Radio>
                    <Radio value={0}>Non</Radio>
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

export default ManagerAbsences; 