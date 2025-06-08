import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Tag, 
  Card, 
  Input, 
  Typography, 
  Spin,
  Button,
  Modal,
  Upload,
  Form,
  Space,
  message,
  Descriptions,
  Image,
  Tooltip
} from 'antd';
import { 
  SearchOutlined, 
  EditOutlined,
  UploadOutlined,
  EyeOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;

const EmployeeTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [actionFile, setActionFile] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const employe_id = userData.employe_id;

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/taches/employee/${employe_id}`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      message.error('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/taches/${taskId}`);
      setTaskDetails(response.data);
    } catch (error) {
      console.error('Error fetching task details:', error);
      message.error('Erreur lors du chargement des détails de la tâche');
    }
  };

  const handleAddAction = (task) => {
    setSelectedTask(task);
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleViewDetails = async (task) => {
    setSelectedTask(task);
    await fetchTaskDetails(task.id);
    setIsDetailsVisible(true);
  };

  const handleSubmitAction = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      
      const formData = new FormData();
      formData.append('employeId', employe_id);
      formData.append('intitule', values.intitule);
      formData.append('detail', values.detail);
      if (actionFile) {
        formData.append('photo', actionFile);
      }

      await axios.post(
        `http://localhost:5000/api/taches/${selectedTask.id}/actions`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      message.success('Action ajoutée avec succès');
      setIsModalVisible(false);
      form.resetFields();
      setActionFile(null);
      await fetchTaskDetails(selectedTask.id);
    } catch (error) {
      console.error('Error submitting action:', error);
      message.error('Erreur lors de l\'ajout de l\'action');
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'DOCX':
      case 'DOC':
        return <FileWordOutlined style={{ color: '#1890ff' }} />;
      case 'JPEG':
      case 'JPG':
      case 'PNG':
      case 'GIF':
        return <FileImageOutlined style={{ color: '#52c41a' }} />;
      default:
        return <FileOutlined />;
    }
  };

  const handleFileView = (actionId) => {
    window.open(`http://localhost:5000/api/taches/actions/file/${actionId}`, '_blank');
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
      title: 'Intitulé',
      dataIndex: 'intitule',
      key: 'intitule',
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return record.intitule.toLowerCase().includes(value.toLowerCase()) ||
               record.description.toLowerCase().includes(value.toLowerCase());
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Date début',
      dataIndex: 'ddr',
      key: 'ddr',
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => moment(a.ddr).unix() - moment(b.ddr).unix(),
    },
    {
      title: 'Date fin',
      dataIndex: 'dfr',
      key: 'dfr',
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => moment(a.dfr).unix() - moment(b.dfr).unix(),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
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
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Voir les détails">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Ajouter une action">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleAddAction(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card className="employee-tasks">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>Mes Tâches</Title>
        <Input
          placeholder="Rechercher une tâche"
          prefix={<SearchOutlined />}
          style={{ width: 250 }}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      
      <Table
        loading={loading}
        dataSource={tasks}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total: ${total} tâches`,
        }}
        style={{ marginTop: 16 }}
      />

      {/* Add Action Modal */}
      <Modal
        title="Ajouter une action"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setActionFile(null);
        }}
        onOk={handleSubmitAction}
        confirmLoading={submitting}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="intitule"
            label="Intitulé"
            rules={[{ required: true, message: 'L\'intitulé est requis' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="detail"
            label="Détail"
            rules={[{ required: true, message: 'Le détail est requis' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
          
          <Form.Item
            label="Fichier joint"
          >
            <Upload
              beforeUpload={(file) => {
                setActionFile(file);
                return false;
              }}
              onRemove={() => setActionFile(null)}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Sélectionner un fichier</Button>
            </Upload>
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              Formats acceptés: PDF, DOCX, JPEG, PNG, GIF
            </Text>
          </Form.Item>
        </Form>
      </Modal>

      {/* Task Details Modal */}
      <Modal
        title="Détails de la tâche"
        open={isDetailsVisible}
        onCancel={() => setIsDetailsVisible(false)}
        footer={null}
        width={800}
      >
        {taskDetails && (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Intitulé">{taskDetails.intitule}</Descriptions.Item>
              <Descriptions.Item label="Description">{taskDetails.description}</Descriptions.Item>
              <Descriptions.Item label="Date début">
                {moment(taskDetails.ddr).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Date fin">
                {moment(taskDetails.dfr).format('DD/MM/YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={getStatusColor(taskDetails.status)}>
                  {getStatusLabel(taskDetails.status)}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ margin: '24px 0 16px' }}>Actions</Title>
            {taskDetails.assignments?.map((assignment) => (
              assignment.actions?.map((action, index) => (
                <Card 
                  key={action.id} 
                  size="small" 
                  style={{ marginBottom: 16 }}
                  title={`Action ${index + 1}: ${action.intitule}`}
                >
                  <p>{action.detail}</p>
                  {action.photo && (
                    <div style={{ marginTop: 8 }}>
                      <Button
                        type="link"
                        icon={getFileIcon(action.photo.split('.').pop().toUpperCase())}
                        onClick={() => handleFileView(action.id)}
                      >
                        Voir le fichier joint
                      </Button>
                    </div>
                  )}
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Ajoutée le {moment(action.date_creation).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </Card>
              ))
            ))}
          </>
        )}
      </Modal>
    </Card>
  );
};

export default EmployeeTasks; 