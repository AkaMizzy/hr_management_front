import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiEdit2, FiTrash2, FiPlus, FiChevronRight, FiChevronDown } from "react-icons/fi";
import "./EntityTable.css";

const EntityTable = () => {
  const [entities, setEntities] = useState([]);
  const [types, setTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        setEntities(entitiesRes.data);
        setTypes(typesRes.data);
        setLoading(false);
      } catch (err) {
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
    setFormData(entity);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette entité ?")) {
      try {
        await axios.delete(`http://localhost:5000/api/entites/${id}`);
        const updatedEntities = await axios.get("http://localhost:5000/api/entites");
        setEntities(updatedEntities.data);
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors de la suppression");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`http://localhost:5000/api/entites/${formData.id}`, formData);
      } else {
        await axios.post("http://localhost:5000/api/entites", formData);
      }
      const updatedEntities = await axios.get("http://localhost:5000/api/entites");
      setEntities(updatedEntities.data);
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'enregistrement");
    }
  };

  const renderTreeNode = (node) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="tree-node">
        <div className="tree-node-header">
          <span 
            className="tree-node-toggle"
            onClick={() => hasChildren && toggleNode(node.id)}
          >
            {hasChildren && (isExpanded ? <FiChevronDown /> : <FiChevronRight />)}
          </span>
          <span className="tree-node-content">
            <span className="tree-node-title">{node.tituler}</span>
            <span className="tree-node-type">{node.type_name}</span>
            <span className={`tree-node-status ${node.status}`}>
              {node.status === "active" ? "Actif" : "Non actif"}
            </span>
          </span>
          <div className="tree-node-actions">
            <button
              className="action-btn edit-btn"
              onClick={() => handleEdit(node)}
            >
              <FiEdit2 />
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => handleDelete(node.id)}
            >
              <FiTrash2 />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="tree-node-children">
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="content-body">
      <div className="content-header">
        <h1 className="content-title">Gestion des entités</h1>
        <button className="btn-primary" onClick={handleAdd}>
          <FiPlus style={{ marginRight: "8px" }} />
          Ajouter une entité
        </button>
      </div>

      <div className="tree-container">
        {entities.map(node => renderTreeNode(node))}
      </div>

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
                      {type.désignation}
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
                  onChange={(e) =>
                    setFormData({ ...formData, parent_id: e.target.value || null })
                  }
                >
                  <option value="">Aucune (racine)</option>
                  {entities
                    .filter(entity => !formData.id || entity.id !== formData.id)
                    .map(entity => (
                      <option key={entity.id} value={entity.id}>
                        {entity.tituler}
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
    </div>
  );
};

export default EntityTable; 