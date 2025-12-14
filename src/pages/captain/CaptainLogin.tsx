import { useState } from 'react';
import { CreditCard, Lock, User } from 'lucide-react';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';

interface CaptainLoginProps {
  onSwitchToAdmin: () => void;
}

export function CaptainLogin({ onSwitchToAdmin }: CaptainLoginProps) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(studentId + '@school.edu', password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
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
                Student ID
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your ID number"
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="button"
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
    </div>
  );
}
