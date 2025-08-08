import React from 'react';
import { Plus, FileText, BarChart3, Settings, LogOut } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { userRole, logout } = useApp();
  
  // تحديد الأزرار بناءً على دور المستخدم
  const tabs = [
    ...(userRole === 'admin' ? [{ id: 'add', label: 'إضافة طلب', icon: Plus }] : []),
    { id: 'orders', label: 'الطلبات', icon: FileText },
    { id: 'analytics', label: 'التحليلات', icon: BarChart3 },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 px-4 py-2 safe-area-pb shadow-lg">
      <div className="flex justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-110 ${
                isActive
                  ? 'text-primary-500 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'scale-110 animate-pulse-slow' : ''} transition-all duration-300`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
        
        {/* زر تسجيل الخروج */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-110 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
        >
          <LogOut className="w-6 h-6 mb-1 transition-all duration-300" />
          <span className="text-xs font-medium">خروج</span>
        </button>
      </div>
    </div>
  );
}