import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  RightOutlined,
  DownOutlined,
  LoadingOutlined,
  AppstoreOutlined,
  ExclamationCircleOutlined,
  UserAddOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { toast } from 'react-hot-toast';
import { Button, Card, Spin, Empty } from 'antd';
import "./Entity.css";
import EmployeeAssociationModal from "./EmployeeAssociationModal";

const Entity = () => {
  const [entities, setEntities] = useState([]);
  const [types, setTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [showAllEmployees, setShowAllEmployees] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    tituler: "",
    type_id: "",
    status: "active",
    parent_id: null
  });
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch entities and types on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [entitiesRes, typesRes] = await Promise.all([
          axios.get("http://localhost:5000/api/entites"),
          axios.get("http://localhost:5000/api/entites/types")
        ]);
        console.log("Fetched entities:", entitiesRes.data);
        console.log("Fetched types:", typesRes.data);
        setEntities(entitiesRes.data);
        setTypes(typesRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Erreur lors du chargement des données");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleAdd = () => {
    setFormData({
      id: "",
      tituler: "",
      type_id: "",
      status: "active",
      parent_id: null
    });
    setIsModalOpen(true);
  };

  const handleEdit = (entity) => {
    setFormData({
      ...entity,
      parent_id: entity.parent_id ? Number(entity.parent_id) : null
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    toast((t) => (
      <div className="delete-confirmation">
        <p>Êtes-vous sûr de vouloir supprimer cette entité ?</p>
        <div className="delete-actions">
          <button 
            className="delete-confirm-btn"
            onClick={async () => {
              try {
                await axios.delete(`http://localhost:5000/api/entites/${id}`);
                const updatedEntities = await axios.get("http://localhost:5000/api/entites");
                setEntities(updatedEntities.data);
                toast.success("Entité supprimée avec succès");
              } catch (err) {
                toast.error(err.response?.data?.message || "Erreur lors de la suppression");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format data to ensure type_id is a number and parent_id is a number or null
      const formattedData = {
        ...formData,
        type_id: Number(formData.type_id),
        parent_id: formData.parent_id ? Number(formData.parent_id) : null
      };
      
      if (formData.id) {
        await axios.put(`http://localhost:5000/api/entites/${formData.id}`, formattedData);
        toast.success("Entité mise à jour avec succès");
      } else {
        await axios.post("http://localhost:5000/api/entites", formattedData);
        toast.success("Entité créée avec succès");
      }
      const updatedEntities = await axios.get("http://localhost:5000/api/entites");
      setEntities(updatedEntities.data);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  // Helper function to flatten the entity tree for dropdown selection
  const flattenEntityTree = (entities, level = 0) => {
    let result = [];
    entities.forEach(entity => {
      // Add the entity without any prefix
      result.push({
        ...entity,
        displayName: entity.tituler,
        level
      });
      
      if (entity.children && entity.children.length > 0) {
        // Recursively add children with increased indentation level
        result = result.concat(
          flattenEntityTree(entity.children, level + 1)
        );
      }
    });
    return result;
  };

  // Get flattened list of entities for parent selection
  const flatEntities = flattenEntityTree(entities);

  // Expand only the first root entity by default when the list of entities changes
  useEffect(() => {
    if (entities.length > 0) {
      setExpandedNodes(new Set([entities[0].id]));
    }
  }, [entities]);

  const handleEmployeeAssociation = (entity = null) => {
    setSelectedEntity(entity);
    setShowAllEmployees(!entity);
    setIsEmployeeModalOpen(true);
  };

  const handleEmployeeModalClose = () => {
    setIsEmployeeModalOpen(false);
    setSelectedEntity(null);
    setShowAllEmployees(false);
  };

  const renderTreeNode = (node) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="tree-node">
        <div className={`tree-node-header ${isExpanded && hasChildren ? 'expanded' : ''}`}>
          <div className="tree-node-left">
            <span 
              className={`tree-node-toggle ${hasChildren ? 'has-children' : 'no-children'}`}
              onClick={() => hasChildren && toggleNode(node.id)}
            >
              {hasChildren ? (
                isExpanded ? <DownOutlined /> : <RightOutlined />
              ) : (
                <span className="tree-leaf-indicator"></span>
              )}
            </span>
            <div className="tree-node-content">
              <span className="tree-node-title">{node.tituler}</span>
              <span className="tree-node-type">{node.type_name}</span>
              <span className={`tree-node-status ${node.status}`}>
                {node.status === "active" ? "Actif" : "Non actif"}
              </span>
            </div>
          </div>
          
          <div className="tree-node-actions">
            <button
              className="action-btn associate-btn"
              onClick={() => handleEmployeeAssociation(node)}
              title="Associer des employés"
            >
              <UserAddOutlined style={{ color: '#52c41a' }} />
            </button>
            <button
              className="action-btn edit-btn"
              onClick={() => handleEdit(node)}
            >
              <EditOutlined style={{ color: '#1890ff' }} />
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => handleDelete(node.id)}
            >
              <DeleteOutlined style={{ color: '#ff4d4f' }} />
            </button>
          </div>
        </div>
        
        {hasChildren && (
          <div className={`tree-node-children ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="content-body">
      <Card>
        <div className="loading-container">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />} />
          <p>Chargement des entités...</p>
        </div>
      </Card>
    </div>
  );
  
  if (error) return (
    <div className="content-body">
      <Card>
        <div className="error-container">
          <div className="notification error-notification">
            {error}
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="content-body">
      <Card>
        <div className="content-header">
          <h1 className="content-title">Gestion des entités</h1>
          <div className="header-buttons">
            <Button 
              onClick={() => handleEmployeeAssociation()}
              icon={<TeamOutlined />}
              style={{ marginRight: '10px' }}
            >
              Gestion des associations
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Ajouter une entité
            </Button>
          </div>
        </div>

        <div className="tree-container">
          {entities.length > 0 ? (
            entities.map(node => renderTreeNode(node))
          ) : (
            <Empty 
              description="Aucune entité trouvée" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                Créer votre première entité
              </Button>
            </Empty>
          )}
        </div>
      </Card>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {formData.id ? "Modifier l'entité" : "Ajouter une entité"}
              </h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Titulaire</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.tituler}
                  onChange={(e) =>
                    setFormData({ ...formData, tituler: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-input"
                  value={formData.type_id}
                  onChange={(e) =>
                    setFormData({ ...formData, type_id: e.target.value })
                  }
                  required
                >
                  <option value="">Sélectionner un type</option>
                  {types.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.designation}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  required
                >
                  <option value="active">Actif</option>
                  <option value="non active">Non actif</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Entité parente</label>
                <select
                  className="form-input"
                  value={formData.parent_id || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      parent_id: value ? Number(value) : null 
                    });
                  }}
                >
                  <option value="">Aucune (racine)</option>
                  {flatEntities
                    .filter(entity => !formData.id || entity.id !== formData.id)
                    .map(entity => (
                      <option 
                        key={entity.id} 
                        value={entity.id} 
                        style={{ paddingLeft: entity.level ? `${entity.level * 20}px` : '0' }}
                      >
                        {entity.displayName}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Association Modal */}
      <EmployeeAssociationModal
        visible={isEmployeeModalOpen}
        onCancel={handleEmployeeModalClose}
        entity={selectedEntity}
        showAllEmployees={showAllEmployees}
        onSuccess={() => {
          toast.success("Association mise à jour avec succès");
        }}
      />
    </div>
  );
};

export default Entity; 