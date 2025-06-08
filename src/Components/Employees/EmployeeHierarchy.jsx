import React, { useState, useEffect } from "react";
import axios from "axios";
import { Tree, Card, Spin, Button, message, Empty, Tooltip, Avatar } from "antd";
import { UserOutlined, TeamOutlined, DownOutlined, ReloadOutlined } from "@ant-design/icons";
import "./Employee.css";

const EmployeeHierarchy = ({ selectedManager = null }) => {
  const [treeData, setTreeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  useEffect(() => {
    if (allEmployees.length > 0) {
      buildHierarchyTree();
    }
  }, [allEmployees, selectedManager]);

  const fetchAllEmployees = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/employes");
      setAllEmployees(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des employés:", error);
      message.error("Impossible de charger les données des employés");
    } finally {
      setLoading(false);
    }
  };

  const buildHierarchyTree = () => {
    // First identify root nodes (employees with no responsable or selected manager)
    const rootId = selectedManager ? selectedManager.id : null;
    const roots = allEmployees.filter(emp => emp.manager_id=== rootId);
    
    if (roots.length === 0 && rootId) {
      // If a specific manager is selected but has no subordinates
      message.info("Cet employé n'a pas de subordonnés");
    }

    // Build the tree recursively
    const tree = roots.map(emp => buildEmployeeNode(emp));
    setTreeData(tree);
    
    // Expand first level by default
    setExpandedKeys(roots.map(r => r.id.toString()));
  };

  const buildEmployeeNode = (employee) => {
    // Find all subordinates for this employee
    const subordinates = allEmployees.filter(emp => emp.manager_id === employee.id);
    
    // Create the node
    const node = {
      title: renderEmployeeTitle(employee),
      key: employee.id.toString(),
      icon: <UserOutlined />,
      data: employee
    };
    
    // Add children if any
    if (subordinates.length > 0) {
      node.children = subordinates.map(sub => buildEmployeeNode(sub));
      node.icon = <TeamOutlined />;
    }
    
    return node;
  };

  const renderEmployeeTitle = (employee) => {
    return (
      <Tooltip title={`Email: ${employee.email || 'Non défini'}`}>
        <span className="employee-node">
          {employee.prenom} {employee.nom} 
          {employee.telephone && <span className="employee-phone"> • {employee.telephone}</span>}
        </span>
      </Tooltip>
    );
  };

  const handleRefresh = () => {
    fetchAllEmployees();
  };

  const onExpand = (expandedKeysValue) => {
    setExpandedKeys(expandedKeysValue);
  };

  if (loading) {
    return (
      <div className="hierarchy-loading">
        <Spin size="large" />
        <p>Chargement de la hiérarchie...</p>
      </div>
    );
  }

  return (
    <Card 
      title="Hiérarchie des Employés" 
      className="hierarchy-card"
      extra={
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          type="text"
        >
          Actualiser
        </Button>
      }
    >
      {treeData.length > 0 ? (
        <Tree
          showIcon
          defaultExpandAll={false}
          expandedKeys={expandedKeys}
          onExpand={onExpand}
          treeData={treeData}
          switcherIcon={<DownOutlined />}
          className="employee-tree"
        />
      ) : (
        <Empty 
          description="Aucune hiérarchie disponible" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      )}
    </Card>
  );
};

export default EmployeeHierarchy; 