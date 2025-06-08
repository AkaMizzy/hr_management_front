import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Upload, 
  message, 
  Typography,
  Tag,
  Modal,
  Input
} from 'antd';
import { 
  UploadOutlined, 
  DownloadOutlined, 
  EyeOutlined, 
  DeleteOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title } = Typography;
const { TextArea } = Input;

const EmployeeDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const employe_id = userData.employe_id;

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/documents/${employe_id}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileView = (documentId) => {
    window.open(`http://localhost:5000/api/documents/view/${documentId}`, '_blank');
  };

  const handleFileDownload = (documentId, fileName) => {
    window.open(`http://localhost:5000/api/documents/download/${documentId}`, '_blank');
  };

 

  const handleUpload = async () => {
    if (!selectedFile) {
      message.error('Veuillez sélectionner un fichier');
      return;
    }

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('description', description);

    setUploading(true);
    try {
      await axios.post(
        `http://localhost:5000/api/documents/upload/${employe_id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      message.success('Document téléchargé avec succès');
      setUploadModalVisible(false);
      setDescription('');
      setSelectedFile(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      message.error('Erreur lors du téléchargement du document');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'DOCX':
        return <FileWordOutlined style={{ color: '#1890ff' }} />;
      case 'JPEG':
      case 'PNG':
        return <FileImageOutlined style={{ color: '#52c41a' }} />;
      default:
        return <FileOutlined />;
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type_fichier',
      key: 'type_fichier',
      width: 70,
      render: (type) => getFileIcon(type),
    },
    {
      title: 'Nom du fichier',
      dataIndex: 'nom_fichier',
      key: 'nom_fichier',
      render: (text) => <span style={{ color: '#1890ff' }}>{text}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Date d\'ajout',
      dataIndex: 'date_upload',
      key: 'date_upload',
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => moment(a.date_upload).unix() - moment(b.date_upload).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleFileView(record.id)}
            title="Voir"
          />
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => handleFileDownload(record.id, record.nom_fichier)}
            title="Télécharger"
          />
        
        </Space>
      ),
    },
  ];

  return (
    <div className="employee-documents">
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>Mes Documents</Title>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            Ajouter un document
          </Button>
        </div>

        <Table
          loading={loading}
          dataSource={documents}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} documents`,
          }}
        />

        <Modal
          title="Ajouter un document"
          open={uploadModalVisible}
          onCancel={() => {
            setUploadModalVisible(false);
            setDescription('');
            setSelectedFile(null);
          }}
          footer={[
            <Button key="cancel" onClick={() => setUploadModalVisible(false)}>
              Annuler
            </Button>,
            <Button
              key="upload"
              type="primary"
              loading={uploading}
              onClick={handleUpload}
            >
              Télécharger
            </Button>,
          ]}
        >
          <Upload
            beforeUpload={(file) => {
              setSelectedFile(file);
              return false;
            }}
            maxCount={1}
            onRemove={() => setSelectedFile(null)}
          >
            <Button icon={<UploadOutlined />}>Sélectionner un fichier</Button>
          </Upload>
          <div style={{ marginTop: 16 }}>
            <TextArea
              placeholder="Description du document"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </Modal>
      </Card>
    </div>
  );
};

export default EmployeeDocuments; 