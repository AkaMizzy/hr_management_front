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
  Divider
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../../../api/constants';
import './ManagerAttestations.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { confirm } = Modal;

const ManagerAttestations = () => {
  const [attestations, setAttestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [selectedAttestation, setSelectedAttestation] = useState(null);
  const [form] = Form.useForm();

  // Get manager data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const managerId = userData.employe_id;

  useEffect(() => {
    if (managerId) {
      fetchAttestations();
    }
  }, [managerId]);

  const fetchAttestations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/attestations/manager/${managerId}`);
      setAttestations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attestations:', error);
      message.error('Erreur lors du chargement des demandes d\'attestation');
      setLoading(false);
    }
  };

  const showDetails = (attestation) => {
    setSelectedAttestation(attestation);
    setDetailsModalVisible(true);
  };

  const showValidationModal = (attestation) => {
    setSelectedAttestation(attestation);
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
      
      await axios.post(`${API_BASE_URL}/attestations/${selectedAttestation.id}/validate/manager`, {
        is_approved: isApproved,
        justification: values.justification,
        manager_id: managerId
      });
      
      message.success(`Demande d'attestation ${isApproved ? 'approuvée' : 'rejetée'} avec succès`);
      setValidationModalVisible(false);
      fetchAttestations();
    } catch (error) {
      console.error('Error validating attestation request:', error);
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

  const getManagerValidationStatus = (attestation) => {
    if (!attestation.manager_validation) return null;
    
    return attestation.manager_validation.is_approved ? 
      <Tag icon={<CheckCircleOutlined />} color="success">Approuvée</Tag> :
      <Tag icon={<CloseCircleOutlined />} color="error">Rejetée</Tag>;
  };

  const pendingColumns = [
    {
      title: 'Employé',
      key: 'employee',
      render: (_, record) => `${record.employe_prenom} ${record.employe_nom}`,
    },
    {
      title: 'Titre',
      dataIndex: 'type_intitule',
      key: 'type_intitule',
    },
    {
      title: 'Date de demande',
      dataIndex: 'date_demande',
      key: 'date_demande',
      render: (date) => new Date(date).toLocaleDateString('fr-FR'),
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
      title: 'Titre',
      dataIndex: 'type_intitule',
      key: 'type_intitule',
    },
    {
      title: 'Date de demande',
      dataIndex: 'date_demande',
      key: 'date_demande',
      render: (date) => new Date(date).toLocaleDateString('fr-FR'),
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

  const pendingAttestations = attestations.filter(a => !a.manager_validation);
  const processedAttestations = attestations.filter(a => a.manager_validation);

  return (
    <div className="manager-attestations-container">
      <Card>
        <Title level={4}>Demandes d'attestation</Title>
        
        <Tabs defaultActiveKey="pending">
          <TabPane 
            tab={
              <span>
                En attente <Tag color="processing">{pendingAttestations.length}</Tag>
              </span>
            } 
            key="pending"
          >
            <Table
              dataSource={pendingAttestations}
              columns={pendingColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                Traitées <Tag color="default">{processedAttestations.length}</Tag>
              </span>
            } 
            key="processed"
          >
            <Table
              dataSource={processedAttestations}
              columns={processedColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>

        {/* Attestation Details Modal */}
        {selectedAttestation && (
          <Modal
            title="Détails de la demande d'attestation"
            open={detailsModalVisible}
            onCancel={() => setDetailsModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setDetailsModalVisible(false)}>
                Fermer
              </Button>
            ]}
            width={700}
          >
            <div style={{ padding: '0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Title level={4}>Demande d'attestation - {selectedAttestation.employe_prenom} {selectedAttestation.employe_nom}</Title>
                {getStatusTag(selectedAttestation.status)}
              </div>
              
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Titre:</Text>
                <Text>{selectedAttestation.type_intitule}</Text>
              </div>
              
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Date de demande:</Text>
                <Text>{new Date(selectedAttestation.date_demande).toLocaleDateString('fr-FR')}</Text>
              </div>
              
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Description:</Text>
                <Text>{selectedAttestation.description}</Text>
              </div>

              <div style={{ marginTop: '24px' }}>
                {(!selectedAttestation.manager_validation && 
                  <div style={{ textAlign: 'center', marginTop: '24px' }}>
                    <Button 
                      type="primary"
                      onClick={() => {
                        setDetailsModalVisible(false);
                        showValidationModal(selectedAttestation);
                      }}
                    >
                      Valider cette demande
                    </Button>
                  </div>
                )}
                {(selectedAttestation.manager_validation && 
                  <div>
                    <Divider orientation="left">Décision de validation</Divider>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                      <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Statut:</Text>
                      <Text>
                        {selectedAttestation.manager_validation.is_approved 
                          ? 'Approuvée' 
                          : 'Rejetée'
                        }
                      </Text>
                    </div>
                    {!selectedAttestation.manager_validation.is_approved && (
                      <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Justification:</Text>
                        <Text>{selectedAttestation.manager_validation.justification || 'Aucune justification fournie'}</Text>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Validation Modal */}
        <Modal
          title="Validation de la demande d'attestation"
          open={validationModalVisible}
          onCancel={() => setValidationModalVisible(false)}
          onOk={handleValidate}
          okText="Soumettre"
          cancelText="Annuler"
        >
          {selectedAttestation && (
            <div>
              <div className="validation-info">
                <Text>Demande de: <strong>{selectedAttestation.employe_prenom} {selectedAttestation.employe_nom}</strong></Text>
                <br />
                <Text>Titre: <strong>{selectedAttestation.type_intitule}</strong></Text>
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

export default ManagerAttestations; 