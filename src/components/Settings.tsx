import React, { useState } from 'react';
import { Moon, Sun, Lock, Download, Upload, Trash2, Shield, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { PasswordConfirm } from './PasswordConfirm';

export function Settings() {
  const { settings, setSettings, orders, setOrders, setIsAuthenticated } = useApp();
  const [showPinInput, setShowPinInput] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    setSettings(prev => ({ ...prev, theme: newTheme }));
  };

  const handlePinToggle = () => {
    if (settings.pinEnabled) {
      // Disable PIN
      setSettings(prev => ({ ...prev, pinEnabled: false, pin: undefined }));
    } else {
      // Enable PIN
      setShowPinInput(true);
    }
  };

  const savePinSettings = () => {
    if (newPin.length >= 4) {
      setSettings(prev => ({ ...prev, pinEnabled: true, pin: newPin }));
      setShowPinInput(false);
      setNewPin('');
    }
  };

  const exportData = () => {
    const data = {
      orders,
      settings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `al-ain-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders);
        }
        if (data.settings && typeof data.settings === 'object') {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
        alert('تم استيراد البيانات بنجاح!');
      } catch (error) {
        alert('خطأ في استيراد البيانات. تأكد من صحة الملف.');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    // عرض نافذة التحقق من كلمة المرور
    setShowPasswordConfirm(true);
  };
  
  // دالة تنفيذ حذف البيانات بعد التحقق من كلمة المرور
  const executeDataDelete = () => {
    setOrders([]);
    localStorage.removeItem('al-ain-orders');
    alert('تم حذف جميع البيانات بنجاح.');
    setShowPasswordConfirm(false);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <div className="p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 animate-bounce-in">
            <img 
              src="./images/logo.jpg"
              alt="العين"
              className="w-full h-full rounded-full object-cover logo-frame"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-pink-600 bg-clip-text text-transparent mb-2">الإعدادات</h1>
          <p className="text-gray-600 dark:text-gray-400">تخصيص التطبيق وإدارة البيانات</p>
        </div>
        
        <div className="space-y-6">
          {/* Theme Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center ml-3">
                {settings.theme === 'light' ? (
                  <Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
              المظهر
            </h2>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center ml-4 text-white">
                  {settings.theme === 'light' ? (
                    <Sun className="w-6 h-6" />
                  ) : (
                    <Moon className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">نمط العرض</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {settings.theme === 'light' ? 'الوضع النهاري' : 'الوضع الليلي'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  settings.theme === 'dark' ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 shadow-lg ${
                    settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center ml-3">
                <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              الأمان
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center ml-4 text-white">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">قفل التطبيق بـ PIN</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.pinEnabled ? 'مفعل' : 'غير مفعل'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handlePinToggle}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    settings.pinEnabled ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-all duration-300 shadow-lg ${
                      settings.pinEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {showPinInput && (
                <div className="mt-6 p-6 bg-gradient-to-r from-primary-50 to-pink-50 dark:from-primary-900/20 dark:to-pink-900/20 rounded-xl border border-primary-200 dark:border-primary-800 animate-slide-up">
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="أدخل رقم PIN (4 أرقام على الأقل)"
                        className="w-full px-4 py-4 pl-12 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-300"
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
                    
                    <div className="flex gap-2">
                      <button
                        onClick={savePinSettings}
                        disabled={newPin.length < 4}
                        className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
                      >
                        حفظ
                      </button>
                      <button
                        onClick={() => {
                          setShowPinInput(false);
                          setNewPin('');
                        }}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settings.pinEnabled && (
                <button
                  onClick={logout}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg"
                >
                  <Shield className="w-5 h-5 ml-2" />
                  تسجيل الخروج
                </button>
              )}
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center ml-3">
                <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              إدارة البيانات
            </h2>
            
            <div className="space-y-4">
              <button
                onClick={exportData}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg"
              >
                <Download className="w-5 h-5 ml-2" />
                تصدير البيانات
              </button>
              
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                  id="import-file"
                />
                <label
                  htmlFor="import-file"
                  className="w-full bg-gradient-to-r from-primary-500 to-blue-500 hover:from-primary-600 hover:to-blue-600 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center cursor-pointer shadow-lg"
                >
                  <Upload className="w-5 h-5 ml-2" />
                  استيراد البيانات
                </label>
              </div>
              
              <button
                onClick={clearAllData}
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white py-4 px-6 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center shadow-lg"
              >
                <Trash2 className="w-5 h-5 ml-2" />
                حذف جميع البيانات
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  {/* مكون التحقق من كلمة المرور */}
  {showPasswordConfirm && (
    <PasswordConfirm
      onConfirm={executeDataDelete}
      onCancel={() => setShowPasswordConfirm(false)}
      actionType="deleteData"
    />
  )}
}