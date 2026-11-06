import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import WalletPanel from '../../components/wallet/WalletPanel';
import StatusBadge from '../../components/ui/StatusBadge';
import { apiFetch } from '../../services/api';
import { formatINR } from '../../constants/finance';

const ACTIVE_ESCROW = ['HELD', 'SUBMITTED', 'DISPUTED'];

const ClientDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    apiFetch('/jobs/myjobs', token).then(setJobs).catch(() => {});
  }, [token]);

  const inEscrow = jobs
    .filter((j) => ACTIVE_ESCROW.includes(j.escrow?.status))
    .reduce((s, j) => s + j.escrow.amount, 0);
  const awaitingReview = jobs.filter((j) => j.escrow?.status === 'SUBMITTED').length;

  const stats = [
    { label: 'Posted Jobs', value: jobs.length },
    { label: 'Open Jobs', value: jobs.filter((j) => j.status === 'OPEN').length },
    { label: 'Held in Escrow', value: formatINR(inEscrow) },
  ];

  return (
    <DashboardLayout title={`Namaste, ${user?.name}`} subtitle="Post projects, fund escrow in ₹, and manage secure payments" wallet={wallet}>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map(({ label, value }) => (
              <div key={label} className="card card-hover p-4 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/60 to-transparent" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-semibold mt-1 tracking-tight">{value}</p>
              </div>
            ))}
          </div>

          {awaitingReview > 0 && (
            <button type="button" onClick={() => navigate('/escrow')} className="w-full card p-4 text-left border-sky-200 bg-sky-50 hover:bg-sky-100 dark:border-sky-800/60 dark:bg-sky-950/30 dark:hover:bg-sky-950/50 transition-colors">
              <p className="text-sm font-medium text-sky-800 dark:text-sky-300">
                {awaitingReview} submission{awaitingReview > 1 ? 's' : ''} waiting for your review →
              </p>
            </button>
          )}

          <div className="card p-6">
            <h2 className="text-sm font-medium mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => navigate('/jobs/create')} className="btn-primary h-11">Post a New Job</button>
              <button type="button" onClick={() => navigate('/jobs/my')} className="btn-secondary h-11">Manage My Jobs</button>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-sm font-medium mb-4">Recent Jobs</h2>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs posted yet. Add money to your wallet, then create your first project.</p>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.jobId} className="flex justify-between items-center gap-3 p-3 bg-muted rounded-md">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{job.title}</p>
                      <div className="flex gap-2 mt-1"><StatusBadge status={job.status} /></div>
                    </div>
                    <span className="text-sm font-semibold shrink-0">{formatINR(job.budget)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <WalletPanel onUpdate={setWallet} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
