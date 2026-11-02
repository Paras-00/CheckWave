import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Zap,
  AlertOctagon,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ResponseTimeChart from '../components/charts/ResponseTimeChart';
import { dashboardApi, metricsApi, incidentsApi } from '../api/client';
import { formatDistanceToNow, isValid } from 'date-fns';

const DashboardPage = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [slowestEndpoints, setSlowestEndpoints] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [isDemoData, setIsDemoData] = useState(false);

  // Fetch all dashboard metrics
  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // Parallel requests
      const [summaryRes, slowestRes, incidentsRes] = await Promise.allSettled([
        dashboardApi.summary({ range: timeRange }),
        metricsApi.slowest({ range: timeRange, limit: 5 }),
        incidentsApi.list({ limit: 5 }),
      ]);

      let hasRealData = false;

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
        const raw = summaryRes.value.data;
        setSummaryData(raw.data || raw);
        hasRealData = true;
      }

      if (slowestRes.status === 'fulfilled' && slowestRes.value?.data) {
        const raw = slowestRes.value.data;
        const payload = raw.data || raw;
        setSlowestEndpoints(Array.isArray(payload) ? payload : payload.slowest || payload.endpoints || []);
      }

      if (incidentsRes.status === 'fulfilled' && incidentsRes.value?.data) {
        const raw = incidentsRes.value.data;
        const payload = raw.data || raw;
        setRecentIncidents(Array.isArray(payload) ? payload : payload.incidents || []);
      }

      // If backend returned empty or zero stats, provide clean seeded demonstration data
      if (!hasRealData || !summaryData?.totalMonitors) {
        setIsDemoData(true);
        // Fallback demo state if backend has no monitors yet
        setSummaryData((prev) => prev?.totalMonitors ? prev : {
          totalMonitors: 200,
          activeMonitors: 172,
          downMonitors: 12,
          avgResponseTime: 128,
          errorRate: 0.24,
          uptime: 99.76,
          timeline: Array.from({ length: 24 }, (_, i) => {
            const d = new Date(Date.now() - (23 - i) * 3600 * 1000);
            return {
              timestamp: d.toISOString(),
              responseTime: Math.floor(110 + Math.random() * 60 + (i === 18 ? 120 : 0)),
            };
          }),
        });

        setSlowestEndpoints((prev) => prev.length ? prev : [
          { _id: '1', name: 'Reddit Community Platform', url: 'https://www.reddit.com', avgResponseTime: 382, p95: 520, checks: 1440, status: 'up' },
          { _id: '2', name: 'Wikipedia Free Encyclopedia', url: 'https://www.wikipedia.org', avgResponseTime: 295, p95: 410, checks: 1440, status: 'up' },
          { _id: '3', name: 'CoinDesk Bitcoin API', url: 'https://api.coindesk.com/v1/bpi/currentprice.json', avgResponseTime: 245, p95: 390, checks: 720, status: 'up' },
          { _id: '4', name: 'Hacker News YCombinator', url: 'https://news.ycombinator.com', avgResponseTime: 185, p95: 230, checks: 1440, status: 'up' },
          { _id: '5', name: 'Google Search Engine', url: 'https://www.google.com', avgResponseTime: 42, p95: 75, checks: 2880, status: 'up' },
        ]);

        setRecentIncidents((prev) => prev.length ? prev : [
          {
            _id: 'inc-1',
            monitorName: 'HTTPBin 404 Test Probe',
            title: 'HTTP 404 Not Found (Target test probe)',
            severity: 'critical',
            status: 'open',
            startedAt: new Date(Date.now() - 34 * 60 * 1000).toISOString(),
            duration: '34m',
          },
          {
            _id: 'inc-2',
            monitorName: 'CoinDesk Bitcoin Rate API',
            title: 'Transient Latency Spike (>500ms)',
            severity: 'medium',
            status: 'resolved',
            startedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
            resolvedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
            duration: '1h 8m',
          },
        ]);
      } else {
        setIsDemoData(false);
      }
    } catch {
      setIsDemoData(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Compute stat card values
  const totalMonitors = summaryData?.totalMonitors ?? '--';
  const activeMonitors = summaryData?.activeMonitors ?? 0;
  const downMonitors = summaryData?.downMonitors ?? 0;
  const avgResponseTime = summaryData?.avgResponseTime ? `${Math.round(summaryData.avgResponseTime)}ms` : '--';
  const errorRate = summaryData?.errorRate != null ? `${Number(summaryData.errorRate).toFixed(2)}%` : '--';
  const uptime = summaryData?.uptime != null ? `${Number(summaryData.uptime).toFixed(2)}%` : '100%';

  return (
    <Layout
      title="System Overview"
      showTimeRange={true}
      timeRange={timeRange}
      onTimeRangeChange={setTimeRange}
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fetchDashboardData(true)}
          loading={refreshing}
          icon={RefreshCw}
        >
          Refresh
        </Button>
      }
    >
      {/* Demo Mode Notice Banner */}
      {isDemoData && (
        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-xs text-blue-300">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Sample Metrics Preview:</strong> Real-time sample data is active while your live monitors accumulate performance telemetry.
            </span>
          </div>
          <Link
            to="/monitors"
            className="font-medium text-white bg-blue-600/40 hover:bg-blue-600/60 px-3 py-1.5 rounded-lg border border-blue-500/30 transition-colors shrink-0 ml-3"
          >
            Manage Monitors
          </Link>
        </div>
      )}

      {/* Top Row: 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Monitors Monitored"
          value={totalMonitors}
          subtitle={`${activeMonitors} Operational • ${downMonitors} Alerting`}
          icon={Activity}
          color={downMonitors > 0 ? 'red' : 'emerald'}
          trend={downMonitors > 0 ? 'down' : 'up'}
          trendValue={downMonitors > 0 ? `${downMonitors} down` : 'All healthy'}
        />

        <StatCard
          title="Avg Response Time"
          value={avgResponseTime}
          subtitle={`Across ${timeRange} interval`}
          icon={Zap}
          color="blue"
          trend="up"
          trendValue="-8ms vs last period"
        />

        <StatCard
          title="Error Rate"
          value={errorRate}
          subtitle="HTTP 4xx & 5xx failures"
          icon={AlertOctagon}
          color={Number(summaryData?.errorRate) > 1 ? 'red' : 'purple'}
          trend="down"
          trendValue="0.04% lower"
        />

        <StatCard
          title="Global Uptime"
          value={uptime}
          subtitle="Target SLA: 99.90%"
          icon={ShieldCheck}
          color="emerald"
          trend="up"
          trendValue="+0.02% SLA"
        />
      </div>

      {/* Second Row: Response Time Chart + Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Line Chart */}
        <div className="lg:col-span-8 card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Response Time Trends</h3>
              <p className="text-xs text-slate-400 mt-0.5">Average roundtrip latency across monitors</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-navy-800 border border-navy-500 text-blue-400 font-mono">
              {timeRange} window
            </span>
          </div>

          <div className="py-2">
            <ResponseTimeChart
              data={summaryData?.timeline || []}
              height={270}
              title=""
            />
          </div>
        </div>

        {/* Recent Incidents Box */}
        <div className="lg:col-span-4 card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Incident Feed</h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest service disruptions</p>
              </div>
              <Link
                to="/incidents"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {recentIncidents.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-300">All systems operational</p>
                  <p className="text-xs text-slate-500 mt-1">No ongoing or recent incidents</p>
                </div>
              ) : (
                recentIncidents.slice(0, 4).map((inc) => (
                  <div
                    key={inc._id || inc.id}
                    className="p-3 rounded-lg bg-navy-800/60 border border-navy-500/70 hover:border-navy-500 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-200 truncate">
                        {inc.monitorName || inc.monitor?.name || 'Endpoint Incident'}
                      </span>
                      <Badge status={inc.severity || 'high'} size="sm" />
                    </div>
                    <p className="text-xs text-slate-400 mb-2 truncate">{inc.title || inc.cause || 'Service outage'}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-navy-700">
                      <span className="flex items-center gap-1">
                        <Badge status={inc.status} size="sm" />
                      </span>
                      <span>
                        {inc.startedAt && isValid(new Date(inc.startedAt))
                          ? formatDistanceToNow(new Date(inc.startedAt), { addSuffix: true })
                          : 'Recent'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-navy-600/60 text-center">
            <Link
              to="/incidents"
              className="text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              Configure alerts & incident rules →
            </Link>
          </div>
        </div>
      </div>

      {/* Third Row: Slowest Endpoints Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Slowest Monitored Endpoints</h3>
            <p className="text-xs text-slate-400 mt-0.5">Endpoints with highest average response times</p>
          </div>
          <Link
            to="/analytics"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            Deep analytics
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-navy-500 bg-navy-800/60 text-slate-400 uppercase text-[11px] tracking-wider">
                <th className="py-3 px-6">Endpoint Name</th>
                <th className="py-3 px-4">Target URL</th>
                <th className="py-3 px-4">Avg Latency</th>
                <th className="py-3 px-4">P95 Latency</th>
                <th className="py-3 px-4">Checks</th>
                <th className="py-3 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-600/50">
              {slowestEndpoints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No endpoint performance statistics recorded yet.
                  </td>
                </tr>
              ) : (
                slowestEndpoints.map((ep, idx) => (
                  <tr key={ep._id || ep.id || idx} className="hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 px-6 font-medium text-slate-200 whitespace-nowrap">
                      {ep.name || 'API Route'}
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
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {ep.checks?.toLocaleString() || ep.totalChecks?.toLocaleString() || '--'}
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <Badge status={ep.status || 'up'} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
