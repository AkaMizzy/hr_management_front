import React, { useState } from "react";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import "./EntityTable.css";

const EntityTable = () => {
  const [entities, setEntities] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    titulaire: "",
    type: "",
    status: ""
  });

  const handleAdd = () => {
    setFormData({ id: "", titulaire: "", type: "", status: "" });
    setIsModalOpen(true);
  };

  const handleEdit = (entity) => {
    setFormData(entity);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    // TODO: Implement delete functionality
    console.log("Delete entity with id:", id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement save functionality
    console.log("Form data:", formData);
    setIsModalOpen(false);
  };

  return (
    <div className="content-body">
      <div className="content-header">
        <h1 className="content-title">Gestion des entités</h1>
        <button className="btn-primary" onClick={handleAdd}>
          <FiPlus style={{ marginRight: "8px" }} />
          Ajouter une entité
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titulaire</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity) => (
              <tr key={entity.id}>
                <td>{entity.id}</td>
                <td>{entity.titulaire}</td>
                <td>{entity.type}</td>
                <td>{entity.status}</td>
                <td>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(entity)}
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(entity.id)}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                  value={formData.titulaire}
                  onChange={(e) =>
                    setFormData({ ...formData, titulaire: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-input"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  required
                >
                  <option value="">Sélectionner un type</option>
                  <option value="type1">Type 1</option>
                  <option value="type2">Type 2</option>
                  <option value="type3">Type 3</option>
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
                  <option value="">Sélectionner un status</option>
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: "#6c757d" }}
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