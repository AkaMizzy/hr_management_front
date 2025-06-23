import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Table, Spin, message, Empty, Tabs, Tag, Select } from 'antd';
import { UserAddOutlined, LoadingOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;
const { Option } = Select;

const EmployeeAssociationModal = ({ visible, onCancel, entity, showAllEmployees, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [associatedEmployees, setAssociatedEmployees] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [allEntities, setAllEntities] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [entities, setEntities] = useState([]);
  const [activeTab, setActiveTab] = useState('1');

  const API_BASE_URL = 'http://localhost:5000';

  // Fetch employees and entities data
  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible, entity]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all entities first for mapping
      const entitiesResponse = await axios.get(`${API_BASE_URL}/api/entites`);
      
      // Create a map of all entities for quick lookup
      const entitiesMap = {};
      const flattenEntities = (items) => {
        items.forEach(item => {
          entitiesMap[item.id] = item;
          if (item.children && item.children.length > 0) {
            flattenEntities(item.children);
          }
        });
      };
      flattenEntities(entitiesResponse.data);
      setAllEntities(entitiesMap);
      
      // Fetch all employees
      const allEmployeesResponse = await axios.get(`${API_BASE_URL}/api/employes`);
      const employees = allEmployeesResponse.data;
      setAllEmployees(employees);
      
      // Set selected entity if one was provided
      if (entity) {
        setSelectedEntity(entity.id);
        
        // Filter associated and available employees
        const associated = employees.filter(emp => emp.entite_id === entity.id);
        const available = employees.filter(emp => emp.entite_id === null);
        
        setAssociatedEmployees(associated);
        setAvailableEmployees(available);
        
        // Set the active tab to the "Associated Employees" tab by default
        setActiveTab('1');
      } else if (showAllEmployees) {
        // Group employees by entity
        const associatedEmps = [];
        employees.forEach(emp => {
          if (emp.entite_id && entitiesMap[emp.entite_id]) {
            associatedEmps.push({
              ...emp,
              entityName: entitiesMap[emp.entite_id].tituler
            });
          }
        });
        setAssociatedEmployees(associatedEmps);
        setAvailableEmployees(employees.filter(emp => emp.entite_id === null));
        
        // Set the active tab to the "All Employees" tab by default
        setActiveTab('1');
      }
      
      // Flatten the tree structure for the select dropdown
      const flattenedEntities = [];
      const flatten = (items) => {
        items.forEach(item => {
          flattenedEntities.push(item);
          if (item.children && item.children.length > 0) {
            flatten(item.children);
          }
        });
      };
      flatten(entitiesResponse.data);
      setEntities(flattenedEntities);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleAssociateEmployee = async () => {
    if (!selectedEmployee) {
      message.warning('Veuillez sélectionner un employé');
      return;
    }

    if (showAllEmployees && !selectedEntity) {
      message.warning('Veuillez sélectionner une entité');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/employes/${selectedEmployee}`, {
        entite_id: selectedEntity
      });
      
      message.success(selectedEntity ? 'Employé associé avec succès' : 'Employé retiré de l\'entité avec succès');
      setSelectedEmployee(null);
      fetchData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error associating employee:', error);
      message.error('Erreur lors de l\'association de l\'employé');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromEntity = async (employeeId) => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/employes/${employeeId}`, {
        entite_id: null
      });
      
      message.success('Employé retiré de l\'entité avec succès');
      fetchData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error removing employee from entity:', error);
      message.error('Erreur lors du retrait de l\'employé');
    } finally {
      setLoading(false);
    }
  };

  const getEntityName = (entityId) => {
    return entityId && allEntities[entityId] ? allEntities[entityId].tituler : 'Aucune entité';
  };

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'nom',
      key: 'nom',
    },
    {
      title: 'Prénom',
      dataIndex: 'prenom',
      key: 'prenom',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div>
          
          <Button 
            danger
            size="small" 
            onClick={() => handleRemoveFromEntity(record.id)}
          >
            Retirer
          </Button>
        </div>
      ),
    },
  ];

  // Extended columns for the all employees tab
  const allEmployeesColumns = [
    {
      title: 'Nom',
      dataIndex: 'nom',
      key: 'nom',
    },
    {
      title: 'Prénom',
      dataIndex: 'prenom',
      key: 'prenom',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Entité actuelle',
      key: 'entite',
      render: (_, record) => (
        record.entite_id ? (
          <Tag color="blue">{getEntityName(record.entite_id)}</Tag>
        ) : (
          <Tag color="default">Non associé</Tag>
        )
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedEmployee(record.id);
              setSelectedEntity(record.entite_id);
              setActiveTab('2');
            }}
            disabled={!record.entite_id}
          >
            Modifier
          </Button>
          <Button
            type={record.entite_id ? "default" : "primary"}
            danger={record.entite_id ? true : false}
            size="small"
            onClick={() => handleRemoveFromEntity(record.id)}
            disabled={!record.entite_id}
          >
            Retirer
          </Button>
        </div>
      ),
    },
  ];

  // Render entity-specific modal (UserAddOutlined icon)
  if (!showAllEmployees) {
    return (
      <Modal
        title={`Association des employés - ${entity?.tituler || 'Entité'}`}
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={800}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Employés associés" key="1">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                <p>Chargement des employés...</p>
              </div>
            ) : associatedEmployees.length > 0 ? (
              <Table
                dataSource={associatedEmployees}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 5 }}
              />
            ) : (
              <Empty
                description="Aucun employé associé à cette entité"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <Button 
                type="primary" 
                icon={<UserAddOutlined />} 
                onClick={() => setActiveTab('2')}
              >
                Associer un employé
              </Button>
            </div>
          </TabPane>
          
          <TabPane tab="Associer un employé" key="2">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                <p>Chargement des employés...</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '10px' }}>Employés disponibles</h3>
                  <Table
                    dataSource={availableEmployees}
                    columns={[
                      { title: 'Nom', dataIndex: 'nom', key: 'nom' },
                      { title: 'Prénom', dataIndex: 'prenom', key: 'prenom' },
                      { title: 'Email', dataIndex: 'email', key: 'email' },
                      {
                        title: 'Action',
                        key: 'action',
                        render: (_, record) => (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => {
                              setSelectedEmployee(record.id);
                              setSelectedEntity(entity.id);
                            }}
                          >
                            Sélectionner
                          </Button>
                        )
                      }
                    ]}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                  />
                  
                  {selectedEmployee && (
                    <div className="selected-employee" style={{ marginTop: '20px', padding: '15px', border: '1px solid #f0f0f0', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                      <h3 style={{ marginBottom: '10px' }}>Employé sélectionné</h3>
                      <p>
                        <strong>Nom:</strong> {allEmployees.find(e => e.id === selectedEmployee)?.nom} {allEmployees.find(e => e.id === selectedEmployee)?.prenom}
                      </p>
                      <p>
                        <strong>Email:</strong> {allEmployees.find(e => e.id === selectedEmployee)?.email}
                      </p>
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <Button
                          onClick={() => setSelectedEmployee(null)}
                          style={{ marginRight: '10px' }}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="primary"
                          onClick={handleAssociateEmployee}
                          loading={loading}
                        >
                          Associer à {entity?.tituler}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabPane>
        </Tabs>
      </Modal>
    );
  }

  // Render "Gestion des associations" modal
  return (
    <Modal
      title="Gestion des associations employés-entités"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Tous les employés" key="1">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <p>Chargement des employés...</p>
            </div>
          ) : (
            <Table
              dataSource={allEmployees}
              columns={allEmployeesColumns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </TabPane>
        
        <TabPane tab="Associer / Modifier" key="2">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <p>Chargement des employés...</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '10px' }}>
                  {selectedEmployee && allEmployees.find(e => e.id === selectedEmployee)?.entite_id 
                    ? "Modification d'une association" 
                    : "Employés sans entité"}
                </h3>
                {(!selectedEmployee || !allEmployees.find(e => e.id === selectedEmployee)?.entite_id) && (
                  <Table
                    dataSource={availableEmployees}
                    columns={[
                      { title: 'Nom', dataIndex: 'nom', key: 'nom' },
                      { title: 'Prénom', dataIndex: 'prenom', key: 'prenom' },
                      { title: 'Email', dataIndex: 'email', key: 'email' },
                      {
                        title: 'Action',
                        key: 'action',
                        render: (_, record) => (
                          <Button
                            type="primary"
                            size="small"
                            onClick={() => {
                              setSelectedEmployee(record.id);
                            }}
                          >
                            Sélectionner
                          </Button>
                        )
                      }
                    ]}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    rowClassName={(record) => record.id === selectedEmployee ? 'ant-table-row-selected' : ''}
                  />
                )}
                
                {selectedEmployee && (
                  <div className="selected-employee" style={{ marginTop: '20px', padding: '15px', border: '1px solid #f0f0f0', borderRadius: '4px', backgroundColor: '#fafafa' }}>
                    <h3 style={{ marginBottom: '10px' }}>Employé sélectionné</h3>
                    <p>
                      <strong>Nom:</strong> {allEmployees.find(e => e.id === selectedEmployee)?.nom} {allEmployees.find(e => e.id === selectedEmployee)?.prenom}
                    </p>
                    <p>
                      <strong>Email:</strong> {allEmployees.find(e => e.id === selectedEmployee)?.email}
                    </p>
                    
                    <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>
                      {allEmployees.find(e => e.id === selectedEmployee)?.entite_id 
                        ? "Modifier l'entité" 
                        : "Sélectionner une entité"}
                    </h3>
                    <Select
                      placeholder="Sélectionner une entité"
                      style={{ width: '100%', marginBottom: '20px' }}
                      value={selectedEntity}
                      onChange={setSelectedEntity}
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      <Option value={null}>Aucune entité</Option>
                      {entities.map(entity => (
                        <Option key={entity.id} value={entity.id}>
                          {entity.tituler}
                        </Option>
                      ))}
                    </Select>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                      <Button
                        onClick={() => setSelectedEmployee(null)}
                        style={{ marginRight: '10px' }}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="primary"
                        onClick={handleAssociateEmployee}
                        loading={loading}
                        disabled={!selectedEntity}
                      >
                        {allEmployees.find(e => e.id === selectedEmployee)?.entite_id
                          ? "Modifier l'association"
                          : "Associer"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default EmployeeAssociationModal; 