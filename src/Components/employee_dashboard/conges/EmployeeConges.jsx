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
  Space, 
  Tooltip,
  InputNumber
} from 'antd';
import { 
  PlusOutlined, 
  ExclamationCircleOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/fr';
import { toast } from 'react-hot-toast';
import './EmployeeConges.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

moment.locale('fr');

const EmployeeConges = () => {
  const [form] = Form.useForm();
  const [conges, setConges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedConge, setSelectedConge] = useState(null);
  const [congeToCancel, setCongeToCancel] = useState(null);
  const [dateRange, setDateRange] = useState([]);

  // Get employee ID from local storage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const employeeId = userData.employe_id;

  useEffect(() => {
    if (employeeId) {
      fetchConges();
    }
  }, [employeeId]);

  const fetchConges = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/conges/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setConges(response.data);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('Erreur lors du chargement des demandes de congé');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      // Calculate the number of days between start and end dates
      const startDate = values.dateRange[0].format('YYYY-MM-DD');
      const endDate = values.dateRange[1].format('YYYY-MM-DD');
      const nombreJours = values.nombreJours || 
                         Math.max(1, values.dateRange[1].diff(values.dateRange[0], 'days') + 1);

      // Format values for the backend
      const formattedValues = {
        date_debut: startDate,
        date_fin: endDate,
        nombre_jours: nombreJours,
        id_employe: employeeId
      };

      await axios.post('http://localhost:5000/api/conges', formattedValues, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      toast.success('Demande de congé soumise avec succès');
      form.resetFields();
      setFormModalVisible(false);
      fetchConges(); // Refresh the list
    } catch (error) {
      console.error('Error submitting leave request:', error);
      if (error.response && error.response.data) {
        toast.error(`Erreur: ${error.response.data.message || 'Erreur lors de la soumission de la demande'}`);
      } else {
        toast.error('Erreur lors de la soumission de la demande');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showNewCongeForm = () => {
    form.resetFields();
    setFormModalVisible(true);
  };

  const showDetails = (conge) => {
    setSelectedConge(conge);
    setDetailsModalVisible(true);
  };

  const showCancelConfirm = (id) => {
    setCongeToCancel(id);
    setConfirmModalVisible(true);
  };

  const handleCancel = async () => {
    try {
      // Find the conge object
      const congeObj = conges.find(c => c.id === congeToCancel);
      
      // Double-check if the request is annulable
      if (congeObj && !isRequestAnnulable(congeObj)) {
        toast.error('Cette demande de congé ne peut pas être annulée');
        setConfirmModalVisible(false);
        return;
      }
      
      await axios.post(`http://localhost:5000/api/conges/${congeToCancel}/cancel`, 
        { employee_id: employeeId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success('Demande de congé annulée avec succès');
      setConfirmModalVisible(false);
      fetchConges(); // Refresh the list
    } catch (error) {
      console.error('Error canceling leave request:', error);
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
      return <Tag icon={<ClockCircleOutlined />} color="processing">En attente RH</Tag>;
    } else {
      return <Tag icon={<ClockCircleOutlined />} color="warning">En attente</Tag>;
    }
  };

  // Handle date range change to auto-calculate number of days
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
      const numberOfDays = dates[1].diff(dates[0], 'days') + 1;
      form.setFieldsValue({ nombreJours: numberOfDays });
    } else {
      setDateRange([]);
      form.setFieldsValue({ nombreJours: null });
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

  const columns = [
    {
      title: 'Période',
      key: 'periode',
      render: (_, record) => (
        <span>
          {moment(record.date_debut).format('DD/MM/YYYY')} - {moment(record.date_fin).format('DD/MM/YYYY')}
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
    <div className="employee-conges-container">
      <Card>
        <Title level={4}>Mes demandes de congé</Title>
        
        <div className="conges-header" style={{ marginTop: '16px' }}>
          <div></div> {/* Empty div for spacing */}
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showNewCongeForm}
          >
            Nouvelle demande
          </Button>
        </div>

        <Table
          dataSource={conges}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        {/* New Leave Request Form Modal */}
        <Modal
          title="Nouvelle demande de congé"
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
              name="dateRange"
              label="Période de congé"
              rules={[{ required: true, message: 'Veuillez sélectionner la période de congé' }]}
            >
              <RangePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
                placeholder={['Date de début', 'Date de fin']}
                onChange={handleDateRangeChange}
              />
            </Form.Item>
            
            <Form.Item
              name="nombreJours"
              label="Nombre de jours"
              rules={[{ required: true, message: 'Veuillez indiquer le nombre de jours' }]}
            >
              <InputNumber 
                min={1} 
                style={{ width: '100%' }} 
                placeholder="Nombre de jours de congé"
              />
            </Form.Item>
            
            <Text type="secondary">
              Le nombre de jours est calculé automatiquement en fonction des dates sélectionnées. Vous pouvez l'ajuster si nécessaire (par exemple pour les demi-journées).
            </Text>
          </Form>
        </Modal>

        {/* Leave Request Details Modal */}
        {selectedConge && (
          <Modal
            title="Détails de la demande de congé"
            open={detailsModalVisible}
            onCancel={() => setDetailsModalVisible(false)}
            footer={[
              ...(selectedConge.status === 'pending' && isRequestAnnulable(selectedConge)
                ? [
                    <Button 
                      key="cancel" 
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        setDetailsModalVisible(false);
                        showCancelConfirm(selectedConge.id);
                      }}
                      style={{ marginRight: 'auto' }}
                    >
                      Annuler cette demande
                    </Button>
                  ] 
                : []),
              ...(selectedConge.status === 'pending' && !isRequestAnnulable(selectedConge)
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
            <div className="conge-details">
              <div className="conge-header">
                <Title level={4}>Demande de congé</Title>
                {getStatusTag(selectedConge.status, selectedConge.manager_validation, selectedConge.hr_validation)}
              </div>
              
              <div className="conge-info">
                <div className="info-item">
                  <Text strong>Période:</Text>
                  <Text>
                    {moment(selectedConge.date_debut).format('DD/MM/YYYY')} - {moment(selectedConge.date_fin).format('DD/MM/YYYY')}
                  </Text>
                </div>
                
                <div className="info-item">
                  <Text strong>Nombre de jours:</Text>
                  <Text>{selectedConge.nombre_jours}</Text>
                </div>
              </div>
              
              <div className="validation-section">
                <Title level={5}>Processus de validation</Title>
                
                <div className="validation-steps">
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
                    
                    {selectedConge.manager_validation && !selectedConge.manager_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary">Justification: </Text>
                        <Text>{selectedConge.manager_validation.justifier}</Text>
                      </div>
                    )}
                    
                    {selectedConge.manager_validation && selectedConge.manager_validation.is_approved && (
                      <div className="annulable-status">
                        <Text type="secondary">Annulable: </Text>
                        {selectedConge.manager_validation.annulable ? (
                          <Tag color="success">Oui</Tag>
                        ) : (
                          <Tag color="error">Non</Tag>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="validation-step">
                    <div className="step-header">
                      <Text strong>Validation Responsable RH</Text>
                      <Space>
                        {selectedConge.hr_validation ? (
                          selectedConge.hr_validation.is_approved ? (
                            <Tag color="success">Approuvée</Tag>
                          ) : (
                            <Tag color="error">Rejetée</Tag>
                          )
                        ) : (
                          selectedConge.manager_validation && !selectedConge.manager_validation.is_approved ? (
                            <Tag color="default">Non concerné</Tag>
                          ) : (
                            <Tag color="processing">En attente</Tag>
                          )
                        )}
                      </Space>
                    </div>
                    
                    {selectedConge.hr_validation && !selectedConge.hr_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary">Justification: </Text>
                        <Text>{selectedConge.hr_validation.justifier}</Text>
                      </div>
                    )}
                    
                    {selectedConge.manager_validation && !selectedConge.manager_validation.is_approved && !selectedConge.hr_validation && (
                      <div className="justification">
                        <Text type="secondary">Le processus de validation s'est arrêté au niveau du manager.</Text>
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
          title="Confirmation"
          open={confirmModalVisible}
          onCancel={() => setConfirmModalVisible(false)}
          footer={null}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: '22px', marginRight: '16px' }} />
            <div>
              <p>Êtes-vous sûr de vouloir annuler cette demande de congé?</p>
              <p>Cette action ne peut pas être annulée.</p>
            </div>
          </div>
          <div className="delete-confirmation-buttons">
            <Button onClick={() => setConfirmModalVisible(false)}>
              Non
            </Button>
            <Button 
              type="primary" 
              danger 
              onClick={handleCancel}
            >
              Oui, annuler
            </Button>
          </div>
        </Modal>
      </Card>
    </div>
  );
};

export default EmployeeConges; 