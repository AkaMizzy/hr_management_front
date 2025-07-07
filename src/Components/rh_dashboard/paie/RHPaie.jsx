import React, { useState } from 'react';
import { Tabs, Typography, Card } from 'antd';
import RubriquesManagement from './RubriquesManagement';
import EmployeRubriquesManagement from './EmployeRubriquesManagement';
import './RHPaie.css';

const { Title } = Typography;
const { TabPane } = Tabs;

const PayrollManagement = () => {
  const [activeTab, setActiveTab] = useState('1');

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  return (
    <div className="payroll-management">
      <Title level={3}>Gestion de la Paie</Title>
      
      <Card className="payroll-card">
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          type="card"
          size="large"
        >
          <TabPane tab="Rubriques" key="1">
            <RubriquesManagement />
          </TabPane>
          <TabPane tab="Rubriques par Employé" key="2">
            <EmployeRubriquesManagement />
          </TabPane>
          <TabPane tab="Coming soon..." key="3">
            <div style={{ padding: '20px 0' }}>
              <p>Fonctionnalité à venir : Gestion des paie</p>
            </div>
          </TabPane>
          <TabPane tab="à venir..." key="4">
            <div style={{ padding: '20px 0' }}>
              <p>Fonctionnalité à venir : Paie details</p>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default PayrollManagement; 