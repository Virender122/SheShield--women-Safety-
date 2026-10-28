import { motion } from 'framer-motion';

const QuickActionCard = ({ item, onClick, delay = 0.35 }) => {
  const Icon = item.icon;

  let badgeClasses = 'bg-pink-500/10 border-pink-100 text-[#E67388]';
  let themeClasses = 'bg-white/80 border-white/60 hover:bg-white/95 hover:border-pink-200/50 shadow-[0_4px_18px_rgba(255,182,193,0.08)]';

  if (item.color === 'success') {
    badgeClasses = 'bg-emerald-500/10 border-emerald-100 text-emerald-600';
  } else if (item.color === 'danger') {
    badgeClasses = 'bg-rose-500/10 border-rose-100 text-rose-600';
    themeClasses = 'bg-rose-50/70 border-rose-100/40 hover:bg-rose-50/90 shadow-[0_4px_18px_rgba(244,63,94,0.06)]';
  } else if (item.color === 'warning') {
    badgeClasses = 'bg-amber-500/10 border-amber-100 text-amber-600';
  } else if (item.color === 'accent') {
    badgeClasses = 'bg-indigo-500/10 border-indigo-100 text-indigo-600';
  }

  return (
    <motion.button
      key={item.id}
      onClick={() => onClick(item)}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.03, y: -2 }}
      className={`flex items-center gap-2.5 p-2 rounded-2xl text-left border backdrop-blur-md transition-all active:scale-[0.98] ${themeClasses}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${badgeClasses}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="truncate flex-1">
        <span className="text-[11.5px] font-black text-slate-800 tracking-tight block leading-none">
          {item.name}
        </span>
        <span className="text-[8.5px] text-slate-400 font-bold block mt-1 leading-none truncate">
          {item.description}
        </span>
      </div>
    </motion.button>
  );
};

export default QuickActionCard;
