const StatusPill = ({ label, color = 'green' }) => {
  const colorMap = {
    green: 'bg-emerald-50/85 border-emerald-100/60 text-emerald-700',
    rose: 'bg-rose-50/85 border-rose-100/60 text-rose-700',
    purple: 'bg-purple-50/85 border-purple-100/60 text-purple-700',
    blue: 'bg-blue-50/85 border-blue-100/60 text-blue-700',
  };

  const dotMap = {
    green: 'bg-emerald-500',
    rose: 'bg-[#FF4777]',
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${colorMap[color]}`}>
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotMap[color]}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotMap[color]}`} />
      </span>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
};

export default StatusPill;
