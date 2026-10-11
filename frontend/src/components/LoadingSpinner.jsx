const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200"></div>
        <div className="w-12 h-12 rounded-full border-4 border-teal-400 border-t-transparent animate-spin absolute top-0 left-0"></div>
      </div>
      {message && <p className="text-gray-500 text-sm">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
