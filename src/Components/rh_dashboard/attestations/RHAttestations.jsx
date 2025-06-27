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
  Divider,
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FilePdfOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../../../api/constants';
import './RHAttestations.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const RHAttestations = () => {
  const [attestations, setAttestations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [selectedAttestation, setSelectedAttestation] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAttestations();
  }, []);

  const fetchAttestations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/attestations/hr`);
      
      // Check for existing PDFs for each attestation
      const attestationsWithPdfStatus = await Promise.all(
        response.data.map(async (attestation) => {
          try {
            // Check if PDF exists for this attestation
            const pdfCheckResponse = await axios.get(`${API_BASE_URL}/attestations/${attestation.id}/pdf`, {
              responseType: 'blob',
              validateStatus: function (status) {
                return status < 500; // Resolve only if the status code is less than 500
              }
            });
            
            return {
              ...attestation,
              has_pdf: pdfCheckResponse.status === 200
            };
          } catch (error) {
            return {
              ...attestation,
              has_pdf: false
            };
          }
        })
      );
      
      setAttestations(attestationsWithPdfStatus);
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
      
      await axios.post(`${API_BASE_URL}/attestations/${selectedAttestation.id}/validate/hr`, {
        is_approved: isApproved,
        justification: values.justification
      });
      
      message.success(`Demande d'attestation ${isApproved ? 'approuvée' : 'rejetée'} avec succès`);
      setValidationModalVisible(false);
      fetchAttestations();
    } catch (error) {
      console.error('Error validating attestation request:', error);
      message.error('Erreur lors de la validation de la demande');
    }
  };

  const generateAttestation = async (attestationId) => {
    try {
      setGeneratingPdf(true);
      message.loading('Génération de l\'attestation en cours...', 1.5);
      
      // Call the API to generate the PDF
      const response = await axios.post(`${API_BASE_URL}/attestations/${attestationId}/generate-pdf`);
      
      message.success('Attestation générée avec succès');
      
      // Update the attestation list to reflect the generated PDF
      fetchAttestations();
    } catch (error) {
      console.error('Error generating attestation:', error);
      message.error('Erreur lors de la génération de l\'attestation: ' + 
        (error.response?.data?.message || error.message));
    } finally {
      setGeneratingPdf(false);
    }
  };

  const downloadAttestation = async (attestationId) => {
    try {
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

  const getHRValidationStatus = (attestation) => {
    if (!attestation.hr_validation) return null;
    
    return attestation.hr_validation.is_approved ? 
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
      render: (_, record) => getHRValidationStatus(record),
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
          {record.hr_validation && 
           record.hr_validation.is_approved && 
           !record.has_pdf && (
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              onClick={() => generateAttestation(record.id)}
              loading={generatingPdf}
            >
              Générer PDF
            </Button>
          )}
          {record.hr_validation && 
           record.hr_validation.is_approved && 
           record.has_pdf && (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => downloadAttestation(record.id)}
            >
              Télécharger PDF
            </Button>
          )}
        </div>
      ),
    },
  ];

  const pendingAttestations = attestations.filter(a => 
    a.manager_validation && 
    a.manager_validation.is_approved && 
    !a.hr_validation
  );
  
  const processedAttestations = attestations.filter(a => a.hr_validation);

  return (
    <div className="rh-attestations-container">
      <Card>
        <Title level={4}>Validation des demandes d'attestation</Title>
        
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
                <Title level={4}>{selectedAttestation.type_intitule} - {selectedAttestation.employe_prenom} {selectedAttestation.employe_nom}</Title>
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
                          <Tag color="processing">En attente</Tag>
                        )}
                      </Space>
                    </div>
                    
                    {selectedAttestation.manager_validation && !selectedAttestation.manager_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary">Justification: </Text>
                        <Text>{selectedAttestation.manager_validation.justification || 'Aucune justification fournie'}</Text>
                      </div>
                    )}
                  </div>
                  
                  <div className="validation-step">
                    <div className="step-header">
                      <Text strong>Validation RH</Text>
                      <Space>
                        {selectedAttestation.hr_validation ? (
                          selectedAttestation.hr_validation.is_approved ? (
                            <Tag color="success">Approuvée</Tag>
                          ) : (
                            <Tag color="error">Rejetée</Tag>
                          )
                        ) : (
                          <Tag color="processing">En attente</Tag>
                        )}
                      </Space>
                    </div>
                    
                    {selectedAttestation.hr_validation && !selectedAttestation.hr_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary">Justification: </Text>
                        <Text>{selectedAttestation.hr_validation.justification || 'Aucune justification fournie'}</Text>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedAttestation.manager_validation && 
                 selectedAttestation.manager_validation.is_approved && 
                 !selectedAttestation.hr_validation && (
                  <div className="validation-actions" style={{ textAlign: 'center', justifyContent: 'center' }}>
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
                
                {selectedAttestation.hr_validation && 
                 selectedAttestation.hr_validation.is_approved && (
                  <div className="validation-actions" style={{ textAlign: 'center', justifyContent: 'center', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    {!selectedAttestation.has_pdf ? (
                      <Button 
                        type="primary" 
                        icon={<FilePdfOutlined />}
                        onClick={() => generateAttestation(selectedAttestation.id)}
                        loading={generatingPdf}
                      >
                        Générer l'attestation
                      </Button>
                    ) : (
                      <Button 
                        type="primary" 
                        icon={<DownloadOutlined />}
                        onClick={() => downloadAttestation(selectedAttestation.id)}
                      >
                        Télécharger l'attestation
                      </Button>
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

export default RHAttestations; 