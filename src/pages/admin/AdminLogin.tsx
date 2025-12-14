import { useState } from 'react';
import { User, EyeOff, Shield, LogIn, Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLoginProps {
  onSportsCaptainMode?: () => void;
}

export function AdminLogin({ onSportsCaptainMode }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 overflow-hidden bg-white shadow-lg">
            <img src="/icss_logo.png" alt="ICSS Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">ICSS Equipment Borrowing</h1>
          <p className="text-gray-500 text-lg">Manage inventory and borrowing requests</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Username or Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                required
                className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-700"
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-4 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-gray-700"
              />
              <EyeOff className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <div className="text-right mt-2">
              <button
                type="button"
                className="text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
          >
            <span className="text-lg">{loading ? 'Logging in...' : 'Log In'}</span>
            <LogIn className="w-5 h-5" />
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">Switch Context</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onSportsCaptainMode}
          className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3"
        >
          <Trophy className="w-6 h-6 text-gray-600" />
          <span className="text-lg">Sports Captain Dashboard</span>
        </button>
      </div>
    </div>
  );
}
