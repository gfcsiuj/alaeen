import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, Filter, ArrowDownUp, Search, Trash2, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getAllPayments, getPaymentsByTimeFilter, deletePayment, Payment } from '../firebase/paymentService';

export function PaymentHistory() {
  const { userRole, payments: appPayments, refreshPayments } = useApp();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null); // معرف المدفوعة التي يتم حذفها حاليًا
  const [deleteError, setDeleteError] = useState<string | null>(null); // رسالة خطأ الحذف
  
  // فلاتر
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'worker' | 'partner'>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'full' | 'partial' | 'none'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDays, setCustomDays] = useState('7');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // جلب المدفوعات من Firebase
  useEffect(() => {
    // تعريف متغير للتحكم في إلغاء العملية
    let isMounted = true;
    let isInitialLoad = true;
    
    const fetchPayments = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        
        // استخدام المدفوعات من AppContext مباشرة بدلاً من إعادة جلبها
        if (appPayments && appPayments.length > 0) {
          console.log(`تطبيق الفلتر على ${appPayments.length} دفعة من السياق`);
          
          // تطبيق الفلتر الزمني على المدفوعات المتاحة بالفعل
          let filteredPayments = [...appPayments];
          
          // تطبيق الفلتر الزمني يدويًا بدلاً من استدعاء API
          if (timeFilter !== 'all') {
            const now = new Date();
            let cutoffDate = new Date();
            
            if (timeFilter === 'today') {
              cutoffDate.setHours(0, 0, 0, 0);
            } else if (timeFilter === 'week') {
              cutoffDate.setDate(now.getDate() - 7);
            } else if (timeFilter === 'month') {
              cutoffDate.setMonth(now.getMonth() - 1);
            } else if (timeFilter === 'custom' && customDays) {
              cutoffDate.setDate(now.getDate() - parseInt(customDays));
            }
            
            filteredPayments = filteredPayments.filter(payment => 
              new Date(payment.date) >= cutoffDate
            );
          }
          
          if (isMounted) {
            setPayments(filteredPayments);
            setError(null);
          }
        } else {
          // إذا لم تكن المدفوعات متاحة في السياق، نقوم بجلبها مرة واحدة
          if (isMounted && isInitialLoad) {
            console.log('جلب المدفوعات من Firebase لأول مرة');
            await refreshPayments();
            isInitialLoad = false;
          }
        }
      } catch (err) {
        console.error('خطأ في جلب المدفوعات:', err);
        if (isMounted) {
          setError('حدث خطأ أثناء جلب سجل المدفوعات');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchPayments();
    
    // تنظيف عند إلغاء تحميل المكون
    return () => {
      isMounted = false;
    };
  }, [appPayments, timeFilter, customDays]);
  
  // تحديث المدفوعات عند تغيير الفلاتر
  useEffect(() => {
    // تطبيق الفلاتر على المدفوعات الحالية
    if (appPayments && appPayments.length > 0) {
      console.log('تطبيق الفلاتر على المدفوعات');
      
      // تأخير قصير لتجنب التحديثات المتكررة
      const filterTimer = setTimeout(() => {
        let filtered = [...appPayments];
        
        // تطبيق فلتر النوع
        if (typeFilter !== 'all') {
          filtered = filtered.filter(payment => payment.type === typeFilter);
        }
        
        // تطبيق فلتر نوع الدفع
        if (paymentTypeFilter !== 'all') {
          filtered = filtered.filter(payment => payment.paymentType === paymentTypeFilter);
        }
        
        // تطبيق فلتر البحث
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase();
          filtered = filtered.filter(payment => 
            payment.recipientName.toLowerCase().includes(searchLower) ||
            payment.type.toLowerCase().includes(searchLower) ||
            payment.paymentType.toLowerCase().includes(searchLower)
          );
        }
        
        setPayments(filtered);
      }, 300);
      
      return () => clearTimeout(filterTimer);
    }
  }, [appPayments, typeFilter, paymentTypeFilter, searchTerm]);
  
  // تطبيق الفلاتر والترتيب
  const filteredPayments = payments
    .filter(payment => {
      // فلتر البحث
      const searchMatch = payment.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // فلتر النوع
      const typeMatch = typeFilter === 'all' || payment.type === typeFilter;
      
      // فلتر نوع الدفع
      const paymentTypeMatch = paymentTypeFilter === 'all' || payment.paymentType === paymentTypeFilter;
      
      return searchMatch && typeMatch && paymentTypeMatch;
    })
    .sort((a, b) => {
      // ترتيب حسب التاريخ أو المبلغ
      if (sortBy === 'date') {
        return sortDirection === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return sortDirection === 'asc'
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
    });
  
  // تبديل اتجاه الترتيب
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // حذف مدفوعة
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // معرف المدفوعة المراد حذفها
  
  const handleDeletePayment = async (paymentId: string) => {
    if (!paymentId) return;
    
    try {
      setDeleting(paymentId);
      setDeleteError(null);
      
      // التحقق من صلاحيات المستخدم
      if (userRole === 'viewer') {
        // إنشاء مودال تحذير
        const warningModal = document.createElement('div');
        warningModal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50';
        warningModal.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl animate-fade-in">
            <div class="flex items-center text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">غير مصرح</h3>
            </div>
            <p class="text-gray-700 dark:text-gray-300 mb-6">ليس لديك صلاحية لحذف المدفوعات. يرجى التواصل مع المسؤول.</p>
            <div class="flex justify-end">
              <button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" id="close-warning">إغلاق</button>
            </div>
          </div>
        `;
        document.body.appendChild(warningModal);
        
        // إضافة مستمع حدث لزر الإغلاق
        document.getElementById('close-warning')?.addEventListener('click', () => {
          document.body.removeChild(warningModal);
        });
        
        setDeleting(null);
        return;
      }
      
      await deletePayment(paymentId);
      
      // إضافة تأخير قصير قبل تحديث المدفوعات لضمان اكتمال عملية الحذف
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // تحديث المدفوعات من Firebase
      await refreshPayments();

      // تأخير إضافي قبل تحديث القائمة المعروضة
      await new Promise(resolve => setTimeout(resolve, 1000));

      // تحديث قائمة المدفوعات المعروضة بناءً على المدفوعات المحدثة في السياق
      if (appPayments && appPayments.length > 0) {
        console.log('تطبيق الفلاتر بعد الحذف');
        let filtered = [...appPayments];
        
        // تطبيق الفلتر الزمني
        if (timeFilter !== 'all') {
          const now = new Date();
          let cutoffDate = new Date();
          
          if (timeFilter === 'today') {
            cutoffDate.setHours(0, 0, 0, 0);
          } else if (timeFilter === 'week') {
            cutoffDate.setDate(now.getDate() - 7);
          } else if (timeFilter === 'month') {
            cutoffDate.setMonth(now.getMonth() - 1);
          } else if (timeFilter === 'custom' && customDays) {
            cutoffDate.setDate(now.getDate() - parseInt(customDays));
          }
          
          filtered = filtered.filter(payment => 
            new Date(payment.date) >= cutoffDate
          );
        }
        
        // تطبيق فلتر النوع
        if (typeFilter !== 'all') {
          filtered = filtered.filter(payment => payment.type === typeFilter);
        }
        
        // تطبيق فلتر نوع الدفع
        if (paymentTypeFilter !== 'all') {
          filtered = filtered.filter(payment => payment.paymentType === paymentTypeFilter);
        }
        
        // تطبيق فلتر البحث
        if (searchTerm.trim()) {
          const searchLower = searchTerm.toLowerCase();
          filtered = filtered.filter(payment => 
            payment.recipientName.toLowerCase().includes(searchLower) ||
            payment.type.toLowerCase().includes(searchLower) ||
            payment.paymentType.toLowerCase().includes(searchLower)
          );
        }
        
        setPayments(filtered);
      } else {
        // استخدام الطريقة القديمة كاحتياط
        const filteredPayments = await getPaymentsByTimeFilter(timeFilter, customDays);
        setPayments(filteredPayments);
      }
      
      // إنشاء مودال نجاح
      const successModal = document.createElement('div');
      successModal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50';
      successModal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl animate-fade-in">
          <div class="flex items-center text-green-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">تم الحذف بنجاح</h3>
          </div>
          <p class="text-gray-700 dark:text-gray-300 mb-6">تم حذف المدفوعة بنجاح من قاعدة البيانات.</p>
          <div class="flex justify-end">
            <button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" id="close-success">إغلاق</button>
          </div>
        </div>
      `;
      document.body.appendChild(successModal);
      
      // إضافة مستمع حدث لزر الإغلاق
      document.getElementById('close-success')?.addEventListener('click', () => {
        document.body.removeChild(successModal);
      });
      
    } catch (err) {
      console.error('خطأ في حذف المدفوعة:', err);
      setDeleteError('حدث خطأ أثناء حذف المدفوعة');
      
      // إنشاء مودال خطأ
      const errorModal = document.createElement('div');
      errorModal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50';
      errorModal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl animate-fade-in">
          <div class="flex items-center text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">خطأ في الحذف</h3>
          </div>
          <p class="text-gray-700 dark:text-gray-300 mb-6">حدث خطأ أثناء محاولة حذف المدفوعة. يرجى المحاولة مرة أخرى.</p>
          <div class="flex justify-end">
            <button class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" id="close-error">إغلاق</button>
          </div>
        </div>
      `;
      document.body.appendChild(errorModal);
      
      // إضافة مستمع حدث لزر الإغلاق
      document.getElementById('close-error')?.addEventListener('click', () => {
        document.body.removeChild(errorModal);
      });
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  };
  
  // الحصول على اسم نوع الدفع بالعربية
  const getPaymentTypeLabel = (type: 'full' | 'partial' | 'none') => {
    switch (type) {
      case 'full': return 'دفع كامل';
      case 'partial': return 'دفع جزئي';
      case 'none': return 'لم يتم الدفع';
      default: return '';
    }
  };
  
  // الحصول على لون نوع الدفع
  const getPaymentTypeColor = (type: 'full' | 'partial' | 'none') => {
    switch (type) {
      case 'full': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'partial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'none': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return '';
    }
  };
  
  return (
    <div className="p-4 pb-20 animate-fade-in">
      {/* مودال تأكيد الحذف */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl animate-fade-in">
            <div className="flex items-center text-red-500 mb-4">
              <AlertCircle className="h-8 w-8 mr-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">تأكيد الحذف</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">هل أنت متأكد من رغبتك في حذف هذه المدفوعة؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting !== null}
              >
                إلغاء
              </button>
              <button 
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                onClick={() => handleDeletePayment(confirmDelete)}
                disabled={deleting !== null}
              >
                {deleting === confirmDelete ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    تأكيد الحذف
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 animate-bounce-in">
            <img
              src="https://scontent.fosm4-2.fna.fbcdn.net/v/t39.30808-6/494646003_122103077492854376_4740803221172287157_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=8gnYz32ttRoQ7kNvwHVFH6B&_nc_oc=Adlg9De_-JOZZATh6rHCiNM4TwI6Qe55Da8iTvwoUW7AfUO98piKDr3i-3yy39pfSQA&_nc_pt=1&_nc_zt=23&_nc_ht=scontent.fosm4-2.fna&_nc_gid=m02mrNFC3RUiJRkPKNka1A&oh=00_AfWT_QZAIBnHVdxqpRk_ZI0KGj4cNRb9LjGtpmCkFag2PQ&oe=6897D9BA"
              alt="العين"
              className="w-full h-full rounded-full object-cover logo-frame"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-pink-600 bg-clip-text text-transparent mb-2">سجل المدفوعات</h1>
          <p className="text-gray-600 dark:text-gray-400">سجل مدفوعات العمال والشركاء</p>
        </div>
        
        {/* فلاتر البحث */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-8 animate-slide-up">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
            <div className="relative w-full md:w-1/3">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full p-3 pr-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                placeholder="بحث باسم المستلم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="flex items-center">
                <Filter className="w-5 h-5 text-primary-500 ml-2" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">فلترة:</span>
              </div>
              
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'worker' | 'partner')}
              >
                <option value="all">جميع الأنواع</option>
                <option value="worker">العمال</option>
                <option value="partner">الشركاء</option>
              </select>
              
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                value={paymentTypeFilter}
                onChange={(e) => setPaymentTypeFilter(e.target.value as 'all' | 'full' | 'partial' | 'none')}
              >
                <option value="all">جميع حالات الدفع</option>
                <option value="full">دفع كامل</option>
                <option value="partial">دفع جزئي</option>
                <option value="none">لم يتم الدفع</option>
              </select>
              
              <select
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as 'all' | 'today' | 'week' | 'month' | 'custom')}
              >
                <option value="all">كل الفترات</option>
                <option value="today">اليوم</option>
                <option value="week">آخر أسبوع</option>
                <option value="month">آخر شهر</option>
                <option value="custom">فترة مخصصة</option>
              </select>
              
              {timeFilter === 'custom' && (
                <div className="flex items-center">
                  <input
                    type="number"
                    className="w-16 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    min="1"
                    max="365"
                  />
                  <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">أيام</span>
                </div>
              )}
              
              <button
                className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={() => {
                  setSortBy(sortBy === 'date' ? 'amount' : 'date');
                }}
              >
                <span className="text-sm font-bold">
                  {sortBy === 'date' ? 'ترتيب: التاريخ' : 'ترتيب: المبلغ'}
                </span>
              </button>
              
              <button
                className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={toggleSortDirection}
              >
                <ArrowDownUp className="w-4 h-4" />
                <span className="text-sm font-bold">
                  {sortDirection === 'desc' ? 'تنازلي' : 'تصاعدي'}
                </span>
              </button>
            </div>
          </div>
        </div>
        
        {/* رسالة خطأ الحذف */}
        {deleteError && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 p-4 rounded-lg text-center mb-4 animate-fade-in">
            {deleteError}
            <button 
              className="mr-2 underline hover:no-underline" 
              onClick={() => setDeleteError(null)}
            >
              إغلاق
            </button>
          </div>
        )}
        
        {/* عرض المدفوعات */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 p-4 rounded-lg text-center">
            {error}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 text-center">
            <div className="w-20 h-20 mx-auto bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 mb-4">
              <DollarSign className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد مدفوعات</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || typeFilter !== 'all' || paymentTypeFilter !== 'all'
                ? 'لا توجد مدفوعات تطابق معايير البحث'
                : 'لم يتم تسجيل أي مدفوعات بعد'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow relative"
              >
                {/* زر الحذف */}
                {userRole !== 'viewer' && (
                  <button
                    className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => setConfirmDelete(payment.id || '')}
                    disabled={deleting === payment.id}
                    title="حذف المدفوعة"
                  >
                    {deleting === payment.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                )}
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${payment.type === 'worker' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                      {payment.type === 'worker' ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        <Users className="w-6 h-6" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {payment.recipientName}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${payment.type === 'worker' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                          {payment.type === 'worker' ? 'عامل' : 'شريك'}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${getPaymentTypeColor(payment.paymentType)}`}>
                          {getPaymentTypeLabel(payment.paymentType)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {payment.amount.toLocaleString('ar-IQ')} د.ع
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <Calendar className="w-4 h-4 ml-1" />
                      {formatDate(payment.date)}
                    </div>
                    {payment.creator && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        تم التسجيل بواسطة: {payment.creator}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}