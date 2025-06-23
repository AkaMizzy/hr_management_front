import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  message,
  Tag,
  Typography,
  Space,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../../../api/constants';
import './EmployeeAttestations.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const EmployeeAttestations = () => {
  const [attestations, setAttestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedAttestation, setSelectedAttestation] = useState(null);
  const [form] = Form.useForm();

  // Get employee data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const employeeId = userData.employe_id;

  useEffect(() => {
    if (employeeId) {
      fetchAttestations();
    }
  }, [employeeId]);

  const fetchAttestations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/attestations/employee/${employeeId}`);
      
      // Process the data to ensure status is lowercase for consistent comparison
      const processedAttestations = response.data.map(attestation => {
        // Make sure status is lowercase for consistent comparison
        if (attestation.status) {
          attestation.status = attestation.status.toLowerCase();
        }
        
        return attestation;
      });
      
      setAttestations(processedAttestations);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attestations:', error);
      message.error('Erreur lors du chargement des demandes d\'attestation');
      setLoading(false);
    }
  };

  const handleCreateAttestation = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      await axios.post(`${API_BASE_URL}/attestations`, {
        ...values,
        employe_id: employeeId
      });
      
      message.success('Demande d\'attestation soumise avec succès');
      setIsModalVisible(false);
      fetchAttestations();
    } catch (error) {
      console.error('Error submitting attestation request:', error);
      message.error('Erreur lors de la soumission de la demande');
    }
  };

  const showDetails = (attestation) => {
    setSelectedAttestation(attestation);
    setDetailsModalVisible(true);
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

  const columns = [
    {
      title: 'Titre',
      dataIndex: 'intitule',
      key: 'intitule',
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
      filters: [
        { text: 'En attente', value: 'pending' },
        { text: 'Approuvée', value: 'approved' },
        { text: 'Rejetée', value: 'rejected' },
      ],
      onFilter: (value, record) => (record.status || '').toLowerCase() === value,
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

  return (
    <div className="employee-attestations-container">
      <Card>
        <div className="attestations-header">
          <Title level={4}>Mes demandes d'attestation</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreateAttestation}
          >
            Nouvelle demande
          </Button>
        </div>

        <Table
          dataSource={attestations}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        {/* Create Attestation Modal */}
        <Modal
          title="Nouvelle demande d'attestation"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={handleSubmit}
          okText="Soumettre"
          cancelText="Annuler"
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="intitule"
              label="Titre de l'attestation"
              rules={[{ required: true, message: 'Veuillez entrer un titre' }]}
            >
              <Input placeholder="Ex: Attestation de travail" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="Description / Motif"
              rules={[{ required: true, message: 'Veuillez entrer une description' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Décrivez le motif de votre demande d'attestation"
              />
            </Form.Item>
          </Form>
        </Modal>

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
            <div className="attestation-details">
              <div className="attestation-header">
                <Title level={4}>{selectedAttestation.intitule}</Title>
                {getStatusTag(selectedAttestation.status)}
              </div>
              
              <div className="attestation-info">
                <div className="info-item">
                  <Text strong>Date de demande:</Text>
                  <Text>{new Date(selectedAttestation.date_demande).toLocaleDateString('fr-FR')}</Text>
                </div>
                
                <div className="info-item">
                  <Text strong>Description:</Text>
                  <Paragraph>{selectedAttestation.description}</Paragraph>
                </div>
              </div>
              
              <div className="validation-section">
                <Title level={5}>Processus de validation</Title>
                
                <div className="validation-steps">
                  <div className="validation-step">
                    <div className="step-header">
                      <Text strong>Validation Manager</Text>
                      <Space>
                        {selectedAttestation.manager_validation ? (
                          selectedAttestation.manager_validation.is_approved ? (
                            <Tag color="success">Approuvée</Tag>
                          ) : (
                            <Tag color="error">Rejetée</Tag>
                          )
                        ) : (
                          <Tag color="processing">En attente</Tag>
                        )}
                      </Space>
                    </div>
                    
                    {selectedAttestation.manager_validation && !selectedAttestation.manager_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary">Justification: </Text>
                        <Text>{selectedAttestation.manager_validation.justification}</Text>
                      </div>
                    )}
                  </div>
                  
                  <div className="validation-step">
                    <div className="step-header">
                      <Text strong>Validation Responsable RH</Text>
                      <Space>
                        {selectedAttestation.hr_validation ? (
                          selectedAttestation.hr_validation.is_approved ? (
                            <Tag color="success">Approuvée</Tag>
                          ) : (
                            <Tag color="error">Rejetée</Tag>
                          )
                        ) : (
                          selectedAttestation.manager_validation && !selectedAttestation.manager_validation.is_approved ? (
                            <Tag color="default">Non concerné</Tag>
                          ) : (
                            <Tag color="processing">En attente</Tag>
                          )
                        )}
                      </Space>
                    </div>
                    
                    {selectedAttestation.hr_validation && !selectedAttestation.hr_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary">Justification: </Text>
                        <Text>{selectedAttestation.hr_validation.justification}</Text>
                      </div>
                    )}
                    
                    {selectedAttestation.manager_validation && !selectedAttestation.manager_validation.is_approved && !selectedAttestation.hr_validation && (
                      <div className="justification">
                        <Text type="secondary">Le processus de validation s'est arrêté au niveau du manager.</Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Show download button when attestation is approved */}
              {(selectedAttestation.status && selectedAttestation.status.toLowerCase() === 'approved') && (
                <div className="download-section">
                  <Tooltip title="Cette fonctionnalité sera disponible prochainement">
                    <Button type="primary" icon={<FileTextOutlined />} disabled>
                      Télécharger l'attestation
                    </Button>
                  </Tooltip>
                  <Text type="secondary">
                    <InfoCircleOutlined /> Le téléchargement sera disponible prochainement
                  </Text>
                </div>
              )}
            </div>
          </Modal>
        )}
      </Card>
    </div>
  );
};

export default EmployeeAttestations; 