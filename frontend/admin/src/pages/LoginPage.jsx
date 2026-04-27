import { useState } from 'react';
import { useAdminContext } from '../context/AdminContext.jsx';

export default function LoginPage() {
  const { login, loading, setAdmin } = useAdminContext();
  const [email, setEmail] = useState('admin@roadguard.in');
  const [password, setPassword] = useState('roadguard@admin2024');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await login({ email, password });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    }
  };

  const handleDemoMode = () => {
    // Demo mode - bypass authentication
    const demoToken = 'demo_token_' + Date.now();
    localStorage.setItem('admin_token', demoToken);
    setAdmin({ email: 'demo@roadguard.in', token: demoToken });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">RG</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            RoadGuard Admin
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Monitor hazards, review reports, and manage operations
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                placeholder="admin@roadguard.in"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDemoMode}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Demo Mode (Skip Login)
          </button>
        </form>
      </div>
    </div>
  );
}
