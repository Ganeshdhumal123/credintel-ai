const TECH_STACK = [
  { label: 'Frontend', value: 'React 19 + Vite + Tailwind CSS' },
  { label: 'Backend', value: 'FastAPI (Python, Asynchronous REST)' },
  { label: 'ML Model', value: 'Scikit-learn Pipeline (ColumnTransformer + Random Forest, 100 Trees)' },
  { label: 'Vector Store & RAG', value: 'FAISS IndexFlatIP (Cosine Similarity) + Dense Embeddings' },
  { label: 'PDF Processing', value: 'pypdf Engine with multi-page text chunking' },
  { label: 'Database & ORM', value: 'SQLAlchemy ORM + SQLite / MySQL Support' },
  { label: 'Data Benchmark', value: 'Statlog German Credit Benchmark (1,000 Records, 20 Features)' },
  { label: 'REST API', value: 'Full CRUD + Inference at http://127.0.0.1:8000' },
];

const GOVERNANCE = [
  'Trained on 1,000 credit records with stratified 80/20 train/test evaluation (ROC-AUC ~0.80).',
  'Uses Scikit-learn ColumnTransformer to eliminate data leakage during feature preprocessing.',
  'Evaluates 20 distinct financial and personal parameters to generate calibrated default risk probabilities.',
  'Provides granular risk tiering: High (≥70%), Medium (40-69%), Low (<40%) default likelihood.',
  'Includes document-grounded policy Q&A to answer underwriting inquiries directly from lending guidelines.',
  'Maintains a permanent audit log of all application submissions and analytical predictions.',
];

const ETHICAL = [
  'Demographic sensitivity: Model parameters are monitored to ensure fair and balanced credit evaluation.',
  'Human-in-the-loop: Designed to augment and empower credit underwriters with transparent probabilities rather than opaque black-box decisions.',
  'Model explainability: Each evaluation returns clear rationales explaining the primary risk factors contributing to the score.',
  'Compliance and transparency: Clear criteria definitions ensure full alignment with responsible AI lending principles.',
];

const About = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          About CredIntel AI
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          Architecture overview, model governance, and technical specifications
        </p>
      </div>

      {/* Dataset & Benchmark */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-6 transition-colors">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
          📊 Benchmark Dataset & Target
        </h2>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <p>
            <strong>Benchmark:</strong>{' '}
            <a
              href="https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 dark:text-teal-400 underline hover:text-teal-300 font-semibold"
            >
              Statlog (German Credit Data) — UCI Machine Learning Benchmark
            </a>
          </p>
          <p>
            <strong>Dataset Volume:</strong> 1,000 loan applications with 20 numerical and categorical features
          </p>
          <p>
            <strong>Target Variable:</strong> Binary credit risk classification —{' '}
            <code className="bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 px-2 py-0.5 rounded text-xs font-bold">0 = Good Credit Risk</code> (low default risk),{' '}
            <code className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-2 py-0.5 rounded text-xs font-bold">1 = Bad Credit Risk</code> (high default risk)
          </p>
          <p>
            <strong>Model Performance:</strong> ~76% Test Accuracy, 0.80 ROC-AUC with balanced precision and recall
          </p>
        </div>
      </div>

      {/* Model Governance */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-6 transition-colors">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
          🛡️ Model Governance & Operational Standards
        </h2>
        <ul className="space-y-2.5">
          {GOVERNANCE.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-teal-500 font-bold mt-0.5 flex-shrink-0">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Responsible AI */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-6 transition-colors">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
          ⚖️ Responsible AI & Ethical Underwriting
        </h2>
        <ul className="space-y-2.5">
          {ETHICAL.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-blue-500 font-bold mt-0.5 flex-shrink-0">›</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tech Stack */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-6 transition-colors">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
          🔧 Technical Stack
        </h2>
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          {TECH_STACK.map(({ label, value }) => (
            <div key={label} className="py-2.5 flex items-start gap-4 text-sm">
              <span className="w-44 text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">{label}</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default About;
