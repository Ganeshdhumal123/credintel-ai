import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApplication, analyzeApplication } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const FIELD_LABELS = {
  credit_amount: 'Credit Amount (DM)',
  duration_in_month: 'Duration (months)',
  installment_rate: 'Installment Rate',
  purpose: 'Purpose',
  status_of_existing_checking_account: 'Checking Account Status',
  savings_account_bonds: 'Savings / Bonds',
  credit_history: 'Credit History',
  present_employment_since: 'Employment Since',
  personal_status_and_sex: 'Personal Status & Sex',
  age_in_years: 'Age (years)',
  job: 'Job Type',
  property: 'Property',
  housing: 'Housing',
  other_installment_plans: 'Other Installment Plans',
  other_debtors_guarantors: 'Other Debtors / Guarantors',
  present_residence_since: 'Residence Since (years)',
  number_of_existing_credits: 'Existing Credits',
  number_of_liable_people: 'Liable People',
  telephone: 'Telephone',
  foreign_worker: 'Foreign Worker',
};

const DataRow = ({ label, value }) => (
  <div className="flex items-start py-2.5 border-b border-gray-50 dark:border-slate-800/80 last:border-0">
    <span className="w-56 text-sm text-gray-500 dark:text-slate-400 flex-shrink-0">{label}</span>
    <span className="text-sm text-gray-800 dark:text-slate-200 font-medium">{value ?? '—'}</span>
  </div>
);

// probability here is the BAD credit probability (0=best, 1=worst)
// We show "Approval Probability" as the inverse for clarity
const ProbabilityBar = ({ probability }) => {
  const badPct = Math.round((probability ?? 0) * 100);
  const goodPct = 100 - badPct;
  const color = goodPct >= 60 ? '#22c55e' : goodPct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-gray-600 dark:text-slate-300">Good Credit Probability (estimated)</span>
        <span className="font-bold" style={{ color }}>{goodPct}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${goodPct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
        Default risk probability: {badPct}% — Risk Category: see badge above
      </p>
    </div>
  );
};

