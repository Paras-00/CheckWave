import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart2,
  Zap,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Search,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import StatCard from '../components/common/StatCard';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ResponseTimeChart from '../components/charts/ResponseTimeChart';
import ErrorRateChart from '../components/charts/ErrorRateChart';
import UptimeChart from '../components/charts/UptimeChart';
import { metricsApi, monitorsApi } from '../api/client';

const AnalyticsPage = () => {
  const [monitors, setMonitors] = useState([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [slowestList, setSlowestList] = useState([]);
  const [endpointSearch, setEndpointSearch] = useState('');

  // Fetch monitors for dropdown
  useEffect(() => {
    const loadMonitors = async () => {
      try {
        const res = await monitorsApi.list();
        const list = Array.isArray(res.data)
          ? res.data
          : res.data?.monitors || [];
        setMonitors(list);
      } catch {
        // Fallback placeholder monitors
        setMonitors([
          { _id: 'mon-1', name: 'CheckWave App' },
          { _id: 'mon-2', name: 'API Gateway' },
          { _id: 'mon-3', name: 'Auth Service' },
        ]);
      }
    };
    loadMonitors();
  }, []);

  // Fetch metrics analytics
  const fetchAnalytics = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = {
        range: timeRange,
        ...(selectedMonitorId !== 'all' ? { monitorId: selectedMonitorId } : {}),
      };

      const [analyticsRes, slowestRes] = await Promise.allSettled([
        metricsApi.analytics(params),
        metricsApi.slowest({ range: timeRange, limit: 10 }),
      ]);

      if (analyticsRes.status === 'fulfilled' && analyticsRes.value?.data) {
        const raw = analyticsRes.value.data;
        const payload = raw.data || raw;
        setAnalyticsData(payload);
      } else {
        // Demo seed analytics data
        const sampleDays = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 24;
        const timeline = Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600 * 1000).toISOString(),
          responseTime: Math.floor(95 + Math.sin(i / 3) * 30 + Math.random() * 20),
          errorRate: i % 8 === 0 ? 1.5 : 0.05,
        }));

        const uptimeHistory = Array.from({ length: Math.min(sampleDays, 14) }, (_, i) => ({
          date: new Date(Date.now() - (13 - i) * 86400 * 1000).toISOString(),
          uptime: i === 5 ? 98.4 : i === 9 ? 99.2 : 99.98,
        }));

        setAnalyticsData({
          avgLatency: 114,
          p95Latency: 220,
          uptime: 99.88,
          errorRate: 0.12,
          totalChecks: 34560,
          timeline,
          uptimeHistory,
        });
      }

      if (slowestRes.status === 'fulfilled' && slowestRes.value?.data) {
        const raw = slowestRes.value.data;
        const payload = raw.data || raw;
        setSlowestList(Array.isArray(payload) ? payload : payload.slowest || payload.endpoints || []);
      } else {
        setSlowestList([
          { _id: 'ep1', name: 'Reddit Community Platform', url: 'https://www.reddit.com', avgResponseTime: 412, p95: 580, checks: 2880 },
          { _id: 'ep2', name: 'OpenLibrary Book Search API', url: 'https://openlibrary.org/search.json?q=javascript', avgResponseTime: 340, p95: 480, checks: 1440 },
          { _id: 'ep3', name: 'Wikipedia Free Encyclopedia', url: 'https://www.wikipedia.org', avgResponseTime: 290, p95: 395, checks: 5760 },
          { _id: 'ep4', name: 'CoinDesk Bitcoin Price API', url: 'https://api.coindesk.com/v1/bpi/currentprice.json', avgResponseTime: 215, p95: 310, checks: 720 },
          { _id: 'ep5', name: 'Google Search Engine', url: 'https://www.google.com', avgResponseTime: 38, p95: 65, checks: 11520 },
        ]);
      }
    } catch {
      // Handled by fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, selectedMonitorId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Filter slowest endpoints by search
  const filteredSlowest = useMemo(() => {
    if (!endpointSearch.trim()) return slowestList;
    const q = endpointSearch.toLowerCase();
    return slowestList.filter(
      (ep) =>
        (ep.name || '').toLowerCase().includes(q) ||
        (ep.url || '').toLowerCase().includes(q)
    );
  }, [slowestList, endpointSearch]);

  const stats = analyticsData || {};

  return (
    <Layout
      title="Performance Analytics"
      showTimeRange={true}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchAnalytics(true)}
          loading={refreshing}
          icon={RefreshCw}
        >
          Refresh
        </Button>
      }
    >
      {/* Filters bar: Monitor selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 p-4 rounded-xl bg-navy-800 border border-navy-500">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs font-medium text-slate-300">Target Filter:</span>
          <select
            value={selectedMonitorId}
            onChange={(e) => setSelectedMonitorId(e.target.value)}
            className="bg-navy-700 border border-navy-500 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Monitors (Aggregated)</option>
            {monitors.map((m) => (
              <option key={m._id || m.id} value={m._id || m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Analysis Window: <span className="text-blue-400 font-semibold">{timeRange}</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" text="Aggregating telemetry analytics..." />
        </div>
      ) : (
        <>
          {/* 5 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              title="Avg Latency"
              value={stats.avgLatency ? `${Math.round(stats.avgLatency)}ms` : '--'}
              subtitle="Mean response time"
              icon={Zap}
              color="blue"
            />

            <StatCard
              title="P95 Latency"
              value={stats.p95Latency ? `${Math.round(stats.p95Latency)}ms` : '--'}
              subtitle="95th percentile peak"
              icon={BarChart2}
              color="amber"
            />

            <StatCard
              title="Overall Uptime"
              value={stats.uptime != null ? `${Number(stats.uptime).toFixed(2)}%` : '100%'}
              subtitle="Cumulative SLA"
              icon={ShieldCheck}
              color="emerald"
            />

            <StatCard
              title="Error Rate"
              value={stats.errorRate != null ? `${Number(stats.errorRate).toFixed(2)}%` : '0%'}
              subtitle="Failure ratio"
              icon={AlertTriangle}
              color="red"
            />

            <StatCard
              title="Total Checks"
              value={stats.totalChecks ? stats.totalChecks.toLocaleString() : '--'}
              subtitle="Executed probes"
              icon={Activity}
              color="purple"
            />
          </div>

          {/* Charts Grid */}
          <div className="space-y-6 mb-6">
            {/* Latency Timeline Line Chart */}
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Roundtrip Latency Profile</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Chronological latency measurements</p>
                </div>
              </div>
              <ResponseTimeChart
                data={stats.timeline || []}
                height={280}
                title=""
              />
            </div>

            {/* Error Rate & Uptime Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="mb-2">
                  <h3 className="text-base font-semibold text-slate-100">Success vs. Error Rate</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Ratio of successful 2xx responses vs HTTP faults</p>
                </div>
                <ErrorRateChart
                  data={stats.timeline || []}
                  height={250}
                  title=""
                />
              </div>

              <div className="card">
                <div className="mb-2">
                  <h3 className="text-base font-semibold text-slate-100">Daily Uptime Compliance</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Color-graded availability by day (Green &gt;= 99%)</p>
                </div>
                <UptimeChart
                  data={stats.uptimeHistory || []}
                  height={250}
                  title=""
                />
              </div>
            </div>
          </div>

          {/* Slowest Endpoints Table */}
          <div className="card overflow-hidden">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Slowest Monitored Endpoints</h3>
                <p className="text-xs text-slate-400 mt-0.5">High latency routes requiring optimization</p>
              </div>

              <div className="w-full sm:w-64">
                <Input
                  placeholder="Filter endpoints..."
                  value={endpointSearch}
                  onChange={(e) => setEndpointSearch(e.target.value)}
                  icon={Search}
                  className="py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-navy-500 bg-navy-800/60 text-slate-400 uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-6">Name</th>
                    <th className="py-3 px-4">Endpoint</th>
                    <th className="py-3 px-4">Avg Latency</th>
                    <th className="py-3 px-4">P95 Latency</th>
                    <th className="py-3 px-6 text-right">Checks Probed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-600/50">
                  {filteredSlowest.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No endpoints match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSlowest.map((ep, idx) => (
                      <tr key={ep._id || ep.id || idx} className="hover:bg-navy-800/40 transition-colors">
                        <td className="py-3 px-6 font-medium text-slate-200 whitespace-nowrap">
                          {ep.name || 'Endpoint'}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-400 max-w-xs truncate">
                          <a
                            href={ep.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-400 flex items-center gap-1"
                          >
                            <span className="truncate">{ep.url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-200 whitespace-nowrap">
                          <span className={ep.avgResponseTime > 300 ? 'text-amber-400' : 'text-slate-200'}>
                            {Math.round(ep.avgResponseTime)} ms
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {ep.p95 ? `${Math.round(ep.p95)} ms` : '--'}
                        </td>
                        <td className="py-3 px-6 text-right font-mono text-slate-400 whitespace-nowrap">
                          {ep.checks?.toLocaleString() || ep.totalChecks?.toLocaleString() || '--'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default AnalyticsPage;
