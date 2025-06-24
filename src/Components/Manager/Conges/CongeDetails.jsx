import React, { useState } from 'react';
import { Modal, Button, Form, Input, Select, message, Typography, Space, Divider, Tag, Radio } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
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
        return <Tag icon={<ClockCircleOutlined />} color="processing">En attente</Tag>;
      case 'approved':
        return <Tag icon={<CheckCircleOutlined />} color="success">Approuvée</Tag>;
      case 'rejected':
        return <Tag icon={<CloseCircleOutlined />} color="error">Rejetée</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
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
      footer={[
        <Button key="close" onClick={onClose}>
          Fermer
        </Button>
      ]}
    >
      {conge && (
        <div style={{ padding: '0 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Title level={4}>Demande de congé - {conge.employe_prenom} {conge.employe_nom}</Title>
            {getStatusTag(conge.status)}
          </div>
          
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Type de congé:</Text>
            <Text>{conge.type_intitule}</Text>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Date de début:</Text>
            <Text>{formatDate(conge.date_debut)}</Text>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Date de fin:</Text>
            <Text>{formatDate(conge.date_fin)}</Text>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Nombre de jours:</Text>
            <Text>{conge.nombre_jours}</Text>
          </div>
          
          {conge.status !== 'pending' && conge.manager_validation && (
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Annulable:</Text>
              <Text>{conge.manager_validation.annulable ? 'Oui' : 'Non'}</Text>
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            {conge.status === 'pending' && !conge.manager_validation && (
              <div>
                <Divider orientation="left">Validation</Divider>
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
                  
                  <div style={{ textAlign: 'center', marginTop: '24px' }}>
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
              <div>
                <Divider orientation="left">Décision de validation</Divider>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Statut:</Text>
                  <Text>
                    {conge.status === 'approved' ? 'Approuvée' : 
                     conge.status === 'rejected' ? 'Rejetée' : 'En attente'}
                  </Text>
                </div>
                
                {conge.manager_validation && (
                  <>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                      <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Décision manager:</Text>
                      <Text>
                        {conge.manager_validation.is_approved ? 'Approuvée' : 'Rejetée'}
                      </Text>
                    </div>
                    
                    {!conge.manager_validation.is_approved && conge.manager_validation.justifier && (
                      <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Justification:</Text>
                        <Text>{conge.manager_validation.justifier || 'Aucune justification fournie'}</Text>
                      </div>
                    )}
                  </>
                )}
                
                {conge.hr_validation && (
                  <>
                    <div style={{ display: 'flex', marginBottom: '8px' }}>
                      <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Décision RH:</Text>
                      <Text>
                        {conge.hr_validation.is_approved ? 'Approuvée' : 'Rejetée'}
                      </Text>
                    </div>
                    
                    {!conge.hr_validation.is_approved && conge.hr_validation.justifier && (
                      <div style={{ display: 'flex', marginBottom: '8px' }}>
                        <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Justification RH:</Text>
                        <Text>{conge.hr_validation.justifier || 'Aucune justification fournie'}</Text>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default CongeDetails; 