import React, { useState, useEffect } from "react";
import axios from "axios";
import { message, Table, Button, Modal, Form, Input, Select, DatePicker, Space, Tooltip, Radio, Card } from "antd";
import { 
  EditOutlined, 
  DeleteOutlined, 
  PlusOutlined, 
  SearchOutlined, 
  TableOutlined, 
  ApartmentOutlined 
} from "@ant-design/icons";
import moment from "moment";
import "./Employee.css";
import EmployeeHierarchy from "./EmployeeHierarchy";

const { Option } = Select;

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" or "hierarchy"
  const [selectedResponsable, setSelectedResponsable] = useState(null);

  // Fetch employees on component mount
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
    try {
      await axios.delete(`http://localhost:5000/api/employes/${id}`);
      message.success("Employé supprimé avec succès");
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      
      // Check if there was a specific error message from the API
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error("Erreur lors de la suppression de l'employé");
      }
    }
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Format date_naissance to YYYY-MM-DD
      const formattedValues = {
        ...values,
        date_naissance: values.date_naissance ? values.date_naissance.format("YYYY-MM-DD") : null,
      };
      
      if (selectedEmployee) {
        // Update existing employee
        await axios.put(`http://localhost:5000/api/employes/${selectedEmployee.id}`, formattedValues);
        message.success("Employé mis à jour avec succès");
      } else {
        // Create new employee
        await axios.post("http://localhost:5000/api/employes", formattedValues);
        message.success("Employé créé avec succès");
      }
      
      setIsModalOpen(false);
      fetchEmployees();
    } catch (error) {
      console.error("Error submitting form:", error);
      message.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  // Filter employees based on search term
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
        <Space size="middle">
          <Tooltip title="Modifier">
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              size="small" 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button 
              type="primary" 
              danger 
              icon={<DeleteOutlined />} 
              size="small" 
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleResponsableChange = (value) => {
    if (value === "all") {
      setSelectedResponsable(null);
    } else {
      const resp = employees.find(emp => emp.id === value);
      setSelectedResponsable(resp);
    }
  };

  return (
    <div className="employee-container">
      <div className="employee-header">
        <h1>Gestion des Employés</h1>
        
        <div className="header-controls">
          <div className="view-selector-container">
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
              <Input
                placeholder="Rechercher un employé"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={<SearchOutlined />}
                className="search-input"
              />
            )}
          </div>
          
          <div className="add-button-container">
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAdd}
            >
              Ajouter un employé
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "hierarchy" && (
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
      )}

      {viewMode === "table" && (
        <Table
          dataSource={filteredEmployees}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          className="employee-table"
        />
      )}

      {/* Add/Edit Employee Modal */}
      <Modal
        title={selectedEmployee ? "Modifier l'employé" : "Ajouter un employé"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Annuler
          </Button>,
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
          initialValues={{
            genre: "homme",
          }}
        >
          <div className="form-row">
            <Form.Item
              name="nom"
              label="Nom"
              rules={[{ required: true, message: "Veuillez saisir le nom" }]}
              className="form-item-half"
            >
              <Input placeholder="Nom" />
            </Form.Item>

            <Form.Item
              name="prenom"
              label="Prénom"
              rules={[{ required: true, message: "Veuillez saisir le prénom" }]}
              className="form-item-half"
            >
              <Input placeholder="Prénom" />
            </Form.Item>
          </div>

          <div className="form-row">
            <Form.Item
              name="genre"
              label="Genre"
              rules={[{ required: true, message: "Veuillez sélectionner le genre" }]}
              className="form-item-half"
            >
              <Select placeholder="Sélectionner le genre">
                <Option value="homme">Homme</Option>
                <Option value="femme">Femme</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="date_naissance"
              label="Date de naissance"
              className="form-item-half"
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Veuillez saisir l'email" },
              { type: "email", message: "Format d'email invalide" },
            ]}
          >
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="responsable_id"
            label="Responsable"
          >
            <Select 
              placeholder="Sélectionner un responsable" 
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {employees
                .filter(emp => !selectedEmployee || emp.id !== selectedEmployee.id)
                .map(emp => (
                  <Option key={emp.id} value={emp.id}>{emp.prenom} {emp.nom}</Option>
                ))
              }
            </Select>
          </Form.Item>

          <Form.Item
            name="telephone"
            label="Téléphone"
          >
            <Input placeholder="Téléphone" />
          </Form.Item>

          <Form.Item
            name="adresse"
            label="Adresse"
          >
            <Input.TextArea placeholder="Adresse complète" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Employee; 