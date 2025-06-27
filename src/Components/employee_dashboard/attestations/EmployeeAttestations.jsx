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
  Tooltip,
  Divider,
  Select
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  DownloadOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../../../api/constants';
import './EmployeeAttestations.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Custom animated pending icon component
const AnimatedPendingIcon = () => {
  const iconStyle = {
    animation: 'rotate 1.5s linear infinite',
    display: 'inline-block'
  };

  return <ClockCircleOutlined style={iconStyle} />;
};

// Custom animated pending icon component for RH validation
const AnimatedProcessingIcon = () => {
  const iconStyle = {
    animation: 'rotate 1.5s linear infinite',
    display: 'inline-block'
  };

  return <LoadingOutlined style={iconStyle} />;
};

const EmployeeAttestations = () => {
  const [attestations, setAttestations] = useState([]);
  const [attestationTypes, setAttestationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typesLoading, setTypesLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedAttestation, setSelectedAttestation] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [form] = Form.useForm();

  // Get employee data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const employeeId = userData.employe_id;

  useEffect(() => {
    if (employeeId) {
      fetchAttestations();
      fetchAttestationTypes();
    }
  }, [employeeId]);

  // Add CSS for the animation to the component
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const fetchAttestations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/attestations/employee/${employeeId}`);
      
      // Process the data to ensure status is lowercase for consistent comparison
      // and check if PDFs exist for approved attestations
      const processedAttestations = await Promise.all(response.data.map(async attestation => {
        // Make sure status is lowercase for consistent comparison
        if (attestation.status) {
          attestation.status = attestation.status.toLowerCase();
        }
        
        // If attestation is approved, check if PDF exists
        if (attestation.status === 'approved' && 
            attestation.hr_validation && 
            attestation.hr_validation.is_approved) {
          try {
            const pdfCheckResponse = await axios.get(`${API_BASE_URL}/attestations/${attestation.id}/pdf`, {
              responseType: 'blob',
              validateStatus: function (status) {
                return status < 500; // Resolve only if the status code is less than 500
              }
            });
            
            attestation.has_pdf = pdfCheckResponse.status === 200;
          } catch (error) {
            attestation.has_pdf = false;
          }
        } else {
          attestation.has_pdf = false;
        }
        
        return attestation;
      }));
      
      setAttestations(processedAttestations);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attestations:', error);
      message.error('Erreur lors du chargement des demandes d\'attestation');
      setLoading(false);
    }
  };

  const fetchAttestationTypes = async () => {
    try {
      setTypesLoading(true);
      const response = await axios.get(`${API_BASE_URL}/attestations/types/all`);
      setAttestationTypes(response.data);
      setTypesLoading(false);
    } catch (error) {
      console.error('Error fetching attestation types:', error);
      message.error('Erreur lors du chargement des types d\'attestation');
      setTypesLoading(false);
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
        type_id: values.type_id,
        description: values.description,
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

  const downloadAttestation = async (attestationId) => {
    try {
      setDownloadingPdf(true);
      message.loading('Téléchargement de l\'attestation...', 1);
      
      // Download the PDF
      const response = await axios.get(`${API_BASE_URL}/attestations/${attestationId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attestation_${attestationId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('Téléchargement réussi');
    } catch (error) {
      console.error('Error downloading attestation:', error);
      message.error('Erreur lors du téléchargement de l\'attestation');
    } finally {
      setDownloadingPdf(false);
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
        return <Tag icon={<AnimatedPendingIcon />} color="warning">En attente</Tag>;
    }
  };

  const columns = [
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
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button
            type="text"
            icon={<FileTextOutlined />}
            onClick={() => showDetails(record)}
            style={{ padding: '4px 12px', display: 'inline-flex', alignItems: 'center' }}
          >
            Détails
          </Button>
          {record.status === 'approved' && record.has_pdf && (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => downloadAttestation(record.id)}
              style={{ padding: '4px 12px', display: 'inline-flex', alignItems: 'center' }}
            >
              Télécharger
            </Button>
          )}
        </div>
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
              name="type_id"
              label="Titre de l'attestation"
              rules={[{ required: true, message: 'Veuillez sélectionner un type d\'attestation' }]}
            >
              <Select 
                placeholder="Sélectionnez le type d'attestation" 
                loading={typesLoading}
              >
                {attestationTypes.map(type => (
                  <Option key={type.id} value={type.id}>{type.intitule}</Option>
                ))}
              </Select>
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
            <div style={{ padding: '0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Title level={4}>{selectedAttestation.type_intitule}</Title>
                {getStatusTag(selectedAttestation.status)}
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
                <Divider orientation="left">Processus de validation</Divider>
                
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
                          <Tag icon={<AnimatedPendingIcon />} color="default">En attente</Tag>
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
                            <Tag icon={<AnimatedPendingIcon />} color="default">En attente</Tag>
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
              {(selectedAttestation.status === 'approved') && (
                <div className="download-section" style={{ marginTop: '24px', textAlign: 'center' }}>
                  {selectedAttestation.has_pdf ? (
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />}
                      onClick={() => downloadAttestation(selectedAttestation.id)}
                      loading={downloadingPdf}
                    >
                      Télécharger l'attestation
                    </Button>
                  ) : (
                    <div>
                      <Button 
                        type="default" 
                        icon={<FilePdfOutlined />}
                        disabled
                      >
                        Attestation non disponible
                      </Button>
                      <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                        <InfoCircleOutlined /> L'attestation n'a pas encore été générée par le service RH
                      </Text>
                    </div>
                  )}
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