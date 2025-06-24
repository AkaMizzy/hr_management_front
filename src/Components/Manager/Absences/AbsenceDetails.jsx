import React, { useState } from 'react';
import { Modal, Button, Form, Input, DatePicker, Select, message, Typography, Space, Divider, Tag, Radio } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AbsenceDetails = ({ visible, absence, onClose, onValidate, refreshData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null);

  const handleValidate = async (status) => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const response = await axios.put(`http://localhost:5000/absences/${absence.id}/validate`, {
        status: status,
        managerComment: values.managerComment || '',
        annulable: values.annulable
      });
      
      if (response.status === 200) {
        message.success(`Absence request ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
        setValidationStatus(status);
        refreshData();
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error validating absence request:', error);
      message.error('Failed to validate absence request');
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
        return <Tag icon={<CloseCircleOutlined />} color="error">Refusée</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getAnnulableTag = (annulable) => {
    return annulable ? 
      <Tag color="success">Annulable</Tag> : 
      <Tag color="error">Non-annulable</Tag>;
  };

  const formatDate = (dateString) => {
    return moment(dateString).format('DD/MM/YYYY');
  };

  return (
    <Modal
      title="Détails de la demande d'absence"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>
          Fermer
        </Button>
      ]}
    >
      {absence && (
        <div style={{ padding: '0 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <Title level={4}>Demande d'absence - {absence.employee?.firstName} {absence.employee?.lastName}</Title>
            {getStatusTag(absence.status)}
          </div>
          
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Département:</Text>
            <Text>{absence.employee?.department}</Text>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Type:</Text>
            <Text>{absence.type}</Text>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Date de début:</Text>
            <Text>{formatDate(absence.startDate)}</Text>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Date de fin:</Text>
            <Text>{formatDate(absence.endDate)}</Text>
          </div>
          
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Durée:</Text>
            <Text>{absence.duration} jours</Text>
          </div>
          
          {absence.reason && (
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Motif:</Text>
              <Text>{absence.reason}</Text>
            </div>
          )}
          
          <div style={{ display: 'flex', marginBottom: '8px' }}>
            <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Soumise le:</Text>
            <Text>{formatDate(absence.createdAt)}</Text>
          </div>
          
          {absence.status !== 'pending' && absence.annulable !== undefined && (
            <div style={{ display: 'flex', marginBottom: '8px' }}>
              <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Annulable:</Text>
              <Text>{absence.annulable ? 'Oui' : 'Non'}</Text>
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            {absence.status === 'pending' && (
              <div>
                <Divider orientation="left">Validation</Divider>
                <Form form={form} layout="vertical" initialValues={{ annulable: false }}>
                  <Form.Item
                    name="managerComment"
                    label="Commentaires"
                  >
                    <TextArea rows={4} placeholder="Ajoutez vos commentaires concernant cette demande d'absence" />
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

            {absence.status !== 'pending' && (
              <div>
                <Divider orientation="left">Décision de validation</Divider>
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Statut:</Text>
                  <Text>{absence.status === 'approved' ? 'Approuvée' : 'Refusée'}</Text>
                </div>
                
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Validée le:</Text>
                  <Text>{formatDate(absence.updatedAt)}</Text>
                </div>
                
                {absence.managerComment && (
                  <div style={{ display: 'flex', marginBottom: '8px' }}>
                    <Text strong style={{ minWidth: '130px', marginRight: '12px' }}>Commentaires:</Text>
                    <Text>{absence.managerComment}</Text>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AbsenceDetails; 