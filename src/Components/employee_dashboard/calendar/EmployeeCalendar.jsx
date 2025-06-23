import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Card, 
  Badge, 
  Tooltip, 
  Modal, 
  Descriptions, 
  Tag, 
  Space,
  Typography,
  Button
} from 'antd';
import {
  EyeOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import './EmployeeCalendar.css';

const { Title, Text } = Typography;

const EmployeeCalendar = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(moment());

  // Predefined colors for tasks
  const taskColors = [
    '#f50',    // red
    '#108ee9', // blue
    '#87d068', // green
    '#722ed1', // purple
    '#faad14', // yellow
    '#13c2c2', // cyan
    '#eb2f96', // pink
    '#52c41a', // lime
    '#fa8c16', // orange
    '#2f54eb', // geekblue
  ];

  // Get employee_id from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const employe_id = userData.employe_id;

  useEffect(() => {
    fetchEmployeeTasks();
  }, []);

  const fetchEmployeeTasks = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/taches/employee/${employe_id}`);
      const tasksWithColors = response.data.map((task, index) => ({
        ...task,
        color: taskColors[index % taskColors.length]
      }));
      setTasks(tasksWithColors);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskDetails = async (taskId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/taches/${taskId}`);
      setTaskDetails(response.data);
    } catch (error) {
      console.error('Error fetching task details:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'gold',
      done: 'green',
      forwarded: 'blue',
      cancel: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En cours',
      done: 'Terminée',
      forwarded: 'Transmise',
      cancel: 'Annulée'
    };
    return labels[status] || status;
  };

  const getListData = (value) => {
    const currentDate = value.format('YYYY-MM-DD');
    return tasks.filter(task => {
      const startDate = moment(task.ddr).format('YYYY-MM-DD');
      const endDate = moment(task.dfr).format('YYYY-MM-DD');
      return moment(currentDate).isBetween(startDate, endDate, 'day', '[]');
    });
  };

  const handleDayClick = (date, tasks) => {
    setSelectedDate(date);
    setIsModalVisible(true);
  };

  const showTaskDetails = async (task) => {
    setSelectedTask(task);
    await fetchTaskDetails(task.id);
    setIsDetailsVisible(true);
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF':
        return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'DOCX':
      case 'DOC':
        return <FileWordOutlined style={{ color: '#1890ff' }} />;
      case 'JPEG':
      case 'JPG':
      case 'PNG':
      case 'GIF':
        return <FileImageOutlined style={{ color: '#52c41a' }} />;
      default:
        return <FileOutlined />;
    }
  };

  const handleFileView = (actionId) => {
    window.open(`http://localhost:5000/api/taches/actions/file/${actionId}`, '_blank');
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    
    if (listData.length === 0) return null;

    return (
      <div 
        className="date-cell"
        style={{
          background: listData.length === 1 
            ? `${listData[0].color}15`
            : 'linear-gradient(45deg, ' +
                listData.map((task, index) => 
                  `${task.color}15 ${(index * 100) / listData.length}%, ${task.color}15 ${((index + 1) * 100) / listData.length}%`
                ).join(', ') + ')',
          cursor: 'pointer'
        }}
        onClick={() => handleDayClick(value, listData)}
      >
        <ul className="events">
          {listData.map(task => (
            <li key={task.id}>
              <Badge
                color={task.color}
                text={
                  <span
                    className="task-title"
                    style={{ color: task.color }}
                  >
                    {task.intitule}
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const monthCellRender = (value) => {
    const listData = tasks.filter(task => {
      const taskMonth = moment(task.ddr).format('YYYY-MM');
      return value.format('YYYY-MM') === taskMonth;
    });

    if (listData.length === 0) {
      return null;
    }

    return (
      <div className="month-tasks">
        <span>{listData.length} tâches</span>
      </div>
    );
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => prev.clone().subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => prev.clone().add(1, 'month'));
  };

  // Custom header renderer for the calendar
  const headerRender = ({ value, type, onChange, onTypeChange }) => {
    const current = value.clone();
    const handleMonthChange = (diff) => {
      const newDate = current.clone().add(diff, 'months');
      onChange(newDate);
    };

    return (
      <div className="calendar-header">
        <Button 
          type="text"
          icon={<LeftOutlined />}
          onClick={() => handleMonthChange(-1)}
          className="month-nav-button"
        />
        <div className="current-month">
          {current.format('MMMM YYYY')}
        </div>
        <Button 
          type="text"
          icon={<RightOutlined />}
          onClick={() => handleMonthChange(1)}
          className="month-nav-button"
        />
      </div>
    );
  };

  return (
    <div className="calendar-wrapper">
      <Card className="calendar-container" loading={loading}>
        

        <Calendar 
          dateCellRender={dateCellRender} 
          monthCellRender={monthCellRender}
          headerRender={headerRender}
          mode="month"
        />

        {/* Day Tasks Modal */}
        <Modal
          title={`Tâches du ${selectedDate ? moment(selectedDate).format('DD/MM/YYYY') : ''}`}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={800}
        >
          {selectedDate && (
            <div className="day-tasks">
              {getListData(selectedDate).map(task => (
                <Card 
                  key={task.id}
                  className="task-card"
                  style={{ marginBottom: 16 }}
                  title={
                    <span style={{ color: task.color }}>
                      {task.intitule}
                    </span>
                  }
                  extra={
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => showTaskDetails(task)}
                    >
                      Voir les actions
                    </Button>
                  }
                >
                  <Descriptions column={1}>
                    <Descriptions.Item label="Description">
                      {task.description}
                    </Descriptions.Item>
                    <Descriptions.Item label="Période">
                      Du {moment(task.ddr).format('DD/MM/YYYY HH:mm')} au {moment(task.dfr).format('DD/MM/YYYY HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Statut">
                      <Tag color={getStatusColor(task.status)}>
                        {getStatusLabel(task.status)}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              ))}
            </div>
          )}
        </Modal>

        {/* Task Details Modal */}
        <Modal
          title="Détails de la tâche"
          open={isDetailsVisible}
          onCancel={() => setIsDetailsVisible(false)}
          footer={null}
          width={800}
        >
          {taskDetails && (
            <>
              <Title level={5} style={{ margin: '24px 0 16px' }}>Actions</Title>
              {taskDetails.assignments?.map((assignment) => (
                assignment.actions?.map((action, index) => (
                  <Card 
                    key={action.id} 
                    size="small" 
                    style={{ marginBottom: 16 }}
                    title={`Action ${index + 1}: ${action.intitule}`}
                  >
                    <p>{action.detail}</p>
                    {action.photo && (
                      <div style={{ marginTop: 8 }}>
                        <Button
                          type="link"
                          icon={getFileIcon(action.photo.split('.').pop().toUpperCase())}
                          onClick={() => handleFileView(action.id)}
                        >
                          Voir le fichier joint
                        </Button>
                      </div>
                    )}
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Ajoutée le {moment(action.date_creation).format('DD/MM/YYYY HH:mm')}
                    </Text>
                  </Card>
                ))
              ))}
            </>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default EmployeeCalendar; 