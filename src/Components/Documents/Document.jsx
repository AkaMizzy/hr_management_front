//Document.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Button, 
  Modal, 
  Table, 
  Space, 
  Card,
  Typography,
  Tooltip,
  List,
  Avatar,
  Input,
  Upload,
  Form,
  message,
  Alert
} from 'antd';
import { 
  UploadOutlined, 
  EyeOutlined, 
  DownloadOutlined, 
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  SearchOutlined,
  FileOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

// Types de fichiers supportés
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

const Document = () => {
  const [form] = Form.useForm();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEmployeeModalVisible, setIsEmployeeModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [fileList, setFileList] = useState([]);

  const API_BASE_URL = 'http://localhost:5000';

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchDocuments(selectedEmployee);
    } else {
      setDocuments([]);
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/employes`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (employeeId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/documents/${employeeId}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee) => {
    setSelectedEmployee(employee.id);
    setIsEmployeeModalVisible(false);
  };

  const filteredEmployees = employees.filter(employee =>
    `${employee.nom} ${employee.prenom}`.toLowerCase().includes(searchText.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleUpload = async (values) => {
    if (fileList.length === 0) {
      message.error('Veuillez sélectionner un fichier');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    const file = fileList[0].originFileObj;
    
    // Use 'document' as the field name to match backend expectation
    formData.append('document', file);
    formData.append('description', values.description);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/documents/upload/${selectedEmployee}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log('Upload progress:', percentCompleted, '%');
          },
        }
      );

      console.log('Upload response:', response.data);
      message.success('Document ajouté avec succès');
      setIsModalVisible(false);
      form.resetFields();
      setFileList([]);
      fetchDocuments(selectedEmployee);
    } catch (error) {
      console.error('Error details:', error.response?.data || error.message);
      message.error(error.response?.data?.message || 'Erreur lors de l\'ajout du document');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      console.log('Selected file:', file);
      if (!SUPPORTED_FILE_TYPES.includes(file.type)) {
        message.error('Type de fichier non supporté. Veuillez choisir un fichier PDF, Word ou une image.');
        return false;
      }
      
      // Check file size (5MB limit)
      const isLessThan5MB = file.size / 1024 / 1024 < 5;
      if (!isLessThan5MB) {
        message.error('Le fichier ne doit pas dépasser 5MB');
        return false;
      }
      
      setFileList([{
        uid: '-1',
        name: file.name,
        status: 'done',
        originFileObj: file
      }]);
      return false;
    },
    fileList,
    onRemove: () => {
      setFileList([]);
    },
    accept: SUPPORTED_FILE_TYPES.join(','),
    multiple: false
  };

  const handleViewDocument = (documentId) => {
    window.open(`${API_BASE_URL}/api/documents/view/${documentId}`, '_blank');
  };

  const handleDownloadDocument = (documentId) => {
    window.open(`${API_BASE_URL}/api/documents/download/${documentId}`, '_blank');
  };

  const columns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Nom du fichier',
      dataIndex: 'nom_fichier',
      key: 'nom_fichier',
    },
    {
      title: 'Type',
      dataIndex: 'type_fichier',
      key: 'type_fichier',
    },
    {
      title: 'Date d\'ajout',
      dataIndex: 'date_upload',
      key: 'date_upload',
      render: (text) => new Date(text).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Voir">
            <Button 
              type="primary" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDocument(record.id)}
            />
          </Tooltip>
          <Tooltip title="Télécharger">
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownloadDocument(record.id)}
            />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleDelete = async (documentId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/documents/${documentId}`);
      message.success('Document supprimé avec succès');
      fetchDocuments(selectedEmployee);
    } catch (error) {
      console.error('Error deleting document:', error);
      message.error('Erreur lors de la suppression du document');
    }
  };

  const getSelectedEmployeeName = () => {
    const employee = employees.find(emp => emp.id === selectedEmployee);
    return employee ? `${employee.nom} ${employee.prenom}` : 'Sélectionner un employé';
  };

  return (
    <div className="document-container" style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '20px' }}>
          <Title level={2}>Gestion des Documents</Title>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Button
              onClick={() => setIsEmployeeModalVisible(true)}
              size="large"
              style={{
                minWidth: '250px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                backgroundColor: selectedEmployee ? '#f0f7ff' : 'white',
                borderColor: selectedEmployee ? '#1890ff' : undefined
              }}
            >
              <span style={{ 
                color: selectedEmployee ? '#1890ff' : 'rgba(0, 0, 0, 0.85)',
                flex: 1,
                textAlign: 'left',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {getSelectedEmployeeName()}
              </span>
              <UserOutlined style={{ color: selectedEmployee ? '#1890ff' : undefined }} />
            </Button>

            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
              disabled={!selectedEmployee}
              size="large"
              style={{
                width: 'fit-content',
                height: '40px',
                padding: '0 24px',
                borderRadius: '6px',
                boxShadow: '0 2px 0 rgba(0, 0, 0, 0.045)'
              }}
            >
              Ajouter un document
            </Button>
          </div>
        </div>

        {!selectedEmployee ? (
          <Alert
            message="Aucun employé sélectionné"
            description="Veuillez sélectionner un employé pour voir et gérer ses documents."
            type="info"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        ) : documents.length === 0 ? (
          <Alert
            message="Aucun document"
            description="Cet employé n'a pas encore de documents. Utilisez le bouton 'Ajouter un document' pour en ajouter."
            type="info"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        ) : (
          <Table 
            columns={columns} 
            dataSource={documents} 
            rowKey="id"
            loading={loading}
          />
        )}

        <Modal
          title={<span style={{ color: '#1890ff' }}>Sélectionner un employé</span>}
          open={isEmployeeModalVisible}
          onCancel={() => setIsEmployeeModalVisible(false)}
          footer={null}
          width={600}
          centered
        >
          <div style={{ marginBottom: '16px' }}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Rechercher un employé..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <List
              dataSource={filteredEmployees}
              renderItem={(employee) => (
                <List.Item
                  onClick={() => handleEmployeeSelect(employee)}
                  style={{ 
                    cursor: 'pointer',
                    padding: '12px',
                    borderRadius: '6px',
                    backgroundColor: selectedEmployee === employee.id ? '#f0f7ff' : 'transparent',
                    transition: 'all 0.3s ease'
                  }}
                  className="employee-list-item"
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<UserOutlined />} 
                        style={{ 
                          backgroundColor: selectedEmployee === employee.id ? '#1890ff' : '#d9d9d9'
                        }}
                      />
                    }
                    title={`${employee.nom} ${employee.prenom}`}
                    description={employee.email}
                  />
                </List.Item>
              )}
              style={{ 
                maxHeight: '400px', 
                overflowY: 'auto',
                border: '1px solid #f0f0f0',
                borderRadius: '8px',
                padding: '8px'
              }}
            />
          </div>
        </Modal>

        <Modal
          title={<span style={{ color: '#1890ff' }}>Ajouter un document</span>}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setFileList([]);
          }}
          footer={null}
          centered
        >
          <Form
            form={form}
            onFinish={handleUpload}
            layout="vertical"
            style={{ marginTop: '20px' }}
          >
            <Form.Item
              name="description"
              label="Description du document"
              rules={[{ required: true, message: 'Veuillez entrer une description' }]}
            >
              <Input placeholder="Entrez une description pour le document" />
            </Form.Item>

            <Form.Item
              name="file"
              label="Fichier"
              rules={[{ required: true, message: 'Veuillez sélectionner un fichier' }]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Upload.Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <FileOutlined />
                </p>
                <p className="ant-upload-text">Cliquez ou glissez-déposez un fichier ici</p>
                <p className="ant-upload-hint" style={{ color: '#666' }}>
                  Formats supportés : PDF, Word, JPEG, PNG (max 5MB)
                </p>
              </Upload.Dragger>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                disabled={fileList.length === 0}
              >
                Ajouter le document
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default Document;