import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 z-0">
        <img
          src="/images.jpg"
          alt="Coach Mury Kuswari"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 to-teal-900/90"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md relative z-10">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-emerald-600 p-3 rounded-xl">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">Selamat Datang</h1>
        <p className="text-center text-emerald-700 font-semibold mb-3 text-sm md:text-base">Nutrition by Coach Mury Kuswari</p>

        <div className="flex justify-center mb-6">
          <img
            src="/images.jpg"
            alt="Coach Mury Kuswari"
            className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-lg"
          />
        </div>

        <p className="text-center text-gray-600 mb-6 md:mb-8 text-sm md:text-base">Sign in to track your fitness journey</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="athlete@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
