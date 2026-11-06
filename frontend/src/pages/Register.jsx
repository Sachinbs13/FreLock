import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Key, User, ArrowRight } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';
import RoleSelector from '../components/auth/RoleSelector';
import { registerUser } from '../services/api';
import { REGISTER_ROLES, ROLES, getDashboardPath } from '../constants/roles';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(ROLES.CLIENT);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const data = await registerUser({ email, password, role, name });
      login(data.user, data.token);
      navigate(getDashboardPath(data.user.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Register as a client or freelancer to get started"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-foreground font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="card p-6 sm:p-8">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <RoleSelector roles={REGISTER_ROLES} value={role} onChange={setRole} />

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">Full name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="name"
                type="text"
                maxLength={80}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field pl-10"
                placeholder="Your name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Min 6 chars"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">Confirm</label>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Repeat password"
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full h-11 gap-2">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                Create account
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Register;
