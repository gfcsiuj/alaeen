import React, { useEffect, useState } from 'react';

interface LoaderProps {
  minDisplayTime?: number; // الحد الأدنى لوقت عرض شاشة التحميل بالمللي ثانية
}

export function Loader({ minDisplayTime = 2000 }: LoaderProps) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // زيادة نسبة التقدم تدريجياً
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, minDisplayTime / 25);
    
    return () => clearInterval(interval);
  }, [minDisplayTime]);
  
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex flex-col items-center justify-center z-50 transition-all duration-500">
      <div className="w-36 h-36 mb-8 animate-bounce-in">
        <img 
          src="./images/logo.jpg"
          alt="العين"
          className="w-full h-full rounded-full object-cover shadow-xl border-4 border-primary-500"
        />
      </div>
      
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent mb-6 animate-pulse">
        العين للأحصائيات المالية
      </h1>
      
      <div className="w-72 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2 shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300 animate-progress"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 text-sm font-medium animate-fade-in">
        {progress}% جاري التحميل
      </p>
      
      <div className="mt-8 flex space-x-2 space-x-reverse">
        <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-3 h-3 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      
      <p className="mt-12 text-xs text-gray-400 dark:text-gray-500 animate-fade-in">
        © {new Date().getFullYear()} العين للأحصائيات المالية
      </p>
    </div>
  );
}