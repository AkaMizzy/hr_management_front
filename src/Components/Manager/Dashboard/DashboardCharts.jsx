import React, { useState, useEffect } from 'react';
import { Card, Select, Spin, Empty, Typography, Row, Col } from 'antd';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import moment from 'moment';
import 'moment/locale/fr';
import axios from 'axios';

const { Option } = Select;
const { Title } = Typography;

moment.locale('fr');

// Colors for charts
const COLORS = [
  '#1890ff', '#52c41a', '#fa8c16', '#f5222d', '#722ed1', 
  '#13c2c2', '#eb2f96', '#faad14', '#a0d911', '#fadb14'
];

const DashboardCharts = ({ leavesData = [], absencesData = [], attestationsData = [], expensesData = [] }) => {
  const [timeRange, setTimeRange] = useState('3');
  const [loading, setLoading] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);
  const [leaveTypeData, setLeaveTypeData] = useState([]);
  const [employeesByDepartment, setEmployeesByDepartment] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  
  useEffect(() => {
    prepareData();
    fetchEmployeesByDepartment();
  }, [leavesData, absencesData, attestationsData, expensesData, timeRange]);
  
  const fetchEmployeesByDepartment = async () => {
    setLoadingDepartments(true);
    try {
      // Get all employees
      const [employeesRes, entitiesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/employes'),
        axios.get('http://localhost:5000/api/entites')
      ]);
      
      const employees = employeesRes.data;
      const entities = entitiesRes.data;
      
      // Create a flat map of entity IDs to names
      const entityMap = {};
      const allDepartments = [];
      
      const flattenEntities = (entitiesList) => {
        entitiesList.forEach(entity => {
          entityMap[entity.id] = entity.tituler;
          allDepartments.push({
            id: entity.id,
            name: entity.tituler
          });
          if (entity.children && entity.children.length > 0) {
            flattenEntities(entity.children);
          }
        });
      };
      flattenEntities(entities);
      
      // Initialize all departments with zero employees
      const departmentCounts = {};
      allDepartments.forEach(dept => {
        departmentCounts[dept.name] = 0;
      });
      
      // Add "Non assigné" category
      departmentCounts['Non assigné'] = 0;
      
      // Count employees by department
      employees.forEach(employee => {
        if (employee.entite_id && entityMap[employee.entite_id]) {
          const departmentName = entityMap[employee.entite_id];
          departmentCounts[departmentName] = (departmentCounts[departmentName] || 0) + 1;
        } else {
          departmentCounts['Non assigné'] = (departmentCounts['Non assigné'] || 0) + 1;
        }
      });
      
      // Convert to array format for chart
      const departmentsData = Object.keys(departmentCounts).map(dept => ({
        name: dept,
        value: departmentCounts[dept]
      }));
      
      // Sort by count (descending)
      departmentsData.sort((a, b) => b.value - a.value);
      
      setEmployeesByDepartment(departmentsData);
    } catch (error) {
      console.error('Error fetching employees by department:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };
  
  const prepareData = () => {
    setLoading(true);
    
    try {
      // Prepare monthly trend data
      const months = parseInt(timeRange, 10);
      const monthlyTrends = prepareMonthlyTrends(months);
      setMonthlyData(monthlyTrends);
      
      // Prepare leave type distribution
      const leaveTypes = prepareLeaveTypeDistribution();
      setLeaveTypeData(leaveTypes);
    } catch (error) {
      console.error('Error preparing chart data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const prepareMonthlyTrends = (months) => {
    const now = new Date();
    const data = [];
    
    // Generate data for the last X months
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = moment(targetDate).format('MMM');
      const year = targetDate.getFullYear();
      
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      
      // Count requests for this month
      const leavesCount = countItemsInDateRange(leavesData, 'date_debut', monthStart, monthEnd);
      const absencesCount = countItemsInDateRange(absencesData, 'date', monthStart, monthEnd);
      const attestationsCount = countItemsInDateRange(attestationsData, 'date_demande', monthStart, monthEnd);
      const expensesCount = countItemsInDateRange(expensesData, 'date_frais', monthStart, monthEnd);
      
      data.push({
        name: `${monthName} ${year !== now.getFullYear() ? year : ''}`,
        conges: leavesCount,
        absences: absencesCount,
        attestations: attestationsCount,
        expenses: expensesCount,
        total: leavesCount + absencesCount + attestationsCount + expensesCount
      });
    }
    
    return data;
  };
  
  const prepareLeaveTypeDistribution = () => {
    // Count leaves by type
    const typeCount = {};
    
    leavesData.forEach(leave => {
      const typeName = leave.type_intitule || 'Non spécifié';
      typeCount[typeName] = (typeCount[typeName] || 0) + 1;
    });
    
    // Convert to array format for chart
    const result = Object.keys(typeCount).map(type => ({
      name: type,
      value: typeCount[type]
    }));
    
    return result;
  };
  
  const countItemsInDateRange = (items, dateField, startDate, endDate) => {
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    }).length;
  };
  
  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
  };
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return percent > 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };
  
  const renderNoData = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <Empty description="Aucune donnée disponible" />
    </div>
  );
  
  return (
    <div className="dashboard-charts">
      {/* Evolution des demandes */}
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Évolution des demandes</span>
            <Select 
              defaultValue="3"
              style={{ width: 150 }} 
              onChange={handleTimeRangeChange}
            >
              <Option value="3">3 derniers mois</Option>
              <Option value="6">6 derniers mois</Option>
              <Option value="12">12 derniers mois</Option>
            </Select>
          </div>
        } 
        style={{ marginBottom: 24 }}
      >
        {loading ? (
          <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin size="large" />
          </div>
        ) : monthlyData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
                dataKey="conges"
                stroke="#f5222d"
                name="Congés"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="absences"
                stroke="#722ed1"
                name="Absences"
              strokeWidth={2}
            />
            <Line
              type="monotone"
                dataKey="attestations"
                stroke="#13c2c2"
                name="Attestations"
              strokeWidth={2}
            />
            <Line
              type="monotone"
                dataKey="expenses"
                stroke="#fa8c16"
                name="Notes de frais"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
        ) : renderNoData()}
      </Card>

      {/* Distribution charts in two columns */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          {/* Types de congés */}
          <Card title="Répartition des types de congés" style={{ marginBottom: 24, height: '100%' }}>
            {loading ? (
              <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" />
              </div>
            ) : leaveTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leaveTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {leaveTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} demandes`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : renderNoData()}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          {/* Employees by Department */}
          <Card title="Nombre d'employés par département" style={{ marginBottom: 24, height: '100%' }}>
            {loadingDepartments ? (
              <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Spin size="large" />
              </div>
            ) : employeesByDepartment.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={employeesByDepartment.slice(0, 10)} // Limit to top 10 departments for readability
                  margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
                >
            <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={(props) => {
                      const { x, y, payload } = props;
                      // Limit department name length for display
                      let displayName = payload.value;
                      if (displayName.length > 20) {
                        displayName = displayName.substring(0, 17) + '...';
                      }
                      
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text
                            x={0}
                            y={0}
                            dy={8}
                            dx={10}
                            textAnchor="end"
                            fill="#666"
                            transform="rotate(-45)"
                            fontSize={12}
                          >
                            {displayName}
                          </text>
                        </g>
                      );
                    }}
                    height={90}
                    interval={0} // Force display all ticks
                  />
                  <YAxis 
                    type="number"
                    allowDecimals={false}
                    domain={[0, 'dataMax + 2']}
                  />
                  <Tooltip 
                    formatter={(value) => `${value} employés`}
                    labelFormatter={(label) => `Département: ${label}`}
                  />
                  <Bar 
                    dataKey="value" 
                    name="" 
                    label={{ 
                      position: 'top',
                      formatter: (value) => value > 0 ? value : '0'
                    }}
                  >
                    {
                      employeesByDepartment.slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))
                    }
                  </Bar>
          </BarChart>
        </ResponsiveContainer>
            ) : renderNoData()}
      </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardCharts; 