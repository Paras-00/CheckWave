import React, { useState } from 'react';
import {
  User,
  Lock,
  Bell,
  Database,
  AlertTriangle,
  Server,
  CheckCircle2,
  Trash2,
  Save,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Danger zone modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);

    if (newPassword) {
      if (newPassword.length < 6) {
        setProfileError('New password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileError('New passwords do not match');
        return;
      }
    }

    setProfileSaving(true);
    setTimeout(() => {
      updateUser({ name });
      setProfileSaving(false);
      setProfileSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setProfileSuccess(false), 4000);
    }, 600);
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation !== 'DELETE') return;
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      logout();
    }, 800);
  };

  return (
    <Layout title="System Settings">
      <div className="space-y-8 max-w-4xl">
        {/* Section 1: User Profile & Security */}
        <div className="card">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-navy-500">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Profile & Security</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage your identity and authentication credentials</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Profile settings saved successfully.</span>
            </div>
          )}

          {profileError && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
              />

              <Input
                label="Email Address"
                value={user?.email || 'user@checkwave.io'}
                disabled
                helperText="Email cannot be changed directly."
              />
            </div>

            <div className="pt-4 border-t border-navy-600">
              <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-3">
                Change Password (Optional)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={Lock}
                />
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={Lock}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={Lock}
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" variant="primary" loading={profileSaving} icon={Save}>
                Save Profile
              </Button>
            </div>
          </form>
        </div>

        {/* Section 2: Notification Preferences */}
        <div className="card">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-navy-500">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Alert Notification Channels</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure alerting channels when endpoints go down</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-navy-800/80 border border-navy-500/70">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-slate-200">Email Alerts</h4>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Send immediate notifications when down thresholds are reached.
                </p>
              </div>
              <input
                type="checkbox"
                disabled
                className="w-5 h-5 rounded bg-navy-700 border-navy-500 cursor-not-allowed opacity-50"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-navy-800/80 border border-navy-500/70">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-slate-200">Slack & Discord Webhook Integrations</h4>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Deliver formatted operational alerts directly to your incident triage channels.
                </p>
              </div>
              <input
                type="checkbox"
                disabled
                className="w-5 h-5 rounded bg-navy-700 border-navy-500 cursor-not-allowed opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Data Retention */}
        <div className="card">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-navy-500">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Telemetry & Data Retention</h3>
              <p className="text-xs text-slate-400 mt-0.5">Policy governance for logs and latency timeseries</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-navy-800/60 border border-navy-500/60 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Active Retention Horizon</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Probes and response time logs are archived for <strong>90 days</strong> before rolling aggregation.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-lg bg-navy-700 text-emerald-400 border border-emerald-500/30">
              90 Days Policy
            </span>
          </div>
        </div>

        {/* Section 4: API & Backend Information */}
        <div className="card">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-navy-500">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Backend API Configuration</h3>
              <p className="text-xs text-slate-400 mt-0.5">Environment information and API connection endpoint</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-navy-800 border border-navy-500 font-mono text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">VITE_API_URL:</span>
              <span className="text-blue-400 font-semibold">{apiUrl}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-navy-800 border border-navy-500">
              <span className="text-slate-400">Application Status:</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Vite + React 18 Production Build
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: Danger Zone */}
        <div className="card border-red-500/40 bg-red-500/5">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-red-500/20">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-300">Danger Zone</h3>
              <p className="text-xs text-slate-400 mt-0.5">Irreversible actions that affect your monitoring tenant</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-navy-900/60 border border-red-500/20">
            <div>
              <h4 className="text-sm font-semibold text-slate-200">Delete Account & Data</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Permanently purge your account, all configured monitors, and incident archives.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              icon={Trash2}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Permanently Delete Account"
        description="This action cannot be undone."
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Please type <strong className="text-red-400 font-mono">DELETE</strong> below to confirm deletion of your CheckWave monitoring account:
          </p>

          <Input
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="font-mono text-center tracking-widest uppercase"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-navy-600">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirmation !== 'DELETE'}
              loading={isDeleting}
              onClick={handleDeleteAccount}
            >
              Confirm Account Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default SettingsPage;
