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
import moment from 'moment';
import 'moment/locale/fr';
import { toast } from 'react-hot-toast';
import './RHNoteFrais.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { confirm } = Modal;

moment.locale('fr');

const RHNoteFrais = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchExpenseRequests();
  }, []);

  const fetchExpenseRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/note-frais/hr', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setExpenses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Erreur lors du chargement des notes de frais');
      setLoading(false);
    }
  };

  const showDetails = (expense) => {
    setSelectedExpense(expense);
    setDetailsModalVisible(true);
  };

  const showValidationModal = (expense) => {
    setSelectedExpense(expense);
    form.resetFields();
    setValidationModalVisible(true);
  };

  const handleValidate = async () => {
    try {
      const values = await form.validateFields();
      const isApproved = values.decision === 'approve';
      
      // If rejecting, justification is required
      if (!isApproved && !values.justification) {
        toast.error('Une justification est requise en cas de rejet');
        return;
      }
      
      await axios.post(
        `http://localhost:5000/api/note-frais/${selectedExpense.id}/validate/hr`,
        {
          is_approved: isApproved,
          justification: values.justification
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      
      toast.success(`Note de frais ${isApproved ? 'approuvée' : 'rejetée'} avec succès`);
      setValidationModalVisible(false);
      fetchExpenseRequests();
    } catch (error) {
      console.error('Error validating expense request:', error);
      toast.error('Erreur lors de la validation de la demande');
    }
  };

  const getStatusTag = (status, hrValidation) => {
    if (hrValidation) {
      if (hrValidation.is_approved) {
        return <Tag icon={<CheckCircleOutlined />} color="success">Approuvée</Tag>;
      } else {
        return <Tag icon={<CloseCircleOutlined />} color="error">Refusée</Tag>;
      }
    }
    return <Tag icon={<ClockCircleOutlined />} color="processing">En attente</Tag>;
  };

  // Helper function to format amount as currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(amount);
  };

  const pendingColumns = [
    {
      title: 'Employé',
      key: 'employee',
      render: (_, record) => `${record.employe_prenom} ${record.employe_nom}`,
    },
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
      title: 'Validation Manager',
      key: 'manager_validation',
      render: (_, record) => (
        record.manager_validation && record.manager_validation.is_approved ? 
          <Tag icon={<CheckCircleOutlined />} color="success">Approuvée</Tag> :
          <Tag icon={<ClockCircleOutlined />} color="warning">En attente</Tag>
      )
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
          {record.manager_validation && 
           record.manager_validation.is_approved && 
           !record.hr_validation && (
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
      title: 'Décision',
      key: 'decision',
      render: (_, record) => (
        record.hr_validation && record.hr_validation.is_approved ? 
          <Tag icon={<CheckCircleOutlined />} color="success">Approuvée</Tag> :
          <Tag icon={<CloseCircleOutlined />} color="error">Refusée</Tag>
      )
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

  const pendingExpenses = expenses.filter(e => 
    e.manager_validation && 
    e.manager_validation.is_approved && 
    !e.hr_validation
  );
  const processedExpenses = expenses.filter(e => e.hr_validation);

  return (
    <div className="rh-note-frais-container">
      <Card>
        <Title level={4}>Notes de frais</Title>
        
        <Tabs defaultActiveKey="pending">
          <TabPane 
            tab={
              <span>
                En attente <Tag color="processing">{pendingExpenses.length}</Tag>
              </span>
            } 
            key="pending"
          >
            <Table
              dataSource={pendingExpenses}
              columns={pendingColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Aucune note de frais en attente' }}
            />
          </TabPane>
          <TabPane 
            tab={
              <span>
                Traitées <Tag color="default">{processedExpenses.length}</Tag>
              </span>
            } 
            key="processed"
          >
            <Table
              dataSource={processedExpenses}
              columns={processedColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Aucune note de frais traitée' }}
            />
          </TabPane>
        </Tabs>

        {/* Expense Details Modal */}
        {selectedExpense && (
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
                <Title level={4}>Note de frais - {selectedExpense.employe_prenom} {selectedExpense.employe_nom}</Title>
                {getStatusTag(selectedExpense.status, selectedExpense.hr_validation)}
              </div>
              
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Date:</Text>
                <Text>{moment(selectedExpense.date_frais).format('DD/MM/YYYY')}</Text>
              </div>
                
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Type de dépense:</Text>
                <Text>{selectedExpense.type_nom}</Text>
              </div>
                
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Montant:</Text>
                <Text style={{ fontWeight: 500, color: '#1890ff' }}>
                  {formatCurrency(selectedExpense.montant)}
                </Text>
              </div>
                
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Description:</Text>
                <Text>{selectedExpense.description || "Aucune description"}</Text>
              </div>

              <div style={{ marginTop: '24px' }}>
                <Divider orientation="left">Processus de validation</Divider>
                
                <div className="validation-steps">
                  <div className="validation-step">
                    <div className="step-header">
                      <Text strong>Validation Manager</Text>
                      <Space>
                        {selectedExpense.manager_validation ? (
                          selectedExpense.manager_validation.is_approved ? (
                            <Tag color="success">Approuvée</Tag>
                          ) : (
                            <Tag color="error">Rejetée</Tag>
                          )
                        ) : (
                          <Tag color="processing">En attente</Tag>
                        )}
                      </Space>
                    </div>
                    
                    {selectedExpense.manager_validation && !selectedExpense.manager_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary">Justification: </Text>
                        <Text>{selectedExpense.manager_validation.justification || 'Aucune justification fournie'}</Text>
                      </div>
                    )}
                  </div>
                  
                  <div className="validation-step">
                    <div className="step-header">
                      <Text strong>Validation RH</Text>
                      <Space>
                        {selectedExpense.hr_validation ? (
                          selectedExpense.hr_validation.is_approved ? (
                            <Tag color="success">Approuvée</Tag>
                          ) : (
                            <Tag color="error">Rejetée</Tag>
                          )
                        ) : (
                          <Tag color="processing">En attente</Tag>
                        )}
                      </Space>
                    </div>
                    
                    {selectedExpense.hr_validation && !selectedExpense.hr_validation.is_approved && (
                      <div className="justification">
                        <Text type="secondary">Justification: </Text>
                        <Text>{selectedExpense.hr_validation.justification || 'Aucune justification fournie'}</Text>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedExpense.manager_validation && 
                 selectedExpense.manager_validation.is_approved && 
                 !selectedExpense.hr_validation && (
                  <div className="validation-actions" style={{ textAlign: 'center', justifyContent: 'center' }}>
                    <Button 
                      type="primary"
                      onClick={() => {
                        setDetailsModalVisible(false);
                        showValidationModal(selectedExpense);
                      }}
                    >
                      Valider cette demande
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Validation Modal */}
        <Modal
          title="Validation de la note de frais"
          open={validationModalVisible}
          onCancel={() => setValidationModalVisible(false)}
          onOk={handleValidate}
          okText="Soumettre"
          cancelText="Annuler"
        >
          {selectedExpense && (
            <div>
              <div className="validation-info">
                <Text>Employé: <strong>{selectedExpense.employe_prenom} {selectedExpense.employe_nom}</strong></Text>
                <br />
                <Text>Montant: <strong>{formatCurrency(selectedExpense.montant)}</strong></Text>
                <br />
                <Text>Type: <strong>{selectedExpense.type_nom}</strong></Text>
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

export default RHNoteFrais; 