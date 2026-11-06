import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';
import ClientDashboard from './dashboard/ClientDashboard';
import FreelancerDashboard from './dashboard/FreelancerDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === ROLES.FREELANCER) return <FreelancerDashboard />;
  return <ClientDashboard />;
};

export default Dashboard;
