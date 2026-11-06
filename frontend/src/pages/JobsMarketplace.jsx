import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, MessageSquare, Send, Clock, Lock, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import Alert from '../components/ui/Alert';
import { apiFetch } from '../services/api';
import { formatINR } from '../constants/finance';

const JobsMarketplace = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showWishlist = searchParams.get('tab') === 'wishlist';
  const [jobs, setJobs] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState({ type: 'info', text: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, wishlist] = await Promise.all([
        apiFetch(showWishlist ? '/jobs/wishlist' : '/jobs', token),
        apiFetch('/jobs/wishlist', token),
      ]);
      setJobs(list);
      setWishlistIds(new Set(wishlist.map((j) => j.jobId)));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, [token, showWishlist]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => `${j.title} ${j.description} ${j.clientName}`.toLowerCase().includes(q));
  }, [jobs, query]);

  const toggleWishlist = async (jobId) => {
    try {
      const data = await apiFetch('/jobs/wishlist', token, { method: 'POST', body: { jobId } });
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (data.wishlisted) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      if (showWishlist && !data.wishlisted) setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const applyJob = async (jobId) => {
    try {
      const data = await apiFetch(`/jobs/${jobId}/apply`, token, { method: 'POST' });
      setMessage({ type: 'success', text: data.message });
      setJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <DashboardLayout
      title={showWishlist ? 'My Wishlist' : 'Find Jobs'}
      subtitle={showWishlist ? 'Jobs you saved for later' : 'Applied jobs move to My Applications'}
    >
      <Alert type={message.type} className="mb-4" onClose={() => setMessage({ type: 'info', text: '' })}>
        {message.text}
        {message.type === 'success' && (
          <button type="button" onClick={() => navigate('/jobs/applied')} className="ml-2 underline font-medium">View applications</button>
        )}
      </Alert>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input className="input-field pl-10" placeholder="Search by title, description or client" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading jobs...</p>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center text-muted-foreground text-sm">
          {query ? 'No jobs match your search.' : showWishlist ? 'No wishlisted jobs.' : 'No open jobs right now. Check My Applications for jobs you applied to.'}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {visible.map((job) => (
            <div key={job.jobId} className="card card-hover p-5 flex flex-col">
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="min-w-0">
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-xs text-muted-foreground">by {job.clientName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleWishlist(job.jobId)}
                  className="p-2 hover:bg-muted rounded-md"
                  aria-label={wishlistIds.has(job.jobId) ? 'Remove from wishlist' : 'Add to wishlist'}
                  aria-pressed={wishlistIds.has(job.jobId)}
                >
                  <Heart size={18} className={wishlistIds.has(job.jobId) ? 'fill-primary text-primary' : 'text-muted-foreground'} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="badge badge-default">{formatINR(job.budget)}</span>
                {job.reward && <span className="badge badge-secondary">+ {job.reward}</span>}
                <span className="badge badge-outline gap-1"><Lock size={10} /> {job.privacyLevel}</span>
              </div>

              <p className="text-sm text-muted-foreground mb-3 flex-grow line-clamp-3">{job.description}</p>

              <div className="flex items-center text-xs text-muted-foreground gap-1 mb-4">
                <Clock size={12} /> Deadline: {new Date(job.deadline).toLocaleDateString('en-IN')}
              </div>

              <div className="flex gap-2 mt-auto">
                <button type="button" onClick={() => applyJob(job.jobId)} className="btn-primary flex-1 h-9 gap-1 text-xs">
                  <Send size={14} /> Apply
                </button>
                <button type="button" onClick={() => navigate(`/messages?job=${job.jobId}&to=${job.posterId}`)} className="btn-secondary flex-1 h-9 gap-1 text-xs">
                  <MessageSquare size={14} /> Ask Client
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default JobsMarketplace;
