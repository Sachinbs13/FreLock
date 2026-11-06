import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Key, ArrowRight, User } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import RoleSelector from '../components/auth/RoleSelector';
import { loginUser } from '../services/api';
import { LOGIN_ROLES, DEMO_CREDENTIALS, ROLES, getDashboardPath } from '../constants/roles';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.CLIENT);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, sessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fillDemo = (cred) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setRole(cred.role);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await loginUser({ email, password, role });
      login(data.user, data.token);
      // Return to the page that required login, if it belongs to this role's area
      const from = location.state?.from;
      const home = getDashboardPath(data.user.role);
      const allowed = from && (data.user.role === 'Admin' ? from.startsWith('/admin') : !from.startsWith('/admin'));
      navigate(allowed ? from : home, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with your role to access the right dashboard"
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-foreground font-medium hover:underline">
            Create account
          </Link>
        </>
      }
    >
      <div className="card p-6 sm:p-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {!error && sessionMessage && (
            <div className="bg-muted border border-border px-4 py-3 rounded-md text-sm">{sessionMessage}</div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <RoleSelector roles={LOGIN_ROLES} value={role} onChange={setRole} />

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full h-11 gap-2">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                Sign in
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Demo accounts</p>
          <div className="space-y-2">
            {DEMO_CREDENTIALS.map((cred) => (
              <button
                key={cred.role}
                type="button"
                onClick={() => fillDemo(cred)}
                className="w-full flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{cred.role}</span>
                </div>
                <span className="text-xs text-muted-foreground">{cred.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
