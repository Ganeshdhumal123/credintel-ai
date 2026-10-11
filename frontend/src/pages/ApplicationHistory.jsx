import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getApplications } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const ApplicationHistory = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApplications(0, 100);
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setApplications(sorted);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Application History
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            All submitted loan applications and audit records
          </p>
        </div>
        <Link
          to="/applications/new"
          className="px-5 py-2.5 rounded-xl text-gray-900 font-bold text-sm transition-all hover:scale-105 shadow-md"
          style={{ backgroundColor: '#64FFDA' }}
        >
          + New Application
        </Link>
      </div>

      {loading && <LoadingSpinner message="Loading applications..." />}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-4 rounded-xl flex items-center gap-3 text-sm">
          <span className="text-lg">ℹ️</span>
          <span>{error}</span>
          <button onClick={fetchApplications} className="ml-auto text-sm underline font-semibold">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm text-center py-20 px-6 transition-colors">
          <div className="text-6xl mb-4">📂</div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">No Applications Yet</h3>
          <p className="text-gray-400 mb-6 max-w-sm mx-auto text-sm">
            You haven&apos;t submitted any loan applications. Start by creating your first one.
          </p>
          <Link
            to="/applications/new"
            className="inline-block px-6 py-3 rounded-xl text-gray-900 font-bold text-sm transition-transform hover:scale-105 shadow-md"
            style={{ backgroundColor: '#64FFDA' }}
          >
            Create First Application →
          </Link>
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {applications.length} application{applications.length !== 1 ? 's' : ''} total
            </p>
            <button
              onClick={fetchApplications}
              className="text-sm text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 font-semibold"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/60 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-3.5 text-left">Application ID</th>
                  <th className="px-6 py-3.5 text-left">Date Submitted</th>
                  <th className="px-6 py-3.5 text-left">Status</th>
                  <th className="px-6 py-3.5 text-left">Prediction</th>
                  <th className="px-6 py-3.5 text-left">Risk</th>
                  <th className="px-6 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {applications.map((app) => (
                  <tr key={app.application_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        {app.application_id?.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatDate(app.created_at)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-6 py-4">
                      {app.prediction !== undefined && app.prediction !== null ? (
                        <StatusBadge status={app.prediction === 1 ? 'APPROVED' : 'REJECTED'} />
                      ) : (
                        <span className="text-gray-400 text-xs">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {app.risk_category ? (
                        <StatusBadge status={app.risk_category} />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/analysis/${app.application_id}`}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
                        style={{ backgroundColor: '#0A192F', border: '1px solid rgba(100,255,218,0.3)' }}
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationHistory;
