import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import WalletPanel from '../../components/wallet/WalletPanel';
import { apiFetch } from '../../services/api';
import { formatINR } from '../../constants/finance';

const FreelancerDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [escrows, setEscrows] = useState([]);

  useEffect(() => {
    apiFetch('/jobs', token).then(setJobs).catch(() => {});
    apiFetch('/escrow/my', token).then(setEscrows).catch(() => {});
  }, [token]);

  const activeWork = escrows.filter((e) => e.status === 'HELD').length;
  const earned = escrows.filter((e) => e.status === 'RELEASED').reduce((s, e) => s + e.amount, 0);

  const stats = [
    { label: 'Open Jobs', value: jobs.length },
    { label: 'Active Contracts', value: activeWork },
    { label: 'Total Earned', value: formatINR(earned) },
  ];

  return (
    <DashboardLayout title={`Welcome, ${user?.name}`} subtitle="Discover jobs, earn in ₹, and get paid securely through escrow" wallet={wallet}>
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

          {activeWork > 0 && (
            <button type="button" onClick={() => navigate('/escrow')} className="w-full card p-4 text-left border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 transition-colors">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                {activeWork} funded contract{activeWork > 1 ? 's' : ''} in progress — submit work when ready →
              </p>
            </button>
          )}

          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-medium">Latest Jobs</h2>
              <button type="button" onClick={() => navigate('/jobs')} className="text-sm text-muted-foreground hover:text-foreground">View all →</button>
            </div>
            {jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open jobs right now. Check back soon.</p>
            ) : (
              <div className="space-y-3">
                {jobs.slice(0, 4).map((job) => (
                  <div key={job.jobId} className="p-4 border border-border rounded-md">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{job.title}</p>
                        <p className="text-xs text-muted-foreground">by {job.clientName} · {job.privacyLevel}</p>
                      </div>
                      <span className="text-sm font-semibold shrink-0">{formatINR(job.budget)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                    <div className="flex gap-2 mt-3">
                      <button type="button" onClick={() => navigate('/jobs')} className="btn-primary h-8 text-xs px-3">View & Apply</button>
                      <button type="button" onClick={() => navigate(`/messages?job=${job.jobId}&to=${job.posterId}`)} className="btn-secondary h-8 text-xs px-3">Message Client</button>
                    </div>
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

export default FreelancerDashboard;
