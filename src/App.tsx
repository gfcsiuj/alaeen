import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { BottomNavigation } from './components/BottomNavigation';
import { AddOrder } from './components/AddOrder';
import OrderList from './components/OrderList';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { PinLogin } from './components/PinLogin';
import { Loader } from './components/Loader';

function AppContent() {
  const { settings, isAuthenticated } = useApp();
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Apply theme on mount and when it changes
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    // إظهار شاشة التحميل لمدة محددة
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500); // 2.5 ثانية
    
    return () => clearTimeout(timer);
  }, []);

  // عرض شاشة التحميل أولاً
  if (loading) {
    return <Loader />;
  }
  
  // Show PIN login if PIN is enabled and user is not authenticated
  if (settings.pinEnabled && !isAuthenticated) {
    return <PinLogin />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'add':
        return <AddOrder />;
      case 'orders':
        return <OrderList />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      default:
        return <Analytics />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors" dir="rtl">
      <main className="relative">
        {renderContent()}
      </main>
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;