import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getApplications, getModelInfo } from '../services/api';
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [appsRes, modelRes] = await Promise.allSettled([
        getApplications(0, 100),
        getModelInfo(),
      ]);

      if (appsRes.status === 'fulfilled') {
        setApplications(appsRes.value.data);
      } else {
        throw new Error(appsRes.reason?.friendlyMessage || 'Failed to load applications.');
      }

      if (modelRes.status === 'fulfilled') {
        setModelInfo(modelRes.value.data);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const completedCount = applications.filter(
    (a) => a.status === 'analyzed'
  ).length;

  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

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
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Overview of loan applications, underwriting velocity, and model performance
        </p>
      </div>

      {loading && <LoadingSpinner message="Loading dashboard..." />}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center gap-2 text-sm">
          <span>ℹ️</span>
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="ml-auto text-sm underline hover:no-underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KpiCard
              title="Total Applications"
              value={applications.length}
              subtitle="All time submitted"
              icon="📁"
              colorClass="text-blue-500 dark:text-blue-400"
            />
            <KpiCard
              title="Completed Analyses"
              value={completedCount}
              subtitle={`${applications.length ? Math.round((completedCount / applications.length) * 100) : 0}% processed`}
              icon="✅"
              colorClass="text-emerald-500 dark:text-emerald-400"
            />
            <KpiCard
              title="Model Version"
              value={modelInfo?.version || modelInfo?.model_version || 'v1.0.0'}
              subtitle="Active model pipeline"
              icon="🧠"
              colorClass="text-purple-500 dark:text-purple-400"
            />
            <KpiCard
              title="Algorithm"
              value={modelInfo?.model_name ? 'Random Forest' : 'ML Model'}
              subtitle={modelInfo?.version || 'v1.0.0'}
              icon="🔄"
              colorClass="text-teal-500 dark:text-teal-300"
            />
          </div>

          {/* Model Info Card */}
          {modelInfo && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-8 transition-colors">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                🧠 Model Architecture & Benchmark
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Model: </span>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">{modelInfo.model_name || 'CredIntel Classifier'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Type: </span>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">{modelInfo.model_type || modelInfo.algorithm || 'Random Forest Classifier'}</span>
                </div>
                {modelInfo.dataset && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Dataset: </span>
                    <span className="text-gray-800 dark:text-gray-200">{typeof modelInfo.dataset === 'object' ? `${modelInfo.dataset.name} (${modelInfo.dataset.size || '1,000 instances'})` : modelInfo.dataset}</span>
                  </div>
                )}
                {modelInfo.features_used && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Features Count: </span>
                    <span className="text-gray-800 dark:text-gray-200">{Array.isArray(modelInfo.features_used) ? modelInfo.features_used.length : '20'} Attributes</span>
                  </div>
                )}
                {modelInfo.target_definition && (
                  <div className="col-span-full">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Target: </span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {typeof modelInfo.target_definition === 'object'
                        ? `${modelInfo.target_definition.description || 'Credit Risk'} (${modelInfo.target_definition.class_0 || '0 = Good'}, ${modelInfo.target_definition.class_1 || '1 = Bad'})`
                        : String(modelInfo.target_definition)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <strong>System Status:</strong> Active & Calibrated for underwriting decision support
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  Pipeline: Scaler + OneHotEncoder + RandomForest (n=100)
                </span>
              </div>
            </div>
          )}

          {/* Recent Applications Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Recent Applications</h2>
              <Link
                to="/history"
                className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                View All →
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="text-5xl mb-4">📂</div>
                <h3 className="text-gray-600 dark:text-gray-300 font-medium mb-2">No applications yet</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Submit your first loan application to get started.
                </p>
                <Link
                  to="/applications/new"
                  className="inline-block px-5 py-2.5 rounded-xl font-bold text-gray-900 text-sm transition-transform hover:scale-105"
                  style={{ backgroundColor: '#64FFDA' }}
                >
                  Create Application →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-800/60 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="px-6 py-3 text-left">Application ID</th>
                      <th className="px-6 py-3 text-left">Date</th>
                      <th className="px-6 py-3 text-left">Status</th>
                      <th className="px-6 py-3 text-left">Prediction</th>
                      <th className="px-6 py-3 text-left">Risk</th>
                      <th className="px-6 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {recentApplications.map((app) => (
                      <tr key={app.application_id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-300">
                          {app.application_id?.slice(0, 8)}…
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(app.created_at)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-6 py-4">
                          {app.prediction !== undefined && app.prediction !== null ? (
                            <StatusBadge status={app.prediction === 1 ? 'APPROVED' : 'REJECTED'} />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {app.risk_category ? (
                            <StatusBadge status={app.risk_category} />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            to={`/analysis/${app.application_id}`}
                            className="text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
