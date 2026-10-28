import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuthStore } from '../context/authStore';
import AuthPageShell from '../components/auth/AuthPageShell';
import BrandHeader from '../components/auth/BrandHeader';
import FormField from '../components/auth/FormField';
import PasswordField from '../components/auth/PasswordField';

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const { login, loading, error, clearError, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) navigate('/home');
    return () => clearError();
  }, [isAuthenticated, navigate, clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
    if (!email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }
    const success = await login(email, password);
    if (success) navigate('/home');
  };

  return (
    <AuthPageShell
      title="Welcome Back"
      subtitle="Sign in to secure your journey and connect with community support."
      error={localError || error}
      brandHeader={<BrandHeader />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField label="Email Address" icon={Mail}>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="jane.doe@example.com"
            className="input-field pl-11 border-slate-200/80 bg-white/90 focus:bg-white"
          />
        </FormField>

        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-pink flex justify-center items-center py-3 bg-gradient-to-tr from-pink-500 to-rose-400 text-white border-0 font-bold shadow-md shadow-pink-200 hover:opacity-95 disabled:bg-none disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none transition-all"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing In...
            </span>
          ) : 'Unlock Home'}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-slate-500 font-semibold">
        New to the Shield Initiative?{' '}
        <Link to="/signup" className="font-bold text-primary-dark hover:text-accent transition-colors">
          Register here
        </Link>
      </p>
    </AuthPageShell>
  );
};

export default LoginPage;
