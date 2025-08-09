import React from 'react';
import { useApp } from '../contexts/AppContext';

interface PasswordConfirmProps {
  onConfirm: () => void;
  onCancel: () => void;
  actionType: 'add' | 'edit' | 'delete' | 'payment' | 'deleteData';
}

export function PasswordConfirm({ onConfirm, onCancel, actionType }: PasswordConfirmProps) {
  const { userRole } = useApp();
  
  // تنفيذ الإجراء فور تحميل المكون
  useEffect(() => {
    // إذا كان المستخدم مشاهد وحاول تسجيل دفع، نمنعه
    if (userRole === 'viewer' && actionType === 'payment') {
      // إنشاء عنصر تحذير
      const warningDiv = document.createElement('div');
      warningDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      warningDiv.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up text-center">
          <div class="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">لا يمكنك تسجيل الدفع</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">ليس لديك صلاحية لتسجيل المدفوعات في وضع المشاهدة</p>
          <button id="warning-close" class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-bold">
            حسناً
          </button>
        </div>
      `;

      document.body.appendChild(warningDiv);

      document.getElementById('warning-close')?.addEventListener('click', () => {
        document.body.removeChild(warningDiv as Node);
      });
      
      onCancel();
      return;
    }
    
    // تنفيذ العملية مباشرة بدون طلب تأكيد
    onConfirm();
    
    // تنظيف المكون
    return () => {
      // أي تنظيف ضروري
    };
  }, []); // تنفيذ مرة واحدة عند تحميل المكون

  // لا نعرض أي واجهة مستخدم لأننا ننفذ الإجراء مباشرة
  return null;
}