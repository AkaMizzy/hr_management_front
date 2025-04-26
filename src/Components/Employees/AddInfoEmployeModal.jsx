import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, DatePicker, Switch, Button, message, Spin, Table, Space, Typography, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title } = Typography;

const AddInfoEmployeModal = ({ visible, onCancel, onSave, employeId, editRecord }) => {
  const [form] = Form.useForm();
  const [availableFields, setAvailableFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInfo, setEditingInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  useEffect(() => {
    if (visible && employeId) {
      fetchAvailableFields();
      fetchEmployeeInfo();
      if (editRecord) {
        form.setFieldsValue({
          intitule: editRecord.intitule,
          value: getInitialValue(editRecord.valeur, editRecord.type)
        });
        setSelectedField({
          type: editRecord.type,
          name: editRecord.intitule
        });
      } else {
        form.resetFields();
        setSelectedField(null);
      }
    }
  }, [visible, editRecord, form, employeId]);

  const fetchEmployeeInfo = async () => {
    try {
      setLoadingInfo(true);
      const response = await axios.get(`http://localhost:5000/api/employe-info/${employeId}`);
      setEmployeeInfo(response.data);
    } catch (error) {
      console.error('Error fetching employee info:', error);
      message.error('Failed to load employee information');
    } finally {
      setLoadingInfo(false);
    }
  };

  const getInitialValue = (value, type) => {
    if (!value) return undefined;
    
    switch (type) {
      case 'date':
        return moment(value);
      case 'boolean':
        return value === true || value === '1' || value === 1;
      default:
        return value;
    }
  };

  const fetchAvailableFields = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/info-employes');
      setAvailableFields(response.data);
    } catch (error) {
      console.error('Error fetching available fields:', error);
      message.error('Failed to load available fields');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId) => {
    const field = availableFields.find(f => f.id === fieldId);
    if (field) {
      setSelectedField({
        id: field.id,
        type: field.type,
        name: field.intitule,
        obligatoire: field.obligatoire
      });
      form.setFieldsValue({ value: undefined });
    } else {
      setSelectedField(null);
    }
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();
      
      setSubmitting(true);
      
      let response;
      const payload = {
        intitule: selectedField.name,
        type: selectedField.type,
        obligatoire: selectedField.obligatoire,
        valeur: formatValueForSubmit(values.value, selectedField?.type),
        employe_id: employeId
      };

      if (editingInfo) {
        response = await axios.put(`http://localhost:5000/api/employe-info/${editingInfo.id}`, payload);
        message.success('Field updated successfully');
      } else {
        response = await axios.post('http://localhost:5000/api/employe-info', payload);
        message.success('Field added successfully');
      }

      // Reset form and refresh data
      setShowAddForm(false);
      setEditingInfo(null);
      form.resetFields();
      fetchEmployeeInfo();
    } catch (error) {
      console.error('Error saving field:', error);
      message.error('Failed to save field');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record) => {
    setEditingInfo(record);
    setShowAddForm(true);
    form.setFieldsValue({
      intitule: record.id, // This selects the field in the dropdown
      value: getInitialValue(record.valeur, record.type)
    });
    // Set selected field for proper input rendering
    setSelectedField({
      id: record.id,
      type: record.type,
      name: record.intitule,
      obligatoire: record.obligatoire
    });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/employe-info/${id}`);
      message.success('Field deleted successfully');
      fetchEmployeeInfo();
    } catch (error) {
      console.error('Error deleting field:', error);
      message.error('Failed to delete field');
    }
  };

  const formatValueForSubmit = (value, type) => {
    if (value === undefined || value === null) return null;
    
    switch (type) {
      case 'date':
        return value.format('YYYY-MM-DD');
      case 'boolean':
        return value ? 1 : 0;
      default:
        return value;
    }
  };

  const renderInputByType = () => {
    if (!selectedField) return null;

    switch (selectedField.type) {
      case 'text':
        return <Input placeholder="Enter text value" />;
      case 'number':
        return <Input type="number" placeholder="Enter numeric value" />;
      case 'date':
        return <DatePicker style={{ width: '100%' }} />;
      case 'boolean':
        return <Switch checkedChildren="Yes" unCheckedChildren="No" />;
      case 'longtext':
        return <Input.TextArea rows={4} placeholder="Enter detailed description" />;
      case 'email':
        return <Input type="email" placeholder="Enter email address" />;
      case 'telephone':
        return <Input placeholder="Enter phone number" />;
      case 'gps':
        return <Input placeholder="Latitude,Longitude" />;
      case 'document':
        return <Input placeholder="Document URL" />;
      default:
        return <Input placeholder="Enter value" />;
    }
  };

  const formatValue = (value, type) => {
    if (value === undefined || value === null) return '-';
    
    switch (type) {
      case 'date':
        return moment(value).format('DD/MM/YYYY');
      case 'boolean':
        return value === true || value === '1' || value === 1 ? 'Yes' : 'No';
      default:
        return value;
    }
  };

  const columns = [
    {
      title: 'Field',
      dataIndex: 'intitule',
      key: 'intitule',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Value',
      key: 'value',
      render: (text, record) => formatValue(record.valeur, record.type)
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)} 
          />
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="Employee Information Fields"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Spin spinning={loadingInfo}>
        {employeeInfo.length > 0 ? (
          <Table 
            dataSource={employeeInfo} 
            columns={columns} 
            rowKey="id"
            pagination={false}
            size="small"
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p>No information fields added yet</p>
          </div>
        )}

        {!showAddForm ? (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setShowAddForm(true)}
            >
              Add New Information Field
            </Button>
          </div>
        ) : (
          <>
            <Divider>
              <Title level={5}>{editingInfo ? 'Edit Information Field' : 'Add New Information Field'}</Title>
            </Divider>
            <Spin spinning={loading || submitting}>
              <Form
                form={form}
                layout="vertical"
              >
                <Form.Item
                  name="intitule"
                  label="Field"
                  rules={[{ required: true, message: 'Please select a field' }]}
                >
                  <Select
                    placeholder="Select a field"
                    onChange={handleFieldChange}
                    disabled={!!editingInfo}
                    options={availableFields.map(field => ({
                      label: field.intitule,
                      value: field.id
                    }))}
                  />
                </Form.Item>

                {selectedField && (
                  <Form.Item
                    name="value"
                    label={`${selectedField.name} Value`}
                    rules={[{ required: selectedField.obligatoire, message: 'Please enter a value' }]}
                  >
                    {renderInputByType()}
                  </Form.Item>
                )}

                <div style={{ textAlign: 'right', marginTop: 20 }}>
                  <Button 
                    style={{ marginRight: 8 }} 
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingInfo(null);
                      form.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="primary" onClick={handleSubmit} loading={submitting}>
                    {editingInfo ? 'Update' : 'Add'}
                  </Button>
                </div>
              </Form>
            </Spin>
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default AddInfoEmployeModal; 