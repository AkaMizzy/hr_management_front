import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Spin, Tooltip, Form, Input, Select, Switch } from 'antd';
import { EditOutlined, PlusOutlined, SaveOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const { Option } = Select;

const InfoEmployesList = ({ visible, onCancel }) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState(null); // null, 'add', or 'edit'
  const [editingField, setEditingField] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form] = Form.useForm();

  // Define allowed types for display and form
  const fieldTypes = [
    { value: 'text', label: 'Texte' },
    { value: 'number', label: 'Nombre' },
    { value: 'date', label: 'Date' },
    { value: 'email', label: 'Email' },
    { value: 'telephone', label: 'Téléphone' },
    { value: 'gps', label: 'Coordonnées GPS' },
    { value: 'document', label: 'Document' },
    { value: 'boolean', label: 'Oui/Non' }
  ];

  useEffect(() => {
    if (visible) {
      fetchFields();
    }
  }, [visible]);

  useEffect(() => {
    if (formMode === 'edit' && editingField) {
      form.setFieldsValue({
        intitule: editingField.intitule,
        type: editingField.type,
        obligatoire: editingField.obligatoire
      });
    } else if (formMode === 'add') {
      form.resetFields();
    }
  }, [formMode, editingField, form]);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/info-employes');
      setFields(response.data);
    } catch (error) {
      console.error('Error fetching fields:', error);
      toast.error('Erreur lors du chargement des champs');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setEditingField(record);
    setFormMode('edit');
  };

  const handleAddNew = () => {
    setEditingField(null);
    setFormMode('add');
  };

  const handleBackToList = () => {
    setFormMode(null);
    setEditingField(null);
    form.resetFields();
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      setFormLoading(true);
      
      try {
        if (formMode === 'edit') {
          // Update existing field
          await axios.put(`http://localhost:5000/api/info-employes/${editingField.id}`, {
            intitule: values.intitule,
            type: values.type,
            obligatoire: values.obligatoire || false
          });
          toast.success('Champ mis à jour avec succès');
        } else {
          // Create new field
          await axios.post('http://localhost:5000/api/info-employes', {
            intitule: values.intitule,
            type: values.type,
            obligatoire: values.obligatoire || false
          });
          toast.success('Champ ajouté avec succès');
        }
        form.resetFields();
        setFormMode(null);
        fetchFields();
      } catch (error) {
        console.error('Error saving info field:', error);
        if (error.response?.data?.message?.includes('existe déjà')) {
          toast.error('Un champ avec ce nom existe déjà');
        } else {
          toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du champ');
        }
      }
    } catch (formError) {
      // Form validation error
      console.error('Form validation error:', formError);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = () => {
    if (!editingField || !editingField.id) {
      toast.error('Erreur: impossible d\'identifier le champ à supprimer');
      return;
    }

    toast((t) => (
      <div className="delete-confirmation">
        <p>Êtes-vous sûr de vouloir supprimer le champ "{editingField.intitule}" ?</p>
        <div className="delete-actions">
          <button
            className="delete-confirm-btn"
            onClick={() => {
              setDeleteLoading(true);
              
              axios.delete(`http://localhost:5000/api/info-employes/${editingField.id}`)
                .then(response => {
                  console.log('Delete success:', response.data);
                  toast.success('Champ supprimé avec succès');
                  setFormMode(null);
                  fetchFields();
                })
                .catch(error => {
                  console.error('Error deleting field:', error);
                  const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Erreur lors de la suppression du champ';
                  toast.error(errorMessage);
                })
                .finally(() => {
                  setDeleteLoading(false);
                });
              
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

  const columns = [
    {
      title: 'Nom du champ',
      dataIndex: 'intitule',
      key: 'intitule',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: type => {
        const fieldType = fieldTypes.find(f => f.value === type);
        return fieldType ? fieldType.label : type;
      }
    },
    {
      title: 'Obligatoire',
      dataIndex: 'obligatoire',
      key: 'obligatoire',
      render: obligatoire => obligatoire ? 'Oui' : 'Non'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Tooltip title="Modifier">
          <Button
            type="text"
            icon={<EditOutlined style={{ color: '#1890ff' }} />}
            onClick={() => handleEdit(record)}
          />
        </Tooltip>
      ),
    }
  ];

  // Determine modal title based on mode
  const getModalTitle = () => {
    if (formMode === 'add') return "Ajouter un champ supplémentaire";
    if (formMode === 'edit') return "Modifier le champ";
    return "Gestion des champs supplémentaires";
  };

  // Determine modal footer based on mode
  const getModalFooter = () => {
    if (formMode === 'add' || formMode === 'edit') {
      const buttons = [
        <Button key="back" onClick={handleBackToList} icon={<ArrowLeftOutlined />}>
          Retour
        </Button>
      ];

      if (formMode === 'edit') {
        buttons.push(
          <Button
            key="delete"
            type="primary"
            danger
            icon={<DeleteOutlined />}
            loading={deleteLoading}
            onClick={handleDelete}
          >
            Supprimer
          </Button>
        );
      }

      buttons.push(
        <Button
          key="submit"
          type="primary"
          icon={formMode === 'edit' ? <SaveOutlined /> : <PlusOutlined />}
          loading={formLoading}
          onClick={handleFormSubmit}
        >
          {formMode === 'edit' ? "Enregistrer" : "Ajouter"}
        </Button>
      );

      return buttons;
    }

    // List mode footer
    return [
      <Button key="cancel" onClick={onCancel}>
        Fermer
      </Button>,
      <Button
        key="add"
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleAddNew}
      >
        Ajouter un champ
      </Button>
    ];
  };

  // Render the form for add/edit modes
  const renderForm = () => (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
    >
      <Form.Item
        name="intitule"
        label="Nom du champ"
        rules={[{ required: true, message: 'Le nom du champ est obligatoire' }]}
      >
        <Input placeholder="Ex: Salaire, Localisation, Permis de conduire..." />
      </Form.Item>
      
      <Form.Item
        name="type"
        label="Type de données"
        rules={[{ required: true, message: 'Le type de données est obligatoire' }]}
      >
        <Select placeholder="Sélectionner le type de données">
          {fieldTypes.map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item
        name="obligatoire"
        label="Champ obligatoire"
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>
    </Form>
  );

  // Render the list table
  const renderList = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
        </div>
      );
    }

    return (
      <Table
        dataSource={fields}
        columns={columns}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: 'Aucun champ défini' }}
      />
    );
  };

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onCancel={formMode ? handleBackToList : onCancel}
      footer={getModalFooter()}
      width={700}
    >
      {formMode ? renderForm() : renderList()}
    </Modal>
  );
};

export default InfoEmployesList; 