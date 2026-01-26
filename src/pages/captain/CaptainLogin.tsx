import { useState } from 'react';
import { CreditCard, Lock, User, X, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface CaptainLoginProps {
  onSwitchToAdmin: () => void;
}

export function CaptainLogin({ onSwitchToAdmin }: CaptainLoginProps) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetStudentId, setResetStudentId] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = studentId.includes('@') ? studentId : studentId + '@school.edu';
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    try {
      const email = resetStudentId + '@school.edu';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  }

  function handleOpenResetForm() {
    setShowResetForm(true);
    setResetStudentId(studentId);
    setResetSuccess(false);
    setResetError('');
  }

  function handleCloseResetForm() {
    setShowResetForm(false);
    setResetStudentId('');
    setResetSuccess(false);
    setResetError('');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      <div className="flex-1 flex flex-col p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm">
              <img src="/icss_logo.png" alt="ICSS Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Sports Captain Portal</h1>
          </div>
          <div className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
            Online
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden mb-8 shadow-xl">
          <img
            src="https://images.pexels.com/photos/3612/sport-balls-basketball-ball.jpg?auto=compress&cs=tinysrgb&w=800"
            alt="Equipment Center"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
            <h2 className="text-white text-2xl font-bold p-6">Equipment Center</h2>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Welcome, Captain</h2>
          <p className="text-gray-600 text-center mb-8">
            Please sign in to start your shift and manage inventory.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email or Student ID
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your email or ID number"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {showPassword ? (
                    <Eye className="w-5 h-5 text-gray-400" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenResetForm}
              className="text-sm text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              Forgot Password?
            </button>

            <Button
              type="submit"
              fullWidth
              size="lg"
              disabled={loading}
              className="flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : 'LOG IN'}
              <span className="text-xl">→</span>
            </Button>
          </form>
        </div>

        <button
          onClick={onSwitchToAdmin}
          className="flex items-center justify-center gap-2 text-gray-700 font-medium py-4 hover:text-gray-900 transition-colors"
        >
          <User className="w-5 h-5" />
          Teacher / Admin Login
        </button>

        <p className="text-center text-sm text-gray-600 mt-4">
          Need help? Contact Mr. Smith in the PE Office.
        </p>
      </div>

      {showResetForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
            <button
              onClick={handleCloseResetForm}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h3>
              <p className="text-gray-600">
                Enter your Student ID and we'll send a password reset link to your school email.
              </p>
            </div>

            {resetSuccess ? (
              <div className="text-center py-4">
                <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-4">
                  Check your school email for a password reset link.
                </div>
                <button
                  onClick={handleCloseResetForm}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                {resetError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">
                    {resetError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Student ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={resetStudentId}
                      onChange={(e) => setResetStudentId(e.target.value)}
                      placeholder="Enter your ID number"
                      required
                      className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <CreditCard className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Reset link will be sent to {resetStudentId}@school.edu
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseResetForm}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
