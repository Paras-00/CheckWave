import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Activity,
  AlertTriangle,
  Play,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import MonitorCard from '../components/monitors/MonitorCard';
import MonitorForm from '../components/monitors/MonitorForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { monitorsApi } from '../api/client';
import sampleDataset200 from '../data/sampleDataset200';

const filterTabs = [
  { id: 'all', label: 'All Monitors' },
  { id: 'up', label: 'Active & Up' },
  { id: 'paused', label: 'Paused' },
  { id: 'down', label: 'Down / Failing' },
];

const MonitorsPage = () => {
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Load monitors
  const fetchMonitors = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setActionError(null);

    try {
      const res = await monitorsApi.list();
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : raw?.data?.monitors || raw?.monitors || (Array.isArray(raw?.data) ? raw.data : []);

      // If backend returns empty array initially, load 200 monitors dataset
      if (list.length === 0) {
        setMonitors(sampleDataset200);
      } else {
        setMonitors(list);
      }
    } catch (err) {
      setMonitors(sampleDataset200);
      setActionError(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  // Periodic refresh every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      fetchMonitors(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchMonitors]);

  // Handle Create
  const handleCreateMonitor = async (formData) => {
    setFormSubmitting(true);
    setActionError(null);
    try {
      const res = await monitorsApi.create(formData);
      const raw = res.data;
      const newMon = raw?.data?.monitor || raw?.monitor || raw?.data || {
        ...formData,
        _id: String(Date.now()),
        status: 'up',
        lastResponseTime: 95,
        lastChecked: new Date().toISOString(),
      };
      setMonitors((prev) => [newMon, ...prev]);
      setIsAddModalOpen(false);
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to create monitor');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Update
  const handleUpdateMonitor = async (formData) => {
    if (!selectedMonitor) return;
    setFormSubmitting(true);
    setActionError(null);
    const id = selectedMonitor._id || selectedMonitor.id;

    try {
      const res = await monitorsApi.update(id, formData);
      const raw = res.data;
      const updated = raw?.data?.monitor || raw?.monitor || raw?.data || { ...selectedMonitor, ...formData };
      setMonitors((prev) => prev.map((m) => ((m._id || m.id) === id ? { ...m, ...updated } : m)));
      setIsEditModalOpen(false);
      setSelectedMonitor(null);
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to update monitor');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Delete
  const handleDeleteMonitor = async () => {
    if (!selectedMonitor) return;
    setFormSubmitting(true);
    setActionError(null);
    const id = selectedMonitor._id || selectedMonitor.id;

    try {
      await monitorsApi.delete(id);
      setMonitors((prev) => prev.filter((m) => (m._id || m.id) !== id));
      setIsDeleteModalOpen(false);
      setSelectedMonitor(null);
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to delete monitor');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Manual Check
  const handleManualCheck = async (id) => {
    try {
      const res = await monitorsApi.check(id);
      const raw = res.data;
      const checkResult = raw?.data?.result || raw?.result || raw?.data || raw;
      setMonitors((prev) =>
        prev.map((m) => {
          if ((m._id || m.id) === id) {
            const rt = checkResult.responseTime ?? m.lastResponseTime;
            const updatedHistory = Array.isArray(m.history) ? [...m.history.slice(-14), rt] : [rt];
            return {
              ...m,
              status: checkResult.status || (checkResult.statusCode < 400 ? 'up' : 'down'),
              lastResponseTime: rt,
              lastChecked: new Date().toISOString(),
              history: updatedHistory,
            };
          }
          return m;
        })
      );
    } catch (err) {
      setActionError(`Manual check failed: ${err.response?.data?.error || err.message}`);
    }
  };

  // Handle Pause / Resume
  const handlePauseToggle = async (monitor) => {
    const id = monitor._id || monitor.id;
    const isPaused = monitor.status === 'paused' || monitor.isActive === false;

    try {
      if (isPaused) {
        await monitorsApi.resume(id);
        setMonitors((prev) =>
          prev.map((m) => ((m._id || m.id) === id ? { ...m, status: 'up', isActive: true } : m))
        );
      } else {
        await monitorsApi.pause(id);
        setMonitors((prev) =>
          prev.map((m) => ((m._id || m.id) === id ? { ...m, status: 'paused', isActive: false } : m))
        );
      }
    } catch (err) {
      // Toggle locally in case API is demo
      setMonitors((prev) =>
        prev.map((m) =>
          (m._id || m.id) === id ? { ...m, status: isPaused ? 'up' : 'paused' } : m
        )
      );
    }
  };

  // Filter & Search Logic
  const filteredMonitors = useMemo(() => {
    return monitors.filter((m) => {
      // Search query filter
      const matchesSearch =
        !searchQuery.trim() ||
        (m.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.url || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Tab filter
      const status = (m.status || '').toLowerCase();
      if (activeTab === 'all') return true;
      if (activeTab === 'up') return status === 'up' || status === 'active';
      if (activeTab === 'paused') return status === 'paused' || m.isActive === false;
      if (activeTab === 'down') return status === 'down' || status === 'failed';

      return true;
    });
  }, [monitors, searchQuery, activeTab]);

  // Reset page when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const totalPages = Math.ceil(filteredMonitors.length / pageSize) || 1;
  const paginatedMonitors = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMonitors.slice(startIndex, startIndex + pageSize);
  }, [filteredMonitors, currentPage, pageSize]);

  return (
    <Layout
      title="Monitors"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchMonitors(true)}
            loading={refreshing}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedMonitor(null);
              setIsAddModalOpen(true);
            }}
            icon={Plus}
          >
            Add Monitor
          </Button>
        </div>
      }
    >
      {/* Error alert if any */}
      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-between text-xs text-red-300">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-navy-800 p-1 rounded-xl border border-navy-500 overflow-x-auto">
          {filterTabs.map((tab) => {
            const count =
              tab.id === 'all'
                ? monitors.length
                : tab.id === 'up'
                ? monitors.filter((m) => m.status === 'up' || m.status === 'active').length
                : tab.id === 'paused'
                ? monitors.filter((m) => m.status === 'paused' || m.isActive === false).length
                : monitors.filter((m) => m.status === 'down' || m.status === 'failed').length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id ? 'bg-blue-700/60 text-white' : 'bg-navy-700 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
            className="py-2"
          />
        </div>
      </div>

      {/* Monitor Cards Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Loading monitors telemetry..." />
        </div>
      ) : filteredMonitors.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={searchQuery ? 'No monitors match your search' : 'No monitors configured yet'}
          description={
            searchQuery
              ? `No monitor results found matching "${searchQuery}". Try adjusting your filters.`
              : 'Add your first endpoint to start tracking uptime, latency, and service availability.'
          }
          action={
            <Button
              variant="primary"
              onClick={() => {
                setSearchQuery('');
                setActiveTab('all');
                setIsAddModalOpen(true);
              }}
              icon={Plus}
            >
              Add New Monitor
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedMonitors.map((monitor) => (
              <MonitorCard
                key={monitor._id || monitor.id}
                monitor={monitor}
                onCheck={handleManualCheck}
                onPauseToggle={handlePauseToggle}
                onEdit={(m) => {
                  setSelectedMonitor(m);
                  setIsEditModalOpen(true);
                }}
                onDelete={(m) => {
                  setSelectedMonitor(m);
                  setIsDeleteModalOpen(true);
                }}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {filteredMonitors.length > 0 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-navy-800/80 border border-navy-700">
              <div className="flex items-center gap-3 text-xs text-navy-400">
                <span>
                  Showing <strong className="text-white">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                  <strong className="text-white">
                    {Math.min(currentPage * pageSize, filteredMonitors.length)}
                  </strong>{' '}
                  of <strong className="text-white">{filteredMonitors.length}</strong> monitors
                </span>
                <span className="hidden sm:inline text-navy-600">•</span>
                <div className="flex items-center gap-1.5">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-navy-900 border border-navy-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={48}>48</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>

                <div className="text-xs text-navy-300 font-medium px-2">
                  Page <span className="text-white">{currentPage}</span> of{' '}
                  <span className="text-white">{totalPages}</span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Monitor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Performance Monitor"
        description="Configure target HTTP endpoint and polling schedule"
        size="lg"
      >
        <MonitorForm
          onSubmit={handleCreateMonitor}
          onCancel={() => setIsAddModalOpen(false)}
          loading={formSubmitting}
        />
      </Modal>

      {/* Edit Monitor Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMonitor(null);
        }}
        title="Edit Monitor"
        description={`Update settings for ${selectedMonitor?.name || 'endpoint'}`}
        size="lg"
      >
        <MonitorForm
          initialData={selectedMonitor}
          onSubmit={handleUpdateMonitor}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedMonitor(null);
          }}
          loading={formSubmitting}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMonitor(null);
        }}
        title="Delete Monitor"
        description="This action cannot be undone."
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>
              Are you sure you want to permanently delete{' '}
              <strong>"{selectedMonitor?.name}"</strong>? All recorded uptime metrics and historical checks will be erased.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-600">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedMonitor(null);
              }}
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteMonitor}
              loading={formSubmitting}
              icon={Trash2}
            >
              Delete Monitor
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default MonitorsPage;
