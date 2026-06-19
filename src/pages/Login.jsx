import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import './Login.css';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, checkAppState } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const nextUrl = searchParams.get('next') || '/';

  useEffect(() => {
    if (user) {
      navigate(nextUrl);
    }
  }, [user, navigate, nextUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          throw new Error('Full name is required for registration.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: window.location.origin + createPageUrl('Login'),
          },
        });

        if (signUpError) throw signUpError;

        setAwaitingConfirmation(true);
        setConfirmationEmail(email);
        setEmail('');
        setPassword('');
        setFullName('');
        setIsSignUp(false);
        setSuccess('');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        setSuccess('Login successful!');
        await checkAppState();
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: confirmationEmail,
        options: {
          emailRedirectTo: window.location.origin + createPageUrl('Login'),
        },
      });
      if (error) throw error;
      setSuccess('Confirmation email resent! Check your inbox.');
    } catch (err) {
      setError(err.message || 'Failed to resend confirmation email.');
    } finally {
      setLoading(false);
    }
  };

  const scoutImages = [
    'https://cdn.builder.io/api/v1/image/assets%2Fdf4dce830ed64b7eb7e941bafa74dac4%2Ffbfd0234e3ed4a7993173280b7c97e56?format=webp&width=800&height=1200',
    'https://cdn.builder.io/api/v1/image/assets%2Fdf4dce830ed64b7eb7e941bafa74dac4%2F2f16adad0fa2408991d6d8efa7739f04?format=webp&width=800&height=1200',
    'https://cdn.builder.io/api/v1/image/assets%2Fdf4dce830ed64b7eb7e941bafa74dac4%2F8b6f56f81380492eaab1dc6611b3b432?format=webp&width=800&height=1200'
  ];

  const scoutLogo = 'https://cdn.builder.io/api/v1/image/assets%2Fdf4dce830ed64b7eb7e941bafa74dac4%2F2f16adad0fa2408991d6d8efa7739f04?format=webp&width=800&height=1200';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-emerald-900 to-blue-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 right-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main container */}
      <div className="w-full max-w-5xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Left side - Desktop image carousel */}
          <div className="hidden lg:flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md">
              {/* Scout Logo */}
              <div className="mb-8 text-center">
                <div className="w-32 h-32 mx-auto bg-white rounded-full shadow-2xl flex items-center justify-center overflow-hidden">
                  <img src={scoutLogo} alt="Rwanda Scout" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-white text-3xl font-bold mt-6">Rwanda Scout</h1>
                <p className="text-emerald-200 text-sm mt-2">Connect, Grow, Lead</p>
              </div>

              {/* Carousel */}
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0">
                  {scoutImages.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt="Scout Community"
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                      style={{
                        opacity: idx === 0 ? 1 : 0,
                      }}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>

              {/* Scout info */}
              <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6 text-white">
                <h3 className="font-semibold text-lg mb-2">Join the Scout Movement</h3>
                <p className="text-sm text-gray-200">
                  Be part of a global community of leaders, explorers, and changemakers. Connect with scouts worldwide, earn badges, and make a difference.
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Login/Signup form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md">
              {/* Mobile Scout Logo */}
              <div className="lg:hidden mb-6 text-center">
                <div className="w-24 h-24 mx-auto bg-white rounded-full shadow-xl flex items-center justify-center overflow-hidden">
                  <img src={scoutLogo} alt="Rwanda Scout" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-white text-2xl font-bold mt-4">Rwanda Scout</h1>
              </div>

              {/* Form Card */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8">
                {awaitingConfirmation ? (
                  <>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
                      Confirm Your Email
                    </h2>
                    <p className="text-gray-600 text-center text-sm mb-6">
                      We've sent a confirmation email to <strong>{confirmationEmail}</strong>. Please click the link in the email to verify your account.
                    </p>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="text-emerald-700 text-sm">{success}</p>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800 text-sm">
                        ✉️ <strong>Check your inbox</strong> for the confirmation email. If you don't see it, check your spam folder.
                      </p>
                    </div>

                    <button
                      onClick={handleResendConfirmation}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Resending...' : 'Resend Confirmation Email'}
                    </button>

                    <div className="mt-6 border-t pt-6">
                      <p className="text-center text-gray-600 text-sm">
                        Already confirmed?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setAwaitingConfirmation(false);
                            setConfirmationEmail('');
                            setError(null);
                            setSuccess(null);
                          }}
                          className="font-semibold text-emerald-600 hover:text-emerald-700 transition"
                        >
                          Try logging in
                        </button>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">
                      {isSignUp ? 'Join Scout' : 'Welcome Back'}
                    </h2>
                    <p className="text-gray-600 text-center text-sm mb-6">
                      {isSignUp ? 'Create your scout account to get started' : 'Login to your scout account'}
                    </p>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <p className="text-emerald-700 text-sm">{success}</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {isSignUp && (
                        <div>
                          <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Full Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="John Doe"
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                              required
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-2.5 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center">
                            <span className="animate-spin mr-2">⚡</span>
                            {isSignUp ? 'Creating Account...' : 'Logging in...'}
                          </span>
                        ) : (
                          isSignUp ? 'Create Account' : 'Login'
                        )}
                      </button>
                    </form>

                    {!isSignUp && (
                      <p className="text-center text-gray-600 text-xs mt-3">
                        <a href="#" className="text-emerald-600 hover:underline">
                          Forgot password?
                        </a>
                      </p>
                    )}

                    <div className="mt-6 border-t pt-6">
                      <p className="text-center text-gray-600 text-sm">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                            setSuccess(null);
                          }}
                          className="font-semibold text-emerald-600 hover:text-emerald-700 transition"
                        >
                          {isSignUp ? 'Login' : 'Sign up'}
                        </button>
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Footer text */}
              <p className="text-center text-gray-300 text-xs mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
