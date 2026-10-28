const FormField = ({ label, icon: Icon, children, extraLabel }) => (
  <div>
    <div className="flex justify-between items-center mb-1.5">
      <label className="input-label mb-0">{label}</label>
      {extraLabel && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{extraLabel}</span>}
    </div>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Icon className="w-5 h-5" />
        </div>
      )}
      {children}
    </div>
  </div>
);

export default FormField;
