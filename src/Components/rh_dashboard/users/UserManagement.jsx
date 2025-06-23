import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Tag, 
  Input, 
  Modal, 
  Form,
  Select,
  Typography,
  message
} from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from '../../../api/constants';
import { toast } from 'react-hot-toast';
import './UserManagement.css';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [isCreating, setIsCreating] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Get the userData from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');

  // Initially load users and employees
  useEffect(() => {
    fetchUsers();
    fetchEmployees();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        params: { requesterRole: userData.role }
      });
      
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Erreur lors du chargement des utilisateurs');
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/employees/list`, {
        params: { 
          requesterRole: userData.role,
          currentUserId: selectedUser?.id // Pass the current user ID when editing
        }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Erreur lors du chargement des employés');
    }
  };

  const handleCreateUser = () => {
    setIsCreating(true);
    setSelectedUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditUser = (user) => {
    setIsCreating(false);
    setSelectedUser(user);
    
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role || '', // Handle null role for inactive users
      employe_id: user.employe_id
    });
    
    setIsModalVisible(true);
    
    // Fetch employees list with the current user ID to ensure it's included
    fetchEmployees();
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (isCreating) {
        await axios.post(`${API_BASE_URL}/users`, {
          ...values,
          requesterRole: userData.role
        });
        message.success('Utilisateur créé avec succès');
      } else {
        await axios.put(`${API_BASE_URL}/users/${selectedUser.id}`, {
          ...values,
          requesterRole: userData.role
        });
        message.success('Utilisateur mis à jour avec succès');
      }
      
      setIsModalVisible(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Form submission error:', error);
      message.error(error.response?.data?.message || 'Erreur lors de la soumission du formulaire');
    }
  };

  const handleDeleteUser = (user) => {
    toast((t) => (
      <div className="delete-confirmation">
        <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</p>
        <div className="delete-actions">
          <button 
            className="delete-confirm-btn"
            onClick={async () => {
              try {
                await axios.delete(`${API_BASE_URL}/users/${user.id}`, {
                  params: { requesterRole: userData.role }
                });
                fetchUsers(); // Refresh the list
                toast.success("Utilisateur supprimé avec succès");
              } catch (error) {
                console.error('Error deleting user:', error);
                toast.error(error.response?.data?.message || "Erreur lors de la suppression de l'utilisateur");
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

  const getRoleLabel = (role) => {
    if (!role) return <Tag color="default" className="role-tag">Compte désactivé</Tag>;
    
    switch (role) {
      case 'employe':
        return <Tag color="blue" className="role-tag">Employé</Tag>;
      case 'manager':
        return <Tag color="green" className="role-tag">Manager</Tag>;
      case 'responsable_rh':
        return <Tag color="purple" className="role-tag">Responsable RH</Tag>;
      default:
        return <Tag className="role-tag">Inconnu</Tag>;
    }
  };

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          record.name.toLowerCase().includes(value.toLowerCase()) ||
          record.email.toLowerCase().includes(value.toLowerCase())
        );
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      render: (role) => getRoleLabel(role),
      filters: [
        { text: 'Employé', value: 'employe' },
        { text: 'Manager', value: 'manager' },
        { text: 'Responsable RH', value: 'responsable_rh' },
        { text: 'Désactivé', value: null },
      ],
      onFilter: (value, record) => {
        if (value === null) {
          return record.role === null;
        }
        return record.role === value;
      },
    },
    {
      title: 'Employé associé',
      dataIndex: 'employe_name',
      key: 'employe_name',
      render: (text) => text ? 
        <span>{text}</span> : 
        <Tag color="orange" className="employee-tag">Non associé</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            type="text"
            onClick={() => handleEditUser(record)}
            title="Modifier"
          />
          <Button
            icon={<DeleteOutlined />}
            type="text"
            danger
            onClick={() => handleDeleteUser(record)}
            title="Supprimer"
          />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="header-actions">
        <Title level={4} style={{ margin: 0 }}>Gestion des Utilisateurs</Title>
        <div>
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            style={{ width: 250, marginRight: 16 }}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleCreateUser}
          >
            Créer un Utilisateur
          </Button>
        </div>
      </div>

      <div className="user-table-container">
        <Table
          loading={loading}
          dataSource={users}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={isCreating ? "Créer un Utilisateur" : "Modifier l'Utilisateur"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleFormSubmit}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ role: 'employe' }}
        >
          <Form.Item
            name="name"
            label="Nom complet"
            rules={[{ required: true, message: 'Veuillez entrer le nom complet' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Veuillez entrer l\'email' },
              { type: 'email', message: 'Email invalide' }
            ]}
          >
            <Input />
          </Form.Item>

          {isCreating && (
            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[{ required: true, message: 'Veuillez entrer le mot de passe' }]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Rôle"
            rules={[{ required: isCreating, message: 'Veuillez sélectionner un rôle' }]}
          >
            <Select>
              <Option value="employe">Employé</Option>
              <Option value="manager">Responsable</Option>
              <Option value="responsable_rh">Responsable RH</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="employe_id"
            label="Lier à un employé"
            tooltip="Sélectionnez un employé auquel associer ce compte utilisateur"
          >
            <Select
              showSearch
              placeholder="Sélectionnez un employé"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              allowClear
            >
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>
                  {`${emp.prenom} ${emp.nom} (${emp.email})`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement; 