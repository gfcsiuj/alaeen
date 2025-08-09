import React, { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Calendar, Filter, PieChart, BarChart3, Target, ClipboardList } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { PasswordConfirm } from './PasswordConfirm';
import { addPayment, Payment } from '../firebase/paymentService';
import { useNavigate } from 'react-router-dom';

export function Analytics() {
  const { orders, userRole, refreshPayments, payments } = useApp();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('all');
  const [customDays, setCustomDays] = useState('7');
  const [filteredOrders, setFilteredOrders] = useState(orders);
  
  // حالة لتتبع مدفوعات العمال والشركاء
  const [workerPaymentStatus, setWorkerPaymentStatus] = useState<Record<string, { status: 'full' | 'partial' | 'none', remainingAmount?: number }>>({});
  const [partnerPaymentStatus, setPartnerPaymentStatus] = useState<Record<string, { status: 'full' | 'partial' | 'none', remainingAmount?: number }>>({});
  
  // دالة للانتقال إلى صفحة سجل المدفوعات
  const goToPaymentHistory = () => {
    navigate('/payments');
  };

  // حالات للتحقق من كلمة المرور
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [paymentAction, setPaymentAction] = useState<{
    type: 'full' | 'partial' | 'none';
    worker?: string;
    share?: number;
    partner?: string;
    partnerShare?: number;
    amount?: number;
  } | null>(null);

  // دالة تنفيذ عملية تسجيل الدفع بعد التحقق من كلمة المرور
  const executePaymentAction = async () => {
    if (!paymentAction) return;
    
    // إنشاء عنصر تحذير إذا كان المستخدم مشاهد
    if (userRole === 'viewer') {
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
      
      // إعادة تعيين حالة الإجراء
      setPaymentAction(null);
      setShowPasswordConfirm(false);
      return;
    }

    // إنشاء العناصر المطلوبة للعرض
    let successDiv, warningDiv;

    try {
      // تنفيذ الإجراء المناسب بناءً على نوع العملية
      if (paymentAction.worker) {
        // تسجيل دفع للعامل
        const { type, worker, share } = paymentAction;
        
        // تسجيل الدفع في Firebase
        await addPayment({
          type: 'worker',
          recipientName: worker,
          amount: type === 'full' ? share! : (paymentAction.amount || 0),
          paymentType: type,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          createdBy: userRole
        }, (newPayment) => {
          // تحديث المدفوعات في الذاكرة
          console.log('تم تحديث المدفوعات في الذاكرة:', newPayment);
        });

        if (type === 'full') {
        // تسجيل دفع كامل
        successDiv = document.createElement('div');
        successDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        successDiv.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up text-center">
            <div class="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">تم تسجيل الدفع بنجاح</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">تم تسجيل دفع كامل المبلغ (${share?.toLocaleString('ar-IQ')} د.ع) للعامل ${worker}</p>
            <button id="success-close" class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 font-bold">
              حسناً
            </button>
          </div>
        `;

        document.body.appendChild(successDiv);

        // تحديث حالة الدفع للعامل باستخدام حالة React
        setWorkerPaymentStatus(prevStatus => ({
          ...prevStatus,
          [worker]: {
            status: 'full',
            remainingAmount: 0
          }
        }));

        document.getElementById('success-close')?.addEventListener('click', () => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv as Node);
          }
        });
      } else if (type === 'partial' && paymentAction.amount) {
        // تسجيل دفع جزئي
        const { amount } = paymentAction;

        successDiv = document.createElement('div');
        successDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        successDiv.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up text-center">
            <div class="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">تم تسجيل الدفع الجزئي بنجاح</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-2">تم تسجيل دفع مبلغ (${amount.toLocaleString('ar-IQ')} د.ع) للعامل ${worker}</p>
            <p class="text-gray-600 dark:text-gray-400 mb-6">المبلغ المتبقي: ${(share! - amount).toLocaleString('ar-IQ')} د.ع</p>
            <button id="success-close" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-bold">
              حسناً
            </button>
          </div>
        `;

        document.body.appendChild(successDiv);

        // تحديث حالة الدفع الجزئي باستخدام حالة React
        setWorkerPaymentStatus(prevStatus => ({
          ...prevStatus,
          [worker]: {
            status: 'partial',
            remainingAmount: share! - amount
          }
        }));

        document.getElementById('success-close')?.addEventListener('click', () => {
          document.body.removeChild(successDiv as Node);
        });
      } else if (type === 'none') {
        // تسجيل عدم الدفع
        warningDiv = document.createElement('div');
        warningDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        warningDiv.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up text-center">
            <div class="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">تم تسجيل عدم الدفع</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">تم تسجيل عدم دفع المبلغ (${share?.toLocaleString('ar-IQ')} د.ع) للعامل ${worker}</p>
            <button id="warning-close" class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-bold">
              حسناً
            </button>
          </div>
        `;

        document.body.appendChild(warningDiv);

        // تحديث حالة عدم الدفع باستخدام حالة React
        setWorkerPaymentStatus(prevStatus => ({
          ...prevStatus,
          [worker]: {
            status: 'none',
            remainingAmount: share
          }
        }));

        document.getElementById('warning-close')?.addEventListener('click', () => {
          document.body.removeChild(warningDiv as Node);
        });
      }
    } else if (paymentAction.partner) {
      // تسجيل دفع للشريك
      const { type, partner, partnerShare, amount } = paymentAction;
      
      // تسجيل الدفع في Firebase
      await addPayment({
        type: 'partner',
        recipientName: partner,
        amount: type === 'full' ? partnerShare! : (amount || 0),
        paymentType: type,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: userRole
      }, (newPayment) => {
        // تحديث المدفوعات في الذاكرة
        console.log('تم تحديث المدفوعات في الذاكرة:', newPayment);
      });

      if (type === 'full') {
        // تسجيل دفع كامل للشريك
        successDiv = document.createElement('div');
        successDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        successDiv.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up text-center">
            <div class="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">تم تسجيل الدفع بنجاح</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">تم تسجيل دفع كامل المبلغ (${partnerShare?.toLocaleString('ar-IQ')} د.ع) للشريك ${partner}</p>
            <button id="success-close-partner" class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 font-bold">
              حسناً
            </button>
          </div>
        `;

        document.body.appendChild(successDiv);

        // تحديث حالة الدفع للشريك باستخدام حالة React
        setPartnerPaymentStatus(prevStatus => ({
          ...prevStatus,
          [partner]: {
            status: 'full',
            remainingAmount: 0
          }
        }));

        document.getElementById('success-close-partner')?.addEventListener('click', () => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv as Node);
          }
        });
      } else if (type === 'partial' && amount) {
        // تسجيل دفع جزئي للشريك
        successDiv = document.createElement('div');
        successDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        successDiv.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up text-center">
            <div class="w-20 h-20 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">تم تسجيل الدفع الجزئي بنجاح</h3>
            <p class="text-gray-600 dark:text-gray-400 mb-2">تم تسجيل دفع مبلغ (${amount.toLocaleString('ar-IQ')} د.ع) للشريك ${partner}</p>
            <p class="text-gray-600 dark:text-gray-400 mb-6">المبلغ المتبقي: ${(partnerShare! - amount).toLocaleString('ar-IQ')} د.ع</p>
            <button id="success-close-partner" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-bold">
              حسناً
            </button>
          </div>
        `;

        document.body.appendChild(successDiv);

        // تحديث حالة الدفع الجزئي للشريك باستخدام حالة React
        setPartnerPaymentStatus(prevStatus => ({
          ...prevStatus,
          [partner]: {
            status: 'partial',
            remainingAmount: partnerShare! - amount
          }
        }));

        document.getElementById('success-close-partner')?.addEventListener('click', () => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv as Node);
          }
        });
      }
    }

    // تحديث المدفوعات من Firebase
    await refreshPayments();
    
    // إعادة تعيين حالة الإجراء
    setPaymentAction(null);
    setShowPasswordConfirm(false);
    } catch (error) {
      console.error('خطأ في تسجيل الدفع:', error);
      
      // عرض رسالة خطأ للمستخدم
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      errorDiv.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up text-center">
          <div class="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">خطأ في تسجيل الدفع</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">حدث خطأ أثناء تسجيل الدفع في قاعدة البيانات. يرجى المحاولة مرة أخرى.</p>
          <button id="error-close" class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-bold">
            حسناً
          </button>
        </div>
      `;

      document.body.appendChild(errorDiv);

      document.getElementById('error-close')?.addEventListener('click', () => {
        document.body.removeChild(errorDiv as Node);
      });
      
      // إعادة تعيين حالة الإجراء
      setPaymentAction(null);
      setShowPasswordConfirm(false);
    }
  };

  // تحديث حالة الدفع للعمال والشركاء بناءً على المدفوعات
  useEffect(() => {
    // تحديث حالة الدفع للعمال
    const workerStatus: Record<string, { status: 'full' | 'partial' | 'none', remainingAmount?: number }> = {};
    const partnerStatus: Record<string, { status: 'full' | 'partial' | 'none', remainingAmount?: number }> = {};
    
    // حساب المبالغ المستحقة للعمال من الطلبات المفلترة
    const workerShares: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.workers.forEach(worker => {
        if (worker.name.trim()) {
          workerShares[worker.name] = (workerShares[worker.name] || 0) + worker.share;
        }
      });
    });
    
    // حساب المبالغ المستحقة للشركاء
    const netProfit = analyticsData.netProfit;
    const partnerShare = netProfit / 3; // تقسيم الأرباح بالتساوي بين الشركاء الثلاثة
    const partners = ['عبدالله', 'عياش', 'زهراء'];
    partners.forEach(partner => {
      partnerStatus[partner] = { status: 'none', remainingAmount: partnerShare };
    });
    
    // تعيين الحالة الأولية لجميع العمال على 'none'
    Object.keys(workerShares).forEach(worker => {
      workerStatus[worker] = { status: 'none', remainingAmount: workerShares[worker] };
    });
    
    // تحديث حالة الدفع بناءً على المدفوعات المسجلة
    payments.forEach(payment => {
      if (payment.type === 'worker') {
        const worker = payment.recipientName;
        const totalShare = workerShares[worker] || 0;
        
        if (payment.paymentType === 'full') {
          // تم دفع كامل المبلغ
          workerStatus[worker] = { status: 'full', remainingAmount: 0 };
        } else if (payment.paymentType === 'partial') {
          // تم دفع جزء من المبلغ
          const currentRemaining = workerStatus[worker]?.remainingAmount || totalShare;
          const newRemaining = Math.max(0, currentRemaining - payment.amount);
          
          if (newRemaining === 0) {
            workerStatus[worker] = { status: 'full', remainingAmount: 0 };
          } else {
            workerStatus[worker] = { status: 'partial', remainingAmount: newRemaining };
          }
        }
      } else if (payment.type === 'partner') {
        const partner = payment.recipientName;
        
        if (payment.paymentType === 'full') {
          // تم دفع كامل المبلغ
          partnerStatus[partner] = { status: 'full', remainingAmount: 0 };
        } else if (payment.paymentType === 'partial') {
          // تم دفع جزء من المبلغ
          const currentRemaining = partnerStatus[partner]?.remainingAmount || partnerShare;
          const newRemaining = Math.max(0, currentRemaining - payment.amount);
          
          if (newRemaining === 0) {
            partnerStatus[partner] = { status: 'full', remainingAmount: 0 };
          } else {
            partnerStatus[partner] = { status: 'partial', remainingAmount: newRemaining };
          }
        }
      }
    });
    
    setWorkerPaymentStatus(workerStatus);
    setPartnerPaymentStatus(partnerStatus);
  }, [payments, filteredOrders, analyticsData]);

  // تحديث الطلبات المفلترة عند تغيير الفلتر الزمني
  useEffect(() => {
    let filtered = orders;
    const now = new Date();

    if (timeFilter === 'today') {
      const today = now.toDateString();
      filtered = orders.filter(order => new Date(order.date).toDateString() === today);
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = orders.filter(order => new Date(order.date) >= weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = orders.filter(order => new Date(order.date) >= monthAgo);
    } else if (timeFilter === 'custom') {
      const daysAgo = new Date(now.getTime() - parseInt(customDays) * 24 * 60 * 60 * 1000);
      filtered = orders.filter(order => new Date(order.date) >= daysAgo);
    }

    setFilteredOrders(filtered);
  }, [orders, timeFilter, customDays]);

  const analyticsData = useMemo(() => {

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.price, 0);

    // حساب إجمالي أرباح العمولة من خدمة الترويج
    const totalPromotionProfit = filteredOrders.reduce((sum, order) => {
      // إذا كان نوع الخدمة هو الترويج وهناك عمولة، نضيفها إلى الأرباح
      if (order.serviceType === 'promotion' && order.promotionCommission) {
        return sum + (parseFloat(order.promotionCommission.toString()) || 0);
      }
      return sum;
    }, 0);
    const totalDiscounts = filteredOrders.reduce((sum, order) => {
      const discount = order.discount || 0;
      return sum + (order.discountType === 'percentage' ? (order.price * discount) / 100 : discount);
    }, 0);
    const totalTax = filteredOrders.reduce((sum, order) => {
      const afterDiscount = order.price - (order.discount || 0);
      return sum + ((afterDiscount * (order.tax || 0)) / 100);
    }, 0);

    // Worker shares calculation
    const workerShares: Record<string, number> = {};
    const totalWorkerShares = filteredOrders.reduce((sum, order) => {
      const orderTotal = order.workers.reduce((workerSum, worker) => workerSum + worker.share, 0);
      order.workers.forEach(worker => {
        if (worker.name.trim()) {
          workerShares[worker.name] = (workerShares[worker.name] || 0) + worker.share;
        }
      });
      return sum + orderTotal;
    }, 0);

    // إضافة أرباح العمولة إلى الأرباح الصافية
    const netProfit = totalRevenue - totalDiscounts + totalTax - totalWorkerShares + totalPromotionProfit;
    const totalOrders = filteredOrders.length;

    return {
      totalRevenue,
      totalDiscounts,
      totalTax,
      totalWorkerShares,
      totalPromotionProfit,
      netProfit,
      totalOrders,
      workerShares,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    };
  }, [filteredOrders]);

  const getFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'اليوم';
      case 'week': return 'الأسبوع الماضي';
      case 'month': return 'الشهر الماضي';
      case 'custom': return `آخر ${customDays} أيام`;
      default: return 'جميع الفترات';
    }
  };

  return (
    <div className="p-4 pb-20 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 animate-bounce-in">
            <img
              src="https://scontent.fosm4-2.fna.fbcdn.net/v/t39.30808-6/494646003_122103077492854376_4740803221172287157_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=8gnYz32ttRoQ7kNvwHVFH6B&_nc_oc=Adlg9De_-JOZZATh6rHCiNM4TwI6Qe55Da8iTvwoUW7AfUO98piKDr3i-3yy39pfSQA&_nc_pt=1&_nc_zt=23&_nc_ht=scontent.fosm4-2.fna&_nc_gid=m02mrNFC3RUiJRkPKNka1A&oh=00_AfWT_QZAIBnHVdxqpRk_ZI0KGj4cNRb9LjGtpmCkFag2PQ&oe=6897D9BA"
              alt="العين"
              className="w-full h-full rounded-full object-cover logo-frame"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-pink-600 bg-clip-text text-transparent mb-2">التحليلات والإحصائيات</h1>
          <p className="text-gray-600 dark:text-gray-400">تحليل شامل للأرباح والأداء المالي</p>
        </div>

        {/* Time Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8 animate-slide-up">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-primary-500 ml-2" />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">فترة التحليل:</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'الكل' },
                { value: 'today', label: 'اليوم' },
                { value: 'week', label: 'أسبوع' },
                { value: 'month', label: 'شهر' },
                { value: 'custom', label: 'مخصص' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setTimeFilter(option.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${timeFilter === option.value
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {timeFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  min="1"
                  className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center transition-all duration-300"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">أيام</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl animate-slide-up transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm font-bold">إجمالي الإيرادات</p>
                <div className="text-3xl font-bold mt-2">
                  {analyticsData.totalRevenue.toLocaleString('ar-IQ')}
                </div>
                <p className="text-xs text-primary-100 mt-1">دينار عراقي</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl animate-slide-up transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-bold">الربح الصافي</p>
                <div className="text-3xl font-bold mt-2">
                  {analyticsData.netProfit.toLocaleString('ar-IQ')}
                </div>
                <p className="text-xs text-green-100 mt-1">
                  هامش ربح: {analyticsData.profitMargin.toFixed(1)}%
                </p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Target className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl animate-slide-up transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-bold">عدد الطلبات</p>
                <div className="text-3xl font-bold mt-2">{analyticsData.totalOrders}</div>
                <p className="text-xs text-blue-100 mt-1">{getFilterLabel()}</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-7 h-7" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-xl animate-slide-up transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-bold">أرباح العمولة</p>
                <div className="text-3xl font-bold mt-2">
                  {analyticsData.totalPromotionProfit.toLocaleString('ar-IQ')}
                </div>
                <p className="text-xs text-purple-100 mt-1">دينار عراقي</p>
              </div>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>
          </div>

        </div>

        {/* Financial Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Revenue Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center ml-3">
                  <PieChart className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                تفصيل الإيرادات
              </h3>

              <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <span className="font-bold text-green-800 dark:text-green-200">إجمالي الإيرادات</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                  +{analyticsData.totalRevenue.toLocaleString('ar-IQ')} د.ع
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <span className="font-bold text-red-800 dark:text-red-200">إجمالي الخصومات</span>
                <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                  -{analyticsData.totalDiscounts.toLocaleString('ar-IQ')} د.ع
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <span className="font-bold text-blue-800 dark:text-blue-200">إجمالي الضرائب</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                  +{analyticsData.totalTax.toLocaleString('ar-IQ')} د.ع
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <span className="font-bold text-orange-800 dark:text-orange-200">إجمالي مبلغ العمال</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">
                  -{analyticsData.totalWorkerShares.toLocaleString('ar-IQ')} د.ع
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <span className="font-bold text-purple-800 dark:text-purple-200">أرباح العمولة (الترويج)</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 text-lg">
                  +{analyticsData.totalPromotionProfit.toLocaleString('ar-IQ')} د.ع
                </span>
              </div>

              <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-50 to-pink-50 dark:from-primary-900/20 dark:to-pink-900/20 rounded-xl border-2 border-primary-200 dark:border-primary-800">
                  <span className="font-bold text-primary-800 dark:text-primary-200 text-lg">الربح الصافي</span>
                  <span className="font-bold text-primary-600 dark:text-primary-400 text-2xl">
                    {analyticsData.netProfit.toLocaleString('ar-IQ')} د.ع
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Worker Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center ml-3">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              العمال
            </h3>

            {Object.keys(analyticsData.workerShares).length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد بيانات عمال للفترة المحددة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(analyticsData.workerShares)
                  .sort(([, a], [, b]) => b - a)
                  .map(([worker, share], index) => {
                    const percentage = analyticsData.totalWorkerShares > 0 ? (share / analyticsData.totalWorkerShares) * 100 : 0;
                    const colors = [
                      'from-blue-500 to-cyan-500',
                      'from-green-500 to-emerald-500',
                      'from-purple-500 to-indigo-500',
                      'from-pink-500 to-rose-500',
                      'from-yellow-500 to-orange-500'
                    ];
                    const colorClass = colors[index % colors.length];

                    return (
                      <div key={worker} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 transform hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-full flex items-center justify-center ml-3 text-white font-bold`}>
                              {worker.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{worker}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {percentage.toFixed(1)}% من إجمالي المبلغ
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-lg text-gray-900 dark:text-white">
                              {share.toLocaleString('ar-IQ')} د.ع
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`bg-gradient-to-r ${colorClass} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            className="px-3 py-1 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200 text-sm"
                            onClick={() => {
                              try {
                                // تصفية الطلبات التي يعمل فيها هذا العامل
                                const workerOrders = filteredOrders.filter(order =>
                                  order.workers && order.workers.some(w => w.name === worker)
                                );

                                // إنشاء عنصر div للنافذة المنبثقة
                                const modalDiv = document.createElement('div');
                                modalDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

                                // حساب عدد الأعمال
                                const orderCount = workerOrders.length;

                                // حساب عدد العملاء الفريدين
                                const uniqueCustomers = new Set(workerOrders.map(order => order.customerName)).size;

                                // إنشاء محتوى تفاصيل الأعمال
                                let orderDetailsHTML = '';

                                workerOrders.forEach((order, index) => {
                                  const workerInfo = order.workers.find(w => w.name === worker);
                                  if (workerInfo) {
                                    orderDetailsHTML += `
                                      <div class="border-b border-gray-200 dark:border-gray-700 py-3 ${index === 0 ? 'pt-0' : ''}">
                                        <div class="flex justify-between items-center mb-2">
                                          <h5 class="font-bold text-gray-900 dark:text-white">${order.customerName}</h5>
                                          <span class="text-sm text-gray-500 dark:text-gray-400">${new Date(order.date).toLocaleDateString('ar-IQ')}</span>
                                        </div>
                                        <p class="text-gray-700 dark:text-gray-300 mb-2">${order.orderDetails}</p>
                                        <div class="flex justify-between">
                                          <span class="text-sm text-gray-600 dark:text-gray-400">نوع العمل: ${workerInfo.workType || 'غير محدد'}</span>
                                          <span class="font-bold text-primary-600 dark:text-primary-400">${workerInfo.share.toLocaleString('ar-IQ')} د.ع</span>
                                        </div>
                                      </div>
                                    `;
                                  }
                                });

                                // محتوى النافذة المنبثقة
                                modalDiv.innerHTML = `
                                  <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up max-h-[90vh] overflow-y-auto">
                                    <div class="flex justify-between items-center mb-6">
                                      <h3 class="text-xl font-bold text-gray-900 dark:text-white">تفاصيل عمل ${worker}</h3>
                                      <button id="close-details-modal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>

                                    <div class="flex items-center mb-6">
                                      <div class="w-16 h-16 bg-gradient-to-r ${colorClass} rounded-full flex items-center justify-center text-white text-2xl font-bold ml-4">
                                        ${worker.charAt(0)}
                                      </div>
                                      <div>
                                        <h4 class="text-lg font-bold text-gray-900 dark:text-white">${worker}</h4>
                                        <p class="text-gray-600 dark:text-gray-400">إجمالي الحصة: ${share.toLocaleString('ar-IQ')} د.ع</p>
                                      </div>
                                    </div>

                                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                      <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-center">
                                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${orderCount}</p>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">عدد الأعمال</p>
                                      </div>
                                      <div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 text-center">
                                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">${uniqueCustomers}</p>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">عدد العملاء</p>
                                      </div>
                                      <div class="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 text-center">
                                        <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${percentage.toFixed(1)}%</p>
                                        <p class="text-sm text-gray-600 dark:text-gray-400">نسبة من الإجمالي</p>
                                      </div>
                                    </div>

                                    <h4 class="font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">تفاصيل الأعمال</h4>
                                    <div class="space-y-2">
                                      ${orderDetailsHTML || '<p class="text-center text-gray-500 dark:text-gray-400 py-4">لا توجد تفاصيل أعمال متاحة</p>'}
                                    </div>
                                  </div>
                                `;

                                // إضافة النافذة المنبثقة إلى الصفحة
                                document.body.appendChild(modalDiv);

                                // إضافة مستمع الحدث لزر الإغلاق
                                document.getElementById('close-details-modal')?.addEventListener('click', () => {
                                  if (document.body.contains(modalDiv)) {
                                    document.body.removeChild(modalDiv);
                                  }
                                });

                                // إغلاق النافذة عند النقر خارجها
                                modalDiv.addEventListener('click', (e) => {
                                  if (e.target === modalDiv && document.body.contains(modalDiv)) {
                                    document.body.removeChild(modalDiv);
                                  }
                                });
                              } catch (error) {
                                console.error('حدث خطأ في عرض تفاصيل العمال:', error);
                                alert('حدث خطأ في عرض تفاصيل العمال. يرجى المحاولة مرة أخرى.');
                              }
                            }}
                          >
                            تفاصيل العمل
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Worker Rights */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center ml-3">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              حقوق العمال
            </h3>

            {Object.keys(analyticsData.workerShares).length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد بيانات عمال للفترة المحددة</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(analyticsData.workerShares)
                  .sort(([, a], [, b]) => b - a)
                  .map(([worker, share], index) => {
                    const colors = [
                      'from-purple-500 to-indigo-500',
                      'from-green-500 to-emerald-500',
                      'from-blue-500 to-cyan-500',
                      'from-pink-500 to-rose-500',
                      'from-yellow-500 to-orange-500'
                    ];
                    const colorClass = colors[index % colors.length];

                    return (
                      <div key={worker} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 transform hover:scale-105 transition-all duration-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`w-10 h-10 bg-gradient-to-r ${colorClass} rounded-full flex items-center justify-center ml-3 text-white font-bold`}>
                              {worker.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{worker}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                المبلغ المستحق: {workerPaymentStatus[worker]?.remainingAmount?.toLocaleString('ar-IQ') || share.toLocaleString('ar-IQ')} د.ع
                                {workerPaymentStatus[worker]?.status === 'full' && (
                                  <span className="text-green-500 mr-2 font-bold">(تم الدفع)</span>
                                )}
                                {workerPaymentStatus[worker]?.status === 'partial' && (
                                  <span className="text-blue-500 mr-2 font-bold">(تم دفع مبلغ جزئي)</span>
                                )}
                                {workerPaymentStatus[worker]?.status === 'none' && (
                                  <span className="text-red-500 mr-2 font-bold">(لم يتم الدفع)</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div>
                            <button
                              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 text-sm"
                              onClick={() => {
                                // إنشاء عنصر div للنافذة المنبثقة
                                const modalDiv = document.createElement('div');
                                modalDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

                                // محتوى النافذة المنبثقة
                                modalDiv.innerHTML = `
                                  <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
                                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">تسجيل دفع مستحقات</h3>
                                    <div class="text-center mb-4">
                                      <div class="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                        ${worker.charAt(0)}
                                      </div>
                                      <p class="mt-2 text-lg font-bold text-gray-900 dark:text-white">${worker}</p>
                                      <p class="text-gray-600 dark:text-gray-400">المبلغ المستحق: ${share.toLocaleString('ar-IQ')} د.ع</p>
                                    </div>

                                    <div class="space-y-3 mb-6">
                                      <button id="pay-full" class="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        تم الدفع بالكامل
                                      </button>

                                      <button id="pay-partial" class="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        تم دفع مبلغ جزئي
                                      </button>

                                      <button id="pay-none" class="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        لم يتم الدفع
                                      </button>
                                    </div>

                                    <button id="close-modal" class="w-full py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors duration-200">
                                      إلغاء
                                    </button>
                                  </div>
                                `;

                                // إضافة النافذة المنبثقة إلى الصفحة
                                document.body.appendChild(modalDiv);

                                // إضافة مستمعي الأحداث للأزرار
                                document.getElementById('pay-full')?.addEventListener('click', () => {
                                  // إزالة النافذة المنبثقة
                                  if (document.body.contains(modalDiv)) {
                                    document.body.removeChild(modalDiv);
                                  }

                                  // تعيين إجراء الدفع وعرض نافذة التحقق من كلمة المرور
                                  setPaymentAction({
                                    type: 'full',
                                    worker,
                                    share
                                  });
                                  setShowPasswordConfirm(true);

                                  // تصفير المبلغ المستحق
                                  // تحديث العنصر في DOM
                                  const workerCards = document.querySelectorAll('.bg-gray-50.dark\\:bg-gray-700.rounded-xl.p-4');
                                  workerCards.forEach(card => {
                                    const nameElement = card.querySelector('h4.font-bold');
                                    if (nameElement && nameElement.textContent === worker) {
                                      const amountElement = card.querySelector('p.text-sm.text-gray-500');
                                      if (amountElement) {
                                        amountElement.innerHTML = `المبلغ المستحق: 0 د.ع <span class="text-green-500 mr-2 font-bold">(تم الدفع)</span>`;
                                      }
                                    }
                                  });
                                });

                                document.getElementById('pay-partial')?.addEventListener('click', () => {
                                  // إنشاء نافذة إدخال المبلغ
                                  const amountDiv = document.createElement('div');
                                  amountDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                                  amountDiv.innerHTML = `
                                    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
                                      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">تسجيل دفع جزئي</h3>
                                      <p class="text-gray-600 dark:text-gray-400 mb-4 text-center">المبلغ المستحق: ${share.toLocaleString('ar-IQ')} د.ع</p>

                                      <div class="mb-4">
                                        <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المبلغ المدفوع:</label>
                                        <input type="number" id="partial-amount" class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="أدخل المبلغ المدفوع" />
                                      </div>

                                      <div class="flex gap-3">
                                        <button id="confirm-partial" class="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-bold">
                                          تأكيد
                                        </button>
                                        <button id="cancel-partial" class="flex-1 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-bold transition-colors duration-200">
                                          إلغاء
                                        </button>
                                      </div>
                                    </div>
                                  `;

                                  document.body.removeChild(modalDiv);
                                  document.body.appendChild(amountDiv);

                                  document.getElementById('confirm-partial')?.addEventListener('click', () => {
                                    const amountInput = document.getElementById('partial-amount') as HTMLInputElement;
                                    const amount = parseFloat(amountInput.value);

                                    if (isNaN(amount) || amount <= 0 || amount > share) {
                                      alert('الرجاء إدخال مبلغ صحيح (أكبر من صفر وأقل من أو يساوي المبلغ المستحق)');
                                      return;
                                    }

                                    // إزالة النافذة المنبثقة
                                    if (document.body.contains(amountDiv)) {
                                      document.body.removeChild(amountDiv);
                                    }

                                    // تعيين إجراء الدفع وعرض نافذة التحقق من كلمة المرور
                                    setPaymentAction({
                                      type: 'partial',
                                      worker,
                                      share,
                                      amount
                                    });
                                    setShowPasswordConfirm(true);

                                    // تحديث حالة الدفع الجزئي في DOM
                                    const workerCards = document.querySelectorAll('.bg-gray-50.dark\\:bg-gray-700.rounded-xl.p-4');
                                    workerCards.forEach(card => {
                                      const nameElement = card.querySelector('h4.font-bold');
                                      if (nameElement && nameElement.textContent === worker) {
                                        const amountElement = card.querySelector('p.text-sm.text-gray-500');
                                        if (amountElement) {
                                          amountElement.innerHTML = `المبلغ المستحق: ${(share - amount).toLocaleString('ar-IQ')} د.ع <span class="text-blue-500 mr-2 font-bold">(تم دفع مبلغ جزئي)</span>`;
                                        }
                                      }
                                    });
                                  });

                                  document.getElementById('cancel-partial')?.addEventListener('click', () => {
                                    if (document.body.contains(amountDiv)) {
                                      document.body.removeChild(amountDiv);
                                    }
                                  });
                                });

                                document.getElementById('pay-none')?.addEventListener('click', () => {
                                  // إزالة النافذة المنبثقة
                                  if (document.body.contains(modalDiv)) {
                                    document.body.removeChild(modalDiv);
                                  }

                                  // تعيين إجراء الدفع وعرض نافذة التحقق من كلمة المرور
                                  setPaymentAction({
                                    type: 'none',
                                    worker,
                                    share
                                  });
                                  setShowPasswordConfirm(true);

                                  // تحديث حالة الدفع في DOM
                                  const workerCards = document.querySelectorAll('.bg-gray-50.dark\\:bg-gray-700.rounded-xl.p-4');
                                  workerCards.forEach(card => {
                                    const nameElement = card.querySelector('h4.font-bold');
                                    if (nameElement && nameElement.textContent === worker) {
                                      const amountElement = card.querySelector('p.text-sm.text-gray-500');
                                      if (amountElement) {
                                        amountElement.innerHTML = `المبلغ المستحق: ${share.toLocaleString('ar-IQ')} د.ع <span class="text-red-500 mr-2 font-bold">(لم يتم الدفع)</span>`;
                                      }
                                    }
                                  });
                                });

                                document.getElementById('close-modal')?.addEventListener('click', () => {
                                  document.body.removeChild(modalDiv);
                                });
                              }}
                            >
                              تسجيل الدفع
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center ml-3">
                <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              الإحصائيات
            </h3>
            <button
              onClick={goToPaymentHistory}
              className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800/40 transition-colors"
            >
              <ClipboardList className="w-4 h-4" />
              سجل المدفوعات
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400 mb-2">الأرباح الصافية: {analyticsData.netProfit.toLocaleString('ar-IQ')} د.ع</p>
            <p className="text-gray-600 dark:text-gray-400 mb-4">حصة كل شريك: {(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع</p>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center ml-3">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            الشركاء
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Partner 1: عبدالله */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-900/30 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center ml-3 text-white text-xl font-bold">
                  ع
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">عبدالله</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">شريك</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 mb-4 shadow-inner">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الحصة من الأرباح:</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(partnerPaymentStatus['عبدالله']?.remainingAmount?.toLocaleString('ar-IQ') || (analyticsData.netProfit / 3).toLocaleString('ar-IQ'))} د.ع
                  {partnerPaymentStatus['عبدالله']?.status === 'full' && (
                    <span className="text-green-500 text-sm mr-2 font-bold">(تم الدفع)</span>
                  )}
                  {partnerPaymentStatus['عبدالله']?.status === 'partial' && (
                    <span className="text-blue-500 text-sm mr-2 font-bold">(تم دفع مبلغ جزئي)</span>
                  )}
                  {partnerPaymentStatus['عبدالله']?.status === 'none' && (
                    <span className="text-red-500 text-sm mr-2 font-bold">(لم يتم الدفع)</span>
                  )}
                </p>
              </div>
              <button
                className="w-full py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-bold flex items-center justify-center"
                onClick={() => {
                  // إنشاء عنصر div للنافذة المنبثقة
                  const modalDiv = document.createElement('div');
                  modalDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                  // محتوى النافذة المنبثقة
                  modalDiv.innerHTML = `
                    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
                      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">تسجيل دفع مستحقات</h3>
                      <div class="text-center mb-4">
                        <div class="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          ع
                        </div>
                        <p class="mt-2 text-lg font-bold text-gray-900 dark:text-white">عبدالله</p>
                        <p class="text-gray-600 dark:text-gray-400">المبلغ المستحق: ${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع</p>
                      </div>
                      <div class="space-y-3 mb-6">
                        <button id="pay-full-partner1" class="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          تم الدفع بالكامل
                        </button>
                        <button id="pay-partial-partner1" class="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          تم دفع مبلغ جزئي
                        </button>
                        <button id="pay-none-partner1" class="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          لم يتم الدفع
                        </button>
                      </div>
                      <button id="close-modal-partner1" class="w-full py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors duration-200">
                        إلغاء
                      </button>
                    </div>
                  `;
                  // إضافة النافذة المنبثقة إلى الصفحة
                  document.body.appendChild(modalDiv);
                  // إضافة مستمعي الأحداث للأزرار
                  document.getElementById('pay-full-partner1')?.addEventListener('click', () => {
                    document.body.removeChild(modalDiv);
                    setPaymentAction({
                      type: 'full',
                      partner: 'عبدالله',
                      partnerShare: analyticsData.netProfit / 3
                    });
                    setShowPasswordConfirm(true);
                  });
                  document.getElementById('pay-partial-partner1')?.addEventListener('click', () => {
                    const amountDiv = document.createElement('div');
                    amountDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                    amountDiv.innerHTML = `
                      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">تسجيل دفع جزئي</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4 text-center">المبلغ المستحق: ${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع</p>
                        <div class="mb-4">
                          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المبلغ المدفوع:</label>
                          <input type="number" id="partial-amount-partner1" class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="أدخل المبلغ المدفوع" />
                        </div>
                        <div class="flex gap-3">
                          <button id="confirm-partial-partner1" class="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-bold">تأكيد</button>
                          <button id="cancel-partial-partner1" class="flex-1 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-bold transition-colors duration-200">إلغاء</button>
                        </div>
                      </div>
                    `;
                    if (document.body.contains(modalDiv)) {
                      document.body.removeChild(modalDiv);
                    }
                    document.body.appendChild(amountDiv);
                    document.getElementById('confirm-partial-partner1')?.addEventListener('click', () => {
                      const amountInput = document.getElementById('partial-amount-partner1') as HTMLInputElement;
                      const amount = parseFloat(amountInput.value);
                      const partnerShare = analyticsData.netProfit / 3;
                      if (isNaN(amount) || amount <= 0 || amount > partnerShare) {
                        alert('الرجاء إدخال مبلغ صحيح (أكبر من صفر وأقل من أو يساوي المبلغ المستحق)');
                        return;
                      }
                      if (document.body.contains(amountDiv)) {
                        document.body.removeChild(amountDiv);
                      }
                      setPaymentAction({
                        type: 'partial',
                        partner: 'عبدالله',
                        partnerShare,
                        amount
                      });
                      setShowPasswordConfirm(true);
                    });
                    document.getElementById('cancel-partial-partner1')?.addEventListener('click', () => {
                      document.body.removeChild(amountDiv);
                    });
                  });
                  document.getElementById('pay-none-partner1')?.addEventListener('click', () => {
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                    warningDiv.innerHTML = `
                      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up text-center">
                        <div class="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">تنبيه: لم يتم الدفع</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-6">تم تسجيل عدم دفع مستحقات الشريك عبدالله البالغة ${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع</p>
                        <button id="warning-close-partner1" class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-bold">حسناً</button>
                      </div>
                    `;
                    if (document.body.contains(modalDiv)) {
                      document.body.removeChild(modalDiv);
                    }
                    document.body.appendChild(warningDiv);
                    const partnerCards = document.querySelectorAll('.bg-gradient-to-br');
                    partnerCards.forEach(card => {
                      const nameElement = card.querySelector('h4.text-lg.font-bold');
                      if (nameElement && nameElement.textContent === 'عبدالله') {
                        const amountElement = card.querySelector('p.text-2xl.font-bold');
                        if (amountElement) {
                          amountElement.innerHTML = `${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع <span class="text-red-500 text-sm mr-2 font-bold">(لم يتم الدفع)</span>`;
                        }
                      }
                    });
                    document.getElementById('warning-close-partner1')?.addEventListener('click', () => {
                      if (document.body.contains(warningDiv)) {
                        document.body.removeChild(warningDiv);
                      }
                    });
                  });
                  document.getElementById('close-modal-partner1')?.addEventListener('click', () => {
                    if (document.body.contains(modalDiv)) {
                      document.body.removeChild(modalDiv);
                    }
                  });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                تسجيل الدفع
              </button>
            </div>

            {/* Partner 2: عياش */}
            <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-xl p-5 border border-green-100 dark:border-green-900/30 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center ml-3 text-white text-xl font-bold">
                  ع
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">عياش</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">شريك</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 mb-4 shadow-inner">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الحصة من الأرباح:</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(partnerPaymentStatus['عياش']?.remainingAmount?.toLocaleString('ar-IQ') || (analyticsData.netProfit / 3).toLocaleString('ar-IQ'))} د.ع
                  {partnerPaymentStatus['عياش']?.status === 'full' && (
                    <span className="text-green-500 text-sm mr-2 font-bold">(تم الدفع)</span>
                  )}
                  {partnerPaymentStatus['عياش']?.status === 'partial' && (
                    <span className="text-blue-500 text-sm mr-2 font-bold">(تم دفع مبلغ جزئي)</span>
                  )}
                  {partnerPaymentStatus['عياش']?.status === 'none' && (
                    <span className="text-red-500 text-sm mr-2 font-bold">(لم يتم الدفع)</span>
                  )}
                </p>
              </div>
              <button
                className="w-full py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all duration-200 font-bold flex items-center justify-center"
                onClick={() => {
                  const modalDiv = document.createElement('div');
                  modalDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                  modalDiv.innerHTML = `
                    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
                      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">تسجيل دفع مستحقات</h3>
                      <div class="text-center mb-4">
                        <div class="w-16 h-16 mx-auto bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          ع
                        </div>
                        <p class="mt-2 text-lg font-bold text-gray-900 dark:text-white">عياش</p>
                        <p class="text-gray-600 dark:text-gray-400">المبلغ المستحق: ${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع</p>
                      </div>
                      <div class="space-y-3 mb-6">
                        <button id="pay-full-partner2" class="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          تم الدفع بالكامل
                        </button>
                        <button id="pay-partial-partner2" class="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          تم دفع مبلغ جزئي
                        </button>
                        <button id="pay-none-partner2" class="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          لم يتم الدفع
                        </button>
                      </div>
                      <button id="close-modal-partner2" class="w-full py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors duration-200">
                        إلغاء
                      </button>
                    </div>
                  `;
                  document.body.appendChild(modalDiv);
                  document.getElementById('pay-full-partner2')?.addEventListener('click', () => {
                    document.body.removeChild(modalDiv);
                    setPaymentAction({
                      type: 'full',
                      partner: 'عياش',
                      partnerShare: analyticsData.netProfit / 3
                    });
                    setShowPasswordConfirm(true);
                  });
                  document.getElementById('pay-partial-partner2')?.addEventListener('click', () => {
                    const amountDiv = document.createElement('div');
                    amountDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                    amountDiv.innerHTML = `
                      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">تسجيل دفع جزئي</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-4 text-center">المبلغ المستحق: ${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع</p>
                        <div class="mb-4">
                          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المبلغ المدفوع:</label>
                          <input type="number" id="partial-amount-partner2" class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="أدخل المبلغ المدفوع" />
                        </div>
                        <div class="flex gap-3">
                          <button id="confirm-partial-partner2" class="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-bold">تأكيد</button>
                          <button id="cancel-partial-partner2" class="flex-1 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-bold transition-colors duration-200">إلغاء</button>
                        </div>
                      </div>
                    `;
                    document.body.removeChild(modalDiv);
                    document.body.appendChild(amountDiv);
                    document.getElementById('confirm-partial-partner2')?.addEventListener('click', () => {
                      const amountInput = document.getElementById('partial-amount-partner2') as HTMLInputElement;
                      const amount = parseFloat(amountInput.value);
                      const partnerShare = analyticsData.netProfit / 3;
                      if (isNaN(amount) || amount <= 0 || amount > partnerShare) {
                        alert('الرجاء إدخال مبلغ صحيح (أكبر من صفر وأقل من أو يساوي المبلغ المستحق)');
                        return;
                      }
                      document.body.removeChild(amountDiv);
                      setPaymentAction({
                        type: 'partial',
                        partner: 'عياش',
                        partnerShare,
                        amount
                      });
                      setShowPasswordConfirm(true);
                    });
                    document.getElementById('cancel-partial-partner2')?.addEventListener('click', () => {
                      document.body.removeChild(amountDiv);
                    });
                  });
                  document.getElementById('pay-none-partner2')?.addEventListener('click', () => {
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                    warningDiv.innerHTML = `
                      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up text-center">
                        <div class="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">تنبيه: لم يتم الدفع</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-6">تم تسجيل عدم دفع مستحقات الشريك عياش البالغة ${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع</p>
                        <button id="warning-close-partner2" class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-bold">حسناً</button>
                      </div>
                    `;
                    if (document.body.contains(modalDiv)) {
                      document.body.removeChild(modalDiv);
                    }
                    document.body.appendChild(warningDiv);
                    const partnerCards = document.querySelectorAll('.bg-gradient-to-br');
                    partnerCards.forEach(card => {
                      const nameElement = card.querySelector('h4.text-lg.font-bold');
                      if (nameElement && nameElement.textContent === 'عياش') {
                        const amountElement = card.querySelector('p.text-2xl.font-bold');
                        if (amountElement) {
                          amountElement.innerHTML = `${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع <span class="text-red-500 text-sm mr-2 font-bold">(لم يتم الدفع)</span>`;
                        }
                      }
                    });
                    document.getElementById('warning-close-partner2')?.addEventListener('click', () => {
                      if (document.body.contains(warningDiv)) {
                        document.body.removeChild(warningDiv);
                      }
                    });
                  });
                  document.getElementById('close-modal-partner2')?.addEventListener('click', () => {
                    if (document.body.contains(modalDiv)) {
                      document.body.removeChild(modalDiv);
                    }
                  });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                تسجيل الدفع
              </button>
            </div>

            {/* Partner 3: زهراء */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-900/30 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center ml-3 text-white text-xl font-bold">
                  ز
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">زهراء</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">شريك</p>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 mb-4 shadow-inner">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الحصة من الأرباح:</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(partnerPaymentStatus['زهراء']?.remainingAmount?.toLocaleString('ar-IQ') || (analyticsData.netProfit / 3).toLocaleString('ar-IQ'))} د.ع
                  {partnerPaymentStatus['زهراء']?.status === 'full' && (
                    <span className="text-green-500 text-sm mr-2 font-bold">(تم الدفع)</span>
                  )}
                  {partnerPaymentStatus['زهراء']?.status === 'partial' && (
                    <span className="text-blue-500 text-sm mr-2 font-bold">(تم دفع مبلغ جزئي)</span>
                  )}
                  {partnerPaymentStatus['زهراء']?.status === 'none' && (
                    <span className="text-red-500 text-sm mr-2 font-bold">(لم يتم الدفع)</span>
                  )}
                </p>
              </div>
              <button
                className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200 font-bold flex items-center justify-center"
                onClick={() => {
                  const modalDiv = document.createElement('div');
                  modalDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                  modalDiv.innerHTML = `
                    <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
                      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">تسجيل دفع مستحقات</h3>
                      <div class="text-center mb-4">
                        <div class="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                          ز
                        </div>
                        <p class="mt-2 text-lg font-bold text-gray-900 dark:text-white">زهراء</p>
                        <p class="text-gray-600 dark:text-gray-400">المبلغ المستحق: ${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع</p>
                      </div>
                      <div class="space-y-3 mb-6">
                        <button id="pay-full-partner3" class="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                          </svg>
                          تم الدفع بالكامل
                        </button>
                        <button id="pay-partial-partner3" class="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          تم دفع مبلغ جزئي
                        </button>
                        <button id="pay-none-partner3" class="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          لم يتم الدفع
                        </button>
                      </div>
                      <button id="close-modal-partner3" class="w-full py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors duration-200">
                        إلغاء
                      </button>
                    </div>
                  `;
                  document.body.appendChild(modalDiv);
                  document.getElementById('pay-full-partner3')?.addEventListener('click', () => {
                    document.body.removeChild(modalDiv);
                    setPaymentAction({
                      type: 'full',
                      partner: 'زهراء',
                      partnerShare: analyticsData.netProfit / 3
                    });
                    setShowPasswordConfirm(true);
                  });
                  document.getElementById('pay-partial-partner3')?.addEventListener('click', () => {
                    const partialModalDiv = document.createElement('div');
                    partialModalDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                    partialModalDiv.innerHTML = `
                      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">تسجيل دفع جزئي</h3>
                        <div class="text-center mb-4">
                          <p class="text-gray-600 dark:text-gray-400">المبلغ المستحق: ${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع</p>
                        </div>
                        <div class="mb-4">
                          <label class="block text-gray-700 dark:text-gray-300 mb-2">المبلغ المدفوع:</label>
                          <input type="number" id="partial-amount-partner3" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" placeholder="أدخل المبلغ المدفوع" />
                          <p id="amount-error-partner3" class="text-red-500 text-sm mt-1 hidden">يرجى إدخال مبلغ صحيح</p>
                        </div>
                        <div class="flex space-x-3 rtl:space-x-reverse">
                          <button id="confirm-partial-partner3" class="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-bold">تأكيد</button>
                          <button id="cancel-partial-partner3" class="flex-1 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors duration-200 font-bold">إلغاء</button>
                        </div>
                      </div>
                    `;
                    if (document.body.contains(modalDiv)) {
                      document.body.removeChild(modalDiv);
                    }
                    document.body.appendChild(partialModalDiv);
                    document.getElementById('confirm-partial-partner3')?.addEventListener('click', () => {
                      const partialAmountInput = document.getElementById('partial-amount-partner3') as HTMLInputElement;
                      const partialAmount = parseFloat(partialAmountInput.value);
                      const totalAmount = analyticsData.netProfit / 3;
                      if (isNaN(partialAmount) || partialAmount <= 0 || partialAmount > totalAmount) {
                        const errorElement = document.getElementById('amount-error-partner3');
                        if (errorElement) {
                          errorElement.classList.remove('hidden');
                        }
                        return;
                      }
                      if (document.body.contains(partialModalDiv)) {
                        document.body.removeChild(partialModalDiv);
                      }
                      setPaymentAction({
                        type: 'partial',
                        partner: 'زهراء',
                        partnerShare: totalAmount,
                        amount: partialAmount
                      });
                      setShowPasswordConfirm(true);
                    });
                    document.getElementById('cancel-partial-partner3')?.addEventListener('click', () => {
                      document.body.removeChild(partialModalDiv);
                      document.body.appendChild(modalDiv);
                    });
                  });
                  document.getElementById('pay-none-partner3')?.addEventListener('click', () => {
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                    warningDiv.innerHTML = `
                      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-up text-center">
                        <div class="w-20 h-20 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">تم تسجيل عدم الدفع</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-6">تم تسجيل عدم دفع المبلغ (${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع) للشريك زهراء</p>
                        <button id="warning-close-partner3" class="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-bold">
                          حسناً
                        </button>
                      </div>
                    `;
                    if (document.body.contains(modalDiv)) {
                      document.body.removeChild(modalDiv);
                    }
                    document.body.appendChild(warningDiv);
                    const partnerCards = document.querySelectorAll('.bg-gradient-to-br');
                    partnerCards.forEach(card => {
                      const nameElement = card.querySelector('h4.text-lg.font-bold');
                      if (nameElement && nameElement.textContent === 'زهراء') {
                        const amountElement = card.querySelector('p.text-2xl.font-bold');
                        if (amountElement) {
                          amountElement.innerHTML = `${(analyticsData.netProfit / 3).toLocaleString('ar-IQ')} د.ع <span class="text-red-500 text-sm mr-2 font-bold">(لم يتم الدفع)</span>`;
                        }
                      }
                    });
                    document.getElementById('warning-close-partner3')?.addEventListener('click', () => {
                      if (document.body.contains(warningDiv)) {
                        document.body.removeChild(warningDiv);
                      }
                    });
                  });
                  document.getElementById('close-modal-partner3')?.addEventListener('click', () => {
                    if (document.body.contains(modalDiv)) {
                      document.body.removeChild(modalDiv);
                    }
                  });
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                تسجيل الدفع
              </button>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 animate-slide-up">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center ml-3">
              <Calendar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            إحصائيات إضافية
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                {Object.keys(analyticsData.workerShares).length}
              </div>
              <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200">عدد العمال النشطين</p>
            </div>

            <div className="text-center p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mb-2">
                {analyticsData.totalRevenue > 0 ? ((analyticsData.totalDiscounts / analyticsData.totalRevenue) * 100).toFixed(1) : '0'}%
              </div>
              <p className="text-sm font-bold text-rose-800 dark:text-rose-200">نسبة الخصومات</p>
            </div>
          </div>
        </div>
      </div>

      {/* مكون التحقق من كلمة المرور */}
      {showPasswordConfirm && (
        <PasswordConfirm
          onConfirm={executePaymentAction}
          onCancel={() => {
            setShowPasswordConfirm(false);
            setPaymentAction(null);
          }}
          actionType="payment"
        />
      )}
    </div>
  );
}