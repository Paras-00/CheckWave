import React, { useState } from 'react';
import { format, isValid } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import Badge from '../common/Badge';

const MonitorHistory = ({ history = [], loading = false }) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(history.length / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const currentItems = history.slice(startIndex, startIndex + pageSize);

  const formatTimestamp = (ts) => {
    if (!ts) return '--';
    const date = new Date(ts);
    if (!isValid(date)) return '--';
    return format(date, 'MMM d, yyyy HH:mm:ss');
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-100">Check Execution History</h3>
        <span className="text-xs text-slate-400">
          Showing {history.length > 0 ? startIndex + 1 : 0}-
          {Math.min(startIndex + pageSize, history.length)} of {history.length}
        </span>
      </div>

      <div className="overflow-x-auto -mx-6">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-navy-500 bg-navy-800/60 text-slate-400 uppercase text-[11px] tracking-wider">
              <th className="py-3 px-6">Timestamp</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Response Time</th>
              <th className="py-3 px-4">HTTP Status</th>
              <th className="py-3 px-6">Message / Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-600/50">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="inline-block animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2 align-middle" />
                  Loading history logs...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No execution checks recorded yet for this monitor.
                </td>
              </tr>
            ) : (
              currentItems.map((item, idx) => {
                const isUp = item.status === 'up' || (item.statusCode >= 200 && item.statusCode < 400);
                return (
                  <tr
                    key={item._id || item.id || idx}
                    className={`transition-colors ${
                      isUp ? 'hover:bg-emerald-500/5' : 'bg-red-500/5 hover:bg-red-500/10'
                    }`}
                  >
                    <td className="py-3 px-6 font-mono text-slate-300 whitespace-nowrap">
                      {formatTimestamp(item.timestamp || item.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {isUp ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        )}
                        <Badge status={isUp ? 'up' : 'down'} size="sm" />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">
                      <span className={item.responseTime > 500 ? 'text-amber-400' : 'text-slate-200'}>
                        {item.responseTime != null ? `${Math.round(item.responseTime)} ms` : '--'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          item.statusCode >= 200 && item.statusCode < 300
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : item.statusCode >= 300 && item.statusCode < 400
                            ? 'bg-blue-500/15 text-blue-400'
                            : item.statusCode
                            ? 'bg-red-500/15 text-red-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.statusCode || '--'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-400 max-w-xs truncate" title={item.error || item.message || ''}>
                      {item.error || item.message || (isUp ? 'OK' : 'Check failed')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-navy-500">
          <span className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-navy-500 text-slate-300 hover:bg-navy-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-navy-500 text-slate-300 hover:bg-navy-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitorHistory;
