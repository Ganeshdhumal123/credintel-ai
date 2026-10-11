import { useTheme } from '../context/ThemeContext';

const ThemeToggle = ({ showLabel = false, className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-teal-300 hover:bg-slate-700 hover:border-teal-400'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 shadow-sm'
      } ${className}`}
    >
      <span className="text-base transform transition-transform duration-300 hover:rotate-12">
        {isDark ? '☀️' : '🌙'}
      </span>
      {showLabel && (
        <span className="text-xs font-semibold select-none">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
