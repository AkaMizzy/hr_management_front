import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Input, DatePicker, 
  Select, Tooltip, Typography, message, Divider, Card, Row, Col, Spin 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ExclamationCircleOutlined, InfoCircleOutlined, UserOutlined, SearchOutlined, EyeOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import './RubriquesManagement.css';
import './EmployeRubriquesManagement.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const EmployeRubriquesManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [rubriques, setRubriques] = useState([]);
  const [employeRubriques, setEmployeRubriques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFormulesModalVisible, setIsFormulesModalVisible] = useState(false);
  const [currentFormules, setCurrentFormules] = useState(null);
  const [form] = Form.useForm();
  const [editingEmployeRubrique, setEditingEmployeRubrique] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loadingFormulas, setLoadingFormulas] = useState(false);

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employes');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Erreur lors du chargement des employés');
    }
  };

  // Fetch rubriques
  const fetchRubriques = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/paie/rubriques');
      setRubriques(response.data);
    } catch (error) {
      console.error('Error fetching rubriques:', error);
      toast.error('Erreur lors du chargement des rubriques');
    }
  };

  // Fetch employee rubriques
  const fetchEmployeRubriques = async (employeeId) => {
    if (!employeeId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/paie/employe-rubriques/${employeeId}`);
      setEmployeRubriques(response.data);
    } catch (error) {
      console.error('Error fetching employee rubriques:', error);
      toast.error('Erreur lors du chargement des rubriques de l\'employé');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchRubriques();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeRubriques(selectedEmployee);
    }
  }, [selectedEmployee]);

  // Handle form submission for create/update
  const handleSubmit = async (values) => {
    try {
      const { rubrique_id, date_range, ...formData } = values;
      
      // Format date range
      const dateData = {};
      if (date_range && date_range[0] && date_range[1]) {
        dateData.date_debut = date_range[0].format('YYYY-MM-DD');
        dateData.date_fin = date_range[1].format('YYYY-MM-DD');
      }
      
      if (editingEmployeRubrique) {
        // Update existing employee rubrique
        await axios.put(`http://localhost:5000/api/paie/employe-rubriques/${editingEmployeRubrique.id}`, {
          ...formData,
          ...dateData
        });
        toast.success('Rubrique de l\'employé mise à jour avec succès');
      } else {
        // Create new employee rubrique
        await axios.post('http://localhost:5000/api/paie/employe-rubriques', {
          id_employe: selectedEmployee,
          id_rubrique: rubrique_id,
          ...dateData,
          ...formData
        });
        toast.success('Rubrique assignée à l\'employé avec succès');
      }
      
      // Reset form and state
      setIsModalVisible(false);
      form.resetFields();
      setEditingEmployeRubrique(null);
      
      // Refresh employee rubriques list
      fetchEmployeRubriques(selectedEmployee);
    } catch (error) {
      console.error('Error saving employee rubrique:', error);
      toast.error('Erreur lors de l\'enregistrement de la rubrique de l\'employé');
    }
  };

  // Handle edit button click
  const handleEdit = (record) => {
    setEditingEmployeRubrique(record);
    
    // Set date range if dates exist
    let dateRange = null;
    if (record.date_debut && record.date_fin) {
      dateRange = [
        moment(record.date_debut),
        moment(record.date_fin)
      ];
    }
    
    form.setFieldsValue({
      rubrique_id: record.id_rubrique,
      date_range: dateRange,
      f1: record.f1 || '',
      f2: record.f2 || '',
      f3: record.f3 || '',
      f4: record.f4 || '',
      f5: record.f5 || ''
    });
    
    setIsModalVisible(true);
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    toast((t) => (
      <div className="delete-confirmation">
        <p>Êtes-vous sûr de vouloir supprimer cette rubrique de l'employé ?</p>
        <div className="delete-actions">
          <button
            className="delete-confirm-btn"
            onClick={async () => {
              try {
                await axios.delete(`http://localhost:5000/api/paie/employe-rubriques/${id}`);
                toast.success('Rubrique de l\'employé supprimée avec succès');
                fetchEmployeRubriques(selectedEmployee);
              } catch (error) {
                console.error('Error deleting employee rubrique:', error);
                if (error.response && error.response.status === 400) {
                  toast.error('Impossible de supprimer cette rubrique car elle est utilisée dans des fiches de paie');
                } else {
                  toast.error('Erreur lors de la suppression de la rubrique de l\'employé');
                }
              }
              toast.dismiss(t.id);
            }}
          >
            Confirmer
          </button>
          <button 
            className="delete-cancel-btn" 
            onClick={() => toast.dismiss(t.id)}
          >
            Annuler
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
      style: {
        background: '#fff',
        color: '#333',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: '400px',
        width: '100%'
      }
    });
  };

  // Function to show formulas modal
  const showFormulesModal = (record) => {
    setCurrentFormules({
      code: record.code,
      intitule: record.intitule,
      formules: [
        { label: 'F1', value: record.f1 },
        { label: 'F2', value: record.f2 },
        { label: 'F3', value: record.f3 },
        { label: 'F4', value: record.f4 },
        { label: 'F5', value: record.f5 }
      ].filter(f => f.value)
    });
    setIsFormulesModalVisible(true);
  };

  // Handle rubrique selection change
  const handleRubriqueChange = async (rubriqueId) => {
    if (!rubriqueId || editingEmployeRubrique) return;
    
    setLoadingFormulas(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/paie/rubriques/${rubriqueId}/details`);
      const rubrique = response.data;
      
      // If the rubrique is obligatoire, auto-fill the formula fields
      if (rubrique.obligatoire === 1) {
        form.setFieldsValue({
          f1: rubrique.f1 || '',
          f2: rubrique.f2 || '',
          f3: rubrique.f3 || '',
          f4: rubrique.f4 || '',
          f5: rubrique.f5 || ''
        });
        
        // Show a message to inform the user
        toast.info('Les formules ont été automatiquement remplies car cette rubrique est obligatoire.');
      } else {
        // Clear the formula fields if the rubrique is not obligatoire
        form.setFieldsValue({
          f1: '',
          f2: '',
          f3: '',
          f4: '',
          f5: ''
        });
      }
    } catch (error) {
      console.error('Error fetching rubrique details:', error);
      toast.error('Erreur lors du chargement des détails de la rubrique');
    } finally {
      setLoadingFormulas(false);
    }
  };

  // Table columns definition
  const columns = [
    {
      title: 'Intitulé',
      dataIndex: 'intitule',
      key: 'intitule',
      sorter: (a, b) => a.intitule.localeCompare(b.intitule),
    },
    {
      title: 'Date de début',
      dataIndex: 'date_debut',
      key: 'date_debut',
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-',
      sorter: (a, b) => {
        if (!a.date_debut) return -1;
        if (!b.date_debut) return 1;
        return moment(a.date_debut).diff(moment(b.date_debut));
      },
    },
    {
      title: 'Date de fin',
      dataIndex: 'date_fin',
      key: 'date_fin',
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : '-',
      sorter: (a, b) => {
        if (!a.date_fin) return -1;
        if (!b.date_fin) return 1;
        return moment(a.date_fin).diff(moment(b.date_fin));
      },
    },
    {
      title: 'Formules',
      key: 'formules',
      render: (_, record) => {
        const formulesCount = [record.f1, record.f2, record.f3, record.f4, record.f5].filter(Boolean).length;
        return (
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => showFormulesModal(record)}
          >
            {formulesCount > 0 ? `${formulesCount} formule${formulesCount > 1 ? 's' : ''}` : 'Aucune formule'}
          </Button>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Modifier">
            <Button 
              type="text" 
              icon={<EditOutlined style={{ color: '#1890ff', fontSize: '18px' }} />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined style={{ fontSize: '18px' }} />} 
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const getEmployeeName = (id) => {
    const employee = employees.find(emp => emp.id === parseInt(id));
    return employee ? `${employee.prenom} ${employee.nom}` : '';
  };

  return (
    <div className="employe-rubriques-management">
      <Title level={4}>Rubriques par Employé</Title>
      
      <Card className="employee-selector-card">
        <Row gutter={16}>
          <Col span={24}>
            <Form layout="vertical">
              <Form.Item
                label={<span><UserOutlined /> Sélectionner un employé</span>}
                required
              >
                <Select
                  showSearch
                  placeholder="Rechercher un employé"
                  optionFilterProp="children"
                  value={selectedEmployee}
                  onChange={(value) => setSelectedEmployee(value)}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                  style={{ width: '100%' }}
                  suffixIcon={<SearchOutlined />}
                >
                  {employees.map(employee => (
                    <Option key={employee.id} value={employee.id}>
                      {employee.prenom} {employee.nom}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>
      
      {selectedEmployee && (
        <>
          <div className="header-actions">
            <Title level={5}>
              Rubriques assignées à {getEmployeeName(selectedEmployee)}
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingEmployeRubrique(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
              className="action-button"
            >
              Assigner une Rubrique
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={employeRubriques}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: '100%' }}
            className="employe-rubriques-table"
          />
        </>
      )}

      <Modal
        title={editingEmployeRubrique ? "Modifier la Rubrique de l'Employé" : "Assigner une Rubrique à l'Employé"}
        visible={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingEmployeRubrique(null);
        }}
        footer={null}
        width={800}
        bodyStyle={{ padding: '16px', maxHeight: '80vh', overflowY: 'auto' }}
        style={{ top: 20 }}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="middle"
        >
          <Form.Item
            name="rubrique_id"
            label="Rubrique"
            rules={[{ required: true, message: 'Veuillez sélectionner une rubrique' }]}
            disabled={!!editingEmployeRubrique}
          >
            <Select 
              placeholder="Sélectionner une rubrique"
              disabled={!!editingEmployeRubrique}
              onChange={handleRubriqueChange}
            >
              {rubriques.map(rubrique => (
                <Option key={rubrique.id} value={rubrique.id}>
                  {rubrique.code} - {rubrique.intitule}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="date_range"
            label="Période de validité"
            tooltip="Laissez vide pour une validité illimitée"
          >
            <RangePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
            />
          </Form.Item>

          <Divider style={{ margin: '8px 0' }}>
            <Text strong>Formules de calcul</Text>
            <Tooltip title="Ces formules sont utilisées pour calculer les montants de la rubrique. Si la rubrique est obligatoire, les formules sont automatiquement copiées depuis la rubrique.">
              <InfoCircleOutlined style={{ marginLeft: 8 }} />
            </Tooltip>
          </Divider>

          {loadingFormulas ? (
            <div style={{ textAlign: 'center', padding: '12px' }}>
              <Spin tip="Chargement des formules..." />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Form.Item
                name="f1"
                label="Formule 1"
                style={{ flex: '1 0 45%' }}
              >
                <Input.TextArea placeholder="Formule 1" rows={1} />
              </Form.Item>

              <Form.Item
                name="f2"
                label="Formule 2"
                style={{ flex: '1 0 45%' }}
              >
                <Input.TextArea placeholder="Formule 2" rows={1} />
              </Form.Item>

              <Form.Item
                name="f3"
                label="Formule 3"
                style={{ flex: '1 0 45%' }}
              >
                <Input.TextArea placeholder="Formule 3" rows={1} />
              </Form.Item>

              <Form.Item
                name="f4"
                label="Formule 4"
                style={{ flex: '1 0 45%' }}
              >
                <Input.TextArea placeholder="Formule 4" rows={1} />
              </Form.Item>

              <Form.Item
                name="f5"
                label="Formule 5"
                style={{ flex: '1 0 45%' }}
              >
                <Input.TextArea placeholder="Formule 5" rows={1} />
              </Form.Item>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 12 }}>
            <Button
              onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
                setEditingEmployeRubrique(null);
              }}
            >
              Annuler
            </Button>
            <Button type="primary" htmlType="submit">
              {editingEmployeRubrique ? "Mettre à jour" : "Assigner"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Modal for displaying formulas */}
      <Modal
        title={currentFormules ? `Formules pour ${currentFormules.intitule}` : 'Formules'}
        visible={isFormulesModalVisible}
        onCancel={() => setIsFormulesModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsFormulesModalVisible(false)}>
            Fermer
          </Button>
        ]}
        width={700}
        bodyStyle={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}
        style={{ top: 20 }}
        centered
      >
        {currentFormules && (
          <div>
            {currentFormules.formules.length > 0 ? (
              currentFormules.formules.map((formula, index) => (
                <div key={index} style={{ marginBottom: '12px' }}>
                  <Text strong style={{ fontSize: '15px' }}>{formula.label}:</Text>
                  <div className="formula-display" style={{ padding: '10px' }}>
                    {formula.value}
                  </div>
                </div>
              ))
            ) : (
              <Text>Aucune formule définie pour cette rubrique.</Text>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployeRubriquesManagement; 