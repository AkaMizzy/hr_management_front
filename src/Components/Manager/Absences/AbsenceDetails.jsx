import React, { useState } from 'react';
import { Modal, Button, Form, Input, DatePicker, Select, message, Typography, Space, Divider, Tag, Radio } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Form;
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
        return <Tag color="orange">Pending</Tag>;
      case 'approved':
        return <Tag color="green">Approved</Tag>;
      case 'rejected':
        return <Tag color="red">Rejected</Tag>;
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
      title="Absence Request Details"
      open={visible}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      {absence && (
        <div className="absence-details">
          <div className="absence-header">
            <Title level={4}>Absence Request #{absence.id}</Title>
            {getStatusTag(absence.status)}
          </div>
          
          <div className="absence-info">
            <div className="info-item">
              <strong>Employee:</strong> {absence.employee?.firstName} {absence.employee?.lastName}
            </div>
            <div className="info-item">
              <strong>Department:</strong> {absence.employee?.department}
            </div>
            <div className="info-item">
              <strong>Type:</strong> {absence.type}
            </div>
            <div className="info-item">
              <strong>Start Date:</strong> {formatDate(absence.startDate)}
            </div>
            <div className="info-item">
              <strong>End Date:</strong> {formatDate(absence.endDate)}
            </div>
            <div className="info-item">
              <strong>Duration:</strong> {absence.duration} days
            </div>
            {absence.reason && (
              <div className="info-item">
                <strong>Reason:</strong> {absence.reason}
              </div>
            )}
            <div className="info-item">
              <strong>Submitted on:</strong> {formatDate(absence.createdAt)}
            </div>
            {absence.status !== 'pending' && absence.annulable !== undefined && (
              <div className="info-item">
                <strong>Annulable:</strong> {getAnnulableTag(absence.annulable)}
              </div>
            )}
          </div>

          {absence.status === 'pending' && (
            <div className="validation-section">
              <Title level={5}>Validation</Title>
              <Form form={form} layout="vertical" initialValues={{ annulable: false }}>
                <Form.Item
                  name="managerComment"
                  label="Comments"
                >
                  <TextArea rows={4} placeholder="Add your comments about this absence request" />
                </Form.Item>
                
                <Form.Item
                  name="annulable"
                  label="Allow employee to cancel this request after approval"
                  valuePropName="checked"
                >
                  <Radio.Group>
                    <Radio value={true}>Yes</Radio>
                    <Radio value={false}>No</Radio>
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
                      Reject
                    </Button>
                    <Button 
                      type="primary" 
                      onClick={() => handleValidate('approved')} 
                      icon={<CheckCircleOutlined />}
                      loading={loading && validationStatus === 'approved'}
                    >
                      Approve
                    </Button>
                  </Space>
                </div>
              </Form>
            </div>
          )}

          {absence.status !== 'pending' && (
            <div className="validation-info">
              <div className="info-item">
                <strong>Status:</strong> {getStatusTag(absence.status)}
              </div>
              <div className="info-item">
                <strong>Validated on:</strong> {formatDate(absence.updatedAt)}
              </div>
              {absence.managerComment && (
                <div className="info-item">
                  <strong>Manager Comments:</strong> {absence.managerComment}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default AbsenceDetails; 