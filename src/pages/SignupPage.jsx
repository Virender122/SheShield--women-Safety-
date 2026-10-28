import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone } from 'lucide-react';
import { useAuthStore } from '../context/authStore';
import AuthPageShell from '../components/auth/AuthPageShell';
import BrandHeader from '../components/auth/BrandHeader';
import FormField from '../components/auth/FormField';
import PasswordField from '../components/auth/PasswordField';

const SignupPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();
  const { signup, loading, error, clearError, isAuthenticated } = useAuthStore();

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
    const { name, email, phone, password, confirmPassword } = formData;
    if (!name || !email || !phone || !password) {
      setLocalError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    const success = await signup({ name, email, phone, password });
    if (success) navigate('/home');
  };

  return (
    <AuthPageShell
      title="Create Secure Account"
      subtitle="Sign up to access safe routes, live reporting, and fast-acting SOS services."
      error={localError || error}
      brandHeader={<BrandHeader />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Full Name" icon={User}>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            className="input-field pl-11 border-slate-200/80 bg-white/90 focus:bg-white"
          />
        </FormField>

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

        <FormField label="Phone Number" icon={Phone}>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            placeholder="9876543210"
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

        <FormField label="Confirm Password" icon={User}>
          <input
            type="password"
            name="confirmPassword"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className="input-field pl-11 border-slate-200/80 bg-white/90 focus:bg-white"
          />
        </FormField>

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
              Creating Account...
            </span>
          ) : 'Register & Set Safe Route'}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-slate-500 font-semibold">
        Already have an account?{' '}
        <Link to="/login" className="font-bold text-primary-dark hover:text-accent transition-colors">
          Sign In here
        </Link>
      </p>
    </AuthPageShell>
  );
};

export default SignupPage;
