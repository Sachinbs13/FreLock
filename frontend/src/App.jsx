import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ROLES } from './constants/roles';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import JobsMarketplace from './pages/JobsMarketplace';
import CreateJob from './pages/CreateJob';
import MyJobs from './pages/MyJobs';
import MyApplications from './pages/MyApplications';
import EscrowTransactions from './pages/EscrowTransactions';
import TransactionHistory from './pages/TransactionHistory';
import Messages from './pages/Messages';

const { ADMIN, CLIENT, FREELANCER } = ROLES;

const ROUTES = [
  { path: '/dashboard', element: <Dashboard />, roles: [CLIENT, FREELANCER] },
  { path: '/jobs', element: <JobsMarketplace />, roles: [FREELANCER] },
  { path: '/jobs/applied', element: <MyApplications />, roles: [FREELANCER] },
  { path: '/jobs/create', element: <CreateJob />, roles: [CLIENT] },
  { path: '/jobs/my', element: <MyJobs />, roles: [CLIENT] },
  { path: '/escrow', element: <EscrowTransactions />, roles: [CLIENT, FREELANCER] },
  { path: '/history', element: <TransactionHistory />, roles: [CLIENT, FREELANCER] },
  { path: '/messages', element: <Messages />, roles: [CLIENT, FREELANCER] },
  { path: '/admin', element: <AdminDashboard />, roles: [ADMIN] },
];

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {ROUTES.map(({ path, element, roles }) => (
              <Route key={path} path={path} element={<ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
