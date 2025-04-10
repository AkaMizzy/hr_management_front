import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiUser, FiUserCheck } from "react-icons/fi";
import "./Employees.css";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    genre: "Homme",
    date_naissance: "",
    email: "",
    adresse: "",
    telephone: ""
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:5000/api/employees", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erreur lors de la récupération des employés');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la récupération des employés");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = selectedEmployee 
        ? `http://localhost:5000/api/employees/${selectedEmployee.id}`
        : "http://localhost:5000/api/employees";
      
      const method = selectedEmployee ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'enregistrement');

      setShowForm(false);
      setSelectedEmployee(null);
      setFormData({
        nom: "",
        prenom: "",
        genre: "Homme",
        date_naissance: "",
        email: "",
        adresse: "",
        telephone: ""
      });
      fetchEmployees();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData(employee);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/employees/${id}`, {
          method: "DELETE",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Erreur lors de la suppression');
        fetchEmployees();
      } catch (error) {
        console.error("Erreur:", error);
        alert("Erreur lors de la suppression");
      }
    }
  };

  return (
    <div className="employees-container">
      <div className="employees-header">
        <h2>Gestion des Employés</h2>
        <button 
          className="add-employee-btn"
          onClick={() => {
            setSelectedEmployee(null);
            setFormData({
              nom: "",
              prenom: "",
              genre: "Homme",
              date_naissance: "",
              email: "",
              adresse: "",
              telephone: ""
            });
            setShowForm(true);
          }}
        >
          <FiPlus /> Ajouter un employé
        </button>
      </div>

      {showForm && (
        <div className="employee-form-container">
          <form onSubmit={handleSubmit} className="employee-form">
            <h3>{selectedEmployee ? "Modifier l'employé" : "Ajouter un employé"}</h3>
            
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Prénom</label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Genre</label>
              <div className="gender-selection">
                <label className={`gender-option ${formData.genre === 'Homme' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="genre"
                    value="Homme"
                    checked={formData.genre === 'Homme'}
                    onChange={handleInputChange}
                  />
                  <FiUser className="gender-icon" />
                  Homme
                </label>
                <label className={`gender-option ${formData.genre === 'Femme' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="genre"
                    value="Femme"
                    checked={formData.genre === 'Femme'}
                    onChange={handleInputChange}
                  />
                  <FiUserCheck className="gender-icon" />
                  Femme
                </label>
              </div>
            </div>

            <div className="form-group">
              <label>Date de naissance</label>
              <input
                type="date"
                name="date_naissance"
                value={formData.date_naissance}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Adresse</label>
              <input
                type="text"
                name="adresse"
                value={formData.adresse}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Téléphone</label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {selectedEmployee ? "Modifier" : "Ajouter"}
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => {
                  setShowForm(false);
                  setSelectedEmployee(null);
                }}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="employees-list">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Genre</th>
              <th>Date de naissance</th>
              <th>Email</th>
              <th>Adresse</th>
              <th>Téléphone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.nom}</td>
                <td>{employee.prenom}</td>
                <td>
                  {employee.genre === 'Homme' ? (
                    <FiUser className="gender-icon" />
                  ) : (
                    <FiUserCheck className="gender-icon" />
                  )}
                  {employee.genre}
                </td>
                <td>{new Date(employee.date_naissance).toLocaleDateString()}</td>
                <td>{employee.email}</td>
                <td>{employee.adresse}</td>
                <td>{employee.telephone}</td>
                <td className="actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(employee)}
                  >
                    <FiEdit2 />
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(employee.id)}
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Employees; 