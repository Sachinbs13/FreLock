import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MessageSquare, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Alert from '../components/ui/Alert';
import StatusBadge from '../components/ui/StatusBadge';
import { apiFetch } from '../services/api';
import { formatINR } from '../constants/finance';

const MyApplications = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/jobs/applied', token)
      .then(setJobs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <DashboardLayout title="My Applications" subtitle="Jobs you applied to or were hired for">
      <Alert type="error" className="mb-4">{error}</Alert>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center text-muted-foreground text-sm">
          No applications yet.
          <button type="button" onClick={() => navigate('/jobs')} className="text-foreground underline ml-1">Browse jobs</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job.jobId} className="card p-5 flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-2">
                <h3 className="font-semibold">{job.title}</h3>
                <StatusBadge status={job.applicationStatus} />
              </div>
              <p className="text-xs text-muted-foreground mb-2">Client: {job.clientDetails?.name || '—'}</p>
              <p className="text-sm text-muted-foreground mb-3 flex-grow line-clamp-2">{job.description}</p>
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="font-semibold">{formatINR(job.budget)}</span>
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <Clock size={12} /> {new Date(job.deadline).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto items-center">
                <StatusBadge status={job.status} />
                {job.applicationStatus === 'ACCEPTED' && job.status === 'ASSIGNED' && (
                  <button type="button" onClick={() => navigate('/escrow')} className="btn-primary h-8 text-xs gap-1 px-3">
                    <Shield size={12} /> Go to Escrow
                  </button>
                )}
                <button type="button" onClick={() => navigate(`/messages?job=${job.jobId}&to=${job.posterId}`)} className="btn-secondary h-8 text-xs gap-1 ml-auto px-3">
                  <MessageSquare size={12} /> Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyApplications;
