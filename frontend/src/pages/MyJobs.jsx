import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MessageSquare, UserCheck, Shield, Trash2, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import PinInput from '../components/ui/PinInput';
import StatusBadge from '../components/ui/StatusBadge';
import { apiFetch } from '../services/api';
import { formatINR } from '../constants/finance';

const ACTIVE_ESCROW = ['HELD', 'SUBMITTED', 'DISPUTED'];

const MyJobs = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fundJob, setFundJob] = useState(null);
  const [pin, setPin] = useState('');

  const fetchJobs = useCallback(async () => {
    try {
      setJobs(await apiFetch('/jobs/myjobs', token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const run = async (fn) => {
    setError('');
    setMessage('');
    try {
      const data = await fn();
      if (data?.message) setMessage(data.message);
      await fetchJobs();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const acceptApplicant = (jobId, freelancerId) =>
    run(() => apiFetch(`/jobs/${jobId}/accept`, token, { method: 'POST', body: { freelancerId } }));

  const handleDelete = (job) => {
    if (!window.confirm(`Delete "${job.title}"? ${formatINR(job.budget)} held in escrow will be refunded to your wallet.`)) return;
    run(() => apiFetch(`/jobs/${job.jobId}`, token, { method: 'DELETE' }));
  };

  const closeFund = () => {
    setFundJob(null);
    setPin('');
  };

  const fundEscrow = async (e) => {
    e.preventDefault();
    const done = await run(() => apiFetch('/escrow/fund', token, { method: 'POST', body: { jobId: fundJob.jobId, pin } }));
    if (done) closeFund();
  };

  return (
    <DashboardLayout
      title="My Posted Jobs"
      subtitle="Review applicants, track escrow, and manage assignments"
      actions={
        <button type="button" onClick={() => navigate('/jobs/create')} className="btn-primary h-9 gap-1 text-sm">
          <PlusCircle size={14} /> Post Job
        </button>
      }
    >
      <Alert type="success" className="mb-4" onClose={() => setMessage('')}>{message}</Alert>
      <Alert type="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center text-muted-foreground text-sm">No jobs posted yet.</div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const escrowActive = ACTIVE_ESCROW.includes(job.escrow?.status);
            return (
              <div key={job.jobId} className="card p-5">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-4">
                  <span className="font-semibold">{formatINR(job.budget)}</span>
                  <span className="text-muted-foreground flex items-center gap-1"><Clock size={12} />{new Date(job.deadline).toLocaleDateString('en-IN')}</span>
                  <span className="text-muted-foreground">{job.applicantDetails?.length || 0} applicant(s)</span>
                  {job.escrow && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield size={12} /> Escrow <StatusBadge status={job.escrow.status} />
                    </span>
                  )}
                </div>

                {job.freelancerDetails && (
                  <div className="bg-muted p-3 rounded-md mb-4 text-sm flex flex-wrap items-center justify-between gap-2">
                    <span><span className="font-medium">Hired: </span>{job.freelancerDetails.name} ({job.freelancerDetails.email})</span>
                    <button type="button" onClick={() => navigate(`/messages?job=${job.jobId}&to=${job.freelancerDetails.id}`)} className="btn-secondary h-8 text-xs gap-1 px-3">
                      <MessageSquare size={12} /> Message
                    </button>
                  </div>
                )}

                {job.status === 'OPEN' && job.applicantDetails?.length > 0 && (
                  <div className="border-t border-border pt-4 mb-4">
                    <p className="text-sm font-medium mb-3">Applicants</p>
                    <div className="space-y-2">
                      {job.applicantDetails.map((applicant) => (
                        <div key={applicant.id} className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted rounded-md">
                          <div>
                            <p className="text-sm font-medium">{applicant.name}</p>
                            <p className="text-xs text-muted-foreground">{applicant.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => navigate(`/messages?job=${job.jobId}&to=${applicant.id}`)} className="btn-secondary h-8 text-xs gap-1 px-3">
                              <MessageSquare size={12} /> Message
                            </button>
                            <button type="button" onClick={() => acceptApplicant(job.jobId, applicant.id)} className="btn-primary h-8 text-xs gap-1 px-3">
                              <UserCheck size={12} /> Hire
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {['OPEN', 'ASSIGNED'].includes(job.status) && !escrowActive && (
                    <button type="button" onClick={() => setFundJob(job)} className="btn-primary h-9 gap-1 text-xs">
                      <Shield size={14} /> Fund Escrow ({formatINR(job.budget)})
                    </button>
                  )}
                  {job.escrow?.status === 'HELD' && job.status === 'ASSIGNED' && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1 px-3 py-2 bg-muted rounded-md">
                      <Shield size={12} /> {formatINR(job.budget)} held — waiting for the freelancer to submit work
                    </span>
                  )}
                  {job.escrow?.status === 'SUBMITTED' && (
                    <button type="button" onClick={() => navigate('/escrow')} className="btn-primary h-9 gap-1 text-xs">
                      <Shield size={14} /> Review & Approve Work
                    </button>
                  )}
                  {job.escrow?.status === 'DISPUTED' && (
                    <span className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1 px-3 py-2 bg-red-50 dark:bg-red-950/40 rounded-md">Under admin review</span>
                  )}
                  {job.status === 'OPEN' && (
                    <button type="button" onClick={() => handleDelete(job)} className="btn-destructive h-9 gap-1 text-xs">
                      <Trash2 size={14} /> Delete & Refund
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={Boolean(fundJob)} onClose={closeFund} title={fundJob ? `Fund Escrow — ${fundJob.title}` : ''}>
        <form onSubmit={fundEscrow} className="space-y-4">
          <p className="text-sm text-muted-foreground">Move {formatINR(fundJob?.budget)} from your wallet into escrow. Enter your PIN to confirm.</p>
          <PinInput value={pin} onChange={setPin} autoFocus />
          <div className="flex gap-2">
            <button type="button" onClick={closeFund} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Confirm Transfer</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default MyJobs;
