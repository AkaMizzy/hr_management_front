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
  Row,
  Col,
  Statistic
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  FileDoneOutlined,
  FileExclamationOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/fr';
import { toast } from 'react-hot-toast';
import './ManagerNoteFrais.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { confirm } = Modal;

moment.locale('fr');

const ManagerNoteFrais = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [validationModalVisible, setValidationModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [form] = Form.useForm();

  // Get manager data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const managerId = userData.employe_id;

  useEffect(() => {
    if (managerId) {
      fetchExpenseRequests();
    }
  }, [managerId]);

  const fetchExpenseRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/note-frais/manager/${managerId}`, {
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

  // Helper function to calculate statistics
  const calculateStatistics = () => {
    const pendingExpenses = expenses.filter(e => !e.manager_validation);
    const approvedExpenses = expenses.filter(e => e.manager_validation && e.manager_validation.is_approved);
    const rejectedExpenses = expenses.filter(e => e.manager_validation && !e.manager_validation.is_approved);
    
    // Calculate total amount
    const totalAmount = expenses.reduce((sum, expense) => sum + Number(expense.montant), 0);
    
    return {
      totalAmount,
      pendingCount: pendingExpenses.length,
      approvedCount: approvedExpenses.length,
      rejectedCount: rejectedExpenses.length
    };
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
        `http://localhost:5000/api/note-frais/${selectedExpense.id}/validate/manager`,
        {
          is_approved: isApproved,
          justification: values.justification,
          manager_id: managerId
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

  const getStatusTag = (status, managerValidation) => {
    if (managerValidation) {
      if (managerValidation.is_approved) {
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
      title: 'Statut',
      key: 'status',
      render: (_, record) => getStatusTag(record.status, record.manager_validation)
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
        record.manager_validation && record.manager_validation.is_approved ? 
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

  const pendingExpenses = expenses.filter(e => !e.manager_validation);
  const processedExpenses = expenses.filter(e => e.manager_validation);
  
  // Get statistics
  const stats = calculateStatistics();

  return (
    <div className="manager-note-frais-container">
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card 
            bordered={false}
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              background: '#ffffff'
            }}
          >
            <Statistic
              title={<Text style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>Total des dépenses</Text>}
              value={formatCurrency(stats.totalAmount)}
              valueStyle={{ color: '#262626', fontSize: '20px', fontWeight: '500' }}
              prefix={<DollarOutlined style={{ color: '#1890ff', marginRight: '8px' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            bordered={false}
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              background: '#ffffff'
            }}
          >
            <Statistic
              title={<Text style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>En attente</Text>}
              value={stats.pendingCount}
              valueStyle={{ color: '#262626', fontSize: '20px', fontWeight: '500' }}
              prefix={<FileSearchOutlined style={{ color: '#faad14', marginRight: '8px' }} />}
              suffix={<Text style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>demandes</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            bordered={false}
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              background: '#ffffff'
            }}
          >
            <Statistic
              title={<Text style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>Validées</Text>}
              value={stats.approvedCount}
              valueStyle={{ color: '#262626', fontSize: '20px', fontWeight: '500' }}
              prefix={<FileDoneOutlined style={{ color: '#52c41a', marginRight: '8px' }} />}
              suffix={<Text style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>demandes</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card 
            bordered={false}
            style={{ 
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              background: '#ffffff'
            }}
          >
            <Statistic
              title={<Text style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>Refusées</Text>}
              value={stats.rejectedCount}
              valueStyle={{ color: '#262626', fontSize: '20px', fontWeight: '500' }}
              prefix={<FileExclamationOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />}
              suffix={<Text style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.65)' }}>demandes</Text>}
            />
          </Card>
        </Col>
      </Row>

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
                {getStatusTag(selectedExpense.status, selectedExpense.manager_validation)}
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
                {(!selectedExpense.manager_validation && 
                  <div style={{ textAlign: 'center', marginTop: '24px' }}>
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
                {(selectedExpense.manager_validation && 
                  <div>
                    <Divider orientation="left">Décision de validation</Divider>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                      <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Statut:</Text>
                      <Text>
                        {selectedExpense.manager_validation.is_approved 
                          ? 'Approuvée' 
                          : 'Refusée'
                        }
                      </Text>
                    </div>
                    {!selectedExpense.manager_validation.is_approved && (
                      <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Justification:</Text>
                        <Text>{selectedExpense.manager_validation.justification || 'Aucune justification fournie'}</Text>
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

export default ManagerNoteFrais; 