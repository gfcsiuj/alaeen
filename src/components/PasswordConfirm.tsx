import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
  actionType: 'add' | 'edit' | 'delete' | 'payment' | 'deleteData';
}

export function PasswordConfirm({ onConfirm, onCancel, actionType }: PasswordConfirmProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // كلمة المرور المطلوبة
  const REQUIRED_PASSWORD = 'استغفرالله؟';

  // نص العملية حسب النوع
  const getActionText = () => {
    switch (actionType) {
      case 'add':
        return 'إضافة طلب جديد';
      case 'edit':
        return 'تعديل الطلب';
      case 'delete':
        return 'حذف الطلب';
      case 'payment':
        return 'تسجيل دفع';
      case 'deleteData':
        return 'مسح البيانات';
      default:
        return 'تنفيذ العملية';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === REQUIRED_PASSWORD) {
      onConfirm();
      setError('');
    } else {
      setError('كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-primary-100 dark:bg-gray-700 rounded-full">
            <Lock className="w-8 h-8 text-primary-500 dark:text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{getActionText()}</h2>
          <p className="text-gray-600 dark:text-gray-400">أدخل كلمة المرور للمتابعة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-lg transition-all duration-300"
              dir="rtl"
              autoFocus
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

          <div className="flex space-x-3 space-x-reverse rtl:space-x-reverse">
            <button
              type="button"
              onClick={onCancel}
              className="w-1/2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-4 rounded-lg font-medium transition-all duration-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="w-1/2 bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium transition-all duration-300"
            >
              تأكيد
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}