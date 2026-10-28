import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import FormField from './FormField';

const PasswordField = ({ label, name, value, onChange, placeholder, required = true }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField label={label} icon={Lock}>
      <input
        type={showPassword ? 'text' : 'password'}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input-field pl-11 pr-10 border-slate-200/80 bg-white/90 focus:bg-white"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </FormField>
  );
};

export default PasswordField;
