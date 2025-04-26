import React from 'react';
import { Card } from 'antd';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Données statiques pour l'évolution des employés et documents
const employeeData = [
  { name: 'Jan', employees: 20, documents: 15, conges: 5 },
  { name: 'Fév', employees: 22, documents: 18, conges: 7 },
  { name: 'Mar', employees: 25, documents: 22, conges: 6 },
  { name: 'Avr', employees: 28, documents: 25, conges: 8 },
  { name: 'Mai', employees: 30, documents: 28, conges: 10 },
  { name: 'Jun', employees: 32, documents: 30, conges: 12 },
];

// Données statiques pour la répartition des congés
const leaveData = [
  { name: 'Congés payés', value: 45 },
  { name: 'Maladie', value: 25 },
  { name: 'RTT', value: 15 },
  { name: 'Autres', value: 15 },
];

const DashboardCharts = () => {
  return (
    <div className="dashboard-charts">
      <Card title="Évolution sur 6 mois" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={employeeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="employees"
              stroke="#8bc34a"
              name="Employés"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="documents"
              stroke="#2196f3"
              name="Documents"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="conges"
              stroke="#ff9800"
              name="Congés"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Répartition des congés" style={{ marginBottom: 24 }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={leaveData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8bc34a" name="Pourcentage" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default DashboardCharts; 