import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Modal, Form, Input, 
  Switch, Tooltip, Typography, message 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  InfoCircleOutlined, EyeOutlined,
  ArrowUpOutlined, ArrowDownOutlined, MenuOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import update from 'immutability-helper';
import { toast } from 'react-hot-toast';
import './RubriquesManagement.css';

const { Title, Text } = Typography;

// Drag and drop row component
const DraggableRow = ({ index, moveRow, className, style, ...restProps }) => {
  const ref = React.useRef();
  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: 'DraggableRow',
    collect: (monitor) => {
      const { index: dragIndex } = monitor.getItem() || {};
      if (dragIndex === index) {
        return {};
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: dragIndex < index ? 'drop-over-downward' : 'drop-over-upward',
      };
    },
    drop: (item) => {
      moveRow(item.index, index);
    },
  });

  const [, drag] = useDrag({
    type: 'DraggableRow',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drop(drag(ref));

  return (
    <tr
      ref={ref}
      className={`${className}${isOver ? ` ${dropClassName}` : ''}`}
      style={{ cursor: 'move', ...style }}
      {...restProps}
    />
  );
};

const RubriquesManagement = () => {
  const [rubriques, setRubriques] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFormulesModalVisible, setIsFormulesModalVisible] = useState(false);
  const [currentFormules, setCurrentFormules] = useState(null);
  const [form] = Form.useForm();
  const [editingRubrique, setEditingRubrique] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // Fetch all rubriques
  const fetchRubriques = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/paie/rubriques');
      // Sort rubriques by order
      const sortedRubriques = response.data.sort((a, b) => a.order - b.order);
      setRubriques(sortedRubriques);
    } catch (error) {
      console.error('Error fetching rubriques:', error);
      message.error('Erreur lors du chargement des rubriques');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRubriques();
  }, []);

  // Handle form submission for create/update
  const handleSubmit = async (values) => {
    try {
      if (editingRubrique) {
        // Update existing rubrique
        await axios.put(`http://localhost:5000/api/paie/rubriques/${editingRubrique.id}`, values);
        message.success('Rubrique mise à jour avec succès');
      } else {
        // Create new rubrique
        // For new rubriques, set the order to be the highest current order + 1
        const maxOrder = rubriques.length > 0 
          ? Math.max(...rubriques.map(r => r.order || 0)) 
          : 0;
        
        const newValues = {
          ...values,
          order: maxOrder + 1
        };
        
        await axios.post('http://localhost:5000/api/paie/rubriques', newValues);
        message.success('Rubrique créée avec succès');
      }
      
      // Reset form and state
      setIsModalVisible(false);
      form.resetFields();
      setEditingRubrique(null);
      
      // Refresh rubriques list
      fetchRubriques();
    } catch (error) {
      console.error('Error saving rubrique:', error);
      message.error('Erreur lors de l\'enregistrement de la rubrique');
    }
  };

  // Move row function for drag and drop
  const moveRow = async (dragIndex, hoverIndex) => {
    // Get the dragged item
    const dragRow = rubriques[dragIndex];
    // Update the state with the new order
    const newData = update(rubriques, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragRow],
      ],
    });
    
    setRubriques(newData);
    
    // Update the order in the database after a short delay to prevent too many requests
    clearTimeout(window.reorderTimeout);
    window.reorderTimeout = setTimeout(async () => {
      try {
        setSavingOrder(true);
        
        // Update the order for each rubrique
        const updatePromises = newData.map((item, index) => 
          axios.put(`http://localhost:5000/api/paie/rubriques/${item.id}`, { 
            order: index + 1 
          })
        );
        
        await Promise.all(updatePromises);
        message.success('Ordre mis à jour avec succès');
      } catch (error) {
        console.error('Error updating order:', error);
        message.error('Erreur lors de la mise à jour de l\'ordre');
        // Revert to the original order
        fetchRubriques();
      } finally {
        setSavingOrder(false);
      }
    }, 500);
  };

  // Function to move a rubrique up in the order
  const moveUp = async (record, index) => {
    if (index === 0) return; // Already at the top
    moveRow(index, index - 1);
  };

  // Function to move a rubrique down in the order
  const moveDown = async (record, index) => {
    if (index === rubriques.length - 1) return; // Already at the bottom
    moveRow(index, index + 1);
  };

  // Handle edit button click
  const handleEdit = (record) => {
    setEditingRubrique(record);
    form.setFieldsValue({
      code: record.code,
      intitule: record.intitule,
      f1: record.f1 || '',
      f2: record.f2 || '',
      f3: record.f3 || '',
      f4: record.f4 || '',
      f5: record.f5 || '',
      visible: record.visible === 1,
      order: record.order,
      obligatoire: record.obligatoire === 1
    });
    setIsModalVisible(true);
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    toast((t) => (
      <div className="delete-confirmation">
        <p>Êtes-vous sûr de vouloir supprimer cette rubrique ?</p>
        <div className="delete-actions">
          <button
            className="delete-confirm-btn"
            onClick={async () => {
              try {
                await axios.delete(`http://localhost:5000/api/paie/rubriques/${id}`);
                toast.success('Rubrique supprimée avec succès');
                fetchRubriques();
              } catch (error) {
                console.error('Error deleting rubrique:', error);
                if (error.response && error.response.status === 400) {
                  toast.error('Impossible de supprimer cette rubrique car elle est assignée à des employés');
                } else {
                  toast.error('Erreur lors de la suppression de la rubrique');
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

  // Table columns definition
  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      sorter: (a, b) => a.code.localeCompare(b.code),
      width: '15%',
    },
    {
      title: 'Intitulé',
      dataIndex: 'intitule',
      key: 'intitule',
      sorter: (a, b) => a.intitule.localeCompare(b.intitule),
      width: '25%',
    },
    {
      title: 'Formules',
      key: 'formules',
      width: '20%',
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
      title: 'Visible',
      dataIndex: 'visible',
      key: 'visible',
      width: '10%',
      render: (visible) => (
        visible === 1 ? <span style={{ color: 'green' }}>Oui</span> : <span style={{ color: 'red' }}>Non</span>
      ),
      filters: [
        { text: 'Oui', value: 1 },
        { text: 'Non', value: 0 },
      ],
      onFilter: (value, record) => record.visible === value,
    },
    {
      title: 'Obligatoire',
      dataIndex: 'obligatoire',
      key: 'obligatoire',
      width: '10%',
      render: (obligatoire) => (
        obligatoire === 1 ? <span style={{ color: 'green' }}>Oui</span> : <span style={{ color: 'red' }}>Non</span>
      ),
      filters: [
        { text: 'Oui', value: 1 },
        { text: 'Non', value: 0 },
      ],
      onFilter: (value, record) => record.obligatoire === value,
    },
    {
      title: 'Ordre',
      key: 'order',
      width: 90,
      render: (_, record, index) => (
        <Space className="order-buttons">
          <Button 
            icon={<ArrowUpOutlined />} 
            size="small" 
            disabled={index === 0}
            onClick={() => moveUp(record, index)}
          />
          <Button 
            icon={<ArrowDownOutlined />} 
            size="small" 
            disabled={index === rubriques.length - 1}
            onClick={() => moveDown(record, index)}
          />
        </Space>
      ),
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
    {
      title: '',
      key: 'sort',
      width: 30,
      className: 'drag-visible',
      render: () => <MenuOutlined className="drag-handle" />,
    },
  ];

  const components = {
    body: {
      row: DraggableRow,
    },
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="rubriques-management">
        <div className="header-container">
          <Title level={4}>Rubriques de Paie</Title>
          <div className="button-container">
            {savingOrder && <span className="saving-indicator">Sauvegarde de l'ordre...</span>}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRubrique(null);
                form.resetFields();
                setIsModalVisible(true);
              }}
            >
              Nouvelle Rubrique
            </Button>
          </div>
        </div>

        <Table
          components={components}
          rowKey="id"
          columns={columns}
          dataSource={rubriques}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: '100%' }}
          onRow={(record, index) => ({
            index,
            moveRow,
          })}
        />

        <Modal
          title={editingRubrique ? "Modifier la Rubrique" : "Nouvelle Rubrique"}
          visible={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setEditingRubrique(null);
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
            initialValues={{
              visible: true,
              obligatoire: false
            }}
            size="middle"
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              <Form.Item
                name="code"
                label="Code"
                rules={[{ required: true, message: 'Le code est obligatoire' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Code de la rubrique" />
              </Form.Item>

              <Form.Item
                name="intitule"
                label="Intitulé"
                rules={[{ required: true, message: 'L\'intitulé est obligatoire' }]}
                style={{ flex: 2 }}
              >
                <Input placeholder="Intitulé de la rubrique" />
              </Form.Item>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text strong>Formules de calcul</Text>
              <Tooltip title="Ces formules sont utilisées pour calculer les montants de la rubrique">
                <InfoCircleOutlined style={{ marginLeft: 8 }} />
              </Tooltip>
            </div>

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

            <div style={{ display: 'flex', gap: '16px', marginTop: 12 }}>
              <Form.Item
                name="visible"
                label="Visible sur fiche de paie"
                valuePropName="checked"
                style={{ flex: 1 }}
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="obligatoire"
                label="Rubrique obligatoire"
                valuePropName="checked"
                style={{ flex: 1 }}
                tooltip="Si coché, les formules seront automatiquement copiées lors de l'assignation à un employé"
              >
                <Switch />
              </Form.Item>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 12 }}>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                  setEditingRubrique(null);
                }}
              >
                Annuler
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRubrique ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Modal for displaying formulas */}
        <Modal
          title={currentFormules ? `Formules pour ${currentFormules.code} - ${currentFormules.intitule}` : 'Formules'}
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
                    <div 
                      style={{ 
                        background: '#f5f5f5', 
                        padding: '10px', 
                        borderRadius: '4px',
                        marginTop: '4px',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}
                    >
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
    </DndProvider>
  );
};

export default RubriquesManagement; 