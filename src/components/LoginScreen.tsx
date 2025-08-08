import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export function LoginScreen() {
  const { setIsAuthenticated, setUserRole } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (password === 'بادي الضلع؟') {
        // تسجيل الدخول كمدير
        await signInWithEmailAndPassword(auth, 'admin@yourcompany.com', password);
        setUserRole('admin');
        setIsAuthenticated(true);
      } else if (password === 'استغفرالله؟') {
        // تسجيل الدخول كمشاهد
        await signInWithEmailAndPassword(auth, 'partner2@yourcompany.com', password);
        setUserRole('viewer');
        setIsAuthenticated(true);
      } else {
        setError('كلمة المرور غير صحيحة');
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 mb-4 animate-bounce-in">
            <img 
              src="./images/logo.jpg"
              alt="العين"
              className="w-full h-full rounded-full object-cover logo-frame"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">العين</h1>
          <p className="text-gray-600 dark:text-gray-400">أدخل كلمة المرور للدخول</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg transition-all duration-300"
              dir="rtl"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}