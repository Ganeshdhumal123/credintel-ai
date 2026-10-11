const KpiCard = ({ title, value, subtitle, icon, colorClass = 'text-teal-400' }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 flex flex-col gap-2 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </span>
        {icon && <span className={`text-2xl ${colorClass}`}>{icon}</span>}
      </div>
      <div className={`text-3xl font-extrabold ${colorClass}`}>{value}</div>
      {subtitle && <div className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</div>}
    </div>
  );
};

export default KpiCard;
