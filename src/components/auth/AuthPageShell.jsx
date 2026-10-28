import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

const AuthPageShell = ({ title, subtitle, error, brandHeader, children }) => (
  <div className="min-h-screen text-slate-800 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center relative">
    <div className="absolute inset-0 bg-[url('/background.jpg')] bg-cover bg-center bg-no-repeat -z-20" />
    <div className="absolute inset-0 bg-gradient-to-tr from-white/75 via-[#FFF5F6]/70 to-[#FFF0F2]/60 backdrop-blur-[1.5px] -z-10" />

    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {brandHeader}
    </motion.div>

    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md card p-8 backdrop-blur-md bg-white/75 border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />

      <h2 className="text-xl font-bold text-center text-slate-800 mb-2 tracking-tight">{title}</h2>
      <p className="text-xs text-center text-slate-500 mb-6 font-semibold">{subtitle}</p>

      {error && (
        <div className="mb-5 p-3.5 bg-danger/10 border border-danger/25 text-danger text-sm rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 animate-bounce" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {children}
    </motion.div>
  </div>
);

export default AuthPageShell;
