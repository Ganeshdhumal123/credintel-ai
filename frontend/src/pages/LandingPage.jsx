import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

const features = [
  {
    icon: '🧠',
    title: 'Machine Learning Risk Engine',
    desc: 'Production-trained Random Forest pipeline evaluates 20 credit parameters to predict default likelihood with precision.',
  },
  {
    icon: '📜',
    title: 'Document-Grounded Policy Assistant',
    desc: 'RAG-powered conversational engine retrieves lending policy guidelines instantly to support high-confidence underwriting.',
  },
  {
    icon: '📊',
    title: 'Real-Time Portfolio Analytics',
    desc: 'Live KPI monitoring tracks application velocity, risk distribution bands, and automated decision history in real time.',
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ backgroundColor: '#0A192F' }}
    >
      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/10">
        <Link to="/" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-400/10 border border-teal-400/30 group-hover:border-teal-400/60 transition-all">
            <span className="text-xl">💳</span>
          </div>
          <div>
            <span className="text-white font-bold text-xl group-hover:text-teal-300 transition-colors">
              CredIntel AI
            </span>
            <span className="block text-[11px] text-teal-400 opacity-80">
              Loan Intelligence Platform
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle showLabel={false} />
          <button
            onClick={() => navigate('/about')}
            className="text-sm font-medium px-4 py-2 rounded-lg text-gray-300 hover:text-white transition-colors"
          >
            System Specs
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-all"
            style={{ backgroundColor: '#64FFDA', color: '#0A192F' }}
          >
            Launch Platform →
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6 border shadow-sm"
            style={{ color: '#64FFDA', borderColor: 'rgba(100,255,218,0.3)', backgroundColor: 'rgba(100,255,218,0.06)' }}
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            Enterprise Credit Risk Architecture · German Benchmark Dataset
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Intelligent Loan Analysis &{' '}
            <span style={{ color: '#64FFDA' }}>Decision Support</span>
          </h1>

          <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            CredIntel AI combines machine learning credit risk modeling with vector-grounded
            policy search. Deliver fast, explainable, and consistent evaluations for every loan application.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 rounded-xl font-bold text-gray-900 text-base transition-all transform hover:scale-105 shadow-lg"
              style={{ backgroundColor: '#64FFDA' }}
            >
              Open Dashboard →
            </button>
            <button
              onClick={() => navigate('/applications/new')}
              className="px-8 py-4 rounded-xl font-medium text-white text-base border border-teal-500/40 hover:bg-white/10 transition-all cursor-pointer"
            >
              + Submit New Application
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full px-4">
          {features.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl p-6 text-left border hover:border-teal-400/40 transition-all duration-300"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}
            >
              <div className="text-3xl mb-4">{icon}</div>
              <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm border-t border-white/10">
        <p>
          CredIntel AI · Intelligent Credit Scoring & Document Grounded Loan Intelligence Platform
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
