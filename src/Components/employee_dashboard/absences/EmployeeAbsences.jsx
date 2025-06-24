import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button,
  Modal,
  Form, 
  Input, 
  DatePicker, 
  Typography, 
  Tag, 
  Divider,
  TimePicker,
  Row,
  Col,
  Tooltip,
  
} from 'antd';
import { 
  PlusOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/fr';
import { toast } from 'react-hot-toast';
import './EmployeeAbsences.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

moment.locale('fr');

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

const EmployeeAbsences = () => {
  const [form] = Form.useForm();
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [absenceToCancel, setAbsenceToCancel] = useState(null);

  // Get employee ID from local storage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const employeeId = userData.employe_id;

  useEffect(() => {
    if (employeeId) {
      fetchAbsences();
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

  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/absences/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAbsences(response.data);
    } catch (error) {
      console.error('Error fetching absences:', error);
      toast.error('Erreur lors du chargement des demandes d\'absence');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      // Format date and times for the backend
      const formattedValues = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        heure_debut: values.heure_debut ? values.heure_debut.format('HH:mm:ss') : null,
        heure_fin: values.heure_fin ? values.heure_fin.format('HH:mm:ss') : null,
        id_employe: employeeId
      };

      await axios.post('http://localhost:5000/api/absences', formattedValues, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      toast.success('Demande d\'absence soumise avec succès');
      form.resetFields();
      setFormModalVisible(false);
      fetchAbsences(); // Refresh the list
    } catch (error) {
      console.error('Error submitting absence request:', error);
      if (error.response && error.response.data) {
        toast.error(`Erreur: ${error.response.data.message || 'Erreur lors de la soumission de la demande'}`);
      } else {
        toast.error('Erreur lors de la soumission de la demande');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showNewAbsenceForm = () => {
    form.resetFields();
    setFormModalVisible(true);
  };

  const showDetails = (absence) => {
    setSelectedAbsence(absence);
    setDetailsModalVisible(true);
  };

  const showCancelConfirm = (id) => {
    setAbsenceToCancel(id);
    setConfirmModalVisible(true);
  };

  const handleCancel = async () => {
    try {
      // Find the absence object
      const absenceObj = absences.find(a => a.id === absenceToCancel);
      
      // Double-check if the request is annulable
      if (absenceObj && !isRequestAnnulable(absenceObj)) {
        toast.error('Cette demande d\'absence ne peut pas être annulée');
        setConfirmModalVisible(false);
        return;
      }
      
      await axios.post(`http://localhost:5000/api/absences/${absenceToCancel}/cancel`, 
        { employee_id: employeeId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success('Demande d\'absence annulée avec succès');
      setConfirmModalVisible(false);
      fetchAbsences(); // Refresh the list
    } catch (error) {
      console.error('Error canceling absence request:', error);
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erreur lors de l\'annulation de la demande');
      }
    }
  };

  const getStatusTag = (status, managerValidation, hrValidation) => {
    if (status === 'rejected') {
      return <Tag icon={<CloseCircleOutlined />} color="error">Refusée</Tag>;
    } else if (status === 'approved') {
      return <Tag icon={<CheckCircleOutlined />} color="success">Approuvée</Tag>;
    } else if (managerValidation && managerValidation.is_approved === true) {
      return <Tag icon={<AnimatedProcessingIcon />} color="processing">En attente RH</Tag>;
    } else {
      return <Tag icon={<AnimatedPendingIcon />} color="warning">En attente</Tag>;
    }
  };

  // Add a helper function to check if a request is annulable
  const isRequestAnnulable = (record) => {
    // If there's no manager validation yet, it's annulable
    if (!record.manager_validation) {
      return true;
    }
    
    // If there's HR validation, it's not annulable (HR validation sets annulable to false)
    if (record.hr_validation) {
      return false;
    }
    
    // Get the annulable value from manager validation
    const annulable = record.manager_validation.annulable;
    
    // Only consider it annulable if it's explicitly true or 1
    if (annulable === true || annulable === 1 || annulable === '1' || annulable === 'true') {
      return true;
    }
    
    // For all other values (false, 0, null, undefined, etc.), consider it not annulable
    return false;
  };

  // Single button for "Détails" - "Annuler" option will be shown in details modal if applicable
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('DD/MM/YYYY')
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
      key: 'status',
      render: (_, record) => getStatusTag(record.status, record.manager_validation, record.hr_validation)
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
          {record.status === 'pending' && isRequestAnnulable(record) && (
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => showCancelConfirm(record.id)}
            >
              Annuler
            </Button>
          )}
          {record.status === 'pending' && !isRequestAnnulable(record) && (
            <Tooltip title="Cette demande ne peut pas être annulée">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                disabled
                style={{ color: '#999999' }}
              >
                Annuler
              </Button>
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="employee-absences-container">
      <Card>
        <Title level={4}>Mes demandes d'absence</Title>
        
        <div className="absences-header" style={{ marginTop: '16px' }}>
          <div></div> {/* Empty div for spacing */}
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showNewAbsenceForm}
          >
            Nouvelle demande
          </Button>
        </div>

        <Table
          dataSource={absences}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        {/* New Absence Form Modal */}
        <Modal
          title="Nouvelle demande d'absence"
          open={formModalVisible}
          onCancel={() => setFormModalVisible(false)}
          onOk={handleSubmit}
          okText="Soumettre"
          cancelText="Annuler"
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="date"
              label="Date d'absence"
              rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
                placeholder="Sélectionnez une date"
              />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="heure_debut"
                  label="Heure de début"
                >
                  <TimePicker 
                    style={{ width: '100%' }} 
                    format="HH:mm" 
                    placeholder="Début"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="heure_fin"
                  label="Heure de fin"
                >
                  <TimePicker 
                    style={{ width: '100%' }} 
                    format="HH:mm" 
                    placeholder="Fin"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Text type="secondary">
              Laissez les horaires vides pour une absence sur la journée complète.
            </Text>
            
            <Divider />
            
            <Form.Item
              name="motif"
              label="Motif"
              rules={[{ required: true, message: 'Veuillez indiquer un motif' }]}
            >
              <TextArea rows={4} placeholder="Veuillez préciser le motif de votre absence" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Absence Details Modal */}
        {selectedAbsence && (
          <Modal
            title="Détails de la demande d'absence"
            open={detailsModalVisible}
            onCancel={() => setDetailsModalVisible(false)}
            footer={[
              ...(selectedAbsence.status === 'pending' && isRequestAnnulable(selectedAbsence)
                ? [
                    <Button 
                      key="cancel" 
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        setDetailsModalVisible(false);
                        showCancelConfirm(selectedAbsence.id);
                      }}
                      style={{ marginRight: 'auto' }}
                    >
                      Annuler cette demande
                    </Button>
                  ] 
                : []),
              ...(selectedAbsence.status === 'pending' && !isRequestAnnulable(selectedAbsence)
                ? [
                    <Tooltip key="cancel-tooltip" title="Cette demande ne peut pas être annulée">
                      <Button 
                        key="cancel-disabled" 
                        icon={<DeleteOutlined />}
                        disabled
                        style={{ marginRight: 'auto', color: '#999999' }}
                      >
                        Annuler cette demande
                      </Button>
                    </Tooltip>
                  ] 
                : []),
              <Button key="close" onClick={() => setDetailsModalVisible(false)}>
                Fermer
              </Button>
            ]}
            width={700}
          >
            <div style={{ padding: '0 8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <Title level={4}>Demande d'absence</Title>
                {getStatusTag(selectedAbsence.status, selectedAbsence.manager_validation, selectedAbsence.hr_validation)}
              </div>
              
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Date d'absence:</Text>
                <Text>{moment(selectedAbsence.date).format('DD/MM/YYYY')}</Text>
              </div>
              
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Horaires:</Text>
                <Text>
                  {selectedAbsence.heure_debut 
                    ? `${selectedAbsence.heure_debut.substring(0, 5)} - ${selectedAbsence.heure_fin.substring(0, 5)}`
                    : 'Journée complète'}
                </Text>
              </div>
              
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Motif:</Text>
                <Text>{selectedAbsence.motif}</Text>
              </div>
              
              <div style={{ marginTop: '24px' }}>
                <Divider orientation="left">Processus de validation</Divider>
                
                <div className="validation-steps">
                  {/* Manager Validation */}
                  <div className="validation-step">
                    <div className="step-header">
                      <Text strong>Validation Manager</Text>
                      {selectedAbsence.manager_validation ? (
                        selectedAbsence.manager_validation.is_approved ? (
                          <Tag icon={<CheckCircleOutlined />} color="success">Approuvé</Tag>
                        ) : (
                          <Tag icon={<CloseCircleOutlined />} color="error">Refusé</Tag>
                        )
                      ) : (
                        <Tag icon={<AnimatedPendingIcon />} color="default">En attente</Tag>
                      )}
                    </div>
                    
                    {selectedAbsence.manager_validation && !selectedAbsence.manager_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary">Justification: </Text>
                        <Text>{selectedAbsence.manager_validation.justifier || 'Aucune justification fournie'}</Text>
                      </div>
                    )}
                    
                    {selectedAbsence.manager_validation && selectedAbsence.manager_validation.is_approved && (
                      <div className="annulable-status">
                        <Text type="secondary">Annulable: </Text>
                        {selectedAbsence.manager_validation.annulable ? (
                          <Tag color="success">Oui</Tag>
                        ) : (
                          <Tag color="error">Non</Tag>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* HR Validation */}
                  <div className="validation-step">
                    <div className="step-header">
                      <Text strong>Validation RH</Text>
                      {selectedAbsence.hr_validation ? (
                        selectedAbsence.hr_validation.is_approved ? (
                          <Tag icon={<CheckCircleOutlined />} color="success">Approuvé</Tag>
                        ) : (
                          <Tag icon={<CloseCircleOutlined />} color="error">Refusé</Tag>
                        )
                      ) : (
                        <Tag icon={<AnimatedPendingIcon />} color="default">En attente</Tag>
                      )}
                    </div>
                    
                    {selectedAbsence.hr_validation && !selectedAbsence.hr_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary">Justification: </Text>
                        <Text>{selectedAbsence.hr_validation.justifier || 'Aucune justification fournie'}</Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Cancel Confirmation Modal */}
        <Modal
          title="Annuler la demande d'absence"
          open={confirmModalVisible}
          onCancel={() => setConfirmModalVisible(false)}
          footer={null}
        >
          <p>Êtes-vous sûr de vouloir annuler cette demande d'absence ?</p>
          <div className="delete-confirmation-buttons">
            <Button onClick={() => setConfirmModalVisible(false)}>
              Non
            </Button>
            <Button type="primary" danger onClick={handleCancel} loading={loading}>
              Oui, annuler
            </Button>
          </div>
        </Modal>
      </Card>
    </div>
  );
};

export default EmployeeAbsences; 