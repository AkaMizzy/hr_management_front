// Merged Employee.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  message,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Tooltip,
  Radio,
  Card,
  Typography
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  TableOutlined,
  ApartmentOutlined,
  PlusCircleOutlined,
  FileAddOutlined
} from "@ant-design/icons";
import { toast } from 'react-hot-toast';
import moment from "moment";
import "./Employee.css";
import EmployeeHierarchy from "./EmployeeHierarchy";
import InfoEmployesList from './InfoEmployesList';
import AddInfoEmployeModal from './AddInfoEmployeModal';

const { Option } = Select;
const { Title, Text } = Typography;

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [selectedResponsable, setSelectedResponsable] = useState(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isInfoEmployesListVisible, setIsInfoEmployesListVisible] = useState(false);
  const [isAddInfoModalVisible, setIsAddInfoModalVisible] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/employes");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      message.error("Erreur lors du chargement des employés");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedEmployee(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    form.setFieldsValue({
      ...employee,
      date_naissance: employee.date_naissance ? moment(employee.date_naissance) : null,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="delete-confirmation">
        <p>Êtes-vous sûr de vouloir supprimer cet employé ?</p>
        <div className="delete-actions">
          <button
            className="delete-confirm-btn"
            onClick={async () => {
              try {
                await axios.delete(`http://localhost:5000/api/employes/${id}`);
                toast.success("Employé supprimé avec succès");
                fetchEmployees();
              } catch (error) {
                console.error("Error deleting employee:", error);
                toast.error(error.response?.data?.message || "Erreur lors de la suppression de l'employé");
              }
              toast.dismiss(t.id);
            }}
          >
            Confirmer
          </button>
          <button className="delete-cancel-btn" onClick={() => toast.dismiss(t.id)}>
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

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        date_naissance: values.date_naissance ? values.date_naissance.format("YYYY-MM-DD") : null,
      };
      if (selectedEmployee) {
        await axios.put(`http://localhost:5000/api/employes/${selectedEmployee.id}`, formattedValues);
        toast.success("Employé mis à jour avec succès");
      } else {
        await axios.post("http://localhost:5000/api/employes", formattedValues);
        toast.success("Employé créé avec succès");
      }
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const showDetails = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailsVisible(true);
  };

  const handleResponsableChange = (value) => {
    if (value === "all") {
      setSelectedResponsable(null);
    } else {
      const resp = employees.find(emp => emp.id === value);
      setSelectedResponsable(resp);
    }
  };

  const handleShowInfoEmployesList = () => {
    setIsInfoEmployesListVisible(true);
  };

  const handleCloseInfoEmployesList = () => {
    setIsInfoEmployesListVisible(false);
  };

  const handleShowAddInfoModal = () => {
    setIsAddInfoModalVisible(true);
  };

  const handleCloseAddInfoModal = () => {
    setIsAddInfoModalVisible(false);
    // Refresh employee info if needed
    if (selectedEmployee) {
      // You might want to refresh the employee data here
    }
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      title: "Nom",
      dataIndex: "nom",
      key: "nom",
      sorter: (a, b) => a.nom.localeCompare(b.nom),
    },
    {
      title: "Prénom",
      dataIndex: "prenom",
      key: "prenom",
      sorter: (a, b) => a.prenom.localeCompare(b.prenom),
    },
    {
      title: "Genre",
      dataIndex: "genre",
      key: "genre",
      render: (genre) => (genre === "homme" ? "Homme" : "Femme"),
      filters: [
        { text: "Homme", value: "homme" },
        { text: "Femme", value: "femme" },
      ],
      onFilter: (value, record) => record.genre === value,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Téléphone",
      dataIndex: "telephone",
      key: "telephone",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Détails">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: '#52c41a', fontSize: '18px' }} />}
              onClick={() => showDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="employee-container">
      <div className="employee-header">
        <h1>Gestion des Employés</h1>
        <div className="header-right">
          <div className="fixed-controls">
            <Radio.Group
              value={viewMode}
              onChange={e => setViewMode(e.target.value)}
              className="view-selector"
              buttonStyle="solid"
            >
              <Radio.Button value="table"><TableOutlined /> Liste</Radio.Button>
              <Radio.Button value="hierarchy"><ApartmentOutlined /> Hiérarchie</Radio.Button>
            </Radio.Group>

            {viewMode === "table" && (
              <div className="search-or-placeholder">
                <Input
                  placeholder="Rechercher un employé"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefix={<SearchOutlined />}
                  className="search-input"
                />
              </div>
            )}
          </div>

          <Button
            type="default"
            icon={<PlusCircleOutlined />}
            onClick={handleShowInfoEmployesList}
          >
            Champs Supplémentaires
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Ajouter un employé
          </Button>
        </div>
      </div>

      {viewMode === "hierarchy" ? (
        <div className="hierarchy-container">
          <Card size="small" className="hierarchy-filter">
            <Select
              placeholder="Sélectionner un responsable"
              onChange={handleResponsableChange}
              className="employee-responsable-select"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              <Option value="all">Tous les employés (sans responsable)</Option>
              {employees.map(emp => (
                <Option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</Option>
              ))}
            </Select>
          </Card>
          <EmployeeHierarchy selectedManager={selectedResponsable} />
        </div>
      ) : (
        <Table
          dataSource={filteredEmployees}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          className="employee-table"
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        title={selectedEmployee ? "Modifier l'employé" : "Ajouter un employé"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>Annuler</Button>,
          selectedEmployee && (
            <Button
              key="addInfo"
              icon={<FileAddOutlined />}
              onClick={handleShowAddInfoModal}
              style={{ marginRight: 8 }}
            >
              Ajouter une information
            </Button>
          ),
          <Button key="submit" type="primary" onClick={handleFormSubmit}>
            {selectedEmployee ? "Mettre à jour" : "Ajouter"}
          </Button>,
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="employeeForm"
          initialValues={{ genre: "homme" }}
        >
          <div className="form-row">
            <Form.Item name="nom" label="Nom" rules={[{ required: true }]}>
              <Input placeholder="Nom" />
            </Form.Item>
            <Form.Item name="prenom" label="Prénom" rules={[{ required: true }]}>
              <Input placeholder="Prénom" />
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item name="genre" label="Genre" rules={[{ required: true }]}>
              <Select placeholder="Sélectionner le genre">
                <Option value="homme">Homme</Option>
                <Option value="femme">Femme</Option>
              </Select>
            </Form.Item>
            <Form.Item name="date_naissance" label="Date de naissance">
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>
          <Form.Item name="email" label="Email" rules={[{ required: true }, { type: "email" }]}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="responsable_id" label="Responsable">
            <Select
              placeholder="Sélectionner un responsable"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {employees.filter(emp => !selectedEmployee || emp.id !== selectedEmployee.id)
                .map(emp => (
                  <Option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item name="telephone" label="Téléphone">
            <Input placeholder="Téléphone" />
          </Form.Item>
          <Form.Item name="adresse" label="Adresse">
            <Input.TextArea placeholder="Adresse complète" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title="Détails de l'Employé"
        open={isDetailsVisible}
        onCancel={() => setIsDetailsVisible(false)}
        footer={null}
        width={600}
      >
        {selectedEmployee && (
          <Card className="employee-details-card">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div className="detail-section">
                <Title level={4}>Informations Personnelles</Title>
                <Text strong>Nom:</Text> <Text>{selectedEmployee.nom}</Text><br />
                <Text strong>Prénom:</Text> <Text>{selectedEmployee.prenom}</Text><br />
                <Text strong>Email:</Text> <Text>{selectedEmployee.email}</Text><br />
                <Text strong>Téléphone:</Text> <Text>{selectedEmployee.telephone}</Text>
              </div>
              <div className="detail-section">
                <Title level={4}>Informations Professionnelles</Title>
                <Text strong>Poste:</Text> <Text>{selectedEmployee.poste}</Text><br />
                <Text strong>Entité:</Text> <Text>{selectedEmployee.entite}</Text><br />
                <Text strong>Date d'Embauche:</Text> <Text>{new Date(selectedEmployee.dateEmbauche).toLocaleDateString()}</Text><br />
                <Text strong>Adresse:</Text> <Text>{selectedEmployee.adresse}</Text>
              </div>
              <div className="detail-section">
                <Title level={4}>Informations Administratives</Title>
                <Text strong>Matricule:</Text> <Text>{selectedEmployee.matricule}</Text><br />
                <Text strong>Statut:</Text> <Text>{selectedEmployee.statut}</Text>
              </div>
            </Space>
          </Card>
        )}
      </Modal>

      {/* Info Employes List Modal */}
      <InfoEmployesList
        visible={isInfoEmployesListVisible}
        onCancel={handleCloseInfoEmployesList}
      />

      {/* Add Info Employe Modal */}
      {selectedEmployee && (
        <AddInfoEmployeModal
          visible={isAddInfoModalVisible}
          onCancel={handleCloseAddInfoModal}
          onSave={handleCloseAddInfoModal}
          employeId={selectedEmployee.id}
        />
      )}
    </div>
  );
};

export default Employee;