const AnalysisResult = () => {
  const { id } = useParams();
  const [application, setApplication] = useState(null);   // from GET /applications/{id}
  const [prediction, setPrediction] = useState(null);      // from POST .../analyze
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  const fetchApplication = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getApplication(id);
      setApplication(res.data);
    } catch (err) {
      setError(err.friendlyMessage || 'Failed to load application.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await analyzeApplication(id);
      // res.data is PredictionResponse — store separately and update app status
      setPrediction(res.data);
      setApplication((prev) => ({ ...prev, status: 'analyzed' }));
    } catch (err) {
      setAnalyzeError(err.friendlyMessage || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return <div className="p-8"><LoadingSpinner message="Loading application..." /></div>;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-lg flex items-center gap-3">
          <span className="text-xl">ℹ️</span>
          <div>
            <p className="font-medium">Error Loading Application</p>
            <p className="text-sm mt-0.5">{error}</p>
          </div>
          <Link to="/history" className="ml-auto text-sm underline">← Back to History</Link>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const isAnalyzed = application.status === 'analyzed';
  // prediction comes from the POST response; predicted_class 0 = Good, 1 = Bad
  const isGoodCredit = prediction ? prediction.predicted_class === 0 : false;

  // Parse applicant_data JSON stored in the application record
  let inputFields = {};
  try {
    if (application.applicant_data) {
      inputFields = typeof application.applicant_data === 'string'
        ? JSON.parse(application.applicant_data)
        : application.applicant_data;
    }
  } catch {
    inputFields = {};
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <Link to="/history" className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 flex items-center gap-1 mb-3 transition-colors">
            ← Back to History
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Application Analysis</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-mono text-sm break-all">{application.application_id}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <StatusBadge status={application.status} />
          {!isAnalyzed && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-5 py-2.5 rounded-lg text-gray-900 font-semibold text-sm transition-all hover:scale-105 disabled:opacity-60 flex items-center gap-2 cursor-pointer shadow-sm"
              style={{ backgroundColor: '#64FFDA' }}
            >
              {analyzing ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  Analyzing…
                </>
              ) : (
                '🧠 Analyze Application'
              )}
            </button>
          )}
          {isAnalyzed && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-4 py-2 rounded-lg text-gray-700 dark:text-slate-200 font-medium text-sm border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {analyzing ? 'Re-analyzing…' : '🔄 Re-analyze'}
            </button>
          )}
        </div>
      </div>

      {analyzeError && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <span>ℹ️</span><span>{analyzeError}</span>
        </div>
      )}

      {/* Meta Info Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 transition-colors">
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Submitted</p>
          <p className="text-sm font-medium text-gray-800 dark:text-slate-200 mt-0.5">{formatDate(application.created_at)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Status</p>
          <div className="mt-1"><StatusBadge status={application.status} /></div>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Prediction</p>
          <div className="mt-1">
            {prediction ? (
              <StatusBadge status={isGoodCredit ? 'APPROVED' : 'REJECTED'} />
            ) : (
              <span className="text-gray-400 dark:text-slate-500 text-sm">Not yet analyzed</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wide">Risk Category</p>
          <div className="mt-1">
            {prediction?.risk_category ? (
              <StatusBadge status={prediction.risk_category} />
            ) : (
              <span className="text-gray-400 dark:text-slate-500 text-sm">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Result Panel */}
      {prediction && (
        <div className={`rounded-xl p-6 mb-6 border-2 transition-colors ${
          isGoodCredit
            ? 'bg-green-50 dark:bg-emerald-950/30 border-green-200 dark:border-emerald-800/60'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{isGoodCredit ? '✅' : '❌'}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isGoodCredit
                  ? 'Good Credit Risk — Potentially Approvable'
                  : 'Bad Credit Risk — High Likelihood of Default'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-300">
                {prediction.predicted_label} · Model: {prediction.model_version}
              </p>
            </div>
          </div>

          {prediction.probability !== undefined && (
            <div className="mb-5">
              <ProbabilityBar probability={prediction.probability} />
            </div>
          )}

          {prediction.explanation && (
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-4 mb-4 border border-gray-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">Model Explanation</p>
              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{prediction.explanation}</p>
            </div>
          )}

          {prediction.limitations && prediction.limitations.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Known Limitations</p>
              <ul className="space-y-1">
                {prediction.limitations.map((lim, i) => (
                  <li key={i} className="text-xs text-gray-600 dark:text-slate-300 flex gap-2">
                    <span className="text-gray-400 dark:text-slate-500 flex-shrink-0">•</span>{lim}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {prediction.analyzed_at && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">Analyzed at: {formatDate(prediction.analyzed_at)}</p>
          )}
        </div>
      )}

      {/* Pending state */}
      {!prediction && !isAnalyzed && (
        <div className="bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-800 rounded-xl p-6 mb-6 text-center">
          <div className="text-4xl mb-3">🧠</div>
          <h3 className="text-gray-700 dark:text-slate-200 font-semibold mb-1">Ready for Analysis</h3>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Click <strong>Analyze Application</strong> above to run the ML model and get a credit risk prediction.
          </p>
        </div>
      )}

      {/* Underwriting Governance Notice */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 mb-6 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 transition-colors">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <strong>Underwriting Governance:</strong> Machine learning risk scoring provides analytical guidance for credit assessment.
        </span>
        <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Audit Logged</span>
      </div>

      {/* Application Input Data */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 transition-colors">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">📋 Submitted Application Data</h3>
        {Object.keys(inputFields).length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {Object.entries(FIELD_LABELS).map(([key, label]) =>
              inputFields[key] !== undefined ? (
                <DataRow key={key} label={label} value={String(inputFields[key])} />
              ) : null
            )}
          </div>
        ) : (
          <p className="text-gray-400 dark:text-slate-500 text-sm">No input data available to display.</p>
        )}
      </div>
    </div>
  );
};

export default AnalysisResult;
