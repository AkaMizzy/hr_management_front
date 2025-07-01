import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Tooltip,
  DatePicker,
  Tag,
  message,
  Transfer
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { toast } from 'react-hot-toast';
import moment from "moment";
import "./Tasks.css";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);

  // Get manager_id from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const manager_id = userData.employe_id;

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/taches?manager_id=${manager_id}`);
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      message.error("Erreur lors du chargement des tâches");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch employees when assign modal opens
  const fetchEmployees = async () => {
    try {
      console.log('Fetching employees for manager:', manager_id);
      
      // First fetch all employees under this manager
      const response = await axios.get(`http://localhost:5000/api/employes/responsable/${manager_id}`);
      console.log('Employees fetched:', response.data);
      
      if (!response.data || response.data.length === 0) {
        message.warning("Aucun employé trouvé sous votre responsabilité");
        return;
      }

      const formattedEmployees = response.data.map(emp => ({
        key: emp.id.toString(),
        title: `${emp.nom} ${emp.prenom}`,
        description: emp.email,
        id: emp.id
      }));
      
      console.log('Formatted employees:', formattedEmployees);
      setEmployees(formattedEmployees);

      // Then fetch current assignments for the selected task
      if (selectedTask) {
        console.log('Fetching assignments for task:', selectedTask.id);
        const taskResponse = await axios.get(`http://localhost:5000/api/taches/${selectedTask.id}`);
        console.log('Task assignments:', taskResponse.data);
        
        if (taskResponse.data.assignments && Array.isArray(taskResponse.data.assignments)) {
          const currentAssignments = taskResponse.data.assignments
            .filter(assignment => assignment.employe_id)
            .map(assignment => assignment.employe_id.toString());
          console.log('Current assignments:', currentAssignments);
          setSelectedEmployees(currentAssignments);
        } else {
          console.log('No existing assignments found');
          setSelectedEmployees([]);
        }
      }
    } catch (error) {
      console.error("Error in fetchEmployees:", error);
      message.error(error.response?.data?.message || "Erreur lors du chargement des employés");
    }
  };

  const handleAdd = () => {
    setSelectedTask(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (task) => {
    setSelectedTask(task);
    form.setFieldsValue({
      ...task,
      dateRange: [moment(task.ddr), moment(task.dfr)],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="delete-confirmation">
        <p>Êtes-vous sûr de vouloir supprimer cette tâche ?</p>
        <div className="delete-actions">
          <button
            className="delete-confirm-btn"
            onClick={async () => {
              try {
                await axios.delete(`http://localhost:5000/api/taches/${id}?manager_id=${manager_id}`);
                toast.success("Tâche supprimée avec succès");
                fetchTasks();
              } catch (error) {
                console.error("Error deleting task:", error);
                toast.error(error.response?.data?.message || "Erreur lors de la suppression de la tâche");
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

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const [ddr, dfr] = values.dateRange;
      
      const formData = {
        intitule: values.intitule,
        description: values.description,
        ddr: ddr.format("YYYY-MM-DD HH:mm:ss"),
        dfr: dfr.format("YYYY-MM-DD HH:mm:ss"),
        manager_id: manager_id
      };

      if (selectedTask) {
        await axios.put(`http://localhost:5000/api/taches/${selectedTask.id}`, formData);
        toast.success("Tâche mise à jour avec succès");
        setIsModalOpen(false);
        fetchTasks();
      } else {
        try {
          // For new task, get the response with the new task data including the ID
          const response = await axios.post("http://localhost:5000/api/taches", formData);
          toast.success("Tâche créée avec succès");
          
          // Get the newly created task ID from the response
          const newTaskId = response.data.taskId;
          if (!newTaskId) {
            console.error("Task ID not found in response:", response.data);
            toast.error("Erreur lors de la récupération des détails de la tâche");
            setIsModalOpen(false);
            fetchTasks();
            return;
          }
          
          try {
            // Fetch the complete task data to ensure we have all fields
            const taskResponse = await axios.get(`http://localhost:5000/api/taches/${newTaskId}`);
            const newTask = taskResponse.data;
            
            // Close the creation modal
            setIsModalOpen(false);
            // Update tasks first
            await fetchTasks();
            
            // Set the newly created task as selected and open the assign modal
            setSelectedTask(newTask);
            setIsAssignModalVisible(true);
            fetchEmployees();
          } catch (fetchError) {
            console.error("Error fetching new task details:", fetchError);
            toast.error("Tâche créée, mais impossible de charger l'écran d'assignation");
            setIsModalOpen(false);
            fetchTasks();
          }
        } catch (createError) {
          console.error("Error creating task:", createError);
          toast.error(createError.response?.data?.message || "Erreur lors de la création de la tâche");
          // Don't close the modal so the user can try again
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const showDetails = (task) => {
    setSelectedTask(task);
    setIsDetailsVisible(true);
  };

  const handleAssign = (task) => {
    console.log('Opening assignment modal for task:', task);
    setSelectedTask(task);
    setIsAssignModalVisible(true);
    fetchEmployees();
  };

  const handleAssignSubmit = async () => {
    console.log('Submitting assignments:', {
      taskId: selectedTask?.id,
      employeeIds: selectedEmployees,
      manager_id: manager_id
    });
    
    setAssignLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/taches/${selectedTask.id}/assign`, {
        employeeIds: selectedEmployees.map(Number),
        manager_id: manager_id
      });
      
      message.success("Employés assignés avec succès");
      setIsAssignModalVisible(false);
      fetchTasks(); // Refresh the task list to update counts
    } catch (error) {
      console.error("Error in handleAssignSubmit:", error);
      message.error(error.response?.data?.message || "Erreur lors de l'assignation des employés");
    } finally {
      setAssignLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'gold',
      done: 'green',
      forwarded: 'blue',
      cancel: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En cours',
      done: 'Terminée',
      forwarded: 'Transmise',
      cancel: 'Annulée'
    };
    return labels[status] || status;
  };

  const columns = [
    {
      title: "Intitulé",
      dataIndex: "intitule",
      key: "intitule",
      sorter: (a, b) => a.intitule.localeCompare(b.intitule),
    },
    {
      title: "Date début",
      dataIndex: "ddr",
      key: "ddr",
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => moment(a.ddr).unix() - moment(b.ddr).unix(),
    },
    {
      title: "Date fin",
      dataIndex: "dfr",
      key: "dfr",
      render: (date) => moment(date).format("DD/MM/YYYY HH:mm"),
      sorter: (a, b) => moment(a.dfr).unix() - moment(b.dfr).unix(),
    },
    {
      title: "Statut",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Tag>
      ),
      filters: [
        { text: 'En cours', value: 'pending' },
        { text: 'Terminée', value: 'done' },
        { text: 'Transmise', value: 'forwarded' },
        { text: 'Annulée', value: 'cancel' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Employés assignés",
      dataIndex: "assigned_employees_count",
      key: "assigned_employees_count",
      sorter: (a, b) => a.assigned_employees_count - b.assigned_employees_count,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Détails">
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: '#52c41a', fontSize: '18px' }} />}
              onClick={() => showDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Assigner">
            <Button
              type="text"
              icon={<UserAddOutlined style={{ color: '#1890ff', fontSize: '18px' }} />}
              onClick={() => handleAssign(record)}
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredTasks = tasks.filter(
    (task) =>
      task.intitule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="task-container">
      <div className="task-header">
        <h1>Gestion des Tâches</h1>
        <div className="header-right">
          <Input
            placeholder="Rechercher une tâche"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
            className="search-input"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Créer une tâche
          </Button>
        </div>
      </div>

      <Table
        dataSource={filteredTasks}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        className="task-table"
      />

      {/* Add/Edit Modal */}
      <Modal
        title={selectedTask ? "Modifier la tâche" : "Créer une tâche"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleFormSubmit}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          name="taskForm"
        >
          <Form.Item
            name="intitule"
            label="Intitulé"
            rules={[{ required: true, message: "L'intitulé est requis" }]}
          >
            <Input placeholder="Intitulé de la tâche" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "La description est requise" }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Description détaillée de la tâche" 
            />
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Période de réalisation"
            rules={[{ required: true, message: "La période est requise" }]}
          >
            <RangePicker 
              showTime 
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Details Modal */}
      <Modal
        title="Détails de la Tâche"
        open={isDetailsVisible}
        onCancel={() => setIsDetailsVisible(false)}
        footer={null}
        width={700}
      >
        {selectedTask && (
          <div className="task-details">
            <h3>{selectedTask.intitule}</h3>
            <p className="task-description">{selectedTask.description}</p>
            <div className="task-info">
              <div className="info-item">
                <strong>Statut:</strong>
                <Tag color={getStatusColor(selectedTask.status)}>
                  {getStatusLabel(selectedTask.status)}
                </Tag>
              </div>
              <div className="info-item">
                <strong>Date de début:</strong>
                <span>{moment(selectedTask.ddr).format("DD/MM/YYYY HH:mm")}</span>
              </div>
              <div className="info-item">
                <strong>Date de fin:</strong>
                <span>{moment(selectedTask.dfr).format("DD/MM/YYYY HH:mm")}</span>
              </div>
              <div className="info-item">
                <strong>Employés assignés:</strong>
                <span>{selectedTask.assigned_employees_count}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Assignment Modal */}
      <Modal
        title="Assigner des Employés"
        open={isAssignModalVisible}
        onCancel={() => {
          setIsAssignModalVisible(false);
          setSelectedEmployees([]);
        }}
        onOk={handleAssignSubmit}
        confirmLoading={assignLoading}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <h4>Tâche: {selectedTask?.intitule}</h4>
          {employees.length === 0 && (
            <div style={{ color: '#ff4d4f', marginTop: 8 }}>
              Aucun employé disponible sous votre responsabilité
            </div>
          )}
        </div>
        <Transfer
          dataSource={employees}
          titles={['Employés disponibles', 'Employés assignés']}
          targetKeys={selectedEmployees}
          onChange={(newTargetKeys) => {
            console.log('Transfer selection changed:', newTargetKeys);
            setSelectedEmployees(newTargetKeys);
          }}
          render={item => `${item.title} (${item.description})`}
          listStyle={{
            width: 300,
            height: 300,
          }}
          showSearch
          filterOption={(inputValue, item) =>
            item.title.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1 ||
            item.description.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1
          }
        />
      </Modal>
    </div>
  );
};

export default TaskList; 