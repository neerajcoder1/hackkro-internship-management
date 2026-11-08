import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import loginIllustration from '../assets/hackkro-login-illustration.jpg';

export default function LoginPage() {
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('hackkro_remember_email') || '';
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    return Boolean(localStorage.getItem('hackkro_remember_email'));
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  const portalParam = new URLSearchParams(location.search).get('portal');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim() || !password) {
      setFormError('Please enter both your email address and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const loggedInUser = await login(email.trim(), password);

      // Handle Remember Me preference
      if (rememberMe) {
        localStorage.setItem('hackkro_remember_email', email.trim());
      } else {
        localStorage.removeItem('hackkro_remember_email');
      }

      // Redirect users based on their actual backend role
      if (from && from !== '/') {
        navigate(from, { replace: true });
      } else if (loggedInUser?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/intern', { replace: true });
      }
    } catch (err) {
      setFormError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] w-full flex flex-col lg:flex-row bg-white selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* LEFT SECTION – 55% width: HackKro Illustration */}
      <div className="w-full lg:w-[55%] bg-white flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 border-b lg:border-b-0 lg:border-r border-slate-200">
        <div className="w-full max-w-2xl flex items-center justify-center">
          <img
            src={loginIllustration}
            alt="HackKro Internship Management System - A Smarter Way to Manage Internships"
            className="w-full h-auto max-h-[320px] sm:max-h-[460px] lg:max-h-[620px] object-contain transition-all"
            loading="eager"
          />
        </div>
      </div>

      {/* RIGHT SECTION – 45% width: Clean Authentication Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-white">
        <div className="w-full max-w-md">
          {/* HackKro Branding */}
          <div className="flex items-center space-x-3 mb-8">
            <img
              src="https://res.cloudinary.com/payb7fsq/image/upload/v1791981789/Hack_Kro_Logo.png"
              alt="HackKro Logo"
              className="h-9 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div
              style={{ display: 'none' }}
              className="w-9 h-9 rounded-lg bg-blue-600 items-center justify-center text-white font-extrabold text-sm"
            >
              HK
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 block leading-tight">
                HackKro
              </span>
              <span className="text-xs text-slate-500 block leading-tight">
                Internship Management System
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {portalParam === 'admin'
                ? 'Admin & Staff Sign In'
                : portalParam === 'intern'
                ? 'Intern Workspace Sign In'
                : 'Welcome back'}
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              {portalParam === 'admin'
                ? 'Sign in with administrative credentials to access the management console.'
                : portalParam === 'intern'
                ? 'Sign in to access your assigned tasks and submit your deliverables.'
                : 'Sign in to continue to your internship workspace.'}
            </p>
          </div>

          {/* Contextual Portal Alert / Switcher */}
          {portalParam === 'admin' && (
            <div className="mb-6 p-3.5 rounded-xl bg-slate-900 text-white shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-xs block text-white">Admin / Employee Portal</span>
                  <span className="text-[11px] text-slate-400 block">Privileged management access</span>
                </div>
              </div>
              <Link
                to="/portals"
                className="text-[11px] font-medium text-blue-300 hover:text-white underline shrink-0"
              >
                Switch Portal
              </Link>
            </div>
          )}

          {portalParam === 'intern' && (
            <div className="mb-6 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-semibold text-xs block text-blue-950">Intern Workspace</span>
                  <span className="text-[11px] text-blue-700 block">Candidate & intern dashboard</span>
                </div>
              </div>
              <Link
                to="/portals"
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline shrink-0"
              >
                Switch Portal
              </Link>
            </div>
          )}

          {/* Validation / Authentication Error Display */}
          {formError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Authentication Error</span>
                <span className="text-xs text-red-600">{formError}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg text-sm shadow-xs transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Registration Navigation Link */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
