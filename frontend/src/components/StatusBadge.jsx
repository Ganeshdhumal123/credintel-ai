const STATUS_STYLES = {
  // Application status
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ANALYZED: 'bg-blue-100 text-blue-800 border-blue-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  // Risk levels
  HIGH: 'bg-red-100 text-red-800 border-red-200',
  MEDIUM: 'bg-orange-100 text-orange-800 border-orange-200',
  LOW: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  ANALYZED: 'Analyzed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  HIGH: 'High Risk',
  MEDIUM: 'Medium Risk',
  LOW: 'Low Risk',
};

const StatusBadge = ({ status }) => {
  const normalized = status ? status.toUpperCase() : '';
  const styles = STATUS_STYLES[normalized] || 'bg-gray-100 text-gray-700 border-gray-200';
  const label = STATUS_LABELS[normalized] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
