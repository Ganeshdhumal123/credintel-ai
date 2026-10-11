import { Link, NavLink, Outlet } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/applications/new', label: 'New Application', icon: '➕' },
  { to: '/history', label: 'History', icon: '📋' },
  { to: '/assistant', label: 'Policy Assistant', icon: '🤖' },
  { to: '/about', label: 'About', icon: 'ℹ️' },
];

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-full z-30 flex flex-col"
        style={{ width: '240px', backgroundColor: '#0A192F' }}
      >
        {/* Brand / Logo - Clickable to Home */}
        <div className="px-6 py-6 border-b border-white/10">
          <Link
            to="/"
            title="Go to Home"
            className="flex items-center gap-3 group transition-transform hover:scale-105 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-400/10 border border-teal-400/30 group-hover:border-teal-400/60 transition-all">
              <span className="text-xl">💳</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight group-hover:text-teal-300 transition-colors">
                CredIntel AI
              </h1>
              <p className="text-xs" style={{ color: '#64FFDA', opacity: 0.85 }}>
                Intelligent Loan Analysis
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map(({ to, label, icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-gray-900 font-semibold shadow-sm'
                        : 'text-gray-300 hover:bg-white/10 hover:text-teal-300'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { backgroundColor: '#64FFDA', color: '#0A192F' }
                      : {}
                  }
                >
                  <span className="text-base">{icon}</span>
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer with Theme Toggle */}
        <div className="px-6 py-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-300">Appearance</span>
            <ThemeToggle showLabel={false} />
          </div>
          <div>
            <p className="text-xs font-semibold text-teal-300">CredIntel AI Platform</p>
            <p className="text-[11px] text-gray-400">Decision Engine · Active</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 overflow-x-hidden bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-200"
        style={{ marginLeft: '240px' }}
      >
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
