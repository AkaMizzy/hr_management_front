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
  Select,
  InputNumber,
} from 'antd';
import { 
  PlusOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  
  FileTextOutlined,
  
  LoadingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/fr';
import { toast } from 'react-hot-toast';
import './EmployeeNoteFrais.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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

const EmployeeNoteFrais = () => {
  const [form] = Form.useForm();
  const [noteFrais, setNoteFrais] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedNoteFrais, setSelectedNoteFrais] = useState(null);

  // Get employee ID from local storage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const employeeId = userData.employe_id;

  useEffect(() => {
    if (employeeId) {
      fetchExpenseRequests();
      fetchExpenseTypes();
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

  const fetchExpenseRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/note-frais/employee/${employeeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setNoteFrais(response.data);
    } catch (error) {
      console.error('Error fetching expense requests:', error);
      toast.error('Erreur lors du chargement des notes de frais');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseTypes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/note-frais/types', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setExpenseTypes(response.data);
    } catch (error) {
      console.error('Error fetching expense types:', error);
      toast.error('Erreur lors du chargement des types de frais');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      // Format date for the backend
      const formattedValues = {
        ...values,
        date_frais: values.date_frais.format('YYYY-MM-DD'),
        id_employe: employeeId
      };

      await axios.post('http://localhost:5000/api/note-frais', formattedValues, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      toast.success('Note de frais soumise avec succès');
      form.resetFields();
      setFormModalVisible(false);
      fetchExpenseRequests(); // Refresh the list
    } catch (error) {
      console.error('Error submitting expense request:', error);
      if (error.response && error.response.data) {
        toast.error(`Erreur: ${error.response.data.message || 'Erreur lors de la soumission de la demande'}`);
      } else {
        toast.error('Erreur lors de la soumission de la note de frais');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showNewExpenseForm = () => {
    form.resetFields();
    setFormModalVisible(true);
  };

  const showDetails = (expense) => {
    setSelectedNoteFrais(expense);
    setDetailsModalVisible(true);
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

  // Helper function to format amount as currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(amount);
  };

  // Helper function to get expense type name by ID
  const getExpenseTypeName = (typeId) => {
    const type = expenseTypes.find(t => t.id === typeId);
    return type ? type.intitule : '';
  };

  // Single button for "Détails"
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date_frais',
      key: 'date_frais',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Type',
      dataIndex: 'type_nom',
      key: 'type_nom'
    },
    {
      title: 'Montant',
      dataIndex: 'montant',
      key: 'montant',
      render: (montant) => formatCurrency(montant)
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
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
      width: 120,
      render: (_, record) => (
        <Button
          type="text"
          icon={<FileTextOutlined />}
          onClick={() => showDetails(record)}
        >
          Détails
        </Button>
      )
    }
  ];

  return (
    <div className="employee-notefrais-container">
      <Card>
        <Title level={4}>Mes notes de frais</Title>
        
        <div className="notefrais-header" style={{ marginTop: '16px' }}>
          <div></div> {/* Empty div for spacing */}
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showNewExpenseForm}
          >
            Nouvelle note de frais
          </Button>
        </div>

        <Table
          dataSource={noteFrais}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        {/* New Expense Form Modal */}
        <Modal
          title="Nouvelle note de frais"
          open={formModalVisible}
          onCancel={() => setFormModalVisible(false)}
          onOk={handleSubmit}
          okText="Soumettre"
          cancelText="Annuler"
          confirmLoading={submitting}
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="date_frais"
              label="Date de la dépense"
              rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}
            >
              <DatePicker 
                style={{ width: '100%' }} 
                format="DD/MM/YYYY"
                placeholder="Sélectionnez une date"
              />
            </Form.Item>
            
            <Form.Item
              name="type_id"
              label="Type de dépense"
              rules={[{ required: true, message: 'Veuillez sélectionner un type de dépense' }]}
            >
              <Select placeholder="Sélectionnez le type de dépense">
                {expenseTypes.map(type => (
                  <Option key={type.id} value={type.id}>{type.intitule}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="montant"
              label="Montant"
              rules={[
                { required: true, message: 'Veuillez indiquer un montant' },
                { type: 'number', min: 0.01, message: 'Le montant doit être supérieur à 0' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                step={0.01}
                precision={2}
                placeholder="0.00"
              />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={4} placeholder="Description détaillée de la dépense (optionnel)" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Expense Details Modal */}
        {selectedNoteFrais && (
          <Modal
            title="Détails de la note de frais"
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
                <Title level={4}>Note de frais</Title>
                {getStatusTag(selectedNoteFrais.status, selectedNoteFrais.manager_validation, selectedNoteFrais.hr_validation)}
              </div>
              
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Date:</Text>
                <Text>{moment(selectedNoteFrais.date_frais).format('DD/MM/YYYY')}</Text>
              </div>
                
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Type de dépense:</Text>
                <Text>{selectedNoteFrais.type_nom}</Text>
              </div>
                
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Montant:</Text>
                <Text style={{ fontWeight: 500, color: '#1890ff' }}>
                  {formatCurrency(selectedNoteFrais.montant)}
                </Text>
              </div>
                
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Description:</Text>
                <Text>{selectedNoteFrais.description || "Aucune description"}</Text>
              </div>
              
              <div style={{ marginTop: '24px' }}>
                <Divider orientation="left">Processus de validation</Divider>
                
                <div className="validation-steps">
                  {/* Manager Validation */}
                  <div className="validation-step">
                    <div className="step-header">
                      <Text strong>Validation Manager</Text>
                      {selectedNoteFrais.manager_validation ? (
                        selectedNoteFrais.manager_validation.is_approved ? (
                          <Tag icon={<CheckCircleOutlined />} color="success">Approuvé</Tag>
                        ) : (
                          <Tag icon={<CloseCircleOutlined />} color="error">Refusé</Tag>
                        )
                      ) : (
                        <Tag icon={<AnimatedPendingIcon />} color="default">En attente</Tag>
                      )}
                    </div>
                    
                    {selectedNoteFrais.manager_validation && !selectedNoteFrais.manager_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary" style={{ marginRight: '8px' }}>Justification:</Text>
                        <Text>{selectedNoteFrais.manager_validation.justification || 'Aucune justification fournie'}</Text>
                      </div>
                    )}
                  </div>
                  
                  {/* HR Validation */}
                  <div className="validation-step">
                    <div className="step-header">
                      <Text strong>Validation RH</Text>
                      {selectedNoteFrais.hr_validation ? (
                        selectedNoteFrais.hr_validation.is_approved ? (
                          <Tag icon={<CheckCircleOutlined />} color="success">Approuvé</Tag>
                        ) : (
                          <Tag icon={<CloseCircleOutlined />} color="error">Refusé</Tag>
                        )
                      ) : (
                        <Tag icon={<AnimatedPendingIcon />} color="default">En attente</Tag>
                      )}
                    </div>
                    
                    {selectedNoteFrais.hr_validation && !selectedNoteFrais.hr_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary" style={{ marginRight: '8px' }}>Justification:</Text>
                        <Text>{selectedNoteFrais.hr_validation.justification || 'Aucune justification fournie'}</Text>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </Card>
    </div>
  );
};

export default EmployeeNoteFrais; 