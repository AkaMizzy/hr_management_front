import React, { useState } from 'react';
import { Modal, Button, Form, Input, Select, message, Typography, Space, Divider, Tag, Radio } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CongeDetails = ({ visible, conge, onClose, refreshData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null);

  const handleValidate = async (status) => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Ensure annulable is a boolean value
      const isAnnulable = values.annulable === true;
      
      const response = await axios.post(`http://localhost:5000/api/conges/${conge.id}/validate/manager`, {
        is_approved: status === 'approved',
        justifier: values.managerComment || '',
        manager_id: JSON.parse(localStorage.getItem('userData') || '{}').employe_id,
        annulable: isAnnulable
      });
      
      if (response.status === 200) {
        message.success(`Demande de congé ${status === 'approved' ? 'approuvée' : 'rejetée'} avec succès`);
        setValidationStatus(status);
        refreshData();
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error validating leave request:', error);
      message.error('Erreur lors de la validation de la demande');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'pending':
        return <Tag color="orange">En attente</Tag>;
      case 'approved':
        return <Tag color="green">Approuvée</Tag>;
      case 'rejected':
        return <Tag color="red">Rejetée</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getAnnulableTag = (annulable) => {
    return annulable ? 
      <Tag color="green">Annulable</Tag> : 
      <Tag color="red">Non-annulable</Tag>;
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
  };

  return (
    <Modal
      title="Détails de la demande de congé"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      {conge && (
        <div className="conge-details">
          <div className="conge-header">
            <Title level={4}>Demande de congé #{conge.id}</Title>
            {getStatusTag(conge.status)}
          </div>
          
          <div className="conge-info">
            <div className="info-item">
              <Text strong>Employé:</Text>
              <Text>{conge.employe_prenom} {conge.employe_nom}</Text>
            </div>
            <div className="info-item">
              <Text strong>Date de début:</Text>
              <Text>{formatDate(conge.date_debut)}</Text>
            </div>
            <div className="info-item">
              <Text strong>Date de fin:</Text>
              <Text>{formatDate(conge.date_fin)}</Text>
            </div>
            <div className="info-item">
              <Text strong>Nombre de jours:</Text>
              <Text>{conge.nombre_jours}</Text>
            </div>
            {conge.status !== 'pending' && conge.manager_validation && (
              <div className="info-item">
                <Text strong>Annulable:</Text>
                {getAnnulableTag(conge.manager_validation.annulable)}
              </div>
            )}
          </div>

          {conge.status === 'pending' && !conge.manager_validation && (
            <div className="validation-section">
              <Title level={5}>Validation</Title>
              <Form form={form} layout="vertical" initialValues={{ annulable: false }}>
                <Form.Item
                  name="managerComment"
                  label="Commentaires"
                >
                  <TextArea rows={4} placeholder="Ajoutez vos commentaires concernant cette demande de congé" />
                </Form.Item>
                
                <Form.Item
                  name="annulable"
                  label="Permettre à l'employé d'annuler cette demande après approbation"
                >
                  <Radio.Group>
                    <Radio value={true}>Oui</Radio>
                    <Radio value={false}>Non</Radio>
                  </Radio.Group>
                </Form.Item>
                
                <div className="validation-actions">
                  <Space>
                    <Button 
                      onClick={() => handleValidate('rejected')} 
                      icon={<CloseCircleOutlined />} 
                      danger
                      loading={loading && validationStatus === 'rejected'}
                    >
                      Rejeter
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={() => handleValidate('approved')} 
                      icon={<CheckCircleOutlined />}
                      loading={loading && validationStatus === 'approved'}
                    >
                      Approuver
                    </Button>
                  </Space>
                </div>
              </Form>
            </div>
          )}

          {(conge.status !== 'pending' || conge.manager_validation) && (
            <div className="validation-info">
              <Title level={5}>Informations de validation</Title>
              <div className="info-item">
                <Text strong>Statut:</Text>
                {getStatusTag(conge.status)}
              </div>
              
              {conge.manager_validation && (
                <>
                  {!conge.manager_validation.is_approved && conge.manager_validation.justifier && (
                    <div className="info-item">
                      <Text strong>Justification du rejet:</Text>
                      <Text>{conge.manager_validation.justifier}</Text>
                    </div>
                  )}
                  <div className="info-item">
                    <Text strong>Décision manager:</Text>
                    {conge.manager_validation.is_approved ? (
                      <Tag color="success">Approuvée</Tag>
                    ) : (
                      <Tag color="error">Rejetée</Tag>
                    )}
                  </div>
                </>
              )}
              
              {conge.hr_validation && (
                <>
                  <div className="info-item">
                    <Text strong>Décision RH:</Text>
                    {conge.hr_validation.is_approved ? (
                      <Tag color="success">Approuvée</Tag>
                    ) : (
                      <Tag color="error">Rejetée</Tag>
                    )}
                  </div>
                  {!conge.hr_validation.is_approved && conge.hr_validation.justifier && (
                    <div className="info-item">
                      <Text strong>Justification RH:</Text>
                      <Text>{conge.hr_validation.justifier}</Text>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <Button onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CongeDetails; 