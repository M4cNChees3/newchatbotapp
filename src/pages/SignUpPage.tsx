import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sportType, setSportType] = useState('');
  const [fitnessGoal, setFitnessGoal] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password, {
        name,
        age: age ? parseInt(age) : undefined,
        sport_type: sportType || undefined,
        fitness_goal: fitnessGoal || undefined,
        dietary_restrictions: dietaryRestrictions || undefined,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
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

      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl my-8 relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-emerald-600 p-3 rounded-xl">
            <Activity className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-gray-900">Create Account</h1>
        <p className="text-center text-emerald-700 font-semibold mb-3 text-sm md:text-base">Nutrition by Coach Mury Kuswari</p>

        <div className="flex justify-center mb-6">
          <img
            src="/images.jpg"
            alt="Coach Mury Kuswari"
            className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500 shadow-lg"
          />
        </div>

        <p className="text-center text-gray-600 mb-6 md:mb-8 text-sm md:text-base">Start your personalized fitness journey</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="25"
                min="1"
                max="120"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
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
              Password *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="sportType" className="block text-sm font-medium text-gray-700 mb-2">
              Sport/Activity Type
            </label>
            <input
              id="sportType"
              type="text"
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="e.g., Running, Weightlifting, Swimming"
            />
          </div>

          <div>
            <label htmlFor="fitnessGoal" className="block text-sm font-medium text-gray-700 mb-2">
              Fitness Goal
            </label>
            <input
              id="fitnessGoal"
              type="text"
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="e.g., Build muscle, Lose fat, Improve endurance"
            />
          </div>

          <div>
            <label htmlFor="dietary" className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Restrictions
            </label>
            <input
              id="dietary"
              type="text"
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="e.g., Vegetarian, Gluten-free, None"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
