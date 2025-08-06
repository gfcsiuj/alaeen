import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export function PinLogin() {
  const { settings, setIsAuthenticated } = useApp();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === settings.pin) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('رقم PIN غير صحيح');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 mb-4 animate-bounce-in">
            <img 
              src="https://scontent.fosm4-2.fna.fbcdn.net/v/t39.30808-6/494646003_122103077492854376_4740803221172287157_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=8gnYz32ttRoQ7kNvwHVFH6B&_nc_oc=Adlg9De_-JOZZATh6rHCiNM4TwI6Qe55Da8iTvwoUW7AfUO98piKDr3i-3yy39pfSQA&_nc_pt=1&_nc_zt=23&_nc_ht=scontent.fosm4-2.fna&_nc_gid=m02mrNFC3RUiJRkPKNka1A&oh=00_AfWT_QZAIBnHVdxqpRk_ZI0KGj4cNRb9LjGtpmCkFag2PQ&oe=6897D9BA"
              alt="العين"
              className="w-full h-full rounded-full object-cover logo-frame"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">العين</h1>
          <p className="text-gray-600 dark:text-gray-400">أدخل رقم PIN للدخول</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="رقم PIN"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg transition-all duration-300"
              dir="ltr"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}