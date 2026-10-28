import { Link } from 'react-router-dom';

const BrandHeader = () => (
  <Link to="/" className="flex items-center gap-2.5 mb-8 group relative z-10">
    <img
      src="/logo.jpg"
      alt="SheShield Logo"
      className="w-12 h-12 rounded-2xl object-cover border border-pink-100/50 shadow-md group-hover:scale-105 transition-transform"
    />
    <span className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
      SheShield
      <span className="text-[10px] uppercase font-black tracking-widest px-2 py-0.5 bg-primary/20 rounded-full text-accent-dark">
        Secured
      </span>
    </span>
  </Link>
);

export default BrandHeader;
