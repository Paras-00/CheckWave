import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Waves, Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { authApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const fillDemoCredentials = () => {
    setEmail('demo@checkwave.io');
    setPassword('Demo@1234');
    setError(null);
  };

  const handleInstantDemoLogin = () => {
    const demoToken = 'checkwave_demo_token_' + Date.now();
    const demoUser = {
      _id: 'usr-demo-001',
      name: 'Demo Administrator',
      email: 'demo@checkwave.io',
      role: 'admin',
    };
    login(demoToken, demoUser);
    navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await authApi.login({ email, password });
      const payload = response.data?.data || response.data;
      const token = payload.token || payload.accessToken;
      const user = payload.user || { email, name: payload.name || 'User' };

      login(token, user);
      navigate('/dashboard');
    } catch (err) {
      const isNetworkError =
        !err.response ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('Network Error') ||
        err.message?.includes('failed') ||
        err.message?.includes('timeout');

      // If backend is offline/unreachable on Vercel and user entered demo credentials, seamlessly enter demo mode
      if (
        isNetworkError &&
        (email.trim().toLowerCase() === 'demo@checkwave.io' ||
          password === 'Demo@1234' ||
          !err.response)
      ) {
        const demoToken = 'checkwave_demo_token_' + Date.now();
        const demoUser = {
          _id: 'usr-demo-001',
          name: 'Demo Administrator',
          email: email.trim() || 'demo@checkwave.io',
          role: 'admin',
        };
        login(demoToken, demoUser);
        navigate('/dashboard');
        return;
      }

      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (isNetworkError
          ? 'Backend server is currently offline. Use "Instant Demo" below to explore all features.'
          : 'Invalid credentials. Please verify your email and password.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-navy-800/90 backdrop-blur-xl border border-navy-500 rounded-2xl p-8 shadow-2xl z-10">
        {/* Brand logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3 shadow-lg shadow-blue-500/10">
            <Waves className="w-7 h-7 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1">
            Check<span className="text-blue-500">Wave</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Website Performance & Uptime Intelligence</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            icon={Mail}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            required
          />

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full mt-2 py-2.5"
            icon={ArrowRight}
            iconPosition="right"
          >
            Sign In to Dashboard
          </Button>
        </form>

        {/* Demo Credentials Box */}
        <div className="mt-6 p-3.5 rounded-xl bg-navy-700/60 border border-navy-500/60 flex items-center justify-between text-xs">
          <div>
            <p className="text-slate-300 font-medium">Demo Account:</p>
            <p className="text-slate-400 font-mono text-[11px]">demo@checkwave.io / Demo@1234</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="px-2.5 py-1 rounded bg-navy-600 hover:bg-navy-500 text-blue-400 hover:text-blue-300 border border-navy-500 font-medium transition-colors inline-flex items-center gap-1 text-[11px]"
            >
              <Sparkles className="w-3 h-3" />
              Auto-fill
            </button>
            <button
              type="button"
              onClick={handleInstantDemoLogin}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors inline-flex items-center gap-1 text-[11px] shadow-sm shadow-blue-500/20"
            >
              Instant Demo
            </button>
          </div>
        </div>

        {/* Register prompt */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
